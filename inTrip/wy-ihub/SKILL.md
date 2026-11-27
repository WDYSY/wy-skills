---
name: wy-ihub
display-name: iHub 考试答题
description: 在 iHub（ihub.ctripcorp.com）上代王妍参加在线考试并答题：打开考试链接、读题（含折叠代码块）、把答案写进 wangEditor 答题框、校验完成数与字数、提交、等 AI 批卷出分。两个关键点：①答题框用常规方式写不进去（fill / execCommand / 粘贴 / type 全部失效），必须走 React fiber 调应用自己的 getChangeData；②既能在程小帮内置浏览器里做，也能连 SunBrowser 的某个实例（走 CDP）。用户说「帮我答题」「打开这个考试链接」「这个考试做一下」「iHub 上的考试」「帮我考」「在 sunbrowser / 实例 N 里答题」「还有几次机会」时使用。
---

# wy-ihub · iHub 考试答题

iHub 的在线考试（`AI Code 审查能力考试 - L2 前端 Web 卷` 这类）是**整页滚动的简答题**，答题框是 wangEditor v5（Slate），要写进去只有一条路：**从 DOM 往上找 React fiber，调应用自己的 `getChangeData(text)`**。

2026-11-23 实战：这套做法在一份 2 题（50+100 分）的卷子上拿到 150 分通过。过程里 fill / execCommand / 粘贴 / 逐字输入 / 重载验证轮番失败，光绕坑花了半个多小时——所以先读第 1 节的「别白试」，再看流程。

## 工具约定

```bash
SKILL_DIR=~/.chengxiaobang/skills/wy-ihub            # 装好后的位置；源码在 ~/Projects/Mine/wy-skills/inTrip/wy-ihub
BROWSER=~/.chengxiaobang/builtin/plugins/browser-control/skills/browser-control/scripts/browser.mjs
N24=~/.nvm/versions/node/v24.15.0/bin/node           # CDP 路线用，要 Node ≥ 22（内置 WebSocket）
```

浏览器默认用 `browser-control` 技能（内置浏览器就够，**不需要扩展**），先 `node "$BROWSER" tabs` 拿 tab_id。完整失败路径与根因见 `references/pitfalls.md`——想知道「为什么不能粘贴」看那一份。

## 第 0 节：先确认考试开在哪个浏览器里

| 情况 | 怎么连 |
|---|---|
| 用户说「当前页面 / 内置浏览器里」 | `browser-control`（`$BROWSER`），tab_id 形如 `b2`，后面全程用 `fill_answer.mjs` |
| 用户说「在 SunBrowser / 本地 Chrome 的某个实例里」 | **browser-control 够不到**（SunBrowser 是独立 Chromium），走 CDP，见下 |

### 走 CDP（SunBrowser 实例）

```bash
B="/Users/temptrip/Library/Application Support/adspower_global/cwd_global"

# 1) 用户说的「实例 N」= 进程命令行里的 --protected-userid=N，取出它的 user-data-dir
ps -eo command | grep -F 'protected-userid=4 ' | head -1 | tr ' ' '\n' | grep -A1 -F user-data-dir

# 2) 端口：user-data-dir 下的 DevToolsActivePort 第一行（随机端口，不能猜）
PORT=$(head -1 "<user-data-dir>/DevToolsActivePort")

# 3) 找目标标签页、读页面
$N24 "$SKILL_DIR/scripts/cdp.mjs" list --port $PORT
$N24 "$SKILL_DIR/scripts/cdp.mjs" eval --port $PORT --id <targetId前12位> --expr "return document.body.innerText.slice(0,300)"
```

要点：

- `--user-data-dir` 路径**带空格**，别用 `grep -o '--user-data-dir=[^ ]*'`（会被截断）。
- 读题、点按钮、写答案都用同一套 `eval`：表达式里可以写多条语句 + `return`，内部已包成 async IIFE。
- **`fill_answer.mjs` 只给 browser-control 用**。CDP 下把注入逻辑写成 `--file`：`atob(base64)` 解出文本 → 找 `[role=textarea]` → 沿 `__reactFiber$` 找到 `getChangeData` → 调用。走 base64 是为了绕开引号和换行的转义。
- 点「开始考试」「提 交」「确 定」都用 `[...document.querySelectorAll('button')].find(b => b.innerText.replace(/\s/g,'') === '提交')`；React 的 onClick 吃 `.click()`，弹窗确认在**同一个表达式里** `await` 300~700ms 后立刻点，就不会遇到「弹窗元素不可见」。
- 结果也 `eval` 读：`已通过 / 分数 N / 次数 M/5`。

实测（2026-11-26）：实例 4（`--protected-userid=4`，profile `kty8r1c_h1em218`）里给另一账号答同一张卷，145 分通过，全程没碰 browser-control。

## 第 1 节：别白试（这几种写法都不行）

