# Design Specification & Content Outline

## I. Project Information

| Property | Value |
| -------- | ----- |
| **Project Name** | Spec Coding 得物技术文章导出 |
| **Source Material** | 微信文章《AI编程能力边界探索：基于 Claude Code 的 Spec Coding 项目实战｜得物技术》 |
| **Page Count** | 16 |
| **Design Style** | Pyramid communication mode + Editorial visual style |
| **Target Audience** | 技术团队、AI Coding 实践者、研发管理者 |
| **Use Case** | 技术分享、内部复盘、方法论传播 |
| **Delivery Purpose** | balanced |
| **Content Strategy** | 忠于原文事实，适度重组以增强演示表达；保留文章核心论点与数据，按“结论—证据—案例—方法—边界—启示”重构为更适合演示阅读的金字塔结构。 |
| **Created Date** | 2026-09-04 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | left/right 72px, top 54px, bottom 44px |
| **Content Area** | 1136×622 |

---

## III. Visual Theme

### Theme Style

- **Mode**: pyramid
- **Visual style**: editorial
- **Theme**: Light theme
- **Tone**: 专业、理性、方法论导向、技术媒体感

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#F7F9FC` | Page background |
| **Secondary bg** | `#EEF3F8` | Card background, section background |
| **Primary** | `#1F4E79` | Title decorations, key sections, icons |
| **Accent** | `#4F8EF7` | Data highlights, key information, links |
| **Secondary accent** | `#7FB3FF` | Secondary emphasis, gradient transitions |
| **Body text** | `#1F2937` | Main body text |
| **Secondary text** | `#5B6472` | Captions, annotations |
| **Tertiary text** | `#7A8595` | Supplementary info, footers |
| **Border/divider** | `#D8E0EA` | Card borders, divider lines |
| **Success** | `#16A34A` | Positive indicators |
| **Warning** | `#DC2626` | Issue markers |
| **Surface** | `#FFFFFF` | Lifted panels on light background |
| **Grid** | `#E6ECF3` | Hairline rules, subtle chart grids |
| **Scrim** | `#1F2937` | Text-over-image overlay tone |
| **Block shade** | `#E9EEF5` | Soft editorial block backing |

### AI Image Strategy

- **Image Rendering**: editorial
- **Image Palette**: cool-corporate

### Gradient Scheme (if needed, using SVG syntax)

