# ttd_lang_station_traffic - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | ttd_lang_station_traffic |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 12 |
| **Design Style** | `data-journalism` 出版级数据报告（《经济学人》/ Bloomberg 信息图气质）× `pyramid` 金字塔叙事（结论先行） |
| **Target Audience** | 海外门票业务（T 站）的运营 / 增长投放团队，以及需要据此分配各语言站投放资源的业务负责人 |
| **Use Case** | 内部数据复盘 / 投放策略评审会：先讲清口径，再给结论，再用排行、集中度与渠道结构逐层支撑，最后落到分站打法 |
| **Delivery Purpose** | `balanced` business — 会上投影讲解、会后留档细读。正文基线 24px；每页一个主论点 + 支撑证据，密度中等偏上 |
| **Content Strategy** | balanced default（用户未指定偏离度）— 在不新增任何事实的前提下重新组织叙事：把源文档的「口径说明 / TOP 语言站 / 渠道对比 / 关键解读」重组为「口径 → 结论 → 排行 → 集中度 → 渠道结构 → 分站解读 → 一站一策」的金字塔结构。所有数字、百分比、站点名、表名、过滤条件均逐字来自源文档，仅做必要的加减法（如 88.6% − 59% = 29.6%） |
| **Created Date** | 20260910 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | left/right 60px, top 46px, bottom 44px |
| **Content Area** | 1160×630 (Safety area 1160 wide × 630 tall) |

---

## III. Visual Theme

### Theme Style

- **Mode**: pyramid — 结论先行，每页一个断言，数据只作为该断言的证据；证据之间相互独立、可单独成立
- **Visual style**: data-journalism — 多栏网格承载密集的微图表与数据表，编辑式侧栏与 pull-stat，发丝分隔线，hero 数字，常驻来源/脚注行；信息密度本身就是观感，靠严格网格保证可读
- **Theme**: Light theme（纸张白场，对比更强、更适合投影与打印）
- **Tone**: 克制、可信、结论明确；像一份财经长报道而不是一份 keynote

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#FFFFFF` | 页面底色（纸张白） |
| **Secondary bg** | `#EEF2F6` | 区块底色 / 表头带 / 侧栏底 |
| **Surface** | `#F7F9FB` | 卡片与面板抬升（比底色低一档，比区块底高一档） |
| **Grid** | `#E7EDF3` | 微图表网格线（比分隔线更浅） |
| **Primary** | `#0F4C81` | 标题、主数据条、图标、关键区块 |
| **Accent** | `#E8833A` | 数据高亮、关键数字、结论强调（用量 < 10%） |
| **Secondary accent** | `#4A90C4` | 次级数据系列、渐变过渡 |
| **Body text** | `#1B2430` | 正文 |
| **Secondary text** | `#5A6675` | 图注、说明 |
| **Tertiary text** | `#8A94A2` | 来源行、页码、脚注 |
| **Border/divider** | `#D5DDE6` | 卡片边框、分隔线（比 grid 深一档） |
| **Success** | `#2E7D32` | 正向指标 |
| **Warning** | `#C62828` | 风险 / 缺口标记 |

> 用色纪律（随视觉风格锁定）：数字按「含义」上色，不按装饰上色——`#0F4C81` 承载主系列，`#4A90C4` 承载第二系列，`#E8833A` 只标记需要读者注意的那一个数字/那一条。图表一律用同一色系的深浅，禁止彩虹配色。

### AI Image Strategy (fill only when §VIII has `ai` rows)

不适用 — 本片 `image_usage: none`，§VIII 无 `ai` 行，不锁定渲染与调色板，第 5 步不生成图片。

### Gradient Scheme (if needed, using SVG syntax)

