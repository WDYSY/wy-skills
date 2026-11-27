#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""clog —— 携程 CLOG 日志查询小工具（走 BAT MCP，无额外依赖）

解决三个痛点：
  1. 分享链接（?left=<一大坨JSON>）看不懂、记不住 → `decode` 翻译成人话
  2. title / tag 得靠记忆，写错一个字就 0 条 → `titles` 反查窗口内真实的 title 与 user 取值
  3. 时间要自己算 UTC、pageNo/pageSize 要重复填 → `search` 参数化 + 自动转 UTC + 自动翻页

用法示例：
  clog.py decode @/tmp/clogurl.txt
  clog.py search --app 100016554 --user TR004363 --title searchResourceList.req --last 30m
  clog.py search --app 100016554 --user TR004363 --title searchResourceList* --from "2026-11-11 20:00" --to "2026-11-11 21:00" --pretty
  clog.py titles --app 100016554 --user TR004363 --last 1h
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

ENDPOINT = "http://bat-mcp-function.faas.ctripcorp.com/mcp"
LOCAL_TZ = datetime.now().astimezone().tzinfo
LEVEL_MAP = {"info": "1", "warn": "2", "error": "3", "fatal": "4"}
NOISY_TAGS = {"_thread_", "_threadName_", "_host_", "_blob_id", "_bucket_id",
              "cat-msg-id", "cat-marker-id", "cat-root-msg-id", "cat-parent-msg-id"}


# ---------------------------------------------------------------- BAT MCP 调用

def mcp_call(tool, arguments, timeout=180):
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": tool, "arguments": arguments}}
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-bbzai-mcp-username": os.environ.get("USER", ""),
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json, text/event-stream",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8", "replace")

    text = None
    for line in body.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        try:
            obj = json.loads(line[5:].strip())
        except ValueError:
            continue
        if obj.get("error"):
            die("BAT 返回错误: %s" % obj["error"].get("message"))
        content = (obj.get("result") or {}).get("content") or []
        if content:
            text = content[0].get("text")
    if text is None:
        die("BAT 返回为空: %s" % body[:300])
    return text


def die(msg):
    sys.stderr.write("✖ %s\n" % msg)
    sys.exit(1)


# ------------------------------------------------------------------ 日志解析

def parse_logs(text):
    try:
        root = ET.fromstring(text)
        return _parse_logs_et(root)
    except ET.ParseError:
        return _parse_logs_regex(text)


def _parse_logs_et(root):
    total = int(root.findtext("totalSize") or 0)
    has_more = (root.findtext("hasMoreResult") or "false").lower() == "true"
    logs = []
    for log in root.findall("./logs/log"):
        item = {name: (log.findtext(name) or "") for name in
                ("id", "hostName", "hostIP", "timestamp", "timeStr", "logLevel",
                 "title", "message", "messageId", "source", "threadId", "region", "idc")}
        item["attrs"] = {a.findtext("key"): (a.findtext("value") or "")
                         for a in log.findall("./attributes/attribute")}
        logs.append(item)
    meta = {"total": total, "has_more": has_more,
            "last_ts": root.findtext("lastTimestamp"),
            "last_key": root.findtext("lastScanRowKey")}
    return meta, logs


def _parse_logs_regex(text):
    total = int((re.search(r"<totalSize>(\d+)</totalSize>", text) or [0, 0])[1])
    has_more = (re.search(r"<hasMoreResult>(\w+)</hasMoreResult>", text) or ["", "false"])[1].lower() == "true"
    logs = []
    for block in re.findall(r"<log>(.*?)</log>", text, re.S):
        def f(tag):
            m = re.search(r"<%s>(.*?)</%s>" % (tag, tag), block, re.S)
            return m.group(1) if m else ""
        attrs = {}
        for a in re.findall(r"<attribute><key>(.*?)</key><value>(.*?)</value></attribute>", block, re.S):
            attrs[a[0]] = a[1]
        item = {k: f(k) for k in ("id", "hostName", "hostIP", "timestamp", "timeStr",
                                  "logLevel", "title", "message", "messageId", "source",
                                  "threadId", "region", "idc")}
        item["attrs"] = attrs
        logs.append(item)
    meta = {"total": total, "has_more": has_more, "last_ts": None, "last_key": None}
    return meta, logs


