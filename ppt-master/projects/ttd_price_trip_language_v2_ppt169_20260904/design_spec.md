# TTD 门票语言站流量分析 v2 - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | TTD 门票语言站流量分析 v2 |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 12 pages |
| **Design Style** | Glassmorphism — 玻璃拟态高级感 |
| **Target Audience** | 运营团队 / 业务管理层：负责 T 站海外门票业务 |
| **Use Case** | 周报/月报汇报，展示各语言站流量分布与渠道策略差异 |
| **Delivery Purpose** | balanced — 商务平衡型 |
| **Content Strategy** | 平衡默认：忠实源数据结构与事实，金字塔式叙事 |
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

- **Mode**: pyramid — 结论先行，MECE 论证
- **Visual style**: glassmorphism — 玻璃拟态：半透明玻璃面板 + 渐变光 + 漂浮层次
- **Theme**: Dark theme（深色底 + 玻璃面板）
- **Tone**: 现代、高级、科技感

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#0F1B2D` | 深色页面背景（暗蓝黑） |
| **Secondary bg** | `#1A2D4A` | 次级背景 |
| **Primary** | `#1E3A5F` | 主色（深蓝） |
| **Accent** | `#4FC3F7` | 亮蓝强调（发光数据） |
| **Secondary accent** | `#FFB74D` | 橙金强调（高亮数字） |
| **Body text** | `#E8F0FA` | 正文文字（亮色） |
| **Secondary text** | `#8FA8C8` | 副标题文字 |
| **Tertiary text** | `#5C7590` | 补充信息、页脚 |
| **Border/divider** | `rgba(120,160,200,0.3)` | 玻璃面板边框 |
| **Success** | `#4CAF50` | 正面指标 |
| **Warning** | `#FF6B6B` | 提醒指标 |

### SVG 装饰元素

每页将包含：
1. **背景装饰**：radial-gradient 光斑（深蓝/蓝紫色调）营造氛围
2. **玻璃面板**：半透明卡片（fill-opacity 0.08-0.15 + 亮色边缘）
3. **渐变标题**：线性渐变文字（蓝色到青蓝）
4. **装饰图标**：使用 tabler-outline 图标库点缀

### Gradient Scheme

```xml
<!-- Title gradient -->
<linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="#4FC3F7"/>
  <stop offset="100%" stop-color="#FFB74D"/>
</linearGradient>

<!-- Glass panel gradient -->
<linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#4FC3F7" stop-opacity="0.15"/>
  <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.05"/>
  <stop offset="100%" stop-color="#FFB74D" stop-opacity="0.1"/>
</linearGradient>

<!-- Background glow -->
<radialGradient id="bgGlow1" cx="20%" cy="20%" r="60%">
  <stop offset="0%" stop-color="#4FC3F7" stop-opacity="0.2"/>
  <stop offset="100%" stop-color="#4FC3F7" stop-opacity="0"/>
</radialGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: modern clean sans — 干净现代无衬线字体

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `"PingFang SC"`, `"Microsoft YaHei"` | `Arial` | `sans-serif` |
| **Body** | `"PingFang SC"`, `"Microsoft YaHei"` | `Arial` | `sans-serif` |
| **Emphasis** | `"PingFang SC"` | `Georgia` | `sans-serif` |

**Per-role font stacks**:

- Title: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- Body: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`
- Emphasis: `Georgia, "Microsoft YaHei", "PingFang SC", sans-serif`

### Font Size Hierarchy

**Baseline**: Body font size = 24 (balanced)

| Role | Size (px) | Weight |
| ---- | --------- | ------ |
| Cover title | 72 | Bold |
| Page title | 42 | Bold |
| Subtitle | 32 | SemiBold |
| Lead | 28 | Regular |
| Subheading | 26 | SemiBold |
| **Body** | **24** | Regular |
| Annotation | 18 | Regular |
| Footnote | 14 | Regular |

---

## V. Layout Principles

### Page Structure

- **Header area**: 高度 80px — 页面标题 + 装饰线
- **Content area**: 高度 520px — 玻璃面板内容区
- **Footer area**: 高度 60px — 页码 + 数据来源

### Layout Pattern Library

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | Covers, conclusions |
| **Glass card grid (2×2)** | 多站点对比、策略建议 |
| **Asymmetric split (3:7)** | 数据图表 vs 简短结论 |
| **Full-bleed glow + floating** | 封面、章节过渡 |

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `tabler-outline` (线性简洁)

