#!/usr/bin/env python3
"""对比同一篇文档的两个版本，输出可直接粘进 changes.md 的台账片段。

用法: python3 recover_edits.py <交付版.md> <当前版.md> [--title 文档标题]

两版从飞书按 revision 回读得到：
  docs +fetch --doc <url> --doc-format markdown --revision-id <交付时的版本> --jq .data.document.content
  docs +fetch --doc <url> --doc-format markdown --jq .data.document.content
"""

import difflib
import re
import sys

# 归因用的机械特征。判不出来的写「待人工归因」，不要瞎猜。
RULES = [
    ("元叙述", r"这份文档|本文|这篇文档|只做|先说明|范围是|不是.{0,6}问题|它决定"),
    ("口语连接", r"也就是说|换句话说|说白了|摆在一起|总的来说|其实"),
    ("推演", r"如果.{2,30}(就|会|则)|顺序反了|否则.{2,20}"),
    ("比喻解释", r"不是.{2,8}，是.{2,20}|像.{2,10}一样|相当于"),
]


def paras(text):
    out = []
    for block in re.split(r"\n\s*\n", text):
        line = " ".join(block.split())
        if line:
            out.append(line)
    return out


def attribute(sentence):
    for name, pat in RULES:
        if re.search(pat, sentence):
            return name
    return "待人工归因"


def cell(s):
    return s.replace("|", "\\|")[:160]


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    base_p, cur_p = sys.argv[1], sys.argv[2]
    title = sys.argv[4] if len(sys.argv) > 4 and sys.argv[3] == "--title" else "（未命名）"

    base = paras(open(base_p, encoding="utf-8").read())
    cur = paras(open(cur_p, encoding="utf-8").read())

    sm = difflib.SequenceMatcher(None, base, cur, autojunk=False)
    removed, added, changed = [], [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        if tag == "delete":
            removed += base[i1:i2]
        elif tag == "insert":
            added += cur[j1:j2]
        else:
            for k in range(max(i2 - i1, j2 - j1)):
                old = base[i1 + k] if i1 + k < i2 else ""
                new = cur[j1 + k] if j1 + k < j2 else ""
                if old and new:
                    changed.append((old, new))
                elif old:
                    removed.append(old)
                else:
                    added.append(new)

    print(f"## {title}\n")
    if removed:
        print("### 删掉的段落\n\n| 原文 | 归因 |\n|---|---|")
        for s in removed:
            print(f"| {cell(s)} | {attribute(s)} |")
        print()
    if added:
        print("### 新增的段落\n\n| 内容 | 备注 |\n|---|---|")
        for s in added:
            print(f"| {cell(s)} | 她补写的 |")
        print()
    if changed:
        print("### 改写的段落\n\n| 原文 | 归因 | 改成 |\n|---|---|---|")
        for o, n in changed:
            print(f"| {cell(o)} | {attribute(o)} | {cell(n)} |")
        print()

    total = len(removed) + len(added) + len(changed)
    print(f"共 {total} 处改动：删 {len(removed)} / 增 {len(added)} / 改 {len(changed)}")
    if not total:
        print("两版一致，没有改动。")
        return 0
    print("\n下一步：把归因不是「待人工归因」的行直接采用；剩下的自己判断。"
          "同类归因出现三次以上，就该往 rules.md 加一条规则。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
