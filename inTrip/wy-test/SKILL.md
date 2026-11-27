---
name: wy-test
display-name: 商品录入测试用例
description: 基于历史 bug 知识库生成「商品录入」页面的测试用例。当王妍改完 imvc-vbk / imvc-vbk-v2 的商品录入页面（判定口径：页面引入了 publicComponent/SubMenu 组件 = 商品详情/商品录入页），需要出回归用例或人工测试清单时使用。知识库按「页面」存全量历史 bug（Sub-bug + 普通 Bug）、按「测试同学」存关注点画像；调用时分别按测试同学 A、测试同学 B、以及程小帮自己的代码/数据推导各生成一份 md（分文件），并支持把新发现的场景回写知识库。用户说「帮我出测试用例」「参考历史 bug 生成回归用例」「生成韩瑞莉/XX 的测试用例」「wy-test 服务人员这块」「把这个改动补测一下」时使用。
---

# wy-test · 商品录入测试用例（基于历史 bug 知识库）

王妍要的是**有据可依的用例**：不是凭空想场景，而是「这个页面历史上谁踩过什么坑 → 这次改动会不会再踩 → 补上历史没覆盖的」。

## 口径（王妍 2026-11 确认，别再问）

| 项 | 默认 | 说明 |
|---|---|---|
| 页面范围 | imvc-vbk / imvc-vbk-v2 的**商品录入页** | **判定口径：页面引入了 `publicComponent/SubMenu`**（= 商品详情/录入页）；非商品录入页排除。清单见 `references/pages.md` |
| bug 类型 | **Sub-bug(9) + 普通 Bug(3)** | 都要拉；Sub-task 不要 |
| 测试同学画像 | **只用 Sub-bug / Bug** | 不纳入用例、评审记录（后续可扩） |
| 输出形态 | **分文件** | 每位同学一份 md + 程小帮一份 md + 一份 index |
| 回写 | **要回写** | 生成用例后，把新发现的场景追加回 `kb/pages/<page>.md` 的「程小帮补充」区 |
| 数据 | 默认 fat 环境、供应商 30804/6206 | 用 DOT MCP 查 `pkgproductdb`；要造数时在用例里给 SQL |

## 目录与知识库

```
wy-test/
├── SKILL.md
├── references/
│   ├── pages.md        # 商品录入页清单（两仓库）+ 入口 URL + 关键 DB 表
│   ├── scenarios.md    # 场景标签体系 + 关键词归类规则（kb_sync 用）
│   └── conventions.md  # 用例条目模板、优先级口径、输出目录
├── scripts/
│   ├── kb_sync.mjs     # iDev2 查询结果 → 知识库（幂等）
│   └── kb_query.mjs    # 页面 + 改动关键词 + 同学 → 召回相关 bug
└── kb/                 # ★ 知识库（增量维护，随技能走）
    ├── bugs/<parent>.json     # 原始快照（含 page / scenarios / creator）
    ├── pages/<page>.md        # 页面维度：场景分组的历史 bug + 程小帮补充区
    └── testers/<id>-<name>.md # 同学画像：场景分布 + 关注点
└── output/             # ★ 生成结果（按日期-页面分目录，不进业务仓库）
```

**两层知识库**：页面层存**全量** bug（与谁提的无关）；同学层只存**视角**（关注点权重）。同一批 bug 只存一份。

## 第 1 步：定位改动与页面

```bash
cd /Users/temptrip/Projects/imvc-vbk        # 或 imvc-vbk-v2
git branch --show-current && git status --short && git diff --stat HEAD
```

- 由改动文件 → `references/pages.md` 里的「代码路径」列映射到页面 key（如 `baseInfoMerge`、`tripProduct`）
- 用户口头说的页面名（"服务人员那块""基本信息"）也按该表映射
- 页面判定仍以「是否引入 SubMenu」为准；不在清单里的页面直接说"不在知识库范围"，不要硬套

## 第 2 步：初始化 / 更新知识库（有新的 iDev 父任务或新同学时才做）

1. 找到父任务 issueId（`iDev2-issue-query` 传 `issueKeys`，取 `issueId`）
2. 拉全部子项（**必须取完所有页**）：

```
parentIssueId: ["<issueId>"]
size: 100
withContent: true
includeFields: issueKey,title,issueType,issueStatusCategory,creatorObj,createtime,contenttxt
```

