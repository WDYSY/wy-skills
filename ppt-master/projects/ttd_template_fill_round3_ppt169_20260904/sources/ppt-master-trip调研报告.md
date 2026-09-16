# PPT Skill 方案调研：ppt-master-trip

> 当前方案名：`ppt-master-trip`
> 调研日期：2026-09-04
> 调研方式：实际运行测试 + 代码/文档分析

---

## 一、需求匹配度

### 模板支持

**1. 是否支持导入业务自定义的 `.pptx` 模板？**
✅ **支持**。有两种方式：
- **`template-fill-pptx` 工作流**：直接基于用户提供的 `.pptx` 模板，在原生 PPTX 层面做克隆/填充，保留原有设计不变。
- **`create-template` 工作流**：将 `.pptx` 转换为可复用的模板包（含 SVG 布局、设计规范），供后续主流程使用。
- 模板从品牌（brand）、布局（layout）、完整模板包（deck）三个层级支持。

**2. 模板的使用方式是什么？（占位符替换 / 样式继承 / 其他）**
**多种方式**：
- 原生 PPTX 模板 → **直接克隆+OOXML 文本替换**（`template-fill`）
- SVG 主流程 → **样式继承+自由结构**（加载模板后继承视觉风格，内容区自由设计）
- Mirror 模式 → **1:1 复制源模板视觉**（完全保留源设计）

**3. 模板中的原有样式、字体、配色能否被保留？**
✅ **能**。`template-fill-pptx` 直接在原生 PPTX 层面编辑，完全保留原模板样式/字体/配色。主流程（SVG）读取模板的 `design_spec.md` 继承品牌 identity，也可部分保留。

**4. 是否支持多套模板切换？**
✅ **支持**。内置模板库包含：品牌模板（`templates/brands/`）5 套、布局模板（`templates/layouts/`）8 套、完整模板包（`templates/decks/`）5 套。支持品牌+布局组合融合。

### 原生图表能力

**5. 生成的图表是 Office 原生图表，还是图片/截图？**
⚠️ **混合**：生成的图表是 **SVG 原生图形元素**（直接转换为 PPT DrawingML shape），不是图片截图。**但也不是 PowerPoint 原生 chart 对象**（非 DataSheet 可编辑图表对象）。图表以矢量 shape 形式存在，视觉上是原生可编辑的。

**6. 支持哪些图表类型？（柱状图、折线图、饼图等，列举）**
✅ **71 种图表模板**，包括：
- 基础图表：`bar_chart`、`line_chart`、`pie_chart`、`donut_chart`、`area_chart`、`scatter_chart`、`bubble_chart`、`radar_chart`、`heatmap_chart`
- 高级图表：`grouped_bar_chart`（分组柱）、`stacked_bar_chart`（堆叠柱）、`horizontal_bar_chart`（横排柱）、`waterfall_chart`、`pareto_chart`、`box_plot_chart`、`gauge_chart`、`bullet_chart`
- 流程图：`process_flow`、`timeline`、`sankey_chart`、`funnel_chart`、`venn_diagram`
- 分析框架：`matrix_2x2`、`quadrant_text_bullets`、`pyramid_chart`、`fishbone_diagram`
- 表格：`basic_table`、`consulting_table`、`financial_statement_table` 等

**7. 图表数据是否可以动态传入？传入方式是什么？**
✅ **可以**。数据来自源文档（Markdown/PDF/DOCX/Excel/PPTX），AI 在生成 SVG 时动态解析数据并绘制图表。在设计阶段通过 `design_spec.md §VII` 指定图表类型和数据源。

**8. 生成后的图表在 PPT 中是否可以二次编辑？**
✅ **可以**。图表以原生 DrawingML shapes 导出，文字、颜色、大小均可直接在 PowerPoint 中编辑。但不是 Office 原生 Chart 对象，不能像 Excel 链接图表那样更新数据源。

### 样式美观度

**9. 是否有 Demo 截图或示例输出文件？描述一下效果**
✅ **有**。本次实际运行已生成 12 页 PPT，效果为：
- 编辑风格（editorial）：大淡蓝色标题 + 高亮橙色强调 + 横向柱状图/环形图
- 封面页：深蓝底 + 大数字（603K+）数据钩子
- 数据页：清晰的水平柱状图、doiut 图、分组柱状图
- 每页含来源标注 + 页码
- 完整 PPT 文件：`projects/ttd_trip_language_analysis_ppt169_20260904/exports/ttd_trip_language_analysis_20260904_123611.pptx`

