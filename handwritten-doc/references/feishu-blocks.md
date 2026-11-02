# 飞书块写法速查

基于 2026-11-01 在本租户实机验证（创建 → `docs +fetch --detail full` 回读）。标注「已验证」的是确实落盘且回读可见的写法。

## 颜色与强调

```xml
<p>这一段测彩色强调：<span text-color="purple">知识库读取与召回</span>、<span text-color="blue">模型切换</span>、<span background-color="light-yellow">待确认</span>，后面继续普通文本。</p>
```

已验证：落盘后回读是 `<span text-color="rgb(100,37,208)">`，即命名色被换算成 rgb，颜色生效。

- 文字色 `<span text-color>`：red / orange / yellow / green / blue / purple / gray。
- 文字背景 `<span background-color>`：基础色 + light-{色} + medium-gray。
- 语义保持一致，别同一个词这次蓝下次红。一篇里彩色词十来个封顶。
- 只染名词和数字，不染整句；染色和加粗不要叠在同一个词上超过两次。

## 调用注意

`docs +fetch` 默认 `--detail simple` **会把行内样式剥掉**，回读看起来像"颜色没生效"。验证必须加 `--detail full`：

```
docs +fetch --doc <url> --doc-format xml --detail full --scope keyword --keyword "关键字" --json
```

## 先看这个：什么时候别用

这些块的用途是让读者少问一句，不是让页面显得丰富。下面这些情况不要上块：

| 块 | 别用的时候 |
|---|---|
| `<span text-color>` | 一句话里有两个以上词要染色，或者只是想让版面好看 |
| `<callout>` | 内容本身就是普通陈述；或者这一屏已经有框了 |
| `<pre>` | 内容是一两句人话，一句话就说得清 |
| `<cite>` chip | 只是"相关文档"，你自己没读过 |
| `<source>` 附件 | 没人会打开的附件，只是备份 |
| `<grid>` | 两边内容对不上，只是为了省行数 |
| `<checkbox>` | 没有下一步动作，纯装饰 |
| `<table>` | 三行以内，或者没有行列关系 |
| `<img caption>` | 图自己能说明白 |

拿不准就问一句：删掉这个块，读者会不会变差？不会就删。整篇一个高亮框都没有的文档是正常的。

## 高亮框（判断、风险、临时结论）
```xml
<callout emoji="💡" background-color="light-yellow" border-color="yellow"><p>高亮框：这里放一条结论或风险。</p></callout>
```

已验证：背景 rgb(254,255,240)、边框 rgb(255,242,88) 都保留。

- 子块只支持文本、标题、列表、待办、引用。别往里塞表格或代码块。
- 背景色：gray / light-{色} / medium-{色}。字色和边框只能用基础色。
- emoji 默认 bulb。一篇文章里 callout 不超过两三个，而且只用 💡 和 ⚠️ 这类有意义的前缀，堆 emoji 立刻变 AI。

## 代码块（原始报文、命令、脚本）

```xml
<pre lang="Plain Text" caption="feishu_doc.py 的优先级逻辑"><code>feishu_doc.py search 内部实现了优先级。
满足以下条件时先调用 agentark_client.py：
-- 配置了 AGENTARK_BASE_URL</code></pre>
```

已验证：caption 和 lang 都保留，`\n` 在回读里变成 `<br/>`。

- 内容必须放在内层 `<code>`，直接写在 `<pre>` 下不生效。
- caption 写"这是什么"，不写"代码"。
- lang 可以随手写 `Plain Text`、`SQL`、`Python`；标错了也没人在意，人本来就常标错。

## 文档引用 chip

```xml
<p>参考：<cite type="doc" doc-id="LDf3d3tuZoIjGBxStCjclZVon6e"></cite></p>
<cite type="doc" doc-id="TOKEN" table-id="tblXXX" view-id="vewXXX"></cite>
<cite type="doc" doc-id="TOKEN" file-type="sheets" sheet-id="SID"></cite>
```

已验证：只给 token 就行，服务端自动补 `file-type` 和 `title`，回读是 `<cite doc-id="…" file-type="docx" title="旅游千手 - 框架层" type="doc">`。

- 引用 wiki 页面时 doc-id 传 wiki 节点的 obj_token（`wiki +node-get` 返回的那个）。
- 这是证据链最省事的载体：一句话后面挂一个 chip，读者点一下就能核对。

## 引用块

```xml
<blockquote><p>这是一段引用，用来放判断和原话。</p></blockquote>
```

放三类东西：别人的原话、自己下的短结论、旁白式自省。不要放"核心洞察："这种标签。

## 附件与图片

```xml
<img href="https://example.com/photo.png"/>
<img src="IMG_TOKEN" width="800" height="400" caption="desc before" name="image.png"/>
```

- `<img href>` 是网络图片，服务端会自己去下载；`<img src>` 需要已上传的 image token。
- `caption` 显示在图下面一行小字，做 before/after 对比时必填。

附件（`<source>`）的坑：

- **`<source name="x"/>` 不带真实 token 直接写进 `<pre>` 之外的位置，会让整篇写入失败**，返回 `4000022 ... fileSize` 警告，且正文一个字都不落盘（实测：探针文档只剩标题）。不要在正式内容里凭空写 source。
- 真要挂附件：`docs +media-insert --doc <url> --type file --file <本地路径> --file-view card --selection-with-ellipsis "<定位文本>"`。实测落成 `<figure view-type="Card"><source name="leaderboard.csv" mime="text/csv" size="2791" token="…"/></figure>`，位置就在被定位的那段之后。
- media-insert 插到**顶层块**，`--selection-with-ellipsis` 命中的文本在表格单元格或 callout 里时，附件会落到容器外面。所以表格里的"文件"列只能写文件名 + 说明，或者事后手工拖进去。