```xml
<!-- Hero number / accent underline gradient -->
<linearGradient id="accentRule" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="#0F4C81"/>
  <stop offset="100%" stop-color="#4A90C4"/>
</linearGradient>

<!-- Section wash (note: rgba forbidden, use stop-opacity) -->
<radialGradient id="panelWash" cx="85%" cy="12%" r="60%">
  <stop offset="0%" stop-color="#0F4C81" stop-opacity="0.08"/>
  <stop offset="100%" stop-color="#0F4C81" stop-opacity="0"/>
</radialGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: 报刊衬线标题（出版权威感）× 中性黑体正文 × 等宽数字（表格与图表标签的数值精确感）——即 `data-journalism` 要求的 “serif headline / hero-number for authority × clean sans or monospace for numeric precision”。

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `SimSun` | `Georgia` | `serif` |
| **Body** | `"Microsoft YaHei"` (macOS preview: `"PingFang SC"`) | `Arial` | `sans-serif` |
| **Emphasis** | `SimSun` | `Georgia` | `serif` |
| **Code** | — | `Consolas, "Courier New"` | `monospace` |

**Per-role font stacks** (CSS `font-family` strings):

- Title: `Georgia, SimSun, "Times New Roman", serif` — Latin-led：拉丁标题走 Georgia 的衬线权威感，中文落到宋体
- Body: `"Microsoft YaHei", "PingFang SC", Arial, sans-serif` — CJK-led：中文正文用雅黑，拉丁随其后
- Emphasis: `Georgia, SimSun, "Times New Roman", serif` — hero 数字与 pull-stat 用衬线数字，与标题同族
- Code: `Consolas, "Courier New", monospace` — 表格数字、图表标签、口径表达式（`page_ct='trip'`、`count(distinct com_pv)`）用等宽

> 全部为 Windows / macOS 预装字体，无需安装或嵌入。栈长 3–4 个，仅含一个 macOS 专属族（`PingFang SC`）作浏览器预览优化。

### Font Size Hierarchy

**Baseline (unitless px)**: Body font size = 24（`balanced` 商务档：既投影也阅读）

| Slot | Size (px) | Ratio | Role |
| ---- | --------- | ----- | ---- |
| `cover_title` | 96 | 4.0x | 封面主标题 |
| `hero_number` | 56 | 2.33x | KPI 卡与集中度页的大数字（已声明的 hero 槽） |
| `title` | 42 | 1.75x | 页面标题 |
| `subtitle` | 32 | 1.33x | 副标题 / 页面引导句 |
| `lead` | 30 | 1.25x | 每页核心信息行（主论断，恒 ≥ body） |
| `subheading` | 28 | 1.17x | 卡片标题 / 区块小标题 |
| `body` | 24 | 1x | 正文 |
| `annotation` | 18 | 0.75x | 图注、单元格说明 |
| `chart_annotation` | 16 | 0.67x | 图表轴标签、数据标签 |
| `footnote` | 16 | 0.67x | 来源行、口径注、页码 |

> 结构型角色（title / body / subtitle / annotation / footnote）在每页固定同一尺寸。`hero_number` 与 `cover_title` 为已声明的 special 槽，不受固定比例带上限约束。

---

## V. Layout Principles

### Page Structure

- **Header area**: 高 100px — 页面标题（42px）+ 核心信息行（30px，`lead`）+ 标题下 1px 发丝线（`#D5DDE6`），左侧压一条 4×28px 的主色竖标
- **Content area**: 高 ~490px — 由图表 / 表格 / 多栏文本承载，栏间距 28px
- **Footer area**: 高 ~40px — 左侧来源行（`#8A94A2`，16px），右侧页码 `P04 / 12`，两者之间一条 1px 发丝线

### Layout Pattern Library (combine or break as content demands)

| Pattern | Where used in this deck |
| ------- | ----------------------- |
| **Single column centered** | P12 结尾论断带 |
| **Symmetric split (5:5)** | P08–P11 分站解读：左栏数据条 + 右栏解读 |
| **Asymmetric split (3:7)** | P05 集中度：左侧 hero 数字 + 右侧环形图 |
| **Three/four column cards** | P03 KPI 四卡、P12 四类站点打法 |
| **Matrix grid (2×2)** | P11 两站并置对比 |
| **Top-bottom split** | P04 排行条 + 底部占比/UV 列 |
| **Negative-space-driven** | P05 breathing 页，让 88.6% 这个数字独自承重 |

