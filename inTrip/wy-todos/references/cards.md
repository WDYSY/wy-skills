# 卡片骨架（卡片 2.0，已实测可发）

一张卡讲完：概览 → 逾期 → 今天 → 本周 → bug → 缺子任务的需求 → 可标完成的需求 → 未排期 → 按钮 → 脚注。分组之间用 `hr` 隔开。**段标题加粗不加色**（`**🗓 本周（…）**`），灰色（`<font color='grey'>`）只留给脚注；值不加粗。

```json
{
  "schema": "2.0",
  "config": { "wide_screen_mode": true },
  "header": {
    "title": { "tag": "plain_text", "content": "📋 iDev 待办 · MM/DD" },
    "template": "red"
  },
  "body": {
    "elements": [
      { "tag": "markdown", "content": "**📊 概览**\n逾期 **8** · 今天 **0** · 本周 **2** · bug **5** · 缺子任务 **5** · 可完成 **1** · 未排期 28" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**⏰ 已逾期（8）**\n[**XLSP-4423**](https://idev2.ctripcorp.com/issueDetail/XLSP-4423) T站视频分站点设置 · P0 · 计划 11/05~11/06\n[**XLSP-4422**](https://idev2.ctripcorp.com/issueDetail/XLSP-4422) …" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**📅 今天（11/09 周一）**\n无到期任务" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**🗓 本周（11/10–11/13，已排除周末）**\n**11-10 周二** XLSP-4736 …（P1 · 1 人天）" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**🐞 待处理 bug（3）**\n[**XLSP-4751**](https://idev2.ctripcorp.com/issueDetail/XLSP-4751) 6206产品行程段有用车组… · P3\n[**XLSP-4691**](https://idev2.ctripcorp.com/issueDetail/XLSP-4691) 8546443产品勾选领队兼导游… · P1" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**🧩 缺子任务的需求（5，待你确认要不要补建）**\n[**XLSP-4643**](https://idev2.ctripcorp.com/issueDetail/XLSP-4643) 图片审核类型不一致增加错误类型 · 待需求规划 · P1\n[**XLSP-4965**](https://idev2.ctripcorp.com/issueDetail/XLSP-4965) 定价系统-IPP调价功能-前端 · 待需求规划 · P1 · VCP-7578\n[**XLSP-4208**](https://idev2.ctripcorp.com/issueDetail/XLSP-4208) T站视频分站点设置-服务 · 待敏捷排期 · P0 · VCP-7357 · 仅 Sub-bug" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**✅ 可标完成的需求（1，子任务已全部完成）**\n[**XLSP-4606**](https://idev2.ctripcorp.com/issueDetail/XLSP-4606) 服务语言一致性二期前端收尾 · 待验收 · P2 · 子任务 3/3 done · 另有 1 个未完成 Sub-bug" },
      { "tag": "hr" },
      { "tag": "markdown", "content": "**📦 未排期 28 条（不含上述 bug）**\n挂起 15 · 待需求规划 6 · 待测试 2 · 开发中 2 · 其他 3" },
      { "tag": "hr" },
      {
        "tag": "column_set", "flex_mode": "none", "horizontal_spacing": "default",
        "columns": [
          {
            "tag": "column", "width": "weighted", "weight": 1,
            "elements": [{
              "tag": "button",
              "text": { "tag": "plain_text", "content": "打开 iDev" },
              "type": "default", "width": "fill",
              "behaviors": [{ "type": "open_url", "default_url": "https://idev2.ctripcorp.com/resource/individual", "pc_url": "https://idev2.ctripcorp.com/resource/individual" }]
            }]
          },
          {
            "tag": "column", "width": "weighted", "weight": 1,
            "elements": [{
              "tag": "button",
              "text": { "tag": "plain_text", "content": "待办需求" },
              "type": "default", "width": "fill",
              "behaviors": [{ "type": "open_url", "default_url": "https://idev2.ctripcorp.com/filter/4504", "pc_url": "https://idev2.ctripcorp.com/filter/4504" }]
            }]
          },
          {
            "tag": "column", "width": "weighted", "weight": 1,
            "elements": [{
              "tag": "button",
              "text": { "tag": "plain_text", "content": "处理中 bug" },
              "type": "default", "width": "fill",
              "behaviors": [{ "type": "open_url", "default_url": "https://idev2.ctripcorp.com/filter/4509", "pc_url": "https://idev2.ctripcorp.com/filter/4509" }]
            }]
          }
        ]
      },
      {
        "tag": "column_set", "flex_mode": "none", "horizontal_spacing": "default",
        "columns": [
          {
            "tag": "column", "width": "weighted", "weight": 1,
            "elements": [{
              "tag": "button",
              "text": { "tag": "plain_text", "content": "备忘清单" },
              "type": "default", "width": "fill",
              "behaviors": [{ "type": "open_url", "default_url": "https://wdysy.github.io/TripToolPages/todo.html", "pc_url": "https://wdysy.github.io/TripToolPages/todo.html" }]
            }]
          },
          {
            "tag": "column", "width": "weighted", "weight": 1,
            "elements": [{
              "tag": "button",
              "text": { "tag": "plain_text", "content": "Anki 库" },
              "type": "default", "width": "fill",
              "behaviors": [{ "type": "open_url", "default_url": "https://wdysy.github.io/TripToolPages/anki.html#library", "pc_url": "https://wdysy.github.io/TripToolPages/anki.html#library" }]
            }]
          }
        ]
      },
      { "tag": "markdown", "content": "<font color='grey'>由王妍触发 · 程小帮</font>" }
    ]
  }
}
```

