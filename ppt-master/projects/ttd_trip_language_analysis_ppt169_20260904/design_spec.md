# TTD 门票语言站流量分析 - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | TTD 门票语言站流量分析 |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 12 pages |
| **Design Style** | Editorial — magazine data report aesthetic |
| **Target Audience** | 运营团队 / 业务管理层：负责 T 站海外门票业务 |
| **Use Case** | 月报/周报汇报，需要展示各语言站的流量分布特征与渠道策略差异 |
| **Delivery Purpose** | balanced — 商务平衡型（阅读+演讲兼顾） |
| **Content Strategy** | 平衡默认：忠实于源数据结构与事实，重新组织为金字塔式叙事（结论先行 → 数据论证 → 策略建议） |
| **Created Date** | 2026-09-04 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | 左右 60px，上下 50px |
| **Content Area** | 1160×620 |

---

## III. Visual Theme

### Theme Style

- **Mode**: pyramid — 结论先行，MECE 论证，数据支撑策略建议
- **Visual style**: editorial — 杂志式数据报告：大数字、数据表格、精细条状图、编辑式信息层级
- **Theme**: Light theme
- **Tone**: 专业、数据驱动、有编辑质感

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#FFFFFF` | 页面背景 |
| **Secondary bg** | `#F5F7FA` | 卡片背景、区块背景 |
| **Primary** | `#1B3A5C` | 标题装饰、主要图标、深色底色区块 |
| **Accent** | `#E46C2C` | 数据高亮、关键数字、强调信息 |
| **Secondary accent** | `#4A90A4` | 次要强调、对比数据 |
| **Body text** | `#1D2430` | 正文文字 |
| **Secondary text** | `#5C6675` | 副标题、注释 |
| **Tertiary text** | `#8A94A6` | 补充信息、页脚 |
| **Border/divider** | `#DCE2EA` | 卡片边框、分隔线 |
| **Success** | `#2E9E6B` | 正面指标 |
| **Warning** | `#D64545` | 需要关注指标 |

### Gradient Scheme

