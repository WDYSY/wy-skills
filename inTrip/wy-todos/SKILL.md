---
name: wy-todos
display-name: 待办清单
description: 拉取王妍在 iDev 上「本月+上月」的 TODO/DOING 任务，以及「WY处理中的bug」筛选器（filter 4509）里的待处理 Sub-bug（已修复待验证不列），按已逾期/当天/本周分类（排除周末与法定节假日）；同时查「WY待办需求」筛选器（filter 4504）：一是**还没建 Sub-task 的需求**（逐条让她确认要不要补建），二是**子任务已全部 DONE、需求本身还没标完成的需求**（逐条让她确认要不要标完成，确认后走状态流转）。最终生成带任务链接的飞书卡片用程小帮机器人身份发给她本人。用户说「统计我的待办」「拉一下我 idev 的任务」「今天有哪些活」「哪些需求还没建子任务」「哪些需求可以标完成了」「给我发个任务清单」时使用；配置每天 10:30 定时推送也走这里。
---

# wy-todos · iDev 待办清单

王妍要的是**一份能一眼看出"现在欠了哪些、今天做什么、本周做什么"的清单**，外加她手上处理中的 bug，以及**哪些需求还没拆子任务**（这块的用途是她逐条确认要不要补建）。

## 口径（王妍 2026-11-09 确认、2026-11-17 补缺口模块，别再问）

| 项 | 默认 | 说明 |
|---|---|---|
| 任务范围 | iDev 上**本月 + 上月** | 按计划开始/结束日期落在上月 1 号～本月末筛；没有日期的单列「未排期」 |
| 状态 | TODO / DOING | `issueStatusCategorys: [1, 2]` |
| 人员 | 王妍本人（TR004363） | 走 `related`，不是只看指派人 |
| bug | **必须单独统计，只列待处理** | 筛选器 id `4509`（WY处理中的bug）：Sub-bug + 状态「待处理/已修复待验证」+ 干系人王妍；卡片上**只展示「待处理」**，已修复待验证不列（王妍 2026-11-09 要求） |
| 缺子任务的需求 | 筛选器 id `4504`（WY待办需求）里**一个 `Sub-task` 都没有**的 Story | Story + 状态「待需求规划…验收中」+ 前端开发=王妍；**不设时间窗，全部列出**；Sub-bug 不算子任务，只有 Sub-bug 的也列并标「仅 Sub-bug」。用途：她逐条确认要不要补建子任务 |
| 可标完成的需求 | `4504` 里**子任务已全部完成、需求本身还没到完成态**的 Story | 判据：`Sub-task` 数量 > 0 且全部 `statuscategory=3`（DONE）；4504 本身只含非完成态，所以无需再筛需求状态。有未完成 Sub-bug 的照样列并标注，让她自己判断。用途：她确认后把需求流转到完成态 |
| 分类 | 已逾期 / 当天 / 本周 | 工作日**必须排除周六日与法定节假日**，见 `references/holidays.md` |
| 身份 | **程小帮机器人**（`--as bot`） | 发给她本人单聊；卡片脚注写「由王妍触发 · 程小帮」 |
| 形态 | 飞书卡片 2.0 | 骨架见 `references/cards.md`，不要改成文本消息 |

## 第 1 步：确认今天

先跑 `date "+%Y-%m-%d %H:%M %A"`。**会话里的系统时间提醒可能过期几周**（2026-11-09 实测前面挂的是 10-20），凡是「明天/周三/本周」这种相对日期一律以 `date` 为准。

## 第 2 步：取数（三组，都要）

**2.1 任务**：`iDev2-issue-query`

```
related: ["TR004363"]
issueStatusCategorys: [1, 2]
orderBy: "endtime asc"
size: 100
includeFields: issueKey,title,issueType,issueStatus,issueStatusCategory,begintime,endtime,estimatedPoint,issuePriority,productObj,parentLinkObj
```

**2.2 bug**：`iDev2-issue-query` 传 `filterId: 4509`，`size: 100`，`includeFields` 同上（再加 `createtime,lastUpdatedTime`）。

**2.3 待办需求 + 子任务缺口**：两步，后一步依赖前一步的结果。

