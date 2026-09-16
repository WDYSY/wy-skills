# agentflow_case01 - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | agentflow_case01 |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 10 |
| **Design Style** | Pyramid argumentation + Editorial visual system |
| **Target Audience** | 企业客户决策层、咨询顾问、潜在投资人 |
| **Use Case** | 首版商业化方案汇报 / 路演型 deck |
| **Delivery Purpose** | `balanced` |
| **Content Strategy** | 平衡默认：保留研究事实与判断依据，但为了说服力重组叙事结构，强调“为什么现在做、为什么从客服与销售协同切入、为什么平台化可复制”。 |
| **Created Date** | 2026-09-03 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | left/right 64px, top 52px, bottom 44px |
| **Content Area** | 1152×624 px safe content region |

---

## III. Visual Theme

### Theme Style

- **Mode**: `pyramid`
- **Visual style**: `editorial`
- **Theme**: Light theme
- **Tone**: 专业、可信、克制、偏科技商业感，不做廉价 futurism

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#F7F8FA` | Page background |
| **Secondary bg** | `#EEF1F4` | Card background, quote box, chart panel |
| **Primary** | `#17324D` | Titles, core dividers, key structural accents |
| **Accent** | `#1F6FB2` | Highlights, key numbers, links, focus annotations |
| **Secondary accent** | `#7FA9D6` | Secondary highlights, chart contrast, subtle emphasis |
| **Body text** | `#1F2933` | Main body text |
| **Secondary text** | `#5B6773` | Captions, notes, secondary annotations |
| **Tertiary text** | `#8A94A1` | Footers, sources, supplementary hints |
| **Border/divider** | `#D8DEE6` | Rules, card borders, section separators |
| **Success** | `#2E8B57` | Positive indicators |
| **Warning** | `#C44E3B` | Risks / constraints |

### AI Image Strategy

- **Image Rendering**: `editorial`
- **Image Palette**: `cool-corporate`

### Gradient Scheme (if needed, using SVG syntax)

