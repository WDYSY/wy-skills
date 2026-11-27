---
name: wy-captain
description: 把当前仓库分支发布到 Captain 的 fat 环境。自动核对今天自己推的提交与镜像，优先复用该分支发布过的历史环境，没有历史则列出 10 天以上无人使用的环境让你选，绝不自己拍板；部署后第 3 分钟用程小帮 bot 在「程小帮发布群」按固定模板提醒，并按参数给下游指定人发指定消息。用户说 /wy-captain、把这个分支发到 fat、发完提醒某人时使用。
---

# wy-captain · 分支发布到 Captain fat 环境

一条命令走完：确认提交 → 等镜像 → 选环境 → 发布 → 第 3 分钟通知。

## 参数（从用户话里解析，没说的用默认）

| 参数 | 默认 | 说明 |
|---|---|---|
| 应用 | 100013904（imvc-vbk） | 支持简写（用户说 `28686` → `100028686`），解析规则与王妍参与/关注的应用清单见 `references/apps.md` |
| 分支 | `git rev-parse --abbrev-ref HEAD` | 用户点名就覆盖 |
| 环境 | 自动判定 | 有历史环境就复用，没有就列候选让你选 |
| 下游通知人 | 无 | 没指定 = 不发下游，只在报告里写明未发 |
| 下游消息 | 无 | 必须和通知人成对出现 |

示例：`/wy-captain` / `/wy-captain 环境=fat16` / `/wy-captain notify=周闻韬:已修复发布` / `/wy-captain 发28686`

**默认口径（用户 2026-11-06 确认）**：用户说「发 xxx」「监测发布 xxx」而没指定分支和环境时，默认指**刚提交、刚推上去的代码**，不要先反问“发哪个分支/要不要等”。正确反应是：确认刚推的 sha → 查镜像 → 没出就挂定时器等 → 镜像出了自动发到复用环境 → 确认发布真完成 → 发卡片。需要问的只有两种情况：① 镜像迟迟不出且用户没说要等（给三选一选项）；② 远端 head 已前进出更新的提交。

## 第 -1 步：先把应用和仓库对清楚

**先读 `references/apps.md`**，那里有王妍参与/关注的 23 个应用（AppID / 中文名 / 仓库）。

- 用户只报了 4–5 位数字（`28686`）→ AppID = `1000` + 该数字，先在清单里核对。
- 清单里没这个应用 → 用 `get_application_info` 验证存在性，并明确提醒“这个应用不在你参与/关注的清单里”，等用户确认再往下走。
- 当前工作目录不一定是那个应用对应的仓库（例：`100013904` 是 `imvc-vbk`，`100028686` 是 `imvc-vbk-v2`）。**仓库对不上就不要拿当前目录的提交当发布内容**，去对应仓库取分支，或者问用户要发哪个分支。
- 清单外的新应用发现后，顺手补进 `references/apps.md`。

## 第 0 步：先确认「要发的是什么」

```bash
git rev-parse --abbrev-ref HEAD
git log --since="$(date +%Y-%m-%d) 00:00" --author="$(git config user.name)" --pretty='%h %ad %s' --date=format:'%H:%M'
git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline
```

- 第三条**必须为空**。有本地未推提交 → 先让用户推送，不要拿远端没有的 commit 去发。
- 今天没有自己的提交 → 停手问用户："今天这个分支没有新提交，还要发当前 HEAD 吗？"
- 记下要发的 commit 短 sha（前 7 位）与分支名，后面全程用这两个做锚点。

## 第 1 步：确认镜像已构建

先 `ToolSearch(query="select:mcp__get_images,mcp__deploy,mcp__get_groups,mcp__get_releases,mcp__list_project_merge_requests,mcp__list_merge_request_pipelines,mcp__list_pipeline_jobs")` 加载工具，然后：

```
mcp__get_images(application_id, keyword=<分支全名>, search_type="branch", page_size=10)
```

在返回的 `name` / `commit_url` 里找包含目标短 sha 的 Gitlab-CI 镜像，记下完整 name（形如 `gitlab-ci/100013904:<小写分支名>-<短sha>-<时间戳>`）。

- 分支搜索是模糊匹配，必须自己核对 tag 里的 sha，别把上一个提交的镜像当成本次镜像。
- 若分支存在比目标 commit 更新的镜像，说明流水线跑的不是你要发的提交，先跟用户对清楚。

