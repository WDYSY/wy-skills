---
name: wy-clog
display-name: CLOG 查日志
description: 查携程 BAT/CLOG 日志。用户说「查日志」「看下 CLOG」「这个 traceId 的日志」「某工号/某时间段的操作日志」「这个 clog 分享链接是查什么」「为什么查不到日志」时使用。支持分享链接翻译、窗口内真实 title/user 反查、traceId 拉全链路、自动转 UTC 与翻页。
---

# wy-clog · CLOG 查日志

## 核心工具

```bash
CLOG=~/.chengxiaobang/skills/wy-clog/scripts/clog.py     # 装好后
[ -f "$CLOG" ] || CLOG=~/Projects/Mine/wy-skills/inTrip/wy-clog/scripts/clog.py
```

只有 `python3` 标准库依赖，走 BAT MCP（`bat-clog`），和 CLOG 页面同一数据源。

| 命令 | 什么时候用 |
|---|---|
| `clog.py decode <链接 | @文件 | left的JSON>` | 用户丢来 clog 分享链接、或问「这个链接到底在查什么」 |
| `clog.py titles --user 工号 --last 1h` | 用户只记得「工号/时间/大概关键字」，不知道 title 怎么写 |
| `clog.py search --user 工号 --title xxx.req --last 30m` | 已经知道 title，精确查 |
| `clog.py trace <traceId> --from "..." --to "..."` | 有 traceId，要一次看全链路（req/res/cost/依赖/打点） |

常用参数：`--app`（默认读 `~/.chengxiaobang/tools/clog.conf`）、`--env pro|fws|uat`、`--idc SHA|FRA-AWS|SGP-ALI`、
`--level info,warn,error,fatal`、`--tag k=v`（可多次）、`--source/--host/--ip/--thread/--msg`、
`--grep 正则`（本地过滤）、`--pretty`（正文 JSON 格式化）、`--full`、`--limit`、`--json`。

## 收到请求后怎么走（按这个顺序判断）

1. **给了 clog 分享链接** → `decode`。顺手核对 `title`：链接里 `where` 的 title 和查询框 `clogQueryModel.title` 经常不一致，两个都可能是他要的；时间窗也常只有十几秒，要提醒。
2. **给了 traceId / `cat-msg-id`** → `trace`，时间窗默认最近 2h，用 `--limit 100` 拉全。
   ⚠️ **陷阱（2026-11-12 实测）**：浏览器响应头里的 CAT id（`X-Cat-Id`/`Rootmessageid`/`Sermessageid`）是**入口链路**的 id，
   应用自己打的 CLOG 日志用的是由它派生出的**新 messageId**，两者数字不同，拿头的 id 查 `messageId` 一定 0 条。
   从一次浏览器请求反推日志，用下面的「从 Network 面板的请求出发」口径。
3. **只给工号 / 用户标识 / 时间段 / 关键字** → 先 `titles` 反查该窗口真实 title 和 user 取值，再 `search` 精确查。不要凭记忆拼 title。
4. **查 0 条** → 别急着说"没有日志"，先看脚本自动打的放宽结果（它会把窗口内真实 title/user 组合列出来），把"写法可能是 X"告诉用户；时间窗仍空就换窗/确认 env。
5. **要判断对错/快慢** → 同一 traceId 里看 `.req` / `.res` / `.cost`（`cost: 2282 ms` 这种）和自定义打点（如 `tour.product.offline.search.empty`）。

## 输出纪律

- 先结论：有没有、多少条、成败、耗时，一句话。
- 再给关键行：时间 + host + title + 关键 tag（`user`/`vendorId`/`method`）+ 正文里真正相关的那几个字段。
- 别把整段 JSON 甩给用户；正文长就用 `--grep` 或 `--pretty` 后只摘需要的字段。
- 排查结论要能落到代码位置：tag 里的 `class` + 正文里的 `source`（如 `ProductMetaProxy.java:1264`）。
- 用户是产品/运营语境时，不贴原始 uid、手机号等个人信息，只给结论。