```xml
<!-- Title gradient -->
<linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#1B3A5C"/>
  <stop offset="100%" stop-color="#4A90A4"/>
</linearGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: editorial CJK sans + geometric sans — 思源黑体 + Inter 风格组合

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `"PingFang SC"`, `"Microsoft YaHei"` | `Arial` | `sans-serif` |
| **Body** | `"PingFang SC"`, `"Microsoft YaHei"` | `Arial` | `sans-serif` |
| **Emphasis** | `"PingFang SC"`, `"Microsoft YaHei"` | `Georgia` | `sans-serif` |

**Per-role font stacks**:

- Title: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- Body: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- Emphasis: `Georgia, "Microsoft YaHei", "PingFang SC", serif`

### Font Size Hierarchy

**Baseline**: Body font size = 24 (balanced 商务平衡型)

| Role | Size (px) | Weight |
| ---- | --------- | ------ |
| Cover title (hero headline) | 72 | Bold |
| Page title | 42 | Bold |
| Subtitle | 32 | SemiBold |
| Lead-in | 28 | Regular / Medium |
| Subheading | 26 | SemiBold |
| **Body content** | **24** | Regular |
| Annotation / caption | 18 | Regular |
| Page number / footnote | 14 | Regular |

---

## V. Layout Principles

### Page Structure

- **Header area**: 高度 80px — 页面标题 + 分隔线
- **Content area**: 高度 520px — 主体内容区
- **Footer area**: 高度 60px — 页码 + 数据来源

### Layout Pattern Library

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | Covers, conclusions, key points |
| **Asymmetric split (3:7 / 2:8)** | 数据图表 vs 简短结论 |
| **Three/four column cards** | 多语言站对比 |
| **Matrix grid (2×2)** | 渠道构成对比 |
| **Editorial columns** | 杂志式排版 |
| **Full-bleed + floating text** | 章节过渡 |

### Spacing Specification

**Universal**:

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Safe margin from canvas edge | 40-60px | 60px |
| Content block gap | 24-40px | 32px |
| Icon-text gap | 8-16px | 12px |

**Card-based layouts**:

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Card gap | 20-32px | 24px |
| Card padding | 20-32px | 24px |
| Card border radius | 8-16px | 12px |
| Single-row card height | 530-600px | 560px |
| Double-row card height | 265-295px each | 280px |

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `tabler-outline` (线性简洁)
- **Usage method**: SVG placeholder `<use data-icon="tabler-outline/icon-name" .../>`

### Recommended Icon List

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| Globe / 全球 | `tabler-outline/globe` | P01 |
| Chart bar / 趋势 | `tabler-outline/chart-bar` | P04 |
| Users / 用户 | `tabler-outline/users` | P04 |
| Target / 目标 | `tabler-outline/target` | P05 |
| Phone / App Push | `tabler-outline/bell` | P08 |
| Search / SEO | `tabler-outline/search` | P09 |
| Link / Partner | `tabler-outline/link` | P10 |
| Dollar / PPC | `tabler-outline/currency-dollar` | P10 |
| Trend up / 上升 | `tabler-outline/trending-up` | P11 |
| Lightbulb / 策略 | `tabler-outline/lightbulb` | P12 |

---

## VII. Visualization Reference List

Catalog read: 71 templates

| Page | Template | Path | Summary-quote (verbatim from `charts_index.json`) | Usage |
| ---- | -------- | ---- | ------------------------------------------------- | ----- |
| P04 | horizontal_bar_chart | `templates/charts/horizontal_bar_chart.svg` | "Pick for ranking 5-12 items, especially with long labels. Skip if <=8 short-label items (use bar_chart)." | TOP 10 语言站 PV 排名对比 |
| P05 | donut_chart | `templates/charts/donut_chart.svg` | "Pick for 3-6 part proportions where a center KPI/total deserves emphasis. Skip if no center value to feature (use pie_chart)." | TOP 2 集中度 59% 占比 |
| P06 | grouped_bar_chart | `templates/charts/grouped_bar_chart.svg` | "Pick for 2-4 series side-by-side across the same categories (e.g. YoY/QoQ). Skip if showing composition within each category (use stacked_bar_chart)." | 各语言站流量来源对比 |
| P05 | kpi_cards | `templates/charts/kpi_cards.svg` | "Pick for 4-8 standalone numeric metrics shown as overview cards (2x2 or 1x4) — exec summary opener, dashboard headline, quarterly recap, results-at-a-glance. Skip if metrics have target baselines (use bullet_chart) or single hero number (use gauge_chart)." | 核心 KPI 总览 |

**Runners-up considered**:

- `bar_chart` | rejected for P04: TOP 10 有 10 个类别且标签较长，horizontal_bar_chart 更适合
- `pie_chart` | rejected for P05: 中心需要突出 KPI 总数字，donut_chart 更有表现力
- `stacked_bar_chart` | rejected for P06: 需要直接对比各站点渠道构成，grouped_bar_chart 更能看到每个渠道差异

---

## VIII. Image Resource List

无图片资源 — 本 deck 为数据分析报告，以数据图表为主，无 AI 图片需求。

---

## IX. Content Outline

### Part 1: 结论总览

#### Slide 01 - Cover 封面

- **Cover impact**: 用一个核心数字 "603K+ PV" 作为封面数据钩子，配以深色底色+大标题设计；组合策略：数据钩子（hero number）+ 编辑式排版
- **Layout**: 深色底 + 大标题 + 核心数字高亮
- **Title**: T站门票语言站流量分析
- **Subtitle**: 数据周期：2026-08-10 ~ 08-17 ｜ 口径：SGP 集群 · page_ct='trip' · sub_bu_name='ibu门票'
- **Info**: 运营数据分析 · 2026-09-04

#### Slide 02 - 核心结论

- **Layout**: Single column centered — 编辑式三段式：结论 + 数据 + 建议
- **Title**: 核心结论
- **Core message**: TOP 2 语言站（香港+新加坡）合计贡献 59% 流量，头部集中度极高
- **Content**:
  - TOP 2（zh-hk + en-sg）合计占 **59%**，TOP 10 占 **88.6%**
  - 港澳台 + 东南亚（新马）+ 俄韩是主力客源区
  - 站内流量仍是大盘主力（各站 32%-67%），每站投放侧重差异巨大

#### Slide 03 - 数据口径说明

- **Layout**: Three/four column cards — 数据来源、环境、指标说明
- **Title**: 数据口径
- **Core message**: 本报告按语言站（locale）统计，与按景点口径不同
- **Content**:
  - 环境：SGP 集群（T 站海外数据）
  - 表：`dw_ticketdb.edw_log_ttd_traffic_order_d_ext`
  - 过滤：`page_ct='trip'` + `sub_bu_name='ibu门票'`
  - 站点：按 `locale` 字段（语言站）
  - 指标：PV = `count(distinct com_pv)`；UV = `count(distinct vid)`
  - 流量来源：`trip_channel`

### Part 2: 数据总览

#### Slide 04 - TOP 10 语言站排名

- **Layout**: Asymmetric split (2:8) — 左侧结论 + 右侧横向柱状图
- **Title**: TOP 10 语言站 PV 排名
- **Core message**: 头部站高度集中，zh-hk（30.1%）+ en-sg（29.0%）构成绝对主力
- **Visualization**: horizontal_bar_chart
- **Content**:
  - zh-hk: 603,658 PV (30.1%) / 49,043 UV
  - en-sg: 581,867 PV (29.0%) / 37,249 UV
  - zh-tw: 148,331 PV (7.4%) / 28,092 UV
  - en-my: 146,071 PV (7.3%) / 11,297 UV
  - ru-ru: 68,933 PV (3.4%) / 16,647 UV
  - ko-kr: 55,648 PV (2.8%) / 14,796 UV
  - en-id: 52,135 PV (2.6%) / 2,955 UV
  - zh-my: 48,370 PV (2.4%) / 3,597 UV
  - zh-sg: 42,422 PV (2.1%) / 2,916 UV
  - en-xx: 39,366 PV (2.0%) / 7,822 UV

#### Slide 05 - 集中度分析

- **Layout**: Editorial — 左大数字 + 右侧 donut 图
- **Title**: 集中度显著：TOP 2 占 59%
- **Core message**: 流量高度集中于头部少数语言站，港澳台+东南亚是主力客源区
- **Visualization**: donut_chart
- **Content**:
  - TOP 2（zh-hk + en-sg）= 59%
  - TOP 10 = 88.6%
  - 主力客源区：港澳台 + 东南亚（新马）+ 俄韩
  - 长尾 50+ 站点共享约 11% 流量

#### Slide 06 - 各语言站流量来源对比

- **Layout**: Asymmetric split (4:6) — 左侧小结 + 右侧 grouped bar chart
- **Title**: 各站流量来源特征
- **Core message**: 每站的渠道构成差异极大，投放策略应一站一策
- **Visualization**: grouped_bar_chart
- **Content**: 5 个核心站点的 6 个渠道占比对比

### Part 3: 重点站点深度分析

#### Slide 07 - zh-hk 香港繁体分析

- **Layout**: Editorial — 三行式（摘要 + 数据 + 策略提示）
- **Title**: zh-hk 香港繁体 — 站内流量主导
- **Core message**: 香港站站内占比 66.6%（全站最高），对外投放依赖低，Partner 是第二抓手
- **Content**:
  - 站内 66.6%（全站最高）→ 用户平台内自发流转
  - Partner 13.3%，APP-PUSH 5.4%，SEO 4.5%
  - 策略：强化平台内交叉引流与 Partner 联盟合作

#### Slide 08 - en-sg 新加坡英文分析

- **Layout**: Editorial — 重点突出 APP-PUSH 数据
- **Title**: en-sg 新加坡英文 — APP-PUSH 驱动
- **Core message**: 新加坡站 APP-PUSH 依赖度全站最高（23%），PV 体量第二
- **Content**:
  - APP-PUSH 23% 全站最高 → 可能绑定 BIGBANG 新加坡演唱会开票提醒
  - 站内 42.7%，SEO 12.1%，Partner 10.8%
  - 策略：深耕 Push 召回能力 + 演唱会/演出票务场景

#### Slide 09 - ru-ru 俄语站分析

- **Layout**: Editorial — 特殊结构突出
- **Title**: ru-ru 俄语站 — SEO 驱动型
- **Core message**: 俄语站 SEO 占比 28.4%（全站最高），对投放依赖低，自然流量为主
- **Content**:
  - SEO 28.4% 全站最高 → 搜索引擎自然流入强
  - 站内 31.7%（全站最低），PPC 12.0%
  - 策略：加大 SEO 内容建设与关键词覆盖

#### Slide 10 - ko-kr + en-my 均衡型分析

- **Layout**: Symmetric split (5:5) — 左右对比
- **Title**: ko-kr + en-my — 多渠道并进
- **Core message**: 韩语与马来站渠道相对均衡，站内 44-55%，各外部渠道 8-16%
- **Content**:
  - ko-kr: 站内 44.3%、Partner 15.0%、PPC 11.6%、SEO 9.7%
  - en-my: 站内 55.0%、Partner 16.1%、SEO 5.2%、PPC 8.4%
  - 策略：维持多渠道配合，优化 Partner + PPC 投放性价比

### Part 4: 策略建议与总结

#### Slide 11 - 策略建议

- **Layout**: Three/four column cards — 4 个核心策略
- **Title**: 运营策略：一站一策
- **Core message**: 不同语言站应根据其渠道特征制定差异化运营策略
- **Content**:
  - zh-hk 香港：加强平台内交叉引流，Partner 联盟是第二抓手
  - en-sg 新加坡：深耕 APP-PUSH 召回，绑定演出票务场景
  - ru-ru 俄语：加大 SEO 建设，关注自然搜索流量
  - ko-kr/en-my：维持多渠道均衡，优化 Partner + PPC 组合

#### Slide 12 - 总结与展望

- **Layout**: Single column centered — 编辑式结语
- **Title**: 下一步：从流量到转化
- **Core message**: 在流量分析基础上，需要进一步看下单转化（订单量、GMV）评估 ROI
- **Content**:
  - 按语言站的流量分布与渠道差异已明确
  - 下一步：分析各站下单转化、订单量、GMV
  - 目标：评估各站投放 ROI，优化资源配置

---

## X. Speaker Notes Requirements

One speaker note file per page, saved to `notes/`:

- **Filename**: match SVG name (e.g., `01_cover.md`)
- **Content**: script key points, timing cues, transition phrases

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

1. viewBox: `0 0 1280 720`
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: write typography & symbols as raw Unicode
8. `clipPath` conditionally allowed only on `<image>` elements
9. `<g opacity="...">` FORBIDDEN (set on each child element individually)
10. Inline styles only; external CSS and `@font-face` FORBIDDEN
