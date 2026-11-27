# 卡片模板（wy-msg）

版式定稿（王妍 2026-11-06）：**绿色标题栏 + 字段表（左灰标签/右值）+ 代码块留地址 + 整宽按钮**。
全部用**卡片 2.0**（`"schema": "2.0"`）：代码块和整宽按钮都只有 2.0 支持。

`--content` 内联传 JSON，外层单引号；不要用 `@文件`。

## 1. 默认模板（状态通知 + 链接）

```json
{
  "schema": "2.0",
  "config": { "wide_screen_mode": true },
  "header": {
    "template": "green",
    "title": { "tag": "plain_text", "content": "✈️ 问题已修复 · 可查看" }
  },
  "body": {
    "elements": [
      { "tag": "column_set", "flex_mode": "none", "columns": [
        { "tag": "column", "width": "120px", "elements": [
          { "tag": "markdown", "content": "<font color='grey'>📄 页面</font>" } ] },
        { "tag": "column", "width": "weighted", "weight": 1, "elements": [
          { "tag": "markdown", "content": "VBK 供应商端 · 价格库存" } ] }
      ] },
      { "tag": "column_set", "flex_mode": "none", "columns": [
        { "tag": "column", "width": "120px", "elements": [
          { "tag": "markdown", "content": "<font color='grey'>🆔 产品 ID</font>" } ] },
        { "tag": "column", "width": "weighted", "weight": 1, "elements": [
          { "tag": "markdown", "content": "8775049" } ] }
      ] },
      { "tag": "column_set", "flex_mode": "none", "columns": [
        { "tag": "column", "width": "120px", "elements": [
          { "tag": "markdown", "content": "<font color='grey'>🌐 环境</font>" } ] },
        { "tag": "column", "width": "weighted", "weight": 1, "elements": [
          { "tag": "markdown", "content": "fat16" } ] }
      ] },
      { "tag": "markdown", "content": "<font color='grey'>完整地址</font>\n```\n<https 链接>\n```" },
      { "tag": "hr" },
      { "tag": "button", "text": { "tag": "plain_text", "content": "查看详情" }, "type": "default", "width": "fill",
        "behaviors": [ { "type": "open_url", "default_url": "<https 链接>", "pc_url": "<https 链接>" } ] }
    ]
  }
}
```

- 字段行按需增删，多个同类字段就复制一组 `column_set`。
- 左侧标签宽度固定 `120px`；标签文字多的用 `140px`，别让右列被挤成折行。
- 值很长（镜像名、commit hash）会自然换行，不用处理。

## 2. 精简版（没有链接可跳）

去掉代码块和 button，只留字段行；或保留 button 但去掉 `hr`：

```json
{
  "schema": "2.0",
  "config": { "wide_screen_mode": true },
  "header": { "template": "blue", "title": { "tag": "plain_text", "content": "📌 排期变更" } },
  "body": { "elements": [
    { "tag": "column_set", "flex_mode": "none", "columns": [
      { "tag": "column", "width": "120px", "elements": [ { "tag": "markdown", "content": "<font color='grey'>🕒 时间</font>" } ] },
      { "tag": "column", "width": "weighted", "weight": 1, "elements": [ { "tag": "markdown", "content": "明天 16:00" } ] }
    ] },
    { "tag": "column_set", "flex_mode": "none", "columns": [
      { "tag": "column", "width": "120px", "elements": [ { "tag": "markdown", "content": "<font color='grey'>📍 地点</font>" } ] },
      { "tag": "column", "width": "weighted", "weight": 1, "elements": [ { "tag": "markdown", "content": "3F 会议室 A" } ] }
    ] }
  ] }
}
```

## 3. 群里 @ 某人

正文里用 `<at id=ou_xxx></at>`（`user_id=` 是 text 消息的写法，卡片里不认）：

