# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## mode
- mode: pyramid

## visual_style
- visual_style: editorial

## colors
- bg: #FFFFFF
- secondary_bg: #F5F7FA
- primary: #1B3A5C
- accent: #E46C2C
- secondary_accent: #4A90A4
- text: #1D2430
- text_secondary: #5C6675
- text_tertiary: #8A94A6
- text_light: #C8D4E0
- text_light_secondary: #A8B8C8
- text_muted: #8FA3B8
- text_dark_muted: #6E8296
- border: #DCE2EA
- success: #2E9E6B
- warning: #D64545

## typography
- font_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- title_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- emphasis_family: Georgia, "Microsoft YaHei", "PingFang SC", serif
- body: 24
- title: 42
- subtitle: 32
- lead: 28
- subheading: 26
- annotation: 18
- footnote: 14
- cover_title: 72
- hero_number: 48

## icons
- library: tabler-outline
- stroke_width: 2
- inventory: globe, chart-bar, users, target, bell, search, link, currency-dollar, trending-up, lightbulb

## page_rhythm
- P01: anchor
- P02: breathing
- P03: dense
- P04: dense
- P05: dense
- P06: dense
- P07: breathing
- P08: breathing
- P09: breathing
- P10: breathing
- P11: dense
- P12: anchor

## page_charts
- P04: horizontal_bar_chart
- P05: donut_chart
- P06: grouped_bar_chart

## forbidden
- Mixing icon libraries
- rgba()
- `<style>`, `class`, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<script>`, `<iframe>`, `<symbol>`+`<use>`
- `<g opacity>` (set opacity on each child element individually)
- HTML named entities in text (`&nbsp;`, `&mdash;`, `&copy;`, `&ndash;`, `&reg;`, `&hellip;`, `&bull;` …) — write as raw Unicode (`—`, `©`, `→`, NBSP, etc.); XML reserved chars `& < > " '` must be escaped as `&amp; &lt; &gt; &quot; &apos;`