a. 查需求：`iDev2-issue-query` 传 `filterId: 4504`，`size: 100`，`includeFields: issueKey,title,issueType,issueStatus,issueStatusCategory,issuePriority,productObj,parentLinkObj`（`issueId` 接口默认就回，不用写）。**这条结果常常只有十几条，会直接内联进上下文、不落盘**——那就把返回的 JSON 原样写到 `/tmp/wy-todo-req.json` 再交给脚本（别用 grep 从对话里抠字段）。

b. 把这些需求的内部 id 取成数组，**别把 JSON 读进上下文**：

```bash
node "$SKILL_DIR/scripts/todo_scan.mjs" --requirements=<需求结果文件> --print-id-args
```

c. 用这个数组查它们下面的子项：

```
parentIssueId: ["11091968", "…"]        # 上一步原样粘过来
size: 300
includeFields: issueKey,issueType,parentLinkObj,issueStatus,issueStatusCategory
```

子项状态是「可标完成」模块的判据来源，**`issueStatus` 必须取**（状态对象里带 `statuscategory`，3 就是完成）。

`total > size` 时按 `page` 把**所有页**都取下来，多页文件用逗号一起交给脚本（`--children=a.txt,b.txt`）。

任务与子项两份结果通常都超长，会落到 `tool-results/…txt`。**不要把整份 JSON 读进上下文**，直接把文件路径交给脚本；只有小结果才需要自己写到 `/tmp`。

## 第 3 步：分类

```bash
node "$SKILL_DIR/scripts/todo_scan.mjs" --today=YYYY-MM-DD \
  --tasks=<任务结果文件> [--bugs=<bug结果文件>] --bug-status=待处理 \
  [--requirements=<需求结果文件>] [--children=<子项结果文件[,更多页]>] --json
```

脚本输出结构化 JSON（overdue / today / thisWeek / later / bugs / noSubtask / undated / counts / workdays），口径：

- 先按「本月+上月」筛：`end || begin` 落在上月 1 号～本月末
- 逾期：`(end||begin) < 今天`
- 当天：`begin <= 今天 <= end`
- 本周：其余里 `begin <= 本周最后一个工作日 && end >= 今天`
- 更晚：本月内其余
- 无日期：单列，按 `issueStatus` 名称计数；其中命中 bug 筛选器的条目从「未排期」里扣掉，避免重复计
- 逾期按结束日**从近到远**排（最该先还的排前面）
- **缺子任务**（`noSubtask`）：需求下 `Sub-task` 计数为 0 就列入；`childCount > 0` 说明它只有 Sub-bug，卡片上标「仅 Sub-bug」。排序按状态在流程里的位置**从后往前**（待验收/测试中/开发中 排前，待需求规划 排后），同状态 P0→P3
- **可标完成**（`doneSubtask`）：`subTaskCount > 0 && subTaskDone === subTaskCount` 就列入，顺带给 `openBugs`（未完成的 Sub-bug 数）供卡片标注。排序同上

## 第 4 步：发卡片

按 `references/cards.md` 的骨架拼卡片 2.0，`LarkCli` 的 `run` 动作：

```
["im","+messages-send","--user-id","ou_c4adae1a03c2ef1b6f50404e6d643472",
 "--msg-type","interactive","--content","<内联JSON>","--as","bot"]
```

- `--content` **不吃 `@文件`**，必须内联 JSON；用 argv 数组传，不要拼 shell 字符串
- **每条任务的 KEY 都要带超链接**（`https://idev2.ctripcorp.com/issueDetail/<KEY>`），底部固定两行按钮：第一行「打开 iDev」「待办需求」（→ `https://idev2.ctripcorp.com/filter/4504`）「处理中 bug」（→ `https://idev2.ctripcorp.com/filter/4509`），第二行「备忘清单」（→ `https://wdysy.github.io/TripToolPages/todo.html`）「Anki 库」（→ `https://wdysy.github.io/TripToolPages/anki.html#library`）。第二行是当日无活时的排查备忘入口，**清单为空也要保留**
- 超过 15 条时只展开逾期与本周，其余给计数，别把卡片撑成两屏；**缺子任务 / 可标完成 两段不受 15 条限制**，但它们自己的条数超过 10 条时只列前 10 条 + 「还有 N 条」
- 发送成功判据：`ok: true` + `message_id`