### 没出镜像时：先诊断，再让用户选（不要直接停下来问“等不等”）

#### 诊断 1：这个提交到底推到 GitLab 了吗（必做）

```bash
cd <应用对应仓库，查 references/apps.md>
git rev-parse HEAD                              # 本地 HEAD 是不是就是要发的 sha
git branch -r --contains <sha>                  # 目标提交在哪些远端分支上（空 = 没推）
git ls-remote origin refs/heads/<branch>        # 远端分支 head（≠ 目标 sha 说明后面又推了新提交）
```

- 远端分支不包含这个 sha → **根本没推上去**，让用户先 push，本次到此为止。
- 远端 head 已是更新的 sha → 用户报的不是分支最新提交，先对清楚要发哪个。

#### 诊断 2：流水线在跑、失败了、还是根本没触发

- **分支有开启中的 MR**（实测可用）：
  `mcp__list_project_merge_requests(project_id="<owner>/<repo>", state="opened")` → 按 `source_branch` 命中 MR →
  `mcp__list_merge_request_pipelines(project_id, merge_request_iid)` → 取 `sha == 目标 sha` 的 pipeline，看 `status` 与 `web_url`。
- **有失败 job**：`mcp__list_pipeline_jobs(project_id, pipeline_id, status="failed")`，把 job 名（如 `Lint`）+ `web_url` 报给用户；注意 `allow_failure: true` 的 job 不算真失败。
- **分支没有 MR**：gitlab-mcp 没有“按 commit / 分支查 pipeline”的接口（已核实）。只能给用户链接：`<gitlab repo 地址>/-/pipelines?ref=<branch>` 和 `/-/commit/<sha>`；内置浏览器可用时可以打开这两个页面读状态。

#### 诊断 3：把结论归为三种之一再问用户

- **还在构建**：镜像通常几分钟内出，推荐“等”。
- **构建失败**：把失败 job 和链接贴上。
- **根本没触发**：提醒用户手动触发流水线，或确认是不是推错分支/仓库。

#### 然后让用户选（选项固定三选一，“没出镜像”就是其中一项）

用 `AskUserQuestion` 问：
1. **等 10 分钟自动重查**（默认，最多 3 次；用 `Schedule` kind=once 挂重查）
2. **这次不发**（就按没出镜像处理）——我会把诊断结论 + 流水线链接给你，不建 release、不发下游通知、只发 bot 提醒说明未发布
3. **用该分支上一次的旧镜像发**——必须明确告知“发的是旧镜像，不等于你今天的提交”，拿到用户明确确认才走第 4 步

**分支边改边推的情况（2026-11-09 实测）**：远端 head 一直在前进时，流水线永远追不上（该仓推送后约 23 分钟才出镜像）。此时不要一直重试追 head；把现状（head 是 X、已构建镜像只有 Y）报给用户，按他的一句话走：
- 用户说「用已经出的发」→ 部署**最新的已构建镜像**（允许不是远端 head），报告和卡片里写明实际 commit 是 Y、远端 head 是 X。
- 用户没说 → 继续重试，但最多 6 次后停下，不擅自拿旧镜像凑。

用户选 2 时不发任何下游消息；bot 提醒照发，卡片正文最后加一行 `本次未发布：镜像未产出（<原因>）`，标题用 `未发布 · <app_id>`，`header.template` 用 `yellow`。

## 第 2 步：找该分支的历史发布环境（能复用就复用）

```
mcp__get_groups(application_id, env="fat")
```

对返回的每个 group 调：

```
mcp__get_releases(application_id, env="fat", subenv=<group.sub_env>, group_id=<group.id>, page_size=20)
```

在该 group 的 `image_tag` 里找以 `<小写分支名>-` 开头的最近一次发布。

- 命中：直接复用这个 group。多个 group 都发布过本分支时，取「最近一次发布该分支」时间最新的那个。在报告里写清"复用历史环境 fatXX（上次 XX 发布过本分支）"。
- `get_groups` 单次最多返回 20 个 group，fat 环境可能更多；需要全量时补齐 `keyword` 再查一遍，别漏掉目标环境。
- 名字含 `offline` 的 group 不参与复用和候选。

