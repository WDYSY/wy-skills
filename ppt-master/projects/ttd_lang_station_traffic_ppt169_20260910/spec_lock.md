# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## mode
- mode: pyramid

## visual_style
- visual_style: data-journalism

## colors
- bg: #FFFFFF
- surface: #F7F9FB
- secondary_bg: #EEF2F6
- grid: #E7EDF3
- primary: #0F4C81
- accent: #E8833A
- secondary_accent: #4A90C4
- text: #1B2430
- text_secondary: #5A6675
- text_tertiary: #8A94A2
- border: #D5DDE6
- success: #2E7D32
- warning: #C62828

## typography
- font_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- title_family: Georgia, SimSun, "Times New Roman", serif
- emphasis_family: Georgia, SimSun, "Times New Roman", serif
- code_family: Consolas, "Courier New", monospace
- body: 24
- cover_title: 96
- hero_number: 56
- title: 42
- subtitle: 32
- lead: 30
- subheading: 28
- annotation: 18
- chart_annotation: 16
- footnote: 16

## icons
- library: tabler-outline
- stroke_width: 2
- inventory: world, database, filter, calendar, checklist, chart-bar, chart-line, trending-up, users, users-group, report-analytics, map-pin, target, adjustments, route, home, share, bell, device-mobile, search, speakerphone, compass, alert-triangle

## page_rhythm
- P01: anchor
- P02: dense
- P03: dense
- P04: dense
- P05: breathing
- P06: dense
- P07: dense
- P08: dense
- P09: dense
- P10: dense
- P11: dense
- P12: anchor

## page_charts
- P03: kpi_cards
- P04: horizontal_bar_chart
- P05: donut_chart
- P06: consulting_table
- P07: radar_chart
- P12: labeled_card

## forbidden
- Mixing icon libraries
- rgba()
- `<style>`, `class`, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<script>`, `<iframe>`, `<symbol>`+`<use>`
- `<g opacity>` (set opacity on each child element individually)
- HTML named entities in text (`&nbsp;`, `&mdash;`, `&copy;`, `&ndash;`, `&reg;`, `&hellip;`, `&bull;` …) — write as raw Unicode (`—`, `©`, `→`, NBSP, etc.); XML reserved chars `& < > " '` must be escaped as `&amp; &lt; &gt; &quot; &apos;`