> 刻意避免「每页都是同样的卡片网格」：P03 用四张 KPI 卡（dense），P04 用横向条形 + 数值列（dense），P05 破格为单数字呼吸页（breathing），P06 用高密度矩阵表（dense），P07 用雷达叠图（dense），P08–P11 用左右分栏的数据条 + 解读（dense），P12 回到单一论断 + 四条并列条带（anchor）。

### Spacing Specification

**Universal** (any container type):

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Safe margin from canvas edge | 40-60px | 60px |
| Content block gap | 24-40px | 28px |
| Icon-text gap | 8-16px | 10px |

**Card-based layouts** (P03 / P08–P12):

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Card gap | 20-32px | 24px |
| Card padding | 20-32px | 24px |
| Card border radius | 8-16px | 10px |
| Single-row card height | 530-600px | 470px |
| Double-row card height | 265-295px each | 232px each |
| Three-column card width | 360-380px each | 370px each |

**Non-card containers** (P05 / P07 / P12 论断带):

- 纵向节奏由留白承载而非卡槽：块间距 40px，分隔用 1px 发丝线而非容器边框
- **Line-height**: 正文 1.45；大字号与 breathing 页 1.3
- **Content width** 由阅读舒适度与图表构图决定，不回算「栏宽」

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `templates/icons/tabler-outline`（线性描边，5,000+ 图标；`data-journalism` 的发丝线与细线图标同调）
- **Usage method**: SVG placeholder `<use data-icon="tabler-outline/<name>" .../>`；`stroke-width` 全片统一 **2**
- **Library lock**: 全片只用 `tabler-outline` 一个风格库，禁止混用；`simple-icons` 品牌库不启用（本片无真实品牌标识需求）

### Recommended Icon List

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| 语言站 / 全球口径 | `tabler-outline/world` | P02, P04 |
| 数据表 / SQL 口径 | `tabler-outline/database` | P02 |
| 过滤条件 | `tabler-outline/filter` | P02 |
| 时间窗 | `tabler-outline/calendar` | P02 |
| 口径清单 | `tabler-outline/checklist` | P02 |
| 排行 / 指标卡 | `tabler-outline/chart-bar` | P03, P04 |
| 趋势 / 集中度 | `tabler-outline/chart-line` | P03 |
| 增长 / 集中标记 | `tabler-outline/trending-up` | P03, P05 |
| 用户 / UV | `tabler-outline/users` | P03, P04 |
| 数据报告 | `tabler-outline/report-analytics` | P03 |
| 站点地理 / 客源区 | `tabler-outline/map-pin` | P05 |
| 目标 / 结论 | `tabler-outline/target` | P03, P12 |
| 渠道结构 / 调节 | `tabler-outline/adjustments` | P06 |
| 渠道指纹 / 路径 | `tabler-outline/route` | P07 |
| 站内流转 | `tabler-outline/home` | P08 |
| 站内分享 | `tabler-outline/share` | P08 |
| APP 推送 | `tabler-outline/bell` | P09 |
| 移动端 | `tabler-outline/device-mobile` | P09 |
| 搜索引擎 | `tabler-outline/search` | P10 |
| 付费投放 | `tabler-outline/speakerphone` | P11 |
| Partner 联盟 | `tabler-outline/users-group` | P07, P11 |
| 策略方向 | `tabler-outline/compass` | P12 |
| 风险 / 提醒 | `tabler-outline/alert-triangle` | P12 |

---

## VII. Visualization Reference List

Catalog read: 71 templates