### 命中之后必须先比对当前镜像（硬规则）

拿复用环境的 `page_size=1` 最新 release，比对它的 `image_tag` 是不是就是这次要发的镜像：

- **完全一致 → 不重发，不建新 release**。直接进「已在运行」分支。
- 不一致（跑的还是该分支更早的镜像，或已被别的分支覆盖）→ 才进第 4 步部署。

### 「已在运行同一镜像」分支

1. **不调 `mcp__deploy`**，不新建 release。
2. 跳过第 5 步的 3 分钟等待（没有新动作需要落定）。
3. 用户指定了下游通知人 → 状态已经成立，可以直接发，不用等。
4. bot 提醒照发（第 7 步卡片），四个字段照填，Card 按钮指向**已经在跑的那个 release**，并在正文最后加一行：`本次未新建 release：该镜像已于 <时间> 发布成功（release <id>）`；标题用 `已在线 · <app_id>`，`header.template` 用 `yellow`。
5. 若用户明确说「重发」「再发一次」，才回到第 4 步真发一遍。

## 第 3 步：没有历史环境 → 让用户选，不要自己拍板

1. 对每个 group 取其最近一次 release 的 `created_at`/`updated_at` 作为"最后发布完成时间"。
2. 候选 = 距今天 **≥ 10 天** 且名字不含 `offline` 的 group。
3. 用表格列给用户：group 名 / 子环境 / group_id / 最近一次发布的镜像 tag / 距今天数。
4. 用 `AskUserQuestion` 让用户从候选里选，或直接给一个 group_id。**用户没确认前不部署。**
5. 一个候选都没有 → 提醒用户自己去 Captain 开一个环境，本次到此为止。

## 第 4 步：部署

```
mcp__deploy(group_id=<选定 group>, image_url=<第 1 步的镜像完整 name>, note="<需求号> <一句话> · <分支名>")
```

- `image_url` **就是** `gitlab-ci/100013904:<tag>`，不要补 `hub.cloud.ctripcorp.com/` 或 `tcr.artifactory...` 前缀，MCP 会自己拼。
- 返回值里 `data.id` 就是 release_id，`data.diff` 里能看到 old image → new image，核对 new image 是不是你要发的那个。
- 记下 **T0 = 部署提交成功的时间**，后面第三分钟从 T0 起算。
- prod/production 环境 MCP 会直接拒，不要去绕；也不要为了过卡点把 `ignore_release_control` 设 true。被红线卡住就把卡点原因告诉用户。

## 第 5 步：等发布真正完成（首次 3 分钟，之后每 2 分钟，直到终态）

仅在本次真的调了 `mcp__deploy` 时执行；「已在运行同一镜像」分支跳过。

发卡片前**必须确认发布真完成**，不能一键下去就当发完了。节奏固定：

1. **T0 + 3 分钟** 做第一次检测：
   ```bash
   sleep 180   # 后台 sleep + wait，别让前台超时
   ```
2. `mcp__get_releases(application_id, env="fat", subenv=<group.sub_env>, group_id=<group_id>, page_size=1)`：
   - 最新 release 的 `id` 等于你刚建的 release_id、且 `status == "SUCCESS"` → **发布完成**，进第 6/7 步发卡片。
   - `status` 还是 `PENDING` / `RUNNING` → 再 `sleep 120` 后重查，**每 2 分钟一次**，直到终态。
   - `status` 是 `FAILED` / `CANCELED` → 终态失败，进第 7 步发**红色卡片**并在正文写明 `FAILED（<原因/卡住的步骤>）`。
   - 黄牌场景（未发出去/仍在跑）：本次没新建 release、镜像未产出、超时仍 RUNNING → 发**黄色卡片**，标题用 `未发布 · <app_id>` 或 `发布中 · <app_id>`，不要用红色（红色专指真失败）。
3. 最多检测 10 次（约 23 分钟）；超过仍在跑 → 不再干等，发一张卡片说明“仍在发布中，当前状态 RUNNING”，附 captain 链接，让用户自己盯。
4. 核对身份：`get_releases` 返回的是 group 最新一条，需确认 `id == 本次 release_id`，避免同组别人刚发了一版把你顶掉。