**10. 默认样式质量如何？（1-5分，说明理由）**
⭐⭐⭐⭐ **4/5**。理由：
- 编辑风格设计专业，有杂志排版质感
- 多种视觉风格可选（editorial / data-journalism / swiss-minimal / dark-tech 等 17 种）
- 图表模板丰富（71 种），参数化程度高
- 内置图标库 11600+ 个
- 略微低于 5 分因为：受限于 SVG 绘制，一些精细视觉效果（如阴影/渐变）需要手动调优，且整体效果依赖 LLM 的生成质量

**11. 是否支持字体、颜色、布局的定制？**
✅ **完全支持**。`design_spec.md` 和 `spec_lock.md` 中集中管理颜色、字体、字号、布局参数。颜色方案 ≥3 组候选，字体方案 ≥3 组候选，8 项确认都有个性化选项。

**12. 是否依赖外部设计资源（字体包、图片素材等）？**
⚠️ **部分依赖**：
- 内置 11600+ 图标库（本地无需外部）
- 内置 71 个图表模板、品牌/布局/模板包资源（本地）
- 字体使用 PPT 安全字体栈（微软雅黑/Arial 等），**不依赖外部字体包**
- AI 图片时依赖外部模型 API（可配置，也可关闭）

---

## 二、集成方式 & 卡点

**13. 是否需要独立起服务才能运行？**
❌ **不需要**。核心生成流程（source → project → spec → SVG → PPTX）全程本地运行，无需外部服务。Confirm UI 和 Live Preview 是可选增强功能，有完整 chat fallback 路径。

**14. 对外暴露的接口形式是什么？（HTTP API / 直接函数调用 / 其他）**
**CLI 脚本 + Skill 指令**：
- 通过 `SKILL.md` 的多步骤指令驱动
- 底层调用 Python CLI 脚本（`project_manager.py`、`finalize_svg.py`、`svg_to_pptx.py` 等）
- 无对外 HTTP API

**15. 当前是否已经是 Skill 结构，可以直接挂载使用？**
✅ **已经是**。`ppt-master-trip` 已经被安装为 Codex Skill（symlink 到 `/Users/temptrip/.codex/skills/ppt-master-trip`），可以直接通过自然语言调用。

**16. 如果需要二次封装，工作量大概是多少？（大/中/小，说明原因）**
**中小**。原因：
- 已有一个完整的 Skill 结构化目录（SKILL.md + workflows + scripts + references）
- 核心工作流已经跑通并有验证
- 如果需要接 API 服务，需要封装 CLI 脚本为 HTTP handler，工作量中等
- 如果只是挂载使用，零成本

**17. 与现有 Skill 框架是否兼容？有无明显冲突点？**
✅ **兼容**。已完成实际挂载和运行验证。作为 Codex Skill 运行正常。
⚠️ 潜在冲突点：
- **严格的流程控制**：要求 8 步确认、禁用跳步等，与用户希望"快速出结果"的期望有张力
- 强制"手写 SVG"：禁止脚本批量生成 SVG 页面，对超长 deck 可能效率偏低
- 对 Python 环境有版本要求（需要 Python 3.10+ 语法支持）

**18. **原来"需要起服务"的卡点，在这个方案里是否被解决了？怎么解决的？**
✅ **已解决**。本方案的核心生成**完全不需要起外部服务**。具体解决方式：
- **不需要 HTTP 后端**：所有生成逻辑通过本地 Python 脚本执行
- **Confirm UI 可选**：确认页（`confirm_ui/server.py`）是增强选项，有完整 chat fallback 路径，页面打不开也能完成 8 项确认
- **Live Preview 可选**：SVG 编辑器（`svg_editor/server.py`）是预览工具，不阻塞生成流程
- **对比旧方案**：方案完全不依赖 `localhost` 上的可视化编辑器才能工作

---

## 三、依赖 & 环境成本

**19. 依赖哪些外部服务或模型？（列举）**
- **AI 主模型**（不可缺）：如 GPT-4 / Claude 等，负责内容分析、规划、SVG 生成决策
- **AI 图片生成**（可选）：Gemini / OpenAI 兼容 API，仅在需要使用 AI 图片时启用
- **Web 图片搜索**（可选）：依赖网络
- **公式渲染**（可选）：CodeCogs / QuickLaTeX 等在线服务
- **本地依赖**：Python 3.10+、python-pptx / Pillow / cairosvg / flask 等 Python 包