def fetch_logs(app, env, from_utc, to_utc, idc, filters, limit):
    """按页拉取，直到凑够 limit 或没有更多。"""
    all_logs, meta = [], None
    last_ts = last_key = None
    while True:
        args = {"env": env, "appId": str(app), "fromUtc": from_utc, "toUtc": to_utc}
        args.update({k: v for k, v in filters.items() if v not in (None, "")})
        if idc:
            args["queryIdc"] = idc
        if last_ts and last_key:
            args["lastScanTime"] = str(last_ts)
            args["lastScanRowKey"] = str(last_key)
        meta, logs = parse_logs(mcp_call("bat-clog", args))
        all_logs.extend(logs)
        if not meta["has_more"] or not logs or len(all_logs) >= limit:
            break
        last_ts, last_key = meta["last_ts"], meta["last_key"]
        if not last_ts or not last_key:
            break
    return meta, all_logs[:limit]


# ------------------------------------------------------------------ 时间处理

def parse_time_arg(s):
    s = s.strip()
    if s in ("now", "现在"):
        return datetime.now(LOCAL_TZ)
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%H:%M:%S", "%H:%M"):
        try:
            dt = datetime.strptime(s, fmt)
        except ValueError:
            continue
        if fmt in ("%H:%M:%S", "%H:%M"):
            now = datetime.now(LOCAL_TZ)
            dt = dt.replace(year=now.year, month=now.month, day=now.day)
        return dt.replace(tzinfo=LOCAL_TZ)
    die("看不懂的时间: %s（支持 2026-11-11 / 2026-11-11 20:59 / 20:59 / now）" % s)


def resolve_window(args):
    if args.last:
        m = re.fullmatch(r"(\d+)\s*([mhd])", args.last.strip())
        if not m:
            die("--last 只支持 30m / 2h / 1d 这种写法")
        num, unit = int(m.group(1)), m.group(2)
        delta = {"m": timedelta(minutes=num), "h": timedelta(hours=num), "d": timedelta(days=num)}[unit]
        to_dt = parse_time_arg(args.to) if args.to else datetime.now(LOCAL_TZ)
        return to_dt - delta, to_dt
    to_dt = parse_time_arg(args.to) if args.to else datetime.now(LOCAL_TZ)
    from_dt = parse_time_arg(args.from_) if args.from_ else to_dt - timedelta(hours=1)
    if from_dt > to_dt:
        die("开始时间晚于结束时间")
    return from_dt, to_dt