| Page | Template | Path | Summary-quote (verbatim from `charts_index.json`) | Usage |
| ---- | -------- | ---- | ------------------------------------------------- | ----- |
| P03 | kpi_cards | `templates/charts/kpi_cards.svg` | "Pick for 4-8 standalone numeric metrics shown as overview cards (2x2 or 1x4) — exec summary opener, dashboard headline, quarterly recap, results-at-a-glance. Skip if metrics have target baselines (use bullet_chart) or single hero number (use gauge_chart)." | 结论先行的四个盘点数字：50+ 语言站 / TOP2 59% / TOP10 88.6% / 长尾 11.4% |
| P04 | horizontal_bar_chart | `templates/charts/horizontal_bar_chart.svg` | "Pick for ranking 5-12 items, especially with long labels. Skip if <=8 short-label items (use bar_chart)." | TOP10 语言站 PV 排行（10 项、标签长，含 locale + 中文名） |
| P05 | donut_chart | `templates/charts/donut_chart.svg` | "Pick for 3-6 part proportions where a center KPI/total deserves emphasis. Skip if no center value to feature (use pie_chart)." | 三段占比（TOP2 / 第 3–10 名 / 其余 40+ 站），中心承载 88.6% |
| P06 | consulting_table | `templates/charts/consulting_table.svg` | "Pick for high-density tables with embedded micro bar visuals (consulting/financial reports). Skip for plain text data (use basic_table)." | 五站 × 六渠道结构矩阵，每格百分比 + 微条 |
| P07 | radar_chart | `templates/charts/radar_chart.svg` | "Pick for 4-8 capability dimensions scored across 1-3 entities. Skip for >3 entities (becomes unreadable; use grouped_bar_chart) or <4 dimensions." | zh-hk / en-sg / ru-ru 三站渠道指纹（6 维度）叠图对比 |
| P12 | labeled_card | `templates/charts/labeled_card.svg` | "Pick for 3-4 parallel aspects of one subject with per-aspect titles + short body (self-introduction, four-pillar overview, capability quadrant). Skip for plain feature lists (use icon_grid), sequential steps (use numbered_steps), or strategic quadrants (use quadrant_text_bullets / matrix_2x2)." | 四类站点打法（站内自转型 / Push 驱动型 / SEO 自然流入型 / 多渠道均衡型） |

**Runners-up considered** (3 entries minimum, drawn from real second-best matches in this deck):

- `bar_chart` | rejected for P04: 有 10 项且标签是「locale + 中文名」的长标签，竖向柱状会被迫旋转或截断，横向条形更适合长标签排行
- `pie_chart` | rejected for P05: 本页要强调的中心量（TOP10 = 88.6%）需要一个中心位来承载，饼图没有中心槽位
- `heatmap_chart` | rejected for P06: 热力图只表达强弱，而这份表要让运营直接读到 66.6% / 23.0% / 28.4% 这类精确百分比，微条表格更准
- `stacked_bar_chart` | rejected for P06: 六个渠道超出该模板「2-4 个内部构成」的可读上限，堆叠后会失去逐格读数能力
- `grouped_bar_chart` | rejected for P07: 六个系列（渠道）× 三个站点会挤成 18 根柱，超过「2-4 个系列」的上限；雷达叠图更能看出单站的渠道「形状」

---

## VIII. Image Resource List (if needed)

**Option A — no images.** 本次确认的 `image_usage` 为 `none`：源文档是纯数据（口径、排行、集中度、渠道占比与解读），没有任何产品、场景或人物可供配图，套用图库/生成图会稀释数据报告的专业感。视觉张力改由图表工艺、字号层级、发丝线与配色纪律来承担。

> 该选择与锁定的视觉风格一致：`data-journalism` 的插画倾向本身为 `sparse`。若后续希望封面用一张 AI 主视觉，可在 Step 5 前改为 `ai` 并补写本节的 `ai` 行与 h.5 渲染/调色板锁定。

因此本片**无任何图片行**，`spec_lock.md` 不含 `images` 段，Step 5 直接跳过。

---

## IX. Content Outline

### Part 1: 口径与结论

#### Slide 01 - Cover

