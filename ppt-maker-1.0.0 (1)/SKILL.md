---
name: ppt-maker
description: "Use when creating, reading, editing, discussing, designing, brainstorming, or visually reviewing presentations (.pptx). Triggers on: PPT, 演示文稿, 幻灯片, slides, deck, presentation, pptx, 做个PPT, 帮我做演示, 讨论PPT, 构思PPT, 设计PPT, 想做演示, 规划幻灯片, 一起做个PPT, 模板, template, 模板规范, 提取模板, 分析模板, 解析模板, 看下这个pptx, 改一下PPT, 这页好看吗, 截图检查, 改ppt, 修改演示文稿."
---

# PPT Maker

## ⚠️ ENTRY HARD RULES — 进 skill 必读

### 1. 唯一生成路径(Unique Generation Path)

| 任务 | 用什么 | 禁止 |
|---|---|---|
| 从零生成 pptx (S1/S2) | `node generate.js` (基于 pptxgenjs) | python-pptx 等其他生成库 |
| 修改 foreign pptx (S3) | python-pptx | 装新库做生成 |
| 读取 pptx 文本 | markitdown | — |
| 分析模板 OOXML | python-pptx | — |
| pptx → pdf 预览 | LibreOffice (`soffice`) | — |
| pdf → jpg 截图 | poppler (`pdftoppm`) | — |

**禁止安装/调用** python-pptx 与 pptxgenjs 之外的任何 pptx 库 (reportlab, aspose, Spire, 等)。
不知道用什么时,看上表;**不要**去 npm/pip 装新东西。

### 2. brainstorming 边界

用户说"**讨论 / 构思 / 设计 / 规划 PPT**"时,**走本 skill 的 workflow Step 1-2**(详见 [workflow-create.md](workflow-create.md)),**不要**跳到 superpowers:brainstorming。

PPT 的构思属于本 skill 的领地。superpowers:brainstorming 是给"我有个想法,要不要先讨论再写代码"的通用设计场景用的;PPT 已经有专门的工作流,从构思到代码到自检全都包了。

### 3. Python 脚本调用方式(不要自己建临时 venv!)

**所有 `scripts/*.py` 都带 PEP 723 inline metadata + uv shebang**(`#!/usr/bin/env -S uv run --script`),依赖在 `# /// script ... # ///` 头部声明。

```bash
# 正确 ✓ — 直接执行,uv 自动按需安装,缓存到 ~/.cache/uv/(首次几秒,之后零成本)
./scripts/workflow/analyze_template.py source.pptx --output-dir ...
./scripts/workflow/validate-template.py path/to/template.yaml

# 错误 ✗ — 绕过 shebang 用系统 python,触发 ModuleNotFoundError
python scripts/workflow/analyze_template.py ...
python3 scripts/workflow/validate-template.py ...
```

**遇到 ModuleNotFoundError 时**:
- **不要** `python -m venv /tmp/xxx` 自己造临时 venv
- **不要** `pip install` / `uv pip install` 到全局
- 检查是不是用了 `python scripts/xxx.py` 而非 `./scripts/xxx.py`
- uv 的 per-script 依赖缓存在 `~/.cache/uv/`,所有会话共享,**这就是固定的依赖位置**,无需重装

每个 .py 文件头部 `# /// script ... # ///` 块就是该脚本的真相源,**不需要全局 requirements.txt 或 venv**。

### 4. 场景路由(Scenario Routing)

**进入本 skill 的第一件事**,在 PPT 项目目录上跑场景检测:

```bash
bash scripts/detect-scenario.sh <project-dir>
```

输出:

| 输出 | 含义 | 走哪个工作流 |
|---|---|---|
| `S1` | 项目不存在或为空 → 从零创作 | [workflow-create.md](workflow-create.md) |
| `S2` | 项目有 design.md + generate.js → 修改 skill-native PPT | [workflow-edit-native.md](workflow-edit-native.md) |
| `S3` | 项目只有 .pptx → 修改 foreign PPT | [workflow-edit-foreign.md](workflow-edit-foreign.md) |
| `UNKNOWN` | 状态不明 | 问用户 |

**必须实际执行脚本,不要自己判断场景**。即使你从上下文能推断出场景类型（比如用户给了 .pptx 文件所以"显然是 S3"），也必须跑脚本。原因：脚本的判断逻辑会随版本演化（新增场景、边界条件），你的推断可能与脚本结果不一致，导致错走工作流。这是 eval 验证的硬性检查点。

---

## Quick Reference