### Recommended Icon List

| Purpose | Icon | Page |
| ------- | ---- | ---- |
| Globe | `tabler-outline/globe` | P01 |
| Chart bar | `tabler-outline/chart-bar` | P04 |
| Users | `tabler-outline/users` | P04 |
| Target | `tabler-outline/target` | P05 |
| Bell | `tabler-outline/bell` | P08 |
| Search | `tabler-outline/search` | P09 |
| Link | `tabler-outline/link` | P10 |
| Trending up | `tabler-outline/trending-up` | P11 |
| Lightbulb | `tabler-outline/lightbulb` | P12 |

---

## VII. Visualization Reference List

| Page | Template | Path | Summary-quote | Usage |
| ---- | -------- | ---- | ------------- | ----- |
| P04 | horizontal_bar_chart | `templates/charts/horizontal_bar_chart.svg` | "Pick for ranking 5-12 items, especially with long labels." | TOP 10 语言站 PV 排名 |
| P05 | donut_chart | `templates/charts/donut_chart.svg` | "Pick for 3-6 part proportions where a center KPI/total deserves emphasis." | 集中度 59% |
| P06 | grouped_bar_chart | `templates/charts/grouped_bar_chart.svg` | "Pick for 2-4 series side-by-side across the same categories." | 各站渠道对比 |

---

## VIII. Image Resource List

无 AI 图片。使用 SVG 装饰图形（渐变光斑、玻璃面板、图标装饰）作为视觉装饰。

---

## IX. Content Outline

### Slide 01 - Cover
- **Title**: T站门票语言站流量分析
- **Cover impact**: 大数字 603K+ PV 作为数据钩子 + 深色玻璃背景 + 渐变光斑
- **Subtitle**: 2026-08-10 ~ 08-17 ｜ SGP 集群 · ibu门票
- **Layout**: 深色底 + 背景光斑 + 玻璃面板 + 大数字

### Slide 02 - 核心结论
- **Title**: TOP 2 合计 59%，头部高度集中
- **Core message**: zh-hk + en-sg 构成绝对主力
- **Content**: 59% / 88.6% / 32-67% 三个核心数字 + 主战场说明

### Slide 03 - 数据口径
- **Title**: 按语言站（locale）口径统计
- **Content**: 环境/表格/过滤/指标说明 + 示例语言站

### Slide 04 - TOP 10 排名
- **Title**: TOP 10 语言站 PV 排名
- **Visualization**: horizontal_bar_chart
- **Content**: 10 个站点的 PV/UV/占比数据

### Slide 05 - 集中度
- **Title**: TOP 2 占 59%：流量高度集中
- **Visualization**: donut_chart
- **Content**: 59% TOP2 + 88.6% TOP10 + 主力客源区

### Slide 06 - 渠道对比
- **Title**: 各站渠道构成差异显著
- **Visualization**: grouped_bar_chart
- **Content**: 5 个核心站的 6 个渠道对比

### Slide 07 - zh-hk
- **Title**: zh-hk 香港 — 站内流量 66.6% 全站最高
- **Content**: 站内主导 + Partner 13.3% 第二抓手

### Slide 08 - en-sg
- **Title**: en-sg 新加坡 — APP-PUSH 23% 全站最高
- **Content**: Push 召回 + 演出票务绑定

### Slide 09 - ru-ru
- **Title**: ru-ru 俄语 — SEO 28.4% 全站最高
- **Content**: 搜索引擎自然流入为主

### Slide 10 - ko-kr + en-my
- **Title**: ko-kr + en-my — 多渠道均衡
- **Content**: 左侧 ko-kr 右侧 en-my 数据卡片

### Slide 11 - 策略
- **Title**: 一站一策：差异化运营策略
- **Content**: 4 个站点策略卡片

### Slide 12 - 总结
- **Title**: 从流量到转化
- **Content**: 已明确流量 → 下一步转化/GMV/ROI

---

## X. Speaker Notes Requirements

One speaker note file per page, saved to `notes/`.

---

## XI. Technical Constraints Reminder

1. viewBox: 0 0 1280 720
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: raw Unicode; XML entities for reserved chars
8. Inline styles only; external CSS MUST NOT be used
9. `clipPath` conditionally allowed on `<image>` elements
10. Glass panel = filled rect with low fill-opacity + bright stroke border