- **Cover impact**: Hook = 一个被压缩到极致的数字——**59%**（TOP2 语言站吃掉近六成门票流量）。Composition = `typographic poster` + `data hook`：左侧超大衬线主标题与一行副题对齐同一基线；右侧用一条从「50+ 语言站」收窄到「TOP2」的收敛几何（10 条由长到短的横线，首两条用主色与强调色点亮），底部一条口径脚注。刻意不做居中标题块，也不放任何装饰图形。
- **Layout**: 非对称 6:4 分栏 — 左栏文字锚点，右栏收敛几何 + 轻量 `panelWash` 渐变
- **Title**: T 站门票语言站流量分析
- **Subtitle**: 50+ 个语言站，TOP2 吃下 59% —— 投放必须一站一策
- **Info**: SGP 集群（T 站海外数据）· 门票业务 · 数据窗口 8/10–8/17 · 截止 2026-08-17

#### Slide 02 - 口径与方法

- **Layout**: 三栏定义网格（2 行 × 3 项），每项一个 `tabler-outline` 图标 + 标签 + 一行值；底部一条加宽的来源注脚带
- **Title**: 口径先行：这次按语言站看，不再按景点
- **Core message**: 结论的可信度取决于口径——统一数据表与过滤条件、统一时间窗，并把「站点」定义为 `locale` 语言站。
- **Content**:
  - **环境** / SGP 集群，T 站海外数据
  - **数据表** / `dw_ticketdb.edw_log_ttd_traffic_order_d_ext`
  - **过滤条件** / `page_ct='trip'` 且 `sub_bu_name='ibu门票'`
  - **站点口径** / 按 `locale` 字段切语言站，如 zh-hk=香港繁体、en-sg=新加坡英文
  - **指标定义** / PV = `count(distinct com_pv)`；UV = `count(distinct vid)`；流量来源 = `trip_channel`
  - **时间窗** / 数据截止 2026-08-17，取最近完整 7 天 8/10–8/17
  - 脚注：上一轮按景点（`viewspotname`）统计，口径答偏；本轮改为按语言站重新统计

#### Slide 03 - 结论先行

- **Layout**: 四张 KPI 卡（1×4），每卡上方一行标签、中间 hero 数字、下方一行注解；卡片下方一条通栏结论带
- **Title**: 结论先行：流量高度头部集中，渠道结构各站迥异
- **Core message**: 语言站流量高度头部集中（TOP2 占 59%、TOP10 占 88.6%），但各语言站的渠道结构差异巨大——站内仍是主力，对外投放必须按站定制，一站一策。
- **Visualization**: `kpi_cards` (see VII. Visualization Reference List)
- **Content**:
  - **50+** / 全量语言站数量
  - **59%** / TOP2（zh-hk + en-sg）合计 PV 占比
  - **88.6%** / TOP10 合计 PV 占比
  - **11.4%** / 其余 40+ 个语言站合计占比
  - 通栏结论：主力客源区是港澳台 + 东南亚（新马）+ 俄韩；站内流量在各站占 31.7%–66.6%，对外投放的四个主要抓手是 Partner 联盟、SEO、APP-PUSH 与 PPC

### Part 2: 排行与集中度

#### Slide 04 - TOP10 语言站排行