```xml
<linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="#17324D"/>
  <stop offset="100%" stop-color="#1F6FB2"/>
</linearGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: editorial serif / sans pairing with strong title hierarchy and readable Chinese business body copy.

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `SimSun` | `Cambria` | `serif` |
| **Body** | `Microsoft YaHei` | `Arial` | `sans-serif` |
| **Emphasis** | `SimSun` | `Georgia` | `serif` |
| **Code** | — | `Consolas, Courier New` | `monospace` |

**Per-role font stacks**

- Title: `Cambria, SimSun, serif`
- Body: `"Microsoft YaHei", Arial, sans-serif`
- Emphasis: `Georgia, SimSun, serif`
- Code: `Consolas, "Courier New", monospace`

### Font Size Hierarchy

**Baseline (unitless px)**: Body font size = 24

| Purpose | Ratio to body | Example @ body=24 (`balanced`) | Weight |
| ------- | ------------- | ------------------------- | ------ |
| Cover title | 2.75x | 66 | Bold |
| Section opener | 2x | 48 | Bold |
| Page title | 1.75x | 42 | Bold |
| Hero number | 1.75x | 42 | Bold |
| Subtitle | 1.33x | 32 | SemiBold |
| Lead-in / intro | 1.25x | 30 | Regular |
| Subheading | 1.17x | 28 | SemiBold |
| **Body content** | **1x** | **24** | Regular |
| Annotation / caption | 0.75x | 18 | Regular |
| Page number / footnote | 0.67x | 16 | Regular |

---

## V. Layout Principles

### Page Structure

- **Header area**: 96-120px, containing kicker / page title / concise conclusion
- **Content area**: primary analysis zone; usually one dominant chart / framework / evidence cluster + 2-3 supporting points
- **Footer area**: sources, page number, minimal metadata

### Layout Pattern Library (combine or break as content demands)

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | Cover, ending page, single key takeaway |
| **Asymmetric split (3:7 / 4:6)** | Problem / implication, framework + explanation |
| **Top-bottom split** | Flow / timeline / sequential argument |
| **Three-column cards** | Three contradictions, three capabilities, three risks |
| **Matrix grid (2×2)** | Capability map, risk-control summary |
| **Z-pattern / waterfall** | Business path, phased rollout |
| **Negative-space-driven** | Transition pages, one-sentence conclusion pages |

### Spacing Specification

**Universal**

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Safe margin from canvas edge | 40-60px | 52-64px |
| Content block gap | 24-40px | 28-36px |
| Icon-text gap | 8-16px | 10-12px |

**Card-based layouts**

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Card gap | 20-32px | 24px |
| Card padding | 20-32px | 24px |
| Card border radius | 8-16px | 12px |
| Single-row card height | 530-600px | 560px |
| Double-row card height | 265-295px each | 280px |
| Three-column card width | 360-380px each | 368px |

---

## VI. Icon Usage Specification

- **Approach**: Built-in icon library
- **Library**: `tabler-outline`
- **Stroke width**: `2`
- **Why**: 与 editorial 风格匹配，轻量、克制、信息导向，不抢正文层级
- **Icon inventory**:
  - `target` — opportunity / strategic focus
  - `bulb` — idea / insight / recommendation
  - `shield` — governance / trust / risk control
  - `users` — collaboration / cross-team users
  - `chart-bar` — business value / KPI / ROI
  - `route-alt-left` — workflow / routing / orchestration
  - `briefcase` — enterprise / business use case

---

## VII. Visualization Specification

### Visualization Direction

本 deck 以“结论先行 + 结构证据”组织信息，图表与框架优先承担解释任务，而不是装饰任务。建议视觉类型以框架图、流程图、对比条形图、分层 capability 图为主。

### Visualization Reference List

| Page | Visualization type | Purpose | reference template path |
| ---- | ------------------ | ------- | ----------------------- |
| P03 | 3-column problem decomposition | 三类核心问题 | no-template-match |
| P05 | layered platform architecture | 四层产品能力框架 | no-template-match |
| P06 | sequential workflow diagram | 客服到销售支持闭环 | no-template-match |
| P07 | grouped KPI comparison bars | 三层业务价值 | no-template-match |
| P08 | phased expansion path | 商业化扩张路径 | no-template-match |
| P09 | risk / success condition matrix | 风险与成功条件 | no-template-match |

---

## VIII. Image Resource List

| ID | Page | Type | Purpose | Acquire Via | Description | Status |
| -- | ---- | ---- | ------- | ----------- | ----------- | ------ |
| cover_hero | P01 | Illustration | 封面主视觉 | ai | 抽象的企业 AI 协同主视觉，体现服务、销售、流程协同与平台感；避免人物脸部特写与俗套机器人 | Planned |
| market_signal | P02 | Illustration | 窗口期氛围图 | placeholder | 若无合适图，则以抽象网格/趋势图形替代，不强依赖真实图片 | Planned |
| service_sales_flow | P06 | Illustration | 业务闭环图辅助背景 | ai | 抽象流程协同示意，不做 UI screenshot，强调信息流、决策流、回写流 | Planned |
| platform_control_plane | P05 | Illustration | 平台能力页辅助图 | ai | 平台控制平面 / orchestration / governance 抽象示意 | Planned |

---

## IX. Content Outline

### P01 — AI Agent 商业化已经从“可试用”转向“可落地”
- Title: AI Agent 在企业客户服务与销售协同中的商业化落地方案
- Key message: 这不是再做一个助手，而是把分散流程升级为可复制的执行系统
- Content:
  - 面向企业客户决策层、咨询顾问、潜在投资人
  - 关键词：窗口期、协同、平台化、可复制

### P02 — 采用已经广泛，但规模化价值仍未被充分释放
- Title: AI 的真正机会，不在“是否采用”，而在“如何从试点走向规模化”
- Key message: 企业已广泛使用 AI，但尚未形成组织级闭环，窗口由此出现
- Content:
  - McKinsey 2025：多数组织已在至少一个业务职能规律性使用 AI
  - 但大多数仍未真正实现企业级规模化
  - 机会在于把零散试点收束为平台化能力

### P03 — 客服与销售支持是最适合率先规模化的入口
- Title: 客服与销售支持同时具备高频、强流程与强 ROI 属性
- Key message: 这两个场景天然适合 Agent 商业化验证
- Content:
  - 高频、标准化与复杂性并存
  - 强知识依赖、强流程依赖
  - 价值可量化：响应时长、升级率、线索质量、满意度

### P04 — 企业今天真正缺的不是工具，而是协同执行系统
- Title: 单点助手难以跨团队复制，流程断裂才是核心阻力
- Key message: 知识分散、流程断裂、价值难复制构成三类结构性问题
- Content:
  - 知识分散：口径不一致、检索慢
  - 流程断裂：跨系统转写、升级与催办成本高
  - 价值难复制：成果停留在局部提效

### P05 — 平台化能力是从“会回答”走向“能运营”的关键
- Title: 可产品化方案必须同时具备 Agent、编排、工作台与治理四层能力
- Key message: 企业最终买单的是治理与工作流能力，而不只是模型本身
- Content:
  - Agent Studio
  - Orchestrator
  - Workspace
  - Control Plane

### P06 — 客服与销售支持之间可以形成一条端到端协同闭环
- Title: 从一次客户问题开始，可以串起服务、判断、跟进与回写全链路
- Key message: 协同价值高于单个 Agent 的局部提效
- Content:
  - 客户问题进入系统
  - 分类、检索、建议、升级
  - 潜在线索同步到销售支持
  - CRM / 工单 / 分析系统回写

### P07 — 商业价值来自效率、质量与复制能力三层叠加
- Title: ROI 不只体现在人效，更体现在质量提升与平台复制
- Key message: 短期看效率，中期看质量，长期看平台扩张
- Content:
  - 效率收益
  - 质量收益
  - 复制收益

### P08 — 最优商业化路径是“试点验证—双场景联动—模板沉淀—平台扩张”
- Title: 成功路径不是大而全上线，而是逐层放大已验证的能力
- Key message: 订阅费、调度量计费与实施服务费可形成稳定收入结构
- Content:
  - 单部门试点
  - 双场景联动
  - 模板与规则沉淀
  - 平台化扩张

### P09 — 这件事可复制，但复制的前提是治理与组织配合
- Title: 真正的护城河来自治理、模板沉淀与流程接入，而非单一模型能力
- Key message: 有清晰成功条件，也有必须正视的实施风险
- Content:
  - 成功条件 4 条
  - 关键风险 4 条
  - 强调平台与组织协同门槛

### P10 — 现在启动联合试点，是进入平台扩张曲线的最低成本方式
- Title: 建议从“客服 + 销售支持”联合试点开始，在 8 周内验证效率与治理闭环
- Key message: 现在是认知红利仍在、组织壁垒尚未固化的窗口期
- Content:
  - 为什么值得做
  - 为什么能做成
  - 为什么现在做
  - CTA

---

## X. Speaker Notes Strategy

- 每页 notes 首句就是结论，而不是主题描述
- 关键数字必须带比较或解释，不出现裸数据
- 对投资人与企业客户双受众，语言保持专业但避免过度学术化
- 全 deck 的 notes 语气保持“冷静、判断型、带建议”

---

## XI. Technical Constraints

- 全部输出为原生可编辑 PPTX 路径，遵循 SVG → PPTX pipeline
- 不使用廉价科幻图像、机器人 3D stock、无关人物大图
- 尽量减少装饰性渐变，以版式和层级驱动专业感
- 图表与流程图优先使用可编辑 SVG 结构表达
- 若 Step 5 图片生成未及时完成，允许先以抽象背景 / placeholder 占位，不阻塞整体生成