| 任务 | 文档 |
|---|---|
| S1 从零创作 PPT | [workflow-create.md](workflow-create.md) |
| S2 修改 skill 创建的 PPT | [workflow-edit-native.md](workflow-edit-native.md) |
| S3 修改外部 PPT | [workflow-edit-foreign.md](workflow-edit-foreign.md) |
| 视觉规范 / 截图检查 | [visual-design.md](visual-design.md) |
| 提取模板规范 | [template-init.md](template-init.md) |
| pptxgenjs API 速查 | [pptxgenjs.md](pptxgenjs.md) |

---

## scripts/ 工具分层

`scripts/` 下分三个 bucket,**新增脚本前先确定它属于哪一个**,放错位置会让后面 cherry-pick 上游 / 复用工具变得困难。

```
scripts/
├── office/         # Bucket 1: 跨格式 OOXML 通用工具集(vendored from Anthropic)
├── pptx-tools/     # Bucket 2: pptx 专用半通用工具(无 ppt-maker workflow 知识)
├── workflow/       # Bucket 3: ppt-maker 定制 workflow 胶水
└── *.sh            # bash 编排(meta tools)
```

| Bucket | 准入门槛 | 现有文件 | 改动约束 |
|---|---|---|---|
| **`office/`** | 跨 docx/pptx/xlsx 通用 OOXML 操作 | `pack.py` / `unpack.py` / `validate.py` / `soffice.py` + `validators/` `helpers/` `schemas/` | **vendored 子目录,谨慎修改**。这是 Anthropic 多个 skill 共享的子工具集,改它意味着脱离上游 |
| **`pptx-tools/`** | pptx-flavored,无 ppt-maker 概念知识(不认识 template.yaml / design.md / generate.js) | `add_slide.py` / `clean.py` / `thumbnail.py` | 可改可加。新加的脚本如果只动 unpacked OOXML 且只针对 pptx,放这里 |
| **`workflow/`** | 认识 ppt-maker 概念,绑死某个 workflow step | `analyze_template.py` / `validate-template.py` / `check-sync.py` / `edit-foreign-template.py` | 可改可加。新加的脚本如果引用 design.md/generate.js/template.yaml,放这里 |
| **`scripts/*.sh`** | shell 编排,调外部二进制(node/soffice/pdftoppm)或检查存在性 | `detect-scenario.sh` / `check-deps.sh` / `regen.sh` | 可改可加。Python 解决不了的 shell 编排放这里 |

**调用入口**:三个 bucket 都通过 `./scripts/<bucket>/<file>.py` 直接执行(全部带 PEP 723 shebang,无需 venv)。bash 工具用 `bash scripts/xxx.sh`。

## 高频脚本速查

| 脚本 | 用途 | 何时跑 |
|---|---|---|
| `bash scripts/detect-scenario.sh <dir>` | 入口场景路由 | 进 skill 第一件事 |
| `bash scripts/check-deps.sh <feature>` | 按 feature 延迟校验工具 | 在使用某个 feature 前 |
| `bash scripts/regen.sh <dir> [--page N]` | 一键 generate→pdf→jpg | 替代手动四步 |
| `./scripts/workflow/analyze_template.py <pptx>` | 提取 OOXML 三层 → template.yaml | S5 提取模板 |
| `./scripts/workflow/validate-template.py <yaml>` | 模板 yaml schema 校验 | 模板提取/修改后 |
| `./scripts/workflow/check-sync.py <dir>` | design.md ↔ generate.js 漂移检测 | S2 修改后,verification 阶段 |
| `./scripts/workflow/edit-foreign-template.py` | S3 python-pptx 骨架 | Claude copy 后改 |
| `./scripts/pptx-tools/thumbnail.py <pptx>` | 缩略图网格(选模板) | 接管外部 pptx 时 |

工具按 feature 延迟校验,**不要进 skill 就跑 `check-deps.sh all`**——只在真正用到某 feature 之前校验那一项。

---

## Template Directory

模板存放在 `ppt/templates/<brand>/` 下,每个模板必须包含 `template.yaml`(机器可读,符合 [templates/template.schema.json](templates/template.schema.json))。结构:

```
ppt/templates/<brand>/
├── template.yaml        # 标准化模板规范(必需)
├── source.pptx          # 原始 pptx
├── layouts.js           # 实现层(每个 layout/component 一个函数)
└── assets/
    ├── logo.png
    ├── layout-*.png     # 每种 layout 的预览
    └── ...
```

详见 [template-init.md](template-init.md)。

---

## QA Principles

- **优先用户截图** — 用户在 PowerPoint 中截图发给 AI 分析,所见即所得
- **LibreOffice 预览** — 作为快速预览手段,标注可能有样式偏差
- **不做 ppt→pdf 最终质检** — PDF 转换会丢失样式
- **emoji / 中文字体** 在 LibreOffice 不准,**以 PowerPoint 截图为准**
- **假设一定有问题** — 检查截图时,目标是找到问题不是确认没问题