## 口径（写错就 0 条，务必记住）

| 维度 | 规律 |
|---|---|
| `title` | 精确值：`<方法名>.req` / `.res` / `.cost`；自定义打点用点号（`tour.product.offline.search.empty`）。模糊要写 `xxx*` |
| `user` tag | 工号（`TR004363`）**或**端上标识（`advisor__WeChat239547203`），两种都存在 |
| `method` | 不带后缀的方法名（`searchResourceList`） |
| `logLevel` | MCP 只认 INFO/WARN/ERROR/FATAL；页面的 DEBUG 传不过去，不传即全量 |
| 时间 | 一律按北京时间输入，脚本转 UTC；`--last 30m` 免算 |
| `totalSize` | MCP 常年返回 0，**不能用来判断有没有数据**，以实际条数为准 |
| 分页 | `--limit` 超过单页时脚本自动用 `lastScanTime`+`lastScanRowKey` 翻页 |

详细字段表见 `references/fields-cheatsheet.md`。

## 从 Network 面板的一次请求出发（最常用的入口）

实测一条 RestAPI 响应头就能给出三个关键参数，直接拼出能命中的查询：

| 响应头 | 用途 |
|---|---|
| `X-Service-Appid` | CLOG 查哪个应用（如 `100016554`），不用靠记忆 |
| `X-Service-Call` | CLOG 的 title 前缀（`inSwitch` → `inSwitch*` 一次拿到 .req/.res/.cost） |
| `X-Service-Idc` | 可选，收敛 idc |
| URL 里的 `subEnv` | 转大写做 tag：`--tag _subEnv_=FAT28135`（多环境共库时非常关键） |
| `Clogging_trace_id` / URL `x-traceId` | 另一套链路 id，只在必要时人工比对 |

标准配方（已实测命中 50 条 req/res/cost）：

```bash
clog.py search --app 100016554 --env fws --title 'inSwitch*' --tag _subEnv_=FAT28135 \
  --from "2026-11-12 14:59:47" --to "2026-11-12 15:19:47"
```

环境判定：域名含 `fws/fat/qa/nt/dev/test` → `fws`；含 `uat` → `uat`；其余 → `pro`。
用户配了 `assets/network-md-export-clog.user.js`（见下）的话，这几步是自动的。

## 相关交付物

- `assets/clog-helper.user.js`：脚本猫(篡改猴类)用户脚本，装在浏览器里，打开 clog 页面自动浮一个面板——把当前 URL 的 `left` 解析成人话、一键复制等价的 `clog` 命令、按工号+title+时间窗跳转重查。用户说"页面里记不住格式"时引导装这个。
- `assets/network-md-export-clog.user.js`：在用户原有的「Network MD 导出工具」(3.10.0) 上加的「选接口 → 生成 CLOG 查询参数」版本（3.11.0，已去掉 @updateURL 防止被上游覆盖）。
  从悬浮菜单进「🔎 选接口 → 生成 CLOG 查询参数」，挑一条请求，自动解析 appId/服务名/subEnv/时间窗，给两种命令（服务名主力口径 + 入口 messageId 备用口径）。
  改这个脚本时保持它原来的风格（内联样式、暗色 `#1e1e2e`、`mkInput/line/mkBtn` 这些小工具函数），不要引入构建或外部依赖。
- 终端里想少打字：`alias clog='python3 ~/.chengxiaobang/skills/wy-clog/scripts/clog.py'`（用户自己加，不要擅自改 `~/.zshrc`）。

## 边界

- 只做只读查询；不碰 `bat-bigeyes-respond` 这类会动生产告警的操作。
- 结果里带用户标识/正文原文时，只在排障语境里给，不外发到群里。
- 脚本改动后要重新安装技能（源码 `~/Projects/Mine/wy-skills/inTrip/wy-clog` → install 接口 → check），否则 `~/.chengxiaobang/skills/` 下还是旧副本。