## 第 5 步：确认两件事（都要她自己拍板）

卡片发出去只是"点名"：**要不要建子任务、要不要标完成，都由她拍板，不要自己替她决定**。

### 5.1 缺子任务的需求（`noSubtask`）

- 发完卡片后**逐条**问她：「XLSP-4936 要补子任务吗？」
- 她说要建的，走 `iDev2-issue-create`：`issueType: "Sub-task"` + `parentIssue: "<父需求KEY>"`，必填 **标题 / 任务类型（`fields:{"customfield_6492":"…"}`，前端一般是「前端开发任务」）/ 指派人 / 开始日期 / 结束日期 / 工作量（`estimatedPoint`，留空会静默失败）**。缺哪项就问，别猜默认值
- 一条需求常常要拆多个子任务（前端/后端/联调/用例），先问清拆几条再建；建完把新 KEY 回报给她
- 她明确说"先不管/这些不用建"的，本条会话内别再追问

### 5.2 可标完成的需求（`doneSubtask`）

- **先报事实再问**：「XLSP-4606 子任务 3/3 都完成了，要标完成吗？」；`openBugs > 0` 的要一并说「还有 1 个 Sub-bug 没关」，让她判断能不能关
- 她说要标的：先 `iDev2-issue-transition-statuses` 查可用流转，挑 `statusCategory = 3` 的那条（XLSP 空间叫「完成」，别的空间可能是「已完成」），**把实际状态名跟她确认一句**再 `iDev2-issue-update-status`；不要照抄名字
- 她说先不标的，本条会话内别再追问

## 第 6 步：回报

一条简短结果：概览数字（逾期/今天/本周/bug/缺子任务/可完成/未排期）、卡片 message_id、以及口径上做了哪些判断（例如某条因为缺日期归到未排期）。**不要把整份清单在对话里再复述一遍**——清单主体在卡片里。若已经就地补建了子任务或标了完成，只报新 KEY / 新状态和挂在哪个需求下。

## 定时推送

王妍要的是每天 10:30 自动发（`Schedule` 的 recurring，cron `30 10 * * *`，prompt 里指回本技能）。每次运行都重新取数，不复用上一次的卡片内容。**定时任务只列缺口，不建子任务、不改状态**——这两件事必须她在对话里点头。

## 踩坑

- 时间戳字段是**北京时间当天 00:00 的毫秒值**，转日期用 `new Date(ms + 8*3600000).toISOString().slice(0,10)`
- 「逾期」只比计划日期，不看状态细节，所以挂起的子 bug 也会进逾期；王妍如果要求排除「挂起」，在 `--exclude-status=挂起` 上加
- filter 4509 / 4504 都是**她本人的私有筛选器**，别人跑不通；改口径时优先改 filter，不要在这里硬编码状态
- `parentIssueId` 可以一次传多个 id，但返回的是**直接子项、不递归**；子项总数可能上百（4504 那 9 条需求下就有 127 个子项），**必须取完所有页**才能断言"没有子任务"，只取第一页会把有子任务的需求误判成缺口
- 需求本身往往挂在 VCP 父需求下（`parentLinkObj` 指向 `VCP-xxxx`），"它的子任务"指它下面的 `Sub-task`，**不是 VCP 那一层**
- 「子任务完成」按 **`issueStatus.statuscategory === 3`** 判，别看状态名（有的叫 DONE、有的叫「完成」）；子项查询只取 `issueStatus` 时没有 `issueStatusCategory` 那一层，脚本已用 `statuscategory` 兜底
- 机器人发出的消息**撤回不了**，发前核对概览数字
- 脚本输出里 **`today` 是「当天任务数组」，不是日期串**，日期在 `todayDate`（`today` 这个 key 被分组列表占用了，别再踩）
- 发卡片只能用 `LarkCli` 工具：**直接 shell 调 `lark-cli` 会 `not_configured`**；`--content` 也不吃 `@文件`（2026-11-17 再次复现），必须把卡片 JSON 内联进 argv
- 卡片正文里的 `<` 要先换成全角 `＜`（如「目标<1.2s」），否则飞书 markdown 会当标签吞掉后半句