## 硬规则

1. 标题 12 字内：`📋 iDev 待办 · 11/09`；有逾期用 `red`，全清时用 `green`，只本周有活时 `blue`。
2. **每条任务都要带超链接**：写成 `[**KEY**](https://idev2.ctripcorp.com/issueDetail/KEY)`，用户点 key 直接进详情页（王妍 2026-11-09 要求）。后面的标题/优先级/日期保持纯文本。
3. 每条一行：`[**KEY**](链接) 标题 · 优先级 · 计划 起~止`，标题超过 24 字就截断加「…」。
4. 逾期按计划结束日**从近到远**排；本周按日期正序并标星期。
5. **bug 段只放「待处理」**，已修复待验证不列；标题写成「🐞 待处理 bug（N）」，不要出现状态分组。
6. 某组为空时写「无到期任务」「本周无排期」，不要整段删掉——王妍要看到"这组是空的"这个信息。
7. 卡片 2.0 里按钮跳转必须写 `behaviors[].open_url`，不要用 1.0 的 `url` 字段。
8. 底部固定**两行按钮**：第一行三个「打开 iDev」→ `/resource/individual`、「待办需求」→ `/filter/4504`、「处理中 bug」→ `/filter/4509`；第二行两个「备忘清单」→ `https://wdysy.github.io/TripToolPages/todo.html`、「Anki 库」→ `https://wdysy.github.io/TripToolPages/anki.html#library`。第二行是当日无活时的排查备忘入口，不要因为今天没任务就省掉。
9. 脚注只写触发人，不加时间戳、不加免责话术。
10. 超过 15 条时只展开逾期与本周，其余给计数。
11. **缺子任务那段**：每行 `[**KEY**](链接) 标题 · 状态 · P级`，有 VCP 父需求时末尾加 `· VCP-xxxx`；只有 Sub-bug 没 Sub-task 的再加 `· 仅 Sub-bug`；标题超 24 字截断加「…」。超过 10 条只列前 10 条 + 「还有 N 条，点『待办需求』看全部」，这一段不参与上面 15 条展开规则。
12. 概览那行**一定要带「缺子任务 N」和「可完成 N」**，王妍扫一眼就知道要不要往那两段看。
13. **段标题一律加粗、不加颜色**：`**🗓 本周（…）**`。grey 只用在脚注；`<font color=…>` 留给真正要报警的单个数值（如 P0、逾期天数），整段标题上色会跟 emoji 抢色、卡片显花（王妍 2026-11-17 口径：稍微强调就行，总体要和谐）。
14. **可标完成那段**：标题写「✅ 可标完成的需求（N，子任务已全部完成）」；每行 `[**KEY**](链接) 标题 · 状态 · P级 · 子任务 x/y done`，有未完成的 Sub-bug 时末尾加 `· 另有 N 个未完成 Sub-bug`（异常项，**不要**因为她要「标完成」就把这行藏掉）；空的时候写「子任务都还没全完成」。