- **Layout**: 横向条形榜（10 行，从上到下 PV 递减），每行 = 排名 + locale 与中文名 + 数据条 + PV 数值 + 占比 + UV 三列；第 1–2 行用主色与强调色点亮，其余用主色浅阶
- **Title**: TOP10 语言站：港澳台与新加坡撑起近九成流量
- **Core message**: TOP10 语言站贡献 88.6% 的 PV，其中香港繁体与新加坡英文两家就占 59%。
- **Visualization**: `horizontal_bar_chart` (see VII. Visualization Reference List)
- **Content**:
  - 1 zh-hk 香港繁体 / PV 603,658 / 30.1% / UV 49,043
  - 2 en-sg 新加坡英文 / PV 581,867 / 29.0% / UV 37,249
  - 3 zh-tw 台湾繁体 / PV 148,331 / 7.4% / UV 28,092
  - 4 en-my 马来西亚英文 / PV 146,071 / 7.3% / UV 11,297
  - 5 ru-ru 俄语 / PV 68,933 / 3.4% / UV 16,647
  - 6 ko-kr 韩语 / PV 55,648 / 2.8% / UV 14,796
  - 7 en-id 印尼英文 / PV 52,135 / 2.6% / UV 2,955
  - 8 zh-my 马来西亚繁体 / PV 48,370 / 2.4% / UV 3,597
  - 9 zh-sg 新加坡繁体 / PV 42,422 / 2.1% / UV 2,916
  - 10 en-xx 泛用英文 / PV 39,366 / 2.0% / UV 7,822
  - 脚注：全量共 50+ 个语言站；榜内各行占比为分别四舍五入后的值，合计 89.1% 与全站口径 TOP10 = 88.6% 存在 0.5pp 舍入差

#### Slide 05 - 头部集中度

- **Layout**: `breathing` 破格页 — 左三分之一只放一个巨大的 `hero_number`（88.6%）与一行注解，右三分之二放三段环形图与图例；页面其余部分留白，仅底部一条脚注
- **Title**: 头部集中：前 10 个语言站吃掉近九成
- **Core message**: 50+ 个语言站里，前 10 个就贡献了 88.6% 的门票 PV。
- **Visualization**: `donut_chart` (see VII. Visualization Reference List)
- **Content**:
  - **88.6%** / TOP10 合计 PV 占比（页面唯一主角）
  - 环形三段：TOP2 59% / 第 3–10 名 29.6% / 其余 40+ 站 11.4%
  - 注解：TOP2 = zh-hk 香港繁体 + en-sg 新加坡英文；主力客源区为港澳台 + 东南亚（新马）+ 俄韩
  - 脚注：29.6% 由源数据 TOP10 88.6% 与 TOP2 59% 相减得出；各口径分别四舍五入，存在 ±0.5pp 舍入差

### Part 3: 渠道结构

#### Slide 06 - 五站渠道结构矩阵

- **Layout**: 高密度矩阵表 — 6 渠道 × 5 站点，每格显示百分比并在同一格内嵌一条微条（长度即占比）；表头带用 `#EEF2F6`，首列渠道名固定列出，每两行间 1px `#E7EDF3` 发丝线
- **Title**: 五站渠道结构：站内仍是主力，但差异极大
- **Core message**: 站内流量在各站占 31.7%–66.6%，对外投放的四个主要抓手是 Partner、SEO、APP-PUSH 与 PPC，但四者的配比因站而异。
- **Visualization**: `consulting_table` (see VII. Visualization Reference List)
- **Content**:
  - 站内 / zh-hk 66.6% · en-sg 42.7% · en-my 55.0% · ru-ru 31.7% · ko-kr 44.3%
  - APP-PUSH / 5.4% · 23.0% · 9.3% · 14.5% · 6.5%
  - Partner / 13.3% · 10.8% · 16.1% · 10.6% · 15.0%
  - SEO / 4.5% · 12.1% · 5.2% · 28.4% · 9.7%
  - PPC / 5.0% · 7.4% · 8.4% · 12.0% · 11.6%
  - 其他/EDM 等 / 5.2% · 4.0% · 6.0% · 2.8% · 12.9%
  - 脚注：表内为各语言站自身的渠道构成占比，每列横向合计 100%

#### Slide 07 - 渠道指纹