| 方式 | 现象 | 为什么 |
|---|---|---|
| `fill --ref <答题框>` | DOM 里能看到文字，`完成 N` 不涨，重载后**消失** | 只改 innerText，Slate 模型还是空 |
| `js` 里 `execCommand('insertText')` | 页面**渲染正常**、段落数变多，`完成 N` 仍不涨，提交前重载就没了 | 进了 Slate 模型，但没触发应用的 onChange，答不进应用状态 |
| 合成 `ClipboardEvent('paste')` | 事件被 preventDefault（说明有 handler），内容不落 | wangEditor 的粘贴处理不认非可信事件 |
| `press --key Meta+V` | 无任何反应 | 内置浏览器只发按键事件，不执行浏览器的粘贴命令 |
| `type --text "中文"` | 报「Typed N characters」，框里没东西 | 走 insertText，中文进不去；单键 `press --key a` 能进，但打不了中文 |
| 无脑重载页面「验证是否保存」 | 内容全丢 | **答案不落服务端，只存在应用内存里**，reload 等于清空作答 |

结论：**别在输入通道上折腾**，直接跳到第 4 节的 `getChangeData`。

## 第 2 节：进入考试

1. 准备页 `https://ihub.ctripcorp.com/front/exam/preparation/<examId>?courseid=<courseId>`，页面上有考试名、时长、合格分/总分、**次数 N/5**、题型（如「总共2题(问答2题)」）。
2. 点 `button 开始考试` → 跳 `/front/exam/examination/<token>`（token 在 URL 里）。**点下去就开始计时并消耗一次机会**，用户没明确说开始就先问。
3. **`examination/<token>` 这个链接可以反复打开，每次打开都是新的一次作答**（2026-11-23 复测：同一 token 提交后再打开，完成数归零、计时重来、题面换成同系列的变体题）。所以：别拿它当成绩页；用户丢来这个链接就是想再来一次，先提醒要消耗机会。
4. 开考后页面顶部：`答题人`、`完成 N 共 M`、`剩余时间`、`提 交`；左侧答题卡 `1` `2`；所有题在同一页往下滚。**开考前先看 `答题人` 是谁**——SunBrowser 实例里往往是别人的账号。

## 第 3 节：读题

- 先拿全文：browser-control 用 `read --tab <id> --filter text`，CDP 用 `eval "return document.body.innerText"`。
- **代码块默认折叠成「全部展开」**，要一次点开：

```bash
# browser-control
node "$BROWSER" js --tab b2 "const els=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/全部展开/.test(e.textContent||''));els.forEach(e=>e.click());return els.length"
# CDP：同一个表达式放进 --expr 即可
```

- 再取一次全文（题干 + 待审代码 + 作答要求 + 分值）。
- **注意题目自带的「不要误报」提示**：找 bug 类题会明说「第 19 行用 `e.detail.value`、第 11 行用相对路径是正常写法，误报会扣分」。逐行审完再按提示剔掉误报项。
- 作答格式按题目要求来（如「每处写『位置 + 缺陷类别 + 一句话修复建议』」），别自由发挥。

## 第 4 节：把答案写进去（核心）

```bash
# 1) 答案先落盘（agent 用 Write 写），便于量字数、便于重来
/tmp/q1.txt

# 2) browser-control 路线
node "$SKILL_DIR/scripts/fill_answer.mjs" fill --tab b2 --index 0 --file /tmp/q1.txt
node "$SKILL_DIR/scripts/fill_answer.mjs" check --tab b2

# 3) CDP 路线：把同样的注入逻辑写成 --file 再 eval
$N24 "$SKILL_DIR/scripts/cdp.mjs" eval --port $PORT --id <id> --file /tmp/fill-0.js
```

两种路线做的是同一件事：

1. 取 `document.querySelectorAll('[role=textarea]')[index]`（就是 `[data-slate-editor]` 那个 contenteditable）；
2. 从它往上找第一个带 `__reactFiber$…` 的祖先（答题框自己是 snabbdom 渲染的，**它身上没有 fiber 键**），再沿 `fiber.return` 找 `memoizedProps.getChangeData`（同层 props 还有 `itemId`、`maxChatLength`、`defaultValue`）；
3. `p.getChangeData(纯文本)` —— 一次性把整段文本写进应用状态。

生效判据（缺一不可）：
- 计数器数字**明显变化**（如 `1354/3000`、`647/3000`）；
- 顶部 `完成 N 共 M` 的 N = 有内容的题数（两题都填就是 2）；
- 答题框渲染成多段落，不是一坨。

**不要**用 fill/execCommand 混着写；**不要**写完 reload 验证（见第 1 节最后一行）。

## 第 5 节：字数