3. 结果通常落盘为 `tool-results/…txt`，**不要把整份 JSON 读进上下文**，直接喂脚本：

```bash
node "$SKILL_DIR/scripts/kb_sync.mjs" --input=<结果文件> --parent=XLSP-3806 \
  --page=product-baseinfo [--creator-filter=S41665] [--kb=$SKILL_DIR/kb]
```

脚本会：按 `issueType.id ∈ {3,9}` 过滤 → 按 `references/scenarios.md` 打场景标签 → 合并进 `kb/bugs/<parent>.json`（按 key 幂等）→ 重写 `kb/pages/<page>.md` 与 `kb/testers/<id>-<name>.md`。

## 第 3 步：召回（生成用例前必做）

```bash
node "$SKILL_DIR/scripts/kb_query.mjs" --kb=$SKILL_DIR/kb --page=product-baseinfo \
  --keywords=置灰,多语言,资源组 [--tester=S41665] [--json]
```

输出按场景分组的历史 bug（含 key/标题/状态/命中词/原文摘要）。**关键词从本次改动里取**：改动的字段名、组件名、提示文案、分支条件（例如 `languageReadOnly`、`guideGroupServiceLanguage`、`请至少添加`）。

## 第 4 步：生成三份 md（分文件）

输出目录：**`$SKILL_DIR/output/<YYYY-MM-DD>-<page>/`**（产物留在技能目录内，**不要写进业务仓库的 `.tmp/`**）

| 文件 | 内容 | 硬要求 |
|---|---|---|
| `用例-<同学姓名>.md` | 该同学在该页面提过的 bug → 转成回归用例；**每条可追溯 bug key** | 该同学此页面无历史 bug 时，明确写「无历史，建议按通用清单」，不要编造来源 |
| `用例-<同学B>.md` | 同上另一位同学 | 同上 |
| `用例-程小帮补充.md` | 代码路径（校验分支、FE/BE 口径差）+ DB 枚举 + PRD 缺口推导出的**新**场景 | 只放历史没覆盖的；每条给代码/表依据 |
| `index.md` | 合并视图 | 标出**交集**（三方/两方都命中）= 必测；列出三份差异原因 |

**用户点名了几位同学就生成几份**，未点名时默认：父任务下 bug 数最多的前两位 + 程小帮补充。

单条用例模板见 `references/conventions.md`，必须含：优先级、来源、前置数据（产品ID/SQL）、步骤、**可判定的预期**（文案/置灰/落库变化）、依据（bug key 或 `file:line`）。

## 第 5 步：回写知识库

生成后，把「程小帮补充」里**经代码/DB 证实、但不属于已有 bug**的场景，追加到 `kb/pages/<page>.md` 的 `## 程小帮补充场景` 区（每条：场景名 / 判定依据 / 对应代码或表 / 首次发现日期）。同一场景已存在则跳过（按场景名去重）。

## 第 6 步：回报

一句话结论 + 本次生成的 md 绝对路径（**同学数 + 1 份补充**，index 只是导航）+ 本次知识库新增了什么（新 bug 数 / 新场景数）+ 哪些场景**当前前端未实现**（需产品拍板）。不要把用例正文复述一遍。

## 踩坑

- `parentIssueId` 只返回**直接子项、不递归**；`total > size` 要翻完所有页，否则"这个页面只有 N 条 bug"是假结论
- 普通 Bug 的 `issueType.id` 是 **3**，Sub-bug 是 **9**，Sub-task 是 **6** —— 只要 3 和 9
- bug 正文里常混 `&amp;` 和图片链接，`kb_sync` 已做清洗；自己读原始 JSON 时别被 URL 干扰
- 页面判定别用路径猜：**以是否 import `publicComponent/SubMenu` 为准**，v1 的 `basicinfo` 是老页面、也引了 SubMenu，算在内
- 同一 bug 可能跨页面（简版/复杂版都复现）：`--page` 只打一个主页面标签，跨页场景在用例里注明"简版同验"
- 知识库是**增量**的：重跑 `kb_sync` 不能覆盖人工回写的「程小帮补充」区（脚本按标题保留该段落）
- 生成用例时**先召回再写**，不要凭印象说"历史上出过"——每条来源都要能在 `kb/` 里查到 key