- **Layout**: 左 55% 放六维雷达叠图（三条系列：zh-hk / en-sg / ru-ru），右 45% 放三行「读图」注解，每行对应一条形状
- **Title**: 渠道指纹：同样的六个渠道，三个站三种形状
- **Core message**: 六个渠道在 zh-hk、en-sg、ru-ru 上呈现出完全不同的形状——站内凸起、Push 尖角、SEO 长刺。
- **Visualization**: `radar_chart` (see VII. Visualization Reference List)
- **Content**:
  - **zh-hk 站内凸起** — 站内 66.6% 把整条形状向外推，其余维度普遍收敛在 4.5%–13.3%
  - **en-sg 的 Push 尖角** — APP-PUSH 23.0% 是全站最高，在雷达上形成唯一一个明显外突的角
  - **ru-ru 的 SEO 长刺** — SEO 28.4% 远超其他渠道，同时站内 31.7% 是六站最低，形状整体被「搜索」拉偏
  - 脚注：维度为该站渠道占比（%），三条系列共用同一刻度

### Part 4: 分站解读

#### Slide 08 - zh-hk：站内自转型

- **Layout**: 左栏数据条（六渠道占比，站内条用主色加粗）+ 站点体量卡；右栏三条解读，每条一个 `tabler-outline` 图标
- **Title**: zh-hk 香港繁体：站内自转型，站内占比 66.6% 全站最高
- **Core message**: 香港用户多在平台内自发流转，对外投放依赖最低，Partner 联盟是第二抓手。
- **Content**:
  - 体量：PV 603,658（30.1%，全站第一）· UV 49,043
  - 结构：站内 66.6% · Partner 13.3% · APP-PUSH 5.4% · 其他/EDM 5.2% · PPC 5.0% · SEO 4.5%
  - 解读：站内 66.6% 是所有站里最高的——香港用户多在平台内自发流转（跨业务跳转 / 历史访问），对外投放依赖低
  - 解读：Partner 联盟 13.3% 是第二抓手，也是这一站最值得继续放大的对外渠道

#### Slide 09 - en-sg：Push 驱动型

- **Layout**: 左栏数据条（APP-PUSH 条用强调色加粗）+ 站点体量卡；右栏两条解读
- **Title**: en-sg 新加坡英文：Push 驱动型，APP-PUSH 依赖度 23% 全站最高
- **Core message**: 新加坡站 PV 体量全站第二，却最依赖 Push 召回，很可能与演出开票提醒强绑定。
- **Content**:
  - 体量：PV 581,867（29.0%，全站第二）· UV 37,249
  - 结构：站内 42.7% · APP-PUSH 23.0% · SEO 12.1% · Partner 10.8% · PPC 7.4% · 其他/EDM 4.0%
  - 解读：APP-PUSH 23% 是六站里最高的，且 PV 体量全站第二——新加坡站高度依赖 Push 召回
  - 解读：这一结构很可能与 BIGBANG 新加坡演唱会等演出的开票提醒强绑定，Push 节奏本身就是大盘节奏

#### Slide 10 - ru-ru：SEO 自然流入型

- **Layout**: 左栏数据条（SEO 条用强调色加粗）+ 站点体量卡；右栏两条解读；顶部一条「结构最特殊」标记
- **Title**: ru-ru 俄语：SEO 自然流入型，SEO 占比 28.4% 全站最高
- **Core message**: 俄罗斯用户大量通过搜索引擎自然流入，对投放依赖低。
- **Content**:
  - 体量：PV 68,933（3.4%）· UV 16,647
  - 结构：站内 31.7% · SEO 28.4% · APP-PUSH 14.5% · PPC 12.0% · Partner 10.6% · 其他/EDM 2.8%
  - 解读：SEO 占 28.4%（全站最高）远超其他渠道，说明俄罗斯用户大量通过搜索引擎自然流入，对投放依赖低
  - 解读：站内 31.7% 是六站最低，这一站的流量结构在五个站里最特殊

#### Slide 11 - ko-kr 与 en-my：多渠道均衡型