- release 变 FAILED：**下游通知人不发**（失败不能替用户对外宣告“已修复”）；bot 卡片照发，标红并写失败。

## 第 6 步：下游通知（只在用户指定时，且发送前要确认）

**一律交给 `wy-msg` 技能执行，不要在本技能里自己拼卡片 JSON。** 做法：

1. 用 `Skill` 加载 `wy-msg`，把「收件人 + 王妍要说的原话（含链接）」当参数传过去。
2. 由 wy-msg 负责：查人拿 `p2p_chat_id`、选卡片还是文本、拼卡片、用**王妍本人身份**发送、回报 message_id。
3. 唯一额外约束：**发给下游的卡片上不能出现收件人自己的名字**（不署名、不写「给某某」、不加代发/触发人/时间戳）。

**发给第三方必须得到用户确认（2026-11-09 用户要求）**：
- 发送前把「发给谁（姓名/部门）+ 原文 + 页面链接」摆给用户过一眼，得到明确 OK 才发。
- 唯一例外：用户在本次请求里已经把「人 + 内容」都说全了（如「发好之后告诉周闻韬：已修复，链接 xxx」），这本身就是确认，可以直接发，不再二次问。
- 定时任务里涉及下游的，必须在用户下达任务时就拿到这份确认；没拿到就不发，只发 bot 卡片并在里面写「未通知下游」。

- 用户没指定收件人 → 明确在报告里写“未指定下游通知人，未发送”，不要自己找人发。
- **下游文案口径（用户 2026-11-10 定）**：就用「`<需求号> 已发布到 fatNN`」一句话，例：「XLSP-4726 已发布到 fat16」。**不要写“你选定的测试环境”这类娘里娘气的说法**，卡上只留事实。
- **不是每次都有需求号**：分支名/提交里拿不到 XLSP-xxxx 时，就写「已发布到 fatNN」或用户当次给的原话，不要自己编个需求号。
- 下游通知只在发布真实成功的分支里执行（FAILED / 超时 / 未发布都不发）。

## 第 7 步：bot 在「程小帮发布群」提醒王妍（每次都发，固定格式，不用征求确认）

这张卡是**固定格式、每次发布都发、不需要先问用户**——用户 2026-11-09 明确：发群里的照旧就行，不用确认；只有发第三方的才要确认。

- 群：`程小帮发布群`，chat_id `oc_5e4092c83abb518fcae1e2fcf671c53d`（程小帮 bot 已在群内，bot open_id `ou_0bf1f6ae8a14b89020129dc22fa92b11`）
- 王妍 open_id：`ou_c4adae1a03c2ef1b6f50404e6d643472`（bot 卡片里用它 `<at>` 王妍）
- **人名口径（用户 2026-11-06 确认）**：给王妍自己的 bot 提醒卡**保留 `<at>` 和「已通知：<收件人>」**；但**发给下游的卡片上不能出现收件人自己的名字**，也不要署名/代发/触发人。即：卡上写谁只取决于这张卡是发给谁的。

**不要再发纯文本**：一行堆着“应用号：xx；分支号：xx；…”在飞书里会折行 + 把链接拆断（用户 2026-11-05 明确反馈。要发卡片）。

用 `--msg-type interactive` 发一张卡片，四个字段都在正文里，链接做成按钮。**卡片里的状态必须来自第 5 步最后一次检测的真实结果，不能写“应该好了”**：

```
lark-cli im +messages-send --chat-id oc_5e4092c83abb518fcae1e2fcf671c53d \
  --msg-type interactive \
  --content '{"config":{"wide_screen_mode":true},"header":{"template":"green","title":{"tag":"plain_text","content":"发布完成 · <app_id>"}},"elements":[{"tag":"div","text":{"tag":"lark_md","content":"<at id=ou_c4adae1a03c2ef1b6f50404e6d643472></at>\n**应用号**：<app_id>\n**分支号**：<branch>\n**已发布到**：fatXX\n**状态**：SUCCESS（<完成时间>，release <id>）"}},{"tag":"hr"},{"tag":"action","actions":[{"tag":"button","text":{"tag":"plain_text","content":"Captain 发布详情"},"type":"primary","url":"<captain 链接>"},{"tag":"button","text":{"tag":"plain_text","content":"GitLab 分支"},"type":"default","url":"<gitlab 分支链接>"}]}]}' \
  --as bot
```