- 每个答题框右下角有 `xxx/3000` 计数器，**按字符计**：中文、英文、数字、标点都算 1，换行不计。
- 题目写「400～600 字」「450～650 字」时**以页面计数器为准**（王妍 2026-11-23 明确要求超了就压）。计数器 ≈ 文本原始长度 + 十几，想一次落进区间就先按 `python3 -c "print(len(open(f).read().strip()))"` 控到上限减 20~30。
- 压字数的顺序：先删修饰词和重复解释，再删可有可无的举例，**别删题目点名要答的点**（如「②要写出 key 出现在哪里」「③要写出动作顺序并说明理由」「① 要写出三次触底各自的页码」）。压完重新注入一次，读数确认。

## 第 6 节：提交

1. 顶部和底部各有一个 `button 提 交`，点任意一个 → 弹确认框「提交后将无法再次进入考试，是否去确认提交？」+ `取 消` / `确 定`。
2. **提交前把「完成 N 共 M」和两题内容报给用户，等他点头**——提交不可撤回、消耗一次机会（共 5 次）。
3. 点 `确 定` 要**紧接着弹窗还在的时候点**：browser-control 路线中间插一条 `read`/`query` 就会报 `not visible or has zero size`；CDP 路线把两步写在同一个表达式里最稳。
4. 成功后跳 `/front/exam/result/<token>`，先显示「AI批卷中…」，**约 45–60 秒**自动出分。

## 第 7 节：出分后

- 结果页读：`N 分` / `已通过` / `答对 X` / `答错 Y` / `已考 1 次，剩余 4 次机会`；有异议可「申请人工阅卷」。
- 回报用户：分数、是否通过、用掉几次机会、还剩几次；**不要**把两题答案在对话里再复述一遍（要看内容去页面或看 `/tmp/q*.txt`）。
- 不是满分时如实说丢了多少分，并说明只能看到总分（答卷列表没有逐题评分）。
- 每次考完把「题目 + 最终答案 + 得分」追加到 `references/exam-bank.md`（三次的存档已在里面，含题面、代码、评分复盘）。**追加时只写实际提交的版本**，别把中间稿也记进去。

## 答题质量（简答题由 AI 阅卷，写空话拿不到分）

- 找缺陷类：逐行对着「需求要点」和「工程约定」核，每处都写成 `位置 + 缺陷类别 + 一句话修复建议`，能点出 off-by-one、单位错（1000 vs 1024）、竞态、闭包陈旧、缺 catch、业务失败码没判、密钥硬编码、敏感信息进日志、测试被改弱、lint 被放宽、越界改其他页面这类**具体**问题才给分。
- 分析类：每问分开答，落到「什么时候执行 / 后果 / 为什么这个改法仍不对 / 正确做法」；处置流程题一定要写出**顺序和顺序的理由**；「怎么验证」要给两种以上手段（单测断言 + E2E/Network 观察）。

## 踩坑速查

- 答题框 DOM 在 wangEditor 手里（snabbdom），**元素上没有 `__reactProps$`**，`__reactFiber$` 要从祖先节点上找。
- `cdp` 子命令在**内置浏览器不支持**（`Input.insertText` 之类用不了）；要 CDP 就自己连，用 `scripts/cdp.mjs`。
- 内置浏览器的 `press` 只发按键，`Meta+V` 不会触发粘贴；中文也没有对应按键。
- **外部改 DOM 后 Slate 不认这份 DOM**（点了没光标、按键无反应）：一旦写坏过，最省事的是重载拿干净实例——代价是已写内容全丢，所以**一次写对**。
- 同一页所有答题框都在 `[role=textarea]` 里，**顺序就是题目顺序**；`--index` 从 0 开始。
- 提交/取消弹窗按钮的文本是 `确 定` / `取 消`（中间有空格），用 `innerText.replace(/\s/g,'')` 匹配。
- 答案不落服务端：中途刷新、切标签页都可能丢，写完就检查 `完成 N`，然后尽快提交。
- `fill_answer.mjs check` 的 `各框字符数` 比文件的 `len()` 多一点（差的都是 `\n`），跟计数器差几个字是正常的。
- 同一套卷子重考会换题面：2026-11 三次都是「L2 前端 Web 卷」，第 1 题依次是 `CitySearch.tsx` → `Uploader.tsx` → `SmsLogin.js`，第 2 题从 Next.js 安全题换成无限滚动闭包题——**别照抄上一次的答案**。
- SunBrowser 里答题时 `--user-data-dir` 带空格、端口随机、端口还会被别的 profile 复用；**身份只认进程的 `--protected-userid`**。
- 找缺陷题的套路可以复用：按「需求要点」逐条造判据（数值/大小写/超时/卸载/单测/依赖），再对着「工程约定」看该不该用工程已有能力（`isCnMobile`、`isAllowedImage`、`MAX_IMAGE_BYTES`、`useDebounce`、`getDeviceFingerprint` 这类），最后剔掉题目点名的正常写法。