```xml
<!-- Title gradient -->
<linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#1F4E79"/>
  <stop offset="100%" stop-color="#7FB3FF"/>
</linearGradient>

<!-- Background decorative gradient -->
<radialGradient id="bgDecor" cx="80%" cy="20%" r="50%">
  <stop offset="0%" stop-color="#4F8EF7" stop-opacity="0.15"/>
  <stop offset="100%" stop-color="#4F8EF7" stop-opacity="0"/>
</radialGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: 现代中文无衬线为主，局部加入编辑型标题层次

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | 思源黑体 | Inter | sans-serif |
| **Body** | 思源黑体 | Inter | sans-serif |
| **Emphasis** | 思源宋体 | Georgia | serif |
| **Code** | — | Consolas, Courier New | monospace |

**Per-role font stacks**

- Title: `"Source Han Sans SC", "Microsoft YaHei", Inter, Arial, sans-serif`
- Body: `"Source Han Sans SC", "Microsoft YaHei", Inter, Arial, sans-serif`
- Emphasis: `"Source Han Serif SC", Georgia, "Times New Roman", serif`
- Code: `Consolas, "Courier New", monospace`

### Font Size Hierarchy

**Baseline (unitless px)**: Body font size = 24

| Purpose | Ratio to body | Example @ body=32 (`presentation`) | Example @ body=24 (`balanced`) | Weight |
| ------- | ------------- | --------------------------- | ------------------------- | ------ |
| Cover title (hero headline) | 2.5-5x | 80-160 | 60-120 | Bold / Heavy |
| Chapter / section opener | 2-2.5x | 64-80 | 48-60 | Bold |
| Page title | 1.5-2x | 48-64 | 36-48 | Bold |
| Hero number (consulting KPIs) | 1.5-2x | 48-64 | 36-48 | Bold |
| Subtitle | 1.2-1.5x | 38-48 | 29-36 | SemiBold |
| Lead-in / intro | 1.1-1.4x | 35-45 | 26-34 | Regular / Medium |
| Subheading | 1.1-1.3x | 35-42 | 26-31 | SemiBold |
| **Body content** | **1x** | **32** | **24** | Regular |
| Annotation / caption | 0.7-0.85x | 22-27 | 17-20 | Regular |
| Page number / footnote | 0.5-0.65x | 16-21 | 12-16 | Regular |

---

## V. Layout Principles

### Page Structure

- **Header area**: 90-110px，容纳 kicker、标题、摘要结论
- **Content area**: 520-560px，承载主体论证、图表、案例、流程
- **Footer area**: 28-36px，容纳页码与来源信息

### Layout Pattern Library (combine or break as content demands)

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | 封面、总结、关键判断 |
| **Symmetric split (5:5)** | 概念对照、能力边界对比 |
| **Asymmetric split (3:7 / 2:8)** | 一侧摘要，一侧图表/案例 |
| **Top-bottom split** | 时间线、阶段推进、结构分层 |
| **Three/four column cards** | 三层规范、三种失效模式、五点总结 |
| **Matrix grid (2×2)** | 四阶段、四案例、双轴分类 |
| **Z-pattern / waterfall** | 案例演进、阶段递进讲述 |
| **Center-radiating** | 工作流、MCP 消除信息断层 |
| **Full-bleed + floating text** | 封面、章节页 |
| **Figure-text overlap** | 数据大数、结论页 |
| **Negative-space-driven** | 一句话总结、价值判断 |

### Spacing Specification

**Universal**

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Safe margin from canvas edge | 40-60px | 44-72px |
| Content block gap | 24-40px | 28px |
| Icon-text gap | 8-16px | 10px |

**Card-based layouts**

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Card gap | 20-32px | 24px |
| Card padding | 20-32px | 24px |
| Card border radius | 8-16px | 12px |
| Single-row card height | 530-600px | 548px |
| Double-row card height | 265-295px each | 272px |
| Three-column card width | 360-380px each | 362px |

**Non-card containers**

- 章节页和结论页通过大面积留白制造停顿感。
- 正文文字行高约 1.45，标题与引导句行高约 1.2–1.3。
- 涉及 AI 主视觉的页面需以 scrim 或浅色信息板保证标题可读性。
- 数据页优先使用规则线、栏位和轻量底色，而非厚重卡片。

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `templates/icons/`
- **Usage method**: SVG placeholder `<use data-icon="library/icon-name" .../>`

### Recommended Icon List (fill as needed)

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| Workflow / process | `tabler-outline/git-branch` | P03 |
| Metrics / dashboard | `tabler-outline/chart-bar` | P05 |
| Timeline / progress | `tabler-outline/route` | P06 |
| Design / product | `tabler-outline/palette` | P07 |
| Frontend delivery | `tabler-outline/code` | P08 |
| Refactor / architecture | `tabler-outline/transform` | P09 |
| Troubleshooting | `tabler-outline/bug` | P10 |
| Rules / standards | `tabler-outline/file-check` | P11 |
| MCP / connectivity | `tabler-outline/plug-connected` | P12 |
| Capability boundary | `tabler-outline/alert-triangle` | P14 |
| Developer role | `tabler-outline/user-cog` | P15 |
| Summary / leverage | `tabler-outline/bolt` | P16 |

---

## VII. Visualization Reference List (if needed)

| Page | Template | Path | Summary-quote (verbatim from `charts_index.json`) | Usage |
| ---- | -------- | ---- | ------------------------------------------------- | ----- |
| P03 | timeline_milestones | `templates/charts/timeline_milestones.svg` | "Use for chronological milestones or phased project progress where each step needs one short takeaway. Avoid when the story is cyclical or when more than ~6 milestones need equal detail." | Spec 工作流阶段与价值概览 |
| P05 | kpi_cards | `templates/charts/kpi_cards.svg` | "Choose for 3-6 headline metrics that need immediate scanability. Avoid when the audience must compare trends across time or categories; use a chart then." | 10天、2.5万行、36%、2754次工具调用等核心指标 |
| P06 | vertical_timeline | `templates/charts/vertical_timeline.svg` | "Pick for 4-8 sequential phases with short descriptions and clear progression. Skip if each phase contains dense evidence or parallel tracks that need comparison." | 10 天开发时间线四阶段 |
| P11 | layered_framework | `templates/charts/layered_framework.svg` | "Use when explaining a hierarchical framework with 3-5 stacked layers, each with a distinct role. Avoid when relationships are networked rather than layered." | 约束层/示范层/视觉层 三层规范体系 |
| P14 | comparison_matrix | `templates/charts/comparison_matrix.svg` | "Use for side-by-side comparison across a small set of dimensions and options. Avoid when the takeaway is primarily sequential or causal." | AI 三种失效模式与应对策略 |

**Runners-up considered** (3 entries minimum, drawn from real second-best matches in this deck):

- `process_chevrons` | rejected for P03: 文章既讲步骤又讲价值，不只是线性推进，时间线更适合承载阶段说明
- `metric_strip` | rejected for P05: 核心数据需要强弱层次和说明文字，不只是横向数字带
- `stacked_steps` | rejected for P11: 三层规范强调层级协同关系，layered framework 比线性 steps 更贴切

---

## VIII. Image Resource List (if needed)

| Filename | Dimensions | Ratio | Purpose | Type | Layout pattern | Acquire Via | Status | Reference | text_policy | page_role |
| -------- | --------- | ----- | ------- | ---- | -------------- | ----------- | ------ | --------- | ----------- | --------- |
| cover_editorial_ai.png | 1280×720 | 16:9 | 封面主视觉，表现 AI Coding、工作流、规范与执行之间的关系 | Background | full-bleed background with floating title | ai | Pending | 杂志化科技拼贴：代码窗口、流程节点、文档层级、数据面板，留出左侧标题安全区，不含任何文字 | none | hero_page |
| chapter_workflow_ai.png | 1280×720 | 16:9 | Spec Coding 方法章节过渡主视觉 | Illustration | editorial chapter opener | ai | Pending | 抽象表现“先写规格再执行”：文档、分支流程、分析图层、蓝灰色编辑式构图，不含文字 | none | section_cover |
| chapter_cases_ai.png | 1280×720 | 16:9 | 典型案例章节过渡主视觉 | Illustration | editorial chapter opener | ai | Pending | 四象限案例拼贴感画面：产品设计、研发开发、系统重构、排障分析，用抽象模块代表，不含文字 | none | section_cover |
| chapter_boundary_ai.png | 1280×720 | 16:9 | 能力边界与经验总结章节过渡主视觉 | Illustration | editorial chapter opener | ai | Pending | 方法论复盘氛围图：边界线、警示符号、开发者与系统图层关系，克制专业，不含文字 | none | section_cover |
| placeholder_metric_panel.png | 1280×720 | 16:9 | 数据概览页或缺图页备用浅背景图 | Background | light panel backdrop | placeholder | Pending | 低对比蓝灰几何背景，占位使用，便于叠加数据卡片 | none | local |

---

## IX. Content Outline

### P01 封面｜10 天 2.5 万行代码：一次 Spec Coding 深度实战
- 页面目标：用一句强结论和核心数字建立全篇记忆点。
- 关键内容：文章标题浓缩版；副标题“基于 Claude Code 的项目复盘”；核心数字 10 天 / 2.5 万行 / 提效 36%。
- 版式建议：全屏 AI 主视觉 + 左侧悬浮信息区；标题强对比，数字做大。
- 页面节奏：breathing

### P02 总览｜这次实战回答了两个问题：AI 能做什么，边界又在哪里
- 页面目标：给出全文地图与主线。
- 关键内容：项目目标、方法主线、结果主线；目录浓缩为 5 个部分：工作流、数据、时间线、案例、边界与启示。
- 版式建议：上结论下结构，使用 editorial rules 分栏。
- 页面节奏：anchor

### P03 方法总览｜Spec Coding 把开发从“直接写代码”改成“先写规格再执行”
- 页面目标：解释 Spec Coding 工作流与价值。
- 关键内容：proposal→design→specs→tasks 流程；减少返工、适合复杂功能、可审计三点价值。
- 版式建议：左侧流程图，右侧三点价值卡。
- 页面节奏：anchor

### P04 项目对象｜这不是 Demo，而是一个完整企业级中后台从 0 到 1 的搭建
- 页面目标：交代项目规模与业务复杂度，为后文数据和案例立标尺。
- 关键内容：表格、表单、卡片列表、数据看板等核心功能；从零搭建；全程 Claude Code 辅助开发。
- 版式建议：标题 + 功能模块矩阵。
- 页面节奏：dense

### P05 数据概览｜2,754 次工具调用展示了 AI 已能覆盖研发日常动作链
- 页面目标：用关键指标展示项目密度和 AI 参与度。
- 关键内容：2,754 次工具调用；738 次文件读取；550 次代码编辑；662 次终端命令；208 次任务进度标记；10 天、109 个 jsonl 会话文件。
- 版式建议：KPI cards + 一条解释性结论栏。
- 页面节奏：anchor

### P06 时间线｜10 天演进不是平均推进，而是四个阶段逐步加深 AI 参与方式
- 页面目标：讲清设计、搭建、开发、部署四阶段如何演进。
- 关键内容：阶段一设计；阶段二项目搭建（2天/20条）；阶段三功能开发（4天/89条）；阶段四打磨部署（4天/108条）。
- 版式建议：纵向时间线 + 每阶段一句结论。
- 页面节奏：anchor

### P07 案例一｜AI 已能把产品、设计、PRD 三个角色压缩进一个工程师工作流中
- 页面目标：呈现 AI 驱动产品设计的价值。
- 关键内容：产品经理 persona；生成高保真 HTML；从设计稿生成研发可读 PRD。
- 版式建议：三栏角色转换图；可配章节主视觉裁切图。
- 页面节奏：dense

### P08 案例二｜SDD + MCP 让增量模块开发从“多轮联调”变成“一次成型”
- 页面目标：展示前端功能研发与联调提效。
- 关键内容：定时任务管理模块；6 个后端接口；接口 URL → MCP 文档 → 字段枚举 → 一次生成；同日额外交付两个完整模块，人效提升 3 倍。
- 版式建议：左右结构，左侧流程，右侧结果数字与模块能力。
- 页面节奏：anchor

### P09 案例三｜面对重构，Spec 的真正价值是先写清“改什么、不能改什么、按什么顺序改”
- 页面目标：说明重构场景比新功能更需要规格。
- 关键内容：首页重构；9 组 34 个子任务；7 个业务组件与公共组件解耦；useChat 拆为 3 个 hook；ChatInterface 从 17 个 props 缩减至 6-8 个。
- 版式建议：问题—任务—结果三段式。
- 页面节奏：anchor

### P10 案例四｜复杂排障暴露出 AI 的结构性短板：信息不全、反馈太慢、根因被层层遮蔽
- 页面目标：用真实失败场景呈现能力边界。
- 关键内容：4 小时；7 个会话；15+ 次方案尝试；59 条指令；云端构建不可复现；多根因掩盖；隐性行为藏在依赖源码；最终解法概览。
- 版式建议：问题链路图 + 根因列表。
- 页面节奏：dense

### P11 规范体系｜真正稳定 AI 输出的不是一句 prompt，而是“约束 + 示范 + 视觉”的三层结构
- 页面目标：讲清规范体系为何有效。
- 关键内容：约束层 `.claude/rules/`；示范层 `.claude/code-design/`；视觉层 `.claude/ui-design/`；为什么单有约束层不够。
- 版式建议：三层框架图 + 每层一句作用解释。
- 页面节奏：anchor

### P12 MCP 工具｜MCP 的本质是补齐 AI 与外部信息源之间的断层
- 页面目标：解释为什么 MCP 对提效关键。
- 关键内容：接口文档直连；飞书云文档直读；减少复制粘贴；39 个接口联调；21 次调用；几乎覆盖所有初次接入和更新场景。
- 版式建议：双栏对照：断层问题 vs MCP 解法。
- 页面节奏：anchor

### P13 角色重估｜AI 更像“顶级执行者”，而不是自带业务常识的 Copilot
- 页面目标：重述对 AI 辅助编程的认知升级。
- 关键内容：极度服从、无限耐心、没有内部业务常识三点；为何这既是优势也是风险。
- 版式建议：中央论断 + 三个支柱卡片。
- 页面节奏：breathing

### P14 边界框架｜AI 的失效并不随机，而是集中出现在规范真空、信息孤岛、目标模糊三种模式
- 页面目标：给出可迁移的能力边界框架。
- 关键内容：模式一规范真空；模式二信息孤岛；模式三任务目标模糊；对应应对方式。
- 版式建议：三列比较矩阵，底部一行应对建议。
- 页面节奏：anchor

### P15 开发者重构｜AI 没有让开发者消失，而是把核心竞争力推向规范设计与系统判断
- 页面目标：给出对开发者角色变化的判断。
- 关键内容：规范设计能力；系统性思维；质量意识前移；为何“向上迁移”是核心变化。
- 版式建议：左侧角色迁移箭头，右侧三点解释。
- 页面节奏：anchor

### P16 收束总结｜规范是杠杆，AI 是力，Spec 工作流是支点
- 页面目标：形成一句带走的话并完成收束。
- 关键内容：一句话总结；未来方向（规范积累、MCP 延伸、多 Agent 并行）；落点到“用结构化规范把不确定性消除在执行之前”。
- 版式建议：大标题 + 三个未来方向短卡。
- 页面节奏：breathing

---

## X. Speaker Notes Strategy

- 采用 pyramid 口径：每页讲稿第一句先说结论，再补充 2-3 个证据点。
- 数据页每个数字都配比较对象或语义解释，避免裸数字。
- 案例页按“背景—动作—结果”顺序展开，保证讲述节奏清晰。
- 章节页和总结页讲稿偏短，作为停顿与转场。
- 全 deck 语气保持专业、理性、克制，像技术媒体专题分享，而非产品发布会。

---

## XI. Technical Constraints

- 全部页面输出为 1280×720 SVG，遵守统一 viewBox 与安全边距。
- 仅使用 spec_lock.md 中定义的颜色、字体、字号和图标库。
- AI 图片仅用于封面和章节过渡，不在密集正文页滥用。
- 正文优先信息密度与可读性，尽量避免大面积深色背景影响阅读。
- 页面标题必须是结论式或判断式，不使用纯主题标签式标题。
- 所有引用数据和论述均来自 source markdown，不引入外部事实。
