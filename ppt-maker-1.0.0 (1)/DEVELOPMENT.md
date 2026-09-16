# ppt-maker

Claude Code skill for creating, reading, editing, and visually reviewing PowerPoint presentations (`.pptx`).

> **For Claude (the model):** read [SKILL.md](SKILL.md) instead — it's the source of truth.
> This README is for humans browsing the repo.

## What it does

| 场景 | 工作流 |
|---|---|
| **S1** 从零创作 PPT | [workflow-create.md](workflow-create.md) |
| **S2** 修改 skill 创建的 PPT(有 design.md + generate.js) | [workflow-edit-native.md](workflow-edit-native.md) |
| **S3** 修改外部 PPT(只有 .pptx,无源码) | [workflow-edit-foreign.md](workflow-edit-foreign.md) |
| **模板提取** 从 .pptx 抽出 template.yaml | [template-init.md](template-init.md) |

底层用 [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) 生成、[python-pptx](https://python-pptx.readthedocs.io/) 修改、LibreOffice + poppler 渲染预览,详见 [SKILL.md](SKILL.md)。

## 目录结构

```
ppt-maker/
├── SKILL.md                  # 模型入口(自动加载)
├── README.md                 # 本文件
├── workflow-create.md        # S1 创作流程
├── workflow-edit-native.md   # S2 修改流程
├── workflow-edit-foreign.md  # S3 外部 pptx 流程
├── template-init.md          # 模板提取
├── editing.md                # 通用 OOXML 编辑指南
├── visual-design.md          # 视觉规范 / 截图自检
├── pptxgenjs.md              # pptxgenjs API 速查
├── templates/                # 模板规范 schema + 实现样板
└── scripts/                  # ↓ 三个 bucket
    ├── office/               # Bucket 1: vendored 跨格式 OOXML toolkit
    ├── pptx-tools/           # Bucket 2: pptx 专用半通用工具
    ├── workflow/             # Bucket 3: ppt-maker 定制 workflow 胶水
    └── *.sh                  # bash 编排
```

## scripts/ 工具分层(设计意图)

`scripts/` 是 ppt-maker 最容易腐烂的地方 — 历史上我把上游 vendored 的工具集和我们自己的 workflow 胶水堆在一起,导致改一个动一片。现在物理上分成 4 个 bucket,**新增脚本前先确定它属于哪一个**:

### Bucket 1: `scripts/office/` — vendored OOXML toolkit

**准入**:跨 docx/pptx/xlsx 通用的 OOXML 操作。

**现有**:`pack.py`、`unpack.py`、`validate.py`、`soffice.py` 以及 `validators/` `helpers/` `schemas/` 子目录。

**约束**:这是 Anthropic docx/xlsx skill 共享的子工具集,vendored 进来的。**修改它意味着脱离上游**,以后不能直接 cherry-pick 上游更新。除非有非常具体的理由,否则不要改它的源码。

### Bucket 2: `scripts/pptx-tools/` — pptx 专用半通用工具

**准入**:只针对 pptx,但**无 ppt-maker workflow 知识**(不认识 `template.yaml` / `design.md` / `generate.js` 等概念)。理论上能复用到任何 pptx-related skill。

**现有**:`add_slide.py`(复制 slide 或从 layout 创建)、`clean.py`(清理 unpacked 目录里没引用的资源)、`thumbnail.py`(渲染 slide 缩略图网格)。

**约束**:可以自由改/加。新加脚本如果只动 unpacked OOXML 且只针对 pptx,放这里。

### Bucket 3: `scripts/workflow/` — ppt-maker 定制 workflow 胶水

**准入**:认识 ppt-maker 的工作流概念,**绑死某个 workflow step**。

**现有**:
- `analyze_template.py` — 抽 OOXML 三层结构 → 草拟 `template.yaml`
- `validate-template.py` — 校验 `template.yaml` 是否符合 schema
- `check-sync.py` — 检测 `design.md` ↔ `generate.js` 漂移
- `edit-foreign-template.py` — S3 流程的 python-pptx 编辑骨架

**约束**:可以自由改/加。新加脚本如果引用任何 ppt-maker 概念,放这里。

### Bucket 4: `scripts/*.sh` — bash 编排

**准入**:Shell 编排 — 调外部二进制(`node` / `soffice` / `pdftoppm`)或检查存在性。Python 解决不了或不优雅的事情。

**现有**:
- `detect-scenario.sh` — 入口场景路由(S1/S2/S3)
- `check-deps.sh` — 按 feature 延迟校验工具是否装了
- `regen.sh` — 一键 generate→pdf→jpg 重生成流水线

**约束**:可以自由改/加。

## Python 依赖管理(为什么没有 requirements.txt)

`scripts/` 下所有 `.py` 都用 [PEP 723 inline script metadata](https://peps.python.org/pep-0723/) 声明依赖,shebang 是 `#!/usr/bin/env -S uv run --script`。直接执行就会自动按需安装,缓存在 `~/.cache/uv/`(所有会话共享,首次几秒、之后毫秒)。

```bash
# 正确 ✓
./scripts/workflow/analyze_template.py source.pptx --output-dir out/

# 错误 ✗ — 绕过 shebang,会触发 ModuleNotFoundError
python scripts/workflow/analyze_template.py source.pptx --output-dir out/
```

每个脚本头部 `# /// script ... # ///` 块就是该脚本依赖的真相源。**不需要全局 venv,不需要 requirements.txt**。

详见 [SKILL.md ENTRY HARD RULE 3](SKILL.md#3-python-脚本调用方式不要自己建临时-venv)。

## 安装

作为 Claude Code skill 安装到 `~/.claude/skills/ppt-maker/`,或通过 marketplace 加载。详见 [Claude Code skills 文档](https://code.claude.com/docs/en/skills)。