卡片硬规则：
- 标题 `发布完成 · <app_id>`；多个应用各发一张卡，**不要拼成一长串**。
- `header.template` 三色口径：**发布成功 `green`；未发布/没发出去 `yellow`（镜像未产出、本次不发、已在运行未新建 release、仍在 RUNNING）；发布失败 `red`（FAILED / CANCELED）**。正文“状态”行跟着写对应文字。
- 正文四行固定顺序：应用号 / 分支号 / 已发布到 / 状态，每行一个字段，不要用分号串起来。
- captain 链接和 gitlab 分支链接**不要写进正文**，做成两个按钮（`action` 块）；`--content` 不吃 `@文件名`，必须内联 JSON 字符串。
- 群名对不上（被改名/找不到）→ `im +chat-search --query 程小帮发布群 --as user` 重新解析 chat_id，仍找不到就报给用户，不要换群乱发。
- bot 发到群里的消息**撤不回来**（普通成员无撤回权限），发之前核对链接与分支名。

### 链接口径

- captain：`https://captain.release.ctripcorp.com/app/<app_id>/cluster/<env>/<release_id>/detail?groupId=<group_id>&type=release`
- gitlab 分支：把 `get_application_info.ci_repo`（`git@git.dev.sh.ctripcorp.com:group/repo.git`）转成 `http://git.dev.sh.ctripcorp.com/group/repo/-/tree/<branch>`（仓库直接查 `references/apps.md`，不用每次调接口）
- imvc-vbk 即 `http://git.dev.sh.ctripcorp.com/vacation-web/imvc-vbk/-/tree/<branch>`

## 已知口径（别重新踩）

- 环境名 ≠ group_id：`fat16-captain-100013904` 是 71194615，但同样存在 `fat-1_100013904`、`FAT66_100013904` 这种写法，一律以 `get_groups` 返回的 `id`/`sub_env` 为准，别按名字猜。
- `get_releases` 必须带 `subenv`，取 group 的 `sub_env` 传。
- 镜像 tag 里的分支名是全小写；`image_name` 才是 `gitlab-ci/<app_id>:<tag>`。
- release 从 PENDING 到 SUCCESS 约 2 分钟；超过 5 分钟还在跑，多半卡在卡点，去看详情链接别干等。
- 推送代码到出镜像通常几分钟，十分钟查一次比反复刷有效。
- **gitlab-mcp 的能力边界（2026-11-05 实测）**：`list_project_merge_requests` / `list_merge_request_pipelines` / `list_pipeline_jobs` 可用，但**没有「按 commit 或分支直接查 pipeline」的接口**；`project_id` 直接传仓库路径（如 `vacation-web/imvc-vbk-v2`）就行，不用数字 id。GitLab REST API 不带 token 时本机 curl 返回 404/302，不要指望直连。
- 判断“提交是否真的推上去了”用 `git ls-remote`，它是 GitLab 服务端的真实 head，比本地 `git log` 可靠。

## 别做

- 不改业务代码、不改分支、不 force push。
- 不往 prod 发。
- 不在没有镜像时拿旧镜像冒充满足"已发布"。
- 不给用户没确认过的环境直接发。
- **分支镜像已经在该环境跑着时，不要重复发布**（用户明确说「重发」除外）。同镜像重发只会重启实例，可能打断同组正在测试的人。
- 不在飞书消息里加"程小帮代发/触发人：xxx"这类脚注。

## 最后给用户的报告（这一段是交付物）

- 应用 / 分支 / 提交（短 sha + message）
- 镜像 tag
- 环境：复用了哪个历史环境，或新选的哪个 + 为什么选它
- release：id、状态、captain 链接；**这次没发就直说“该镜像已于 XX 在 fatXX 发布成功，未重复发布”**，不要把已有 release 写成新发的
- 下游通知：发给了谁、原文是什么、message_id；（没指定则写明未发）
- bot 提醒：是否已发到「程小帮发布群」
- 任何没做到的步骤，明确写出卡在哪
- **报告只讲事实，不加未经请求的建议**：不要说“改完再发更省事”“可以少等几轮”这类劝阻/建议。用户让发就发，一轮接一轮也照发，不点评节奏。