def iso_utc(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def local_str(dt):
    return dt.astimezone(LOCAL_TZ).strftime("%Y-%m-%d %H:%M:%S")


def epoch_ms_to_local(ms):
    return datetime.fromtimestamp(int(ms) / 1000.0, LOCAL_TZ)


# --------------------------------------------------------------------- 展示

def fmt_message(msg, pretty, full, width):
    if pretty:
        try:
            return json.dumps(json.loads(msg), ensure_ascii=False, indent=2)
        except ValueError:
            pass
    if full or len(msg) <= width:
        return msg
    return msg[:width] + " …(共 %d 字符，-f 看全文)" % len(msg)


def print_logs(logs, args):
    for log in logs:
        attrs = log.get("attrs") or {}
        head = "%s  %-5s %s(%s)" % (log.get("timeStr") or epoch_ms_to_local(log["timestamp"]).strftime("%Y-%m-%d %H:%M:%S"),
                                    log.get("logLevel", "?"), log["hostName"], log["hostIP"])
        print(head + "  " + log.get("title", ""))
        keys = [k for k in ("method", "user", "vendorId", "group", "class", "region", "idc")
                if k in attrs]
        keys += [k for k in attrs if k not in keys and k not in NOISY_TAGS]
        tags = " ".join("%s=%s" % (k, attrs[k]) for k in keys)
        extra = "src=%s  msgId=%s" % (log.get("source", ""), log.get("messageId", ""))
        print("    " + extra)
        if tags:
            print("    tags: " + tags)
        print("    " + fmt_message(log.get("message", ""), args.pretty, args.full, args.width).replace("\n", "\n    "))
        print()


def grep_filter(logs, pattern):
    if not pattern:
        return logs
    rx = re.compile(pattern, re.I)
    return [l for l in logs
            if rx.search(l.get("message", "")) or rx.search(l.get("title", ""))
            or rx.search(json.dumps(l.get("attrs") or {}, ensure_ascii=False))]


def summarize_titles(logs):
    """(title, user) 组合统计——用来反查真实取值，替代靠记忆。"""
    counter = {}
    for log in logs:
        attrs = log.get("attrs") or {}
        key = (log.get("title") or "(no title)", attrs.get("user") or "(no user)")
        counter.setdefault(key, {"n": 0, "method": attrs.get("method", ""),
                                 "vendorId": attrs.get("vendorId", ""),
                                 "sample": log.get("message", "")[:80]})
        counter[key]["n"] += 1
    return sorted(counter.items(), key=lambda kv: -kv[1]["n"])


# -------------------------------------------------------------------- 子命令

def build_filters(args):
    filters = {}
    if getattr(args, "title", None):
        filters["title"] = args.title
    if args.user:
        filters["tagKey"] = "user"
        filters["tagValue"] = args.user
    if args.tag:
        keys, vals = [], []
        for pair in args.tag:
            if "=" not in pair:
                die("--tag 要写成 key=value")
            k, v = pair.split("=", 1)
            keys.append(k)
            vals.append(v)
        if args.user:  # 与 --user 合并
            keys.insert(0, "user")
            vals.insert(0, args.user)
        filters["tagKey"] = "&".join(keys)
        filters["tagValue"] = "&".join(vals)
    if args.level:
        codes = [LEVEL_MAP[l.lower()] for l in re.split(r"[, ]+", args.level) if l]
        filters["logLevel"] = ",".join(codes)
    if args.trace:
        filters["messageId"] = args.trace
    if args.msg:
        filters["message"] = args.msg
    if args.source:
        filters["source"] = args.source
    if args.host:
        filters["hostName"] = args.host
    if args.ip:
        filters["hostIp"] = args.ip
    if args.thread:
        filters["threadId"] = args.thread
    return filters


def cmd_search(args):
    from_dt, to_dt = resolve_window(args)
    filters = build_filters(args)
    meta, logs = fetch_logs(args.app, args.env, iso_utc(from_dt), iso_utc(to_dt),
                            args.idc, filters, args.limit)
    logs = grep_filter(logs, args.grep)

    if args.json:
        print(json.dumps({"window": [local_str(from_dt), local_str(to_dt)],
                          "total": meta["total"], "logs": logs}, ensure_ascii=False, indent=2))
        return

    total_txt = " / totalSize=%s" % meta["total"] if meta["total"] else ""
    print("窗口 %s ~ %s（北京时间）  app=%s  命中 %d 条%s\n"
          % (local_str(from_dt), local_str(to_dt), args.app, len(logs), total_txt))
    if logs:
        print_logs(logs, args)
        return

    print("✖ 0 条。常见原因：title 是精确值（不是包名/方法名）、user tag 可能是端上标识不一定是工号、"
          "时间窗太窄、分页之后的更新没覆盖到。")
    if args.no_fallback:
        return
    diagnose(args, from_dt, to_dt, filters)


def diagnose(args, from_dt, to_dt, filters):
    """0 条时逐级放宽条件，把"真实长什么样"直接摊出来，代替靠记忆。"""
    attempts = []
    if filters.get("title"):
        attempts.append(("只去掉 title，保留 user/tag",
                         {k: v for k, v in filters.items() if k != "title"}))
    if filters.get("tagKey"):
        attempts.append(("去掉 tag 过滤（user/其他 tag 值可能写错）",
                         {k: v for k, v in filters.items()
                          if k in ("logLevel", "messageId", "source", "title")}))
    attempts.append(("全部条件清空，只看窗口",
                     {k: v for k, v in filters.items()
                      if k in ("logLevel", "messageId", "source")}))

    for label, loose in attempts:
        print("\n→ 放宽：%s …" % label)
        meta, logs = fetch_logs(args.app, args.env, iso_utc(from_dt), iso_utc(to_dt),
                                args.idc, loose, 300)
        if not logs:
            print("  仍然 0 条。")
            continue
        pairs = [(k, v) for k, v in summarize_titles(logs) if k[0] not in ("NA", "(no title)")]
        hint = (args.title or "").lower()
        print("  拉到 %d 条，真实 title / user 组合（前 15）：" % len(logs))
        for (title, user), info in pairs[:15]:
            mark = " ★" if hint and hint in title.lower() else ""
            print("    %-48s user=%-26s ×%-4d %s%s"
                  % (title, user, info["n"], info["method"], mark))
        matched = [(t, u) for (t, u), _ in pairs if hint and hint in t.lower()]
        window = '--from "%s" --to "%s"' % (local_str(from_dt), local_str(to_dt))
        if matched:
            parts = ["clog.py search --app %s" % args.app]
            if matched[0][1] != "(no user)":
                parts.append("--user '%s'" % matched[0][1])
            parts.extend(["--title '%s'" % matched[0][0], window])
            print("\n  下一步可直接复制：\n    " + " ".join(parts))
        else:
            print("\n  这个窗口内的 title 里没有包含 %r 的，可能时间窗不对或用户标识不对。" % (args.title or ""))
            print("  扩大范围再看一遍真实取值：\n    clog.py titles --app %s --user '%s' --last 2h --top 40"
                  % (args.app, args.user or ""))
        return
    print("\n  这个窗口内该应用一条日志都没有：换时间窗，或确认 appId / 环境（当前 env=%s）。" % args.env)


def cmd_titles(args):
    from_dt, to_dt = resolve_window(args)
    filters = build_filters(args)
    filters.pop("title", None)  # 这条命令就是为了发现 title
    meta, logs = fetch_logs(args.app, args.env, iso_utc(from_dt), iso_utc(to_dt),
                            args.idc, filters, args.limit)
    logs = grep_filter(logs, args.grep)
    total_txt = " / totalSize=%s" % meta["total"] if meta["total"] else ""
    print("窗口 %s ~ %s  app=%s  拉到 %d 条%s\n"
          % (local_str(from_dt), local_str(to_dt), args.app, len(logs), total_txt))
    if not logs:
        print("没有日志。检查 appId、env（当前 %s）、时间窗，或去掉 --user/--level 再试。" % args.env)
        return
    for (title, user), info in summarize_titles(logs)[:args.top]:
        if title in ("NA", "(no title)"):
            continue
        print("%-48s user=%-26s ×%-4d %s vendor=%s" %
              (title, user, info["n"], info["method"], info["vendorId"]))
        if info["sample"]:
            print("    %s…" % info["sample"].replace("\n", " "))


def cmd_decode(args):
    raw = args.target
    if raw.startswith("@"):
        with open(raw[1:], encoding="utf-8") as fh:
            raw = fh.read()
    raw = raw.strip()

    app = None
    if raw.startswith("{"):
        left = json.loads(raw)
    else:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(raw).query)
        if "left" not in q:
            die("没找到 left 参数，请确认是 clog 页面右上角 Share 出来的完整链接")
        left = json.loads(q["left"][0])
        app = (q.get("leftHitName") or [None])[0]

    query = (left.get("queries") or [{}])[0]
    where = query.get("where") or query.get("_where") or ""
    extra_where = query.get("whereQuery") or ""
    parts = []
    for chunk in (where, extra_where):
        for cond in re.split(r"\s+AND\s+", chunk.strip()) if chunk.strip() else []:
            if cond and cond not in parts:
                parts.append(cond)
    full_where = " AND ".join(parts)

    rng = left.get("range") or {}
    from_dt = epoch_ms_to_local(rng["from"]) if rng.get("from") else None
    to_dt = epoch_ms_to_local(rng["to"]) if rng.get("to") else None

    titles = re.findall(r"title\s*=\s*'([^']*)'", full_where)
    tags = dict(re.findall(r"_tags\['(\w+)'\]\s*=\s*'([^']*)'", full_where))
    levels = re.search(r"log_level\s+IN\s*\(([^)]*)\)", full_where)
    model_title = ((query.get("clogQueryModel") or {}).get("title") or "")

    print("应用 appId : %s" % (app or "(链接里没带)"))
    print("日志表     : %s" % (query.get("table") or "-"))
    print("region     : %s" % (left.get("region") or "-"))
    print("时间窗     : %s ~ %s（北京时间）"
          % (local_str(from_dt) if from_dt else "-", local_str(to_dt) if to_dt else "-"))
    print("级别       : %s" % (levels.group(1) if levels else "全部"))
    print("title 过滤 : %s" % (titles[0] if titles else "（where 里没有）"))
    if model_title:
        note = "" if not titles or model_title == titles[0] else "   ← 与 where 不一致，注意别抄错"
        print("查询框 title: %s%s" % (model_title, note))
    if tags:
        print("tag 过滤   : %s" % "  ".join("%s=%s" % kv for kv in tags.items()))
    print("\n原始 where : %s" % full_where)

    if app:
        cmd = ["clog.py search --app %s" % app]
        if tags.get("user"):
            cmd.append("--user '%s'" % tags["user"])
        if titles:
            cmd.append("--title '%s'" % titles[0])
        if from_dt and to_dt:
            cmd.append('--from "%s" --to "%s"' % (local_str(from_dt), local_str(to_dt)))
        if levels:
            mapped = [w.lower() for w in re.findall(r"'?(INFO|WARN|ERROR|FATAL)'?", levels.group(1), re.I)]
            if mapped and len(mapped) < 4:  # 全选就不必写了
                cmd.append("--level " + ",".join(mapped))
        print("\n可直接复用：\n  " + " ".join(cmd))


