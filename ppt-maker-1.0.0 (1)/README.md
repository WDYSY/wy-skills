# PPT Maker

Claude Code Skill，用自然语言创建和编辑专业演示文稿。

## 能做什么

- **从零创建 PPT** — 告诉 Claude 你要做什么演示，自动完成构思、设计、生成全流程
- **修改已有 PPT** — 给 Claude 一个 .pptx 文件，说明要改什么，自动完成修改
- **提取模板** — 从现有 PPT 中提取设计规范，复用到新演示
- **视觉审查** — 自动截图检查排版质量，发现问题主动修复

## 使用示例

```
帮我做个技术方案的 PPT
把这个 PPT 的第 3 页标题改一下
从这个 PPT 提取模板
做个 10 页的产品介绍演示文稿
```

触发词：`PPT`、`幻灯片`、`演示文稿`、`slides`、`deck`、`做个PPT`、`改PPT`

## 安装

### 方式一：Skills 市场安装

在 Claude Code Skills 市场搜索 `ppt-maker`，一键安装。

### 方式二：手动安装

克隆仓库并软链接到 Claude Code skills 目录：

```bash
git clone git@git.dev.sh.ctripcorp.com:caif-test/ppt-maker.git ~/dev/ppt-maker
ln -s ~/dev/ppt-maker ~/.claude/skills/ppt-maker
```

### 依赖

运行时需要以下工具（skill 会在用到时自动检查）：

| 工具 | 用途 | 安装 |
|------|------|------|
| Node.js | 生成 PPT | `brew install node` |
| uv | Python 脚本运行 | `brew install uv` |
| LibreOffice | PPT 转 PDF 预览 | `brew install --cask libreoffice` |
| poppler | PDF 转图片截图 | `brew install poppler` |

> Python 脚本依赖通过 PEP 723 inline metadata 自动管理，无需手动安装 Python 包。

## 工作原理

1. **构思阶段** — 与你对话明确演示目标、受众、核心信息
2. **设计阶段** — 生成设计文档（页面结构、配色、排版方案）
3. **生成阶段** — 通过 PptxGenJS 生成 .pptx 文件
4. **审查阶段** — 自动截图检查，发现问题迭代修复

## 内置品牌模板

| 模板 | 说明 |
|------|------|
| [tripcom-standard](brand-templates/tripcom-standard/) | Trip.com 标准演示模板，13 种 layout + 品牌配色 |

使用时指定模板名即可：

```
用 tripcom-standard 模板做个技术方案 PPT
```

你也可以从任意 .pptx 提取模板，生成到 `brand-templates/` 下复用。

## 技术栈

| 组件 | 技术 |
|------|------|
| PPT 生成 | [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) |
| PPT 修改 | [python-pptx](https://python-pptx.readthedocs.io/) |
| 预览渲染 | LibreOffice + poppler |
| 模板系统 | OOXML 解析 + YAML 规范 |

## 开发者文档

如果你想了解代码实现细节或参与开发，请查看 [DEVELOPMENT.md](DEVELOPMENT.md)。