## 搜内部文档来挂引用

写文档前先搜一遍，比只挂外网链接可信得多：

```bash
lark-cli docs +search --query "模型评测 榜单" --as user \
  --jq '.data.results[] | [(.result_meta.token // ""), (.result_meta.doc_types // ""), (.title_highlighted // "")] | @tsv' --json
```

- 换三四个关键词各搜一次，一次能出十来条。
- `--jq` 必须加，否则返回里每个结果都带一大坨 `result_meta`，token 会爆。
- `result_meta.token` 对 WIKI 条目是 wiki 节点 token，`icon_info` 里那个 `token` 才是 docx obj token。挂 chip 用 obj token；不确定就直接用 wiki 节点 token 试，失败再换。
- 命中之后先用 `--scope outline` 看一眼再决定要不要引，别只看标题。

## 分栏（before/after、并列证据）

```xml
<grid>
  <column width-ratio="0.5"><p>左栏</p></column>
  <column width-ratio="0.5"><p>右栏</p></column>
</grid>
```

两份截图对比、两个方案并列时用。三列以上会挤，宁可拆两行。

## 表格（口径表、清单、字段说明）

```xml
<table>
  <colgroup><col width="120"/><col width="400"/></colgroup>
  <thead><tr><th background-color="light-gray">Scope</th><th background-color="light-gray">Details</th></tr></thead>
  <tbody>
    <tr><td>基础信息</td><td>
      <ol><li seq="auto">Why：为什么需要</li><li seq="auto">How：怎么做<ol><li seq="auto">子项：<cite type="doc" doc-id="TOKEN"></cite></li></ol></li></ol>
    </td></tr>
    <tr><td>更新机制</td><td>人负责判断<checkbox done="false">待补</checkbox></td></tr>
  </tbody>
</table>
```

- 单元格里可以放：有序/无序列表（可多层嵌套）、checkbox、cite chip、img（带 caption）、代码块、引用块。这一格是人工感最强的地方——AI 只会写一段话。
- 单元格里同样能放 `<a href>` 链接、`<code>` 行内代码、`<b>`、`<span text-color>`。**这是表格去 AI 味的关键**：让最后一列变成能点的链接，让中间列变成能数的数字。

### 单元格里放什么，按这个顺序挑

1. 链接：原始数据地址、平台页面、仓库。链接文字用短路径，不要贴整条 URL。
2. 代码：文件名、字段名、命令、接口路径。
3. 数字：行数、分数、占比、条数、更新时间。带单位和口径。
4. chip：内部文档引用。
5. 勾选框：这一行的状态。
6. 最后才是文字说明，而且写成半句，不要写成完整句。

一条可执行的判定：**每个单元格都要么能被点开，要么能被数出来**。纯文字解释的列，直接删掉或换掉。

已验证的写法（五个列，最后一列是链接）：

```xml
<table>
<colgroup><col width="120"/><col width="170"/><col width="300"/><col width="180"/></colgroup>
<thead><tr><th background-color="light-gray">列表</th><th background-color="light-gray">答什么问题</th><th background-color="light-gray">今天拉到</th><th background-color="light-gray">取数</th></tr></thead>
<tbody>
<tr>
  <td><code>best-100</code></td>
  <td>综合值不值得装</td>
  <td>100 行；skills.sh 88 / clawhub 12；#1 <span text-color="green">agent-browser</span>，wis <b>77.5</b></td>
  <td><a href="https://raw.githubusercontent.com/…/rankings/best-100.csv">rankings/best-100.csv</a></td>
</tr>
</tbody>
</table>
```

- 表头用 `<th>` 包在 `<thead>`，加 `background-color="light-gray"`。
- `colgroup` 的 width 会被保留（回读是 `<col width="180"/>`），但 `--detail simple` 下看不到，别以为没生效。长文本列给宽一点，短状态列给窄一点。
- 合并单元格只在起始格写 `colspan` / `rowspan`。
- 表上方一行写来源和取数时间，表下方给一段 `curl` 或 `python`，让人能自己跑一遍。这一对加起来，比表本身更有说服力。

## 待办

```xml
<checkbox done="true">已完成的事</checkbox>
<checkbox done="false">没做完的事</checkbox>
```

用 `done="false"` 显式留活口。文档里留两三个未打的勾，比全部写完更可信。

## 转义与嵌套

- 标签不转义，只有文本内容里的 `<` `>` `&` 转义成 `&lt;` `&gt;` `&amp;`；换行用 `<br/>`。
- 行内样式嵌套顺序固定：`<a> → <b> → <em> → <del> → <u> → <code> → <span>`，关闭顺序严格反转。
- `<title>` 全文只出现一次；用 `--title` 时正文里就不要再写 `<title>`，否则会有重复标题的 warning。

## 回读校验清单

写完跑一遍，逐项看：

1. `<span text-color>` 有没有变成 rgb（说明染色成功）。
2. `<callout>` 的 background-color / border-color 在不在。
3. `<pre>` 的 caption 和 lang 在不在。
4. `<cite>` 有没有补上 title（说明引用真的解析到了文档）。
5. 表格嵌套的列表和 checkbox 有没有被拍平。