```json
{ "tag": "markdown", "content": "<at id=ou_52f466b657062763d1ca60a4670083fa></at> 评审挪到 16:00，会议室不变。" }
```

## 4. 两个操作按钮（并排，各占一半）

不要竖着堆两个整宽按钮，并排更好看：

```json
{ "tag": "column_set", "flex_mode": "none", "columns": [
  { "tag": "column", "width": "weighted", "weight": 1, "elements": [
    { "tag": "button", "text": { "tag": "plain_text", "content": "查看详情" }, "type": "default", "width": "fill",
      "behaviors": [ { "type": "open_url", "default_url": "<url1>", "pc_url": "<url1>" } ] } ] },
  { "tag": "column", "width": "weighted", "weight": 1, "elements": [
    { "tag": "button", "text": { "tag": "plain_text", "content": "GitLab 分支" }, "type": "default", "width": "fill",
      "behaviors": [ { "type": "open_url", "default_url": "<url2>", "pc_url": "<url2>" } ] } ] }
] }
```

## 5. 一句话（不用卡片）

```
--msg-type text --content '{"text":"<原话>"}'
```

群里 @ 人时：`{"text":"<at user_id=\"ou_xxx\">名字</at> <原话>"}`。

## 代码块里放多组链接的排版（王妍 2026-11-12 定）

编号/标题独占一行，链接另起一行，说明再逐行。**不要把 `C1` 和 URL 塞在同一行**——手机端 URL 会自动折行，编号和链接黏在一起，看不出哪条说明属于哪个链接。

```
C1
https://xxx/case-1
覆盖：功能1 xxx
覆盖：功能2 xxx
C2
https://xxx/case-2
覆盖：功能3 xxx
```

## 字段标签 emoji 对照

| 场景 | 标签 |
|---|---|
| 页面/模块 | 📄 |
| 产品/应用 | 🆔 / 🧩 |
| 环境 | 🌐 |
| 分支 | 🌿 |
| 镜像 | 📦 |
| 提交 | 🔖 |
| 时间 | 🕒 |
| 地点 | 📍 |
| 负责人 | 👤 |
| 链接 | 🔗 |
| 状态 | ✅ / ⚠️ / ❌ |

标签够用就行，别每行换一个花哨 emoji。

## 坑（都实测过）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 1.0 `lark_md` 里写 ``` 代码块 | 卡片上原样显示三行反引号，链接变蓝色自动链接 | 代码块只有 2.0 的 `markdown` 元素支持 |
| 2.0 button 写顶层 `url` | 不跳转/报错 | 2.0 只认 `behaviors: [{type:"open_url", default_url, pc_url}]` |
| 1.0 button 写 `behaviors` | 不跳转/报错 | 1.0 用顶层 `"url"`；整宽也不支持 `width` |
| 想要整宽按钮 | 1.0 无 `width` 字段 | 2.0 用 `"width": "fill"` |
| 左右两列没对齐 | 误用 `"width": "auto"` | 左列写死 `120px`，右列 `"width": "weighted", "weight": 1` |
| 卡片 markdown 代码块 | 没有复制图标，长链接横向截断 | 客户端限制；别在正文承诺「点右上角复制」 |
| `--content @card.json` | 报 `--content is not valid JSON: @card.json` | 内联 JSON 字符串 |
| JSON 里嵌套引号 | 命令被 shell 截断 | 外层单引号包整个 JSON，内部全用双引号，正文里的 `"` 转义成 `\"` |
| 2.0 在旧版网页客户端 | 显示「当前版本不支持查看」 | 桌面端/手机端验收 |
| 正文带姓名 | 「**王妍**，问题已修复」——已明确不要 | 开头直接说事，收件人靠单聊/群 @ 体现 |
| 以 bot 身份发 | 王妍撤不回（非群主/管理员） | 默认 `--as user` |
| 群名差一个字 | `im +chat-search` 返回空 | 去掉「群」等后缀再搜 |
