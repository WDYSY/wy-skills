# iHub 答题框写入：完整踩坑记录（2026-11-23 实战）

一次 2 题（50 分审 MR + 100 分 Next.js 安全分析）的考试，从点开链接到 150 分通过。以下按**当时试过的顺序**记录，每条写清「现象 → 根因 → 结论」，下次照着跳过。

## 1. 答题框到底是什么

- DOM：`div[role=textarea][contenteditable=true][data-slate-editor]`，id 形如 `w-e-textarea-1` / `w-e-textarea-2`，**同页顺序即题目顺序**。
- 内层是 `[data-slate-node=element]` 段落 + `[data-slate-node=text]` + `[data-slate-leaf=true]`，即 Slate 的数据结构。
- 但渲染器不是 slate-react，是 **wangEditor v5 + snabbdom**：所以这些 DOM 节点上**没有 `__reactProps$` / `__reactFiber$`**，React 只在祖先的业务组件里。
- 编辑器实例也没挂到 window、没有全局注册表，`document.execCommand` 之外的「正规 API」从页面里拿不到。

## 2. 失败路径逐条（别重走）

### 2.1 `fill --ref` 只改 DOM

- 现象：`fill --ref e44 --value '...'` 返回成功，`innerText` 里有全文，但页面右下角计数器仍显示旧值（如 `7/3000`），顶部「完成 0/2」不动。
- 根因：`fill` 设的是 DOM 文本 + 一个 input 事件；Slate 的模型（`editor.children`）没变，应用读的是模型派生出来的值。
- 结论：**看到「计数器不动」就当没写进去**，别继续在这个方向上换写法。

### 2.2 `execCommand('insertText')` 能进模型，但进不了应用状态

- 做法：`focus()` → `range.selectNodeContents(editor)` → `execCommand('selectAll')` → `execCommand('insertText', false, text)`。
- 现象：**页面看起来完全正常**——段落被切成了 13 段、计数器有时也会跟着变（这次第 2 题从 stale 变成 `684/3000`）。但：
  - 顶部「完成 N」经常不涨；
  - 一 reload 就全丢（第 2 题只剩之前用真实按键敲进去的 `a`）。
- 根因：execCommand 产生的是可信 beforeinput，Slate 会把它算进 `editor.children` 并重渲染，但它**不经过业务组件的 `onChange` 链路**（至少这条链上没把值回写到 React state / 提交载荷）。
- 结论：execCommand 只适合「让页面内容看起来对」，**不能作为最终答案**。这也是最坑的一条——肉眼验收会骗人。

### 2.3 合成 paste 事件

- 做法：构造 `new DataTransfer()`，`setData('text/plain'|'text/html')`，`editor.dispatchEvent(new ClipboardEvent('paste', {clipboardData, bubbles:true, cancelable:true}))`。
- 现象：`dispatchEvent` 返回 `false`（说明 handler 里 preventDefault 了，事件确实被接住），**但内容一个字符都没进去**。
- 根因：wangEditor 的 paste handler 校验/解析走的是自己的序列化路径，非可信事件里拿不到它要的东西。
- 结论：合成粘贴不通。

### 2.4 真实 `Cmd+V`（系统剪贴板 + 按键）

- 做法：`printf '...' | pbcopy`，点进答题框，`press --key Meta+V`。
- 现象：无任何反应，框里内容不变。
- 根因：内置浏览器的 `press` 只发 `Input.dispatchKeyEvent` 的按键序列，**不会执行浏览器的粘贴命令**（那需要 CDP 的 `commands:["paste"]` 或扩展环境）。
- 结论：内置浏览器下**没有可用的「真实粘贴」通道**。这条就是「不能复制粘贴」的本质。

### 2.5 `type` 打中文

- 现象：`type --text "测试abc"` 报「Typed 5 characters via trusted text input」，框里**一个都没有**；但 `press --key a` 能进去。
- 根因：`type` 走 insertText 路径，Slate/wangEditor 不认；单键 press 走的是浏览器默认输入，能进，但中文没有对应按键。
- 结论：单键能进 = 焦点没问题；中文进不去 = 通道不对。

### 2.6 `cdp` 子命令