- **Layout**: 2×2 并置 — 左右两站各占一半，每半含站点体量卡 + 六渠道横条；底部一条通栏结论
- **Title**: ko-kr 与 en-my：多渠道并进，没有单一依赖
- **Core message**: 韩语与马来英文两站的渠道构成相对均衡，站内 44%–55%，其余渠道各占 8%–16%。
- **Content**:
  - ko-kr 韩语：PV 55,648（2.8%）· UV 14,796；站内 44.3% · Partner 15.0% · 其他/EDM 12.9% · PPC 11.6% · SEO 9.7% · APP-PUSH 6.5%
  - en-my 马来西亚英文：PV 146,071（7.3%）· UV 11,297；站内 55.0% · Partner 16.1% · APP-PUSH 9.3% · PPC 8.4% · 其他/EDM 6.0% · SEO 5.2%
  - 结论：两站没有明显短板，站内 44–55%，Partner / PPC / SEO 各占 8–16%，多渠道并进——适合组合投放、小步试错，而不是押注单渠道

### Part 5: 打法

#### Slide 12 - 一站一策

- **Closing impact**: 受众离场时该带走的一句话是「**投放必须一站一策**」——四类站点对应四套投放配方，而不是一张全网通投表。Composition：顶部一条通栏论断带（大字号结论 + 主色下划线），下方四条并列条带（非卡片网格，靠 1px 发丝线分隔），每条 = 站点类型 + 代表站 + 一句打法；底部一行下一步。
- **Layout**: 单一论断带 + 四条并列条带（`breathing` 式的留白纪律，但保持 anchor 结构页的收束感）
- **Title**: 一站一策：四类站点，四套投放配方
- **Content**:
  - **站内自转型** / zh-hk 香港繁体 / 优先用 Partner 联盟放大站内自然流转，控制买量规模
  - **Push 驱动型** / en-sg 新加坡英文 / 把 Push 节奏与演出开票、大促绑定，守住召回基本盘
  - **SEO 自然流入型** / ru-ru 俄语 / 用 SEO 内容与落地页承接自然流量，投放只作 PPC 补位
  - **多渠道均衡型** / ko-kr 韩语 · en-my 马来西亚英文 / 组合投放、小步试错，不押注单一渠道
  - 下一步：可把这一版按语言站的分析生成 HTML 动态页面；也可进一步看各语言站的下单转化（订单量、GMV），评估哪个站的投放 ROI 最高

---

## X. Speaker Notes Requirements

One speaker note file per page, saved to `notes/`:

- **Filename**: match SVG name (e.g., `01_cover.md`), 12 files total
- **Content structure**: 每页 = 一句话开场（这页要落什么）→ 2–3 个数据支撑点 → 一句过渡到下一页；数据点直接念源文档里的数字，不四舍五入、不改口径
- **Total duration**: 约 15 分钟（12 页 × 平均 75 秒，P02/P06 口径与矩阵页各留 90 秒）
- **Notes style**: formal / 汇报体 — 陈述句为主，先结论后证据；避免「大家好/谢谢」这类寒暄
- **Presentation purpose**: report — 让听众与阅读者得到同一套结论：头部集中 + 一站一策

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

1. viewBox: `0 0 1280 720`
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: write typography & symbols as raw Unicode (em dash `—`, en dash `–`, `©`, `®`, `→`, NBSP, etc.); HTML named entities (`&nbsp;`, `&mdash;`, `&copy;`, `&reg;` …) are FORBIDDEN. XML reserved chars in text MUST be escaped as `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` (e.g. `R&amp;D`, `error &lt; 5%`). See shared-standards.md §1.0
8. `marker-start` / `marker-end` conditionally allowed: `<marker>` must be in `<defs>`, `orient="auto"`, shape must be triangle / diamond / circle (see shared-standards.md §1.1)
9. `clipPath` conditionally allowed **only on `<image>` elements`**; this deck has no images, so no `clipPath` is expected

### PPT Compatibility Rules:

- `<g opacity="...">` FORBIDDEN (group opacity); set on each child element individually
- Image transparency uses overlay mask layer (`<rect fill="bg-color" opacity="0.x"/>`) — not applicable, no images in this deck
- Inline styles only; external CSS and `@font-face` FORBIDDEN
- 图标统一用 `<use data-icon="tabler-outline/<name>" .../>` 占位，`stroke-width="2"`，颜色取自 `spec_lock.md colors`
