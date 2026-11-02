#!/usr/bin/env python3
"""扫文档里的 AI 味痕迹和块丰富度。用法: python3 ai_tells.py <file.xml|file.md>"""

import re
import sys

BANNED = [
    "首先", "其次", "再次强调", "综上所述", "综上", "总的来说", "总而言之",
    "值得注意的是", "不难看出", "由此可见", "赋能", "抓手", "闭环", "一体化",
    "显著提升", "极大地", "助力", "全链路打通", "深度融合", "持续迭代",
    "未来可期", "旨在", "本文将", "详见上文", "如有疑问", "希望对您有帮助",
    "核心洞察", "一句话总结", "价值主张", "最佳实践", "生态位",
]

EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF]"
)

BLOCKS = {
    "标题": r"<h[1-9][ >]",
    "段落": r"<p[ >]",
    "列表项": r"<li[ >]",
    "表格": r"<table[ >]",
    "引用块": r"<blockquote[ >]",
    "高亮框": r"<callout[ >]",
    "代码块": r"<pre[ >]",
    "文档引用": r'<cite[^>]*type="doc"',
    "附件": r"<source[ >]",
    "图片": r"<img[ >]",
    "待办": r"<checkbox[ >]",
    "分栏": r"<grid[ >]",
    "彩色强调": r"<span[^>]*(text-color|background-color)",
}


def scan_banned(lines):
    hits = []
    for no, line in lines:
        # callout 的 emoji 属性是唯一允许的图标位置
        probe = re.sub(r'<callout[^>]*emoji="[^"]*"[^>]*>', "<callout>", line)
        for word in BANNED:
            if word in probe:
                hits.append((no, "套话", f"「{word}」", line.strip()[:60]))
        for m in EMOJI.finditer(probe):
            hits.append((no, "emoji", m.group(0), line.strip()[:60]))
    return hits


def check_tables(text):
    """表格单元格里有没有可点/可数的东西。"""
    out = []
    for i, tbl in enumerate(re.findall(r"<table[ >].*?</table>", text, re.S), 1):
        cells = re.findall(r"<td[ >].*?</td>", tbl, re.S)
        if not cells:
            continue
        bare = [
            c for c in cells
            if not re.search(r"<a[ >]|<code[ >]|<cite[ >]|<checkbox[ >]|\d", c)
        ]
        if len(bare) / len(cells) > 0.6:
            out.append(f"第 {i} 张表：{len(cells)} 格里有 {len(bare)} 格是纯文字。"
                       f"这张表如果要给人核对数据，补数字、字段名或链接；"
                       f"如果是给人查词的字典型表格，忽略这条。")
    return out


LABEL_HEAD = re.compile(r"说明|介绍|概况|相关|情况|详情|内容|概述|小结|简介")


def check_pyramid(text):
    """金字塔原理的机械部分：结论先行、标题写判断、分组成立。"""
    out = []

    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S)
    if m and re.search(r"怎么|如何|是否|为什么|吗？|？|\?", m.group(1)):
        out.append(f"文档标题「{m.group(1)}」是问句。改成交付物式：<体裁>：<对象> 的 <产出物>，"
                   f"例「调研：vai 与 B 端流程的指令对齐方案」。")

    if "<callout" not in text[:1200]:
        out.append("首屏没有独立标出的结论。如果第一段本身就是判断句，忽略这条；不是的话，把结论提上来。")

    for tag, title in re.findall(r"<(h[3-9])[^>]*>([^<]{2,30})</h[3-9]>", text):
        if LABEL_HEAD.search(title):
            out.append(f"{tag}「{title}」是标签词，不是论点。改写成这节要证明的判断。")

    for lst in re.findall(r"<(?:ul|ol)[ >].*?</(?:ul|ol)>", text, re.S):
        n = len(re.findall(r"<li[ >]", lst))
        if n == 1:
            out.append("有一组列表只有 1 条。一条不成组，改成一句话写进段落。")
        elif n > 7:
            out.append(f"有一组列表有 {n} 条。超过 7 条读者抓不住，往上一层再分组。")

    return out


def check_xml(text):
    tally = {name: len(re.findall(pat, text)) for name, pat in BLOCKS.items()}

    prose = tally["段落"] + tally["列表项"]
    carriers = sum(tally[k] for k in ("引用块", "高亮框", "代码块", "表格", "文档引用", "附件", "分栏"))
    total = prose + carriers + tally["标题"]

    print("块水位：" + " / ".join(f"{k} {v}" for k, v in tally.items() if v))

    if total and prose / total > 0.85:
        print("[参考] 段落和列表占 85% 以上。如果内容本身就是这样铺陈，保持原样；需要对比或核对的地方，再换表或代码块。")
    for line in check_pyramid(text):
        print(f"[金字塔] {line}")
    for line in check_tables(text):
        print(f"[表格] {line}")

    # 表格里的 <code> 是字段名和文件名，属于该用；密度只按表格外的正文算
    outside = re.sub(r"<table[ >].*?</table>", "", text, flags=re.S)
    inline_code = len(re.findall(r"<code[ >]", outside)) - len(re.findall(r"<pre[ >]", outside))
    return max(inline_code, 0)


def check_markdown(lines):
    body, inside = [], False
    inline_code = 0
    bold = 0
    for no, line in enumerate(lines, 1):
        if re.match(r"^\s*(```|~~~)", line):
            inside = not inside
            continue
        if inside:
            continue
        body.append((no, line))
        bold += line.count("**") // 2
        inline_code += len(re.findall(r"(?<!`)`([^`\n]{1,60})`(?!`)", line))
    return body, inline_code, bold


def main():
    if len(sys.argv) < 2:
        print("用法: python3 ai_tells.py <file.xml|file.md>")
        return 2
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()
    text = "\n".join(lines)

    is_xml = bool(re.search(r"<(p|h[1-9]|table|callout|blockquote)[ >]", text))

    if is_xml:
        body = list(enumerate(lines, 1))
        inline_code = check_xml(text)
    else:
        body, inline_code, bold = check_markdown(lines)
        if bold > 20:
            print(f"[提示] 加粗 {bold} 处，通篇都在强调等于没有强调。")

    hits = scan_banned(body)
    n = len(lines) or 1
    density = inline_code / n * 20

    print(f"\n{path}: {n} 行")
    if inline_code:
        flag = "偏高" if density > 3 else "正常"
        print(f"行内代码 {inline_code} 处，每 20 行约 {density:.1f} 处（{flag}，阈值 3）")

    if not hits:
        print("套话和 emoji：干净。")
        return 0

    print(f"套话和 emoji：{len(hits)} 处")
    for no, kind, detail, ctx in hits:
        print(f"  L{no:>5}  [{kind}] {detail}  {ctx}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