- 现象：`cdp Input.insertText --params '{"text":"…"}'` 直接报 **not supported by the built-in browser**。
- 结论：内置浏览器没这能力，只有浏览器扩展环境才有；不要在这上面绕。

### 2.7 reload「验证保存」

- 现象：写完 reload 一次，答案全丢（只剩很早之前用真实按键敲的那个 `a`）。
- 根因：**答案不落服务端，只在内存里**；页面也没有 localStorage/sessionStorage 草稿（查过，只有 `userInfo`、`page_time` 等）。
- 结论：reload 只能用来「拿干净编辑器」，绝不能当验收手段。写完就用计数器/完成数验收，然后尽快提交。

### 2.8 把 DOM 写坏之后

- 现象：一旦用 `innerHTML = '<p data-slate-node=element>…'` 之类硬塞结构，Slate 就「不认」这块 DOM：点进去没有光标、单键 press 完全无反应（`keydown` 能收到，但编辑器忽略）、execCommand 也只改表面。
- 结论：**写坏就别修**，reload 拿干净实例；正因如此，正确的写入方式要一次到位（见下节）。

## 3. 唯一可靠的做法：React fiber → `getChangeData(text)`

```js
const ed = document.querySelectorAll('[role=textarea]')[index];
let node = ed, key = null;
for (let i = 0; i < 20 && node; i++) {
  const k = Object.keys(node).find(k => k.startsWith('__reactFiber$'));
  if (k) { key = k; break; }
  node = node.parentElement;          // 答题框自己是 snabbdom 的，往上找
}
let f = node[key];
while (f) {
  const p = f.memoizedProps;
  if (p && typeof p.getChangeData === 'function') {
    p.getChangeData(text);            // ← 一次写好整段，纯文本，\n 分段落
    break;
  }
  f = f.return;
}
```

- 命中的组件 props：`itemId`、`maxChatLength`（3000）、`defaultValue`、`getChangeData`、`disable`、`correct`、`partialCorrect`、`viewstandanswerflag`、`paste`。
- `getChangeData` 的实现是 `e => { e !== ref.current && (ref.current = e, …超长判断…), B(e) }`——即原样接收**整段纯文本**，内部自己判断是否超 3000 并回写状态。
- 调用后：答题框重渲染成正确段落、右下角计数器变成真实字数、顶部「完成 N」上涨（两题都有内容就是 `2/2`）。
- 校验三件套：`完成 N 共 M`、`字数 xxx/3000`、`各框字符数`（`fill_answer.mjs check` 一次打全）。

## 4. 计数口径与压字数

- 计数器**按字符计**：中文、英文、数字、标点各 1，换行不计；`599/3000` 这种读数 ≈ 文件原始长度 + 十几。
- 「400～600 字」按这对计数器理解（王妍要求超了就压）。压的时候先删修饰、再删举例，**保留题目点名的必答点**。
- 实操循环：写文件 → `python3 -c "print(len(open('/tmp/q2.txt').read().strip()))"` → 注入 → `check` 读数 → 差几个字再微调。这次第 2 题从 705 → 692 → 664 → 641 → 635 → 590 → 582 → 580（计数器 599）才落进 600 以内。

## 5. 提交与出分

- 顶部、底部各一个 `提 交`；点了弹「提交确认 / 提交后将无法再次进入考试，是否去确认提交？」+ `取 消` `确 定`（按钮文本中间有空格，匹配时先 `replace(/\s/g,'')`）。
- 点 `确 定` 必须**趁弹窗还在**：中间插一条 `read`/`query` 之类的命令再点，会报 `target element is not visible or has zero size`，只能重新点提交再弹一次。
- 提交成功 → `/front/exam/result/<token>` → 「AI批卷中」→ 约 45 秒后出分（本次 150 分、2 答对 0 答错、简答题 AI 阅卷、已考 1 次剩 4 次）。
- 提交不可撤回，**动手前把两题全文 + 完成数报给用户等确认**。

## 6. 顺带记一笔：iHub 其它页面

- 课程/考试列表、搜索都是常规接口（`/examapi/*`、`/courseapi/*`、`/portal/*`）；考试内容接口是 `POST /examapi/examing`。
- 考试页是 React（不是 Vue，页面没有 `#app`/`__vue__`），React 18 fiber key 形如 `__reactFiber$xxxx`。