**20. 是否强依赖特定 LLM？（如 GPT-4 / 内部模型，是否可替换）**
❌ **不依赖特定 LLM**。架构上 AI 的角色是内容策略分析 + SVG 编写 + 流程控制，任何具备文件读写能力的 LLM（GPT / Claude / 其他）均可替代。图片生成后端支持可配置多种源。

**21. 单次生成大概消耗多少 Token？（估算）**
**中等偏高**。以本次 12 页 PPT 为例，实测整个流程（含 8 项确认、12 页 SVG 手写）预计消耗 **50K-150K Token**。原因：
- 每页 SVG 需 LLM 手写（不能脚本批量生成）
- 每页生成前需重新读取 `spec_lock.md`（防止上下文漂移）
- 8 项确认 + 多轮角色切换有额外开销
- 12 页 deck 的 SVG 代码量本身较大（每页 2-9KB）

**22. 安装和启动的复杂度如何？（低/中/高，说明步骤数）**
**中等**。步骤：
1. Python 3.10+ 环境（必需）
2. `pip install -r requirements.txt`（约 10-15 个 Python 包）
3. 本地 brew 安装 cairo（可选，用于 SVG→PNG 兼容）
4. 无需要启动的服务，直接用命令行/ Skill 调用

**23. 是否需要特殊运行环境？（如 Docker / 特定 Python 版本 / 系统依赖）**
⚠️ **需要**：
- **Python 3.10+**（代码使用了 `list[str] | None` 语法）
- **macOS/Linux/Windows** 均可运行
- 如需要 AI 图片生成：相应模型的 API key
- 如需要公式渲染：网络访问
- 无需 Docker

---

## 四、可维护性

**24. 代码最近更新时间？是否有持续维护迹象？**
✅ **较为活跃**（截至 2026-07-03）。目录中 75KB 的 `SKILL.md`，56 个 Python 脚本，71 个图表模板，代码规模大且组织清晰，有持续迭代迹象。

**25. 是否有明确的维护人或负责团队？**
❓ **未知/待确认**。无明显维护人标识（无 `AUTHORS` / `MAINTAINERS` / `CONTRIBUTORS` 文件）。

**26. 文档完善程度如何？（低/中/高）**
✅ **非常高**。包含：
- `SKILL.md`（75KB 主流程说明）
- `references/`（20+ 个角色定义和标准参考文件）
- `scripts/docs/`（7 个技术文档）
- `workflows/`（17 个独立工作流说明）
- 每个模板目录都有 README

**27. 是否有已知 Bug 或明显技术债？**
⚠️ **存在一些**：
- **Python 兼容性问题**：`config.py` 使用 `list[str] | None` 语法，Python 3.9 无法运行（需要 3.10+）
- **pyexpat 依赖问题**：Homebrew Python 的 pyexpat 可能链接到旧版系统 expat 导致运行时错误
- **Pillow 依赖**：某些环境下需手动安装
- **token 消耗较高**：手写 SVG 流程对长 deck 不友好

---

## 五、一句话总结

**28. 用一句话总结：这个方案适不适合落地，最大的优势和最大的问题各是什么？**

**适合落地。最大优势：** 它是一个完整闭环的 Skill 方案，模板/图表/图标/风格生态齐全（71 图表 + 11600+ 图标 + 17 种风格 + 多工作流），**不需要起外部服务**即可直接生成高质量 PPT，且对 PPTX 模板导入有专门支持路径；**最大问题：** 每页 SVG 必须由 AI 逐页手工编写（禁止脚本批量生成），导致**长 deck 生成速度慢、Token 消耗高**（12 页即需 50K+ Token），且最终图表以矢量 shape 而非 Office 原生 Chart 对象呈现，数据源编辑能力受限。

---

> ✅ 本报告基于 ppt-master-trip skill 的实际运行验证（已成功生成 12 页 PPTX）+ 代码/文档深度分析得出。

---

## 📊 整体流程图

> 以下为 ppt-master-trip skill 的整体架构流程图（SVG 格式）

### 流程总览

本 skill 采用 **「路由决策 → 主流程 7 步串行 → 独立工作流补充」** 的三层架构：

- **路由层**：根据请求类型自动分派到不同工作流
- **主流程层**：Source → Project → Template → Strategist（⚠️ 阻塞确认）→ Image → Executor → Export
- **辅助工作流层**：PPTX 模板填充、美化、音频、实时预览等 17 个独立工作流

### 完整流程图

![ppt-master-trip整体流程图](./ppt-master-trip流程图.svg)

> 📁 SVG 文件位置：`/Users/temptrip/Projects/LL/pulic-skills/skills report/ppt-master-trip流程图.svg`