# ----------------------------------------------------------------------- CLI

def default_app():
    if os.environ.get("CLOG_APP"):
        return os.environ["CLOG_APP"].strip()
    conf = os.path.expanduser("~/.chengxiaobang/tools/clog.conf")
    if os.path.exists(conf):
        try:
            with open(conf, encoding="utf-8") as fh:
                return str(json.load(fh).get("app") or "").strip() or None
        except (ValueError, OSError):
            return None
    return None


def cmd_trace(args):
    """traceId 一次拉全链路：req / res / cost / 依赖调用 / 自定义打点。"""
    args.title = None
    args.trace = args.trace_id
    args.no_fallback = True
    if not args.last and not args.from_:
        args.last = "2h"
    cmd_search(args)


def main(argv=None):
    p = argparse.ArgumentParser(prog="clog", description="CLOG 日志查询小工具（BAT MCP）")
    sub = p.add_subparsers(dest="cmd")

    def common(sp):
        sp.add_argument("--app", default=None, help="应用 appId，如 100016554（可用 CLOG_APP 或 clog.conf 设为默认）")
        sp.add_argument("--env", default="pro", choices=["pro", "fws", "uat"])
        sp.add_argument("--idc", default=None, help="SHA / FRA-AWS / SGP-ALI，pro 生效")
        sp.add_argument("--from", dest="from_", default=None, help='如 "2026-11-11 20:00"')
        sp.add_argument("--to", default=None, help='如 "2026-11-11 21:00"')
        sp.add_argument("--last", default=None, help="最近多久，如 30m / 2h / 1d")
        sp.add_argument("--user", default=None, help="user tag 值（工号或端上标识）")
        sp.add_argument("--tag", action="append", default=[], help="额外 tag，key=value，可多次")
        sp.add_argument("--level", default=None, help="info,warn,error,fatal")
        sp.add_argument("--source", default=None, help="来源类名，支持 like")
        sp.add_argument("--host", default=None, help="完整 hostname")
        sp.add_argument("--ip", default=None, help="完整 ip")
        sp.add_argument("--thread", default=None, help="线程号")
        sp.add_argument("--trace", default=None, help="完整 traceId / messageId")
        sp.add_argument("--msg", default=None, help="正文关键字（只匹配前128字符）")
        sp.add_argument("--grep", default=None, help="本地过滤（正则，匹配正文/tags）")
        sp.add_argument("--limit", type=int, default=50, help="最多展示条数，默认 50")
        sp.add_argument("--json", action="store_true", help="输出 JSON")
        sp.add_argument("--pretty", action="store_true", help="正文是 JSON 时格式化")
        sp.add_argument("--full", "-f", action="store_true", help="不截断正文")
        sp.add_argument("--width", type=int, default=400, help="正文截断长度")

    sp = sub.add_parser("search", help="按条件查日志")
    common(sp)
    sp.add_argument("--title", default=None, help="日志 title 精确值，支持 test* 这种 like")
    sp.add_argument("--no-fallback", action="store_true", help="0 条时不自动反查")
    sp.set_defaults(func=cmd_search)

    tp = sub.add_parser("titles", help="反查窗口内真实的 title / user 取值")
    common(tp)
    tp.add_argument("--top", type=int, default=20, help="展示前 N 种，默认 20")
    tp.set_defaults(func=cmd_titles)

    tr = sub.add_parser("trace", help="按 traceId/messageId 一次拉全链路日志")
    common(tr)
    tr.add_argument("trace_id", help="完整的 traceId / messageId，如 100029702-0a2d01dd-498444-1623807")
    tr.set_defaults(func=cmd_trace, trace=None)

    dp = sub.add_parser("decode", help="把 clog 分享链接 / left 参数翻译成可复用命令")
    dp.add_argument("target", help="链接，或 @文件路径，或 left 的 JSON 原文")
    dp.set_defaults(func=cmd_decode)

    args = p.parse_args(argv)
    if not getattr(args, "func", None):
        p.print_help()
        return 1
    if getattr(args, "app", None) is None:
        args.app = default_app()
    if not args.app and args.func is not cmd_decode:
        die("没找到 appId：加 --app 100016554，或设 export CLOG_APP=100016554")
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
