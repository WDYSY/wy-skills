---
name: vbk-e2e
display-name: VBK 商品后台 E2E（造数→用例→执行）
description: B 端（VBK/跟团游）商品后台页面的端到端测试编排：读 idev/PRD + 学习本地 B 端前端页面 → vai 生成 TripTest E2E 用例（占位 productId）→ 取起点数据 → 替换占位落 TripTest（按页面/需求建用例目录，同一 idev 的多条用例归到一个测试计划）→ 建任务云端执行 → 轮询结果出报告 → 写台账。起点分两类：成品走造数台筛模板一键造数；**中间态（刚新建成功、只点亮销售控制和产品信息两个 tab、未上线未置有效）造数台拿不到，改走产品列表页搜索（兜底查库 prd_product）→ 打开 → 页面点「复制」拿新 productId**。登录用浏览器 DevTools 复制的完整 Cookie（vbkticket 那套，不用账号密码）。用户说「跑 VBK e2e」「商品后台 e2e」「按这个需求/idev 跑 e2e」「造数生成用例」「XLSP-xxxx e2e」「造数台造数出用例再执行」「中间态产品」「未上线/刚建的产品跑 e2e」「TripTest 登录跑不通」时使用。
---

# vbk-e2e · VBK 商品后台 E2E（vai 用例 → 造数 → TripTest → 报告）

一条链路四个角色，程小帮是编排者：

| 角色 | 谁 | 干什么 |
|---|---|---|
| 用例生成 | **vai**（vai-cases，本地） | 读 PRD + 本地 B 端前端代码 → 生成 TripTest E2E YAML：步骤（aiWaitFor/aiAct/aiInput）+ 断言（aiAssert），productId 用 `{PRODUCT_ID}` 占位 |
| 测试数据 | **造数台**（成品）+ **产品列表页/DB → 页面复制**（中间态） | 造数台按特征筛模板一键造数 → 有效/上线/可订的 productId；中间态（刚建好、只亮两个页签、未上线）改为列表页或 DB 找现成产品 → 页面「复制」→ 新 productId（见 [references/seed-data-sources.md](references/seed-data-sources.md)） |
| 用例资产 + 执行 + 报告 | **TripTest**（mpaas AI 测试工具） | ① 资产库：校验 YAML、落库草稿；② 执行引擎：云端 WebAi 跑步骤；③ 报告与自愈：执行记录、报告链接、失败取证 |
| 编排 | 程小帮 | 解析意图、学本地页面、唯一确认点、轮询、台账、异常兜底 |

分工口诀（陈亚军）：**vai 出步骤和断言，造数台出 productId，TripTest 出资产和执行，程小帮串起来。**

**起点有两种，来源不同**（判定与操作全在 [references/seed-data-sources.md](references/seed-data-sources.md)）：成品 = 造数台一键造数（有效+上线+可订）；**中间态 = 刚建好、只点亮「销售控制」「产品信息」两个页签、未上线未置有效**——造数台拿不到，必须去产品列表页（兜底走 DB）找现成中间态产品，打开后点「复制」，用复制出来的新产品当起点。

## 关联模型（本 skill 的核心能力）

方向恒为「**用例 → 造数 → 回附**」：

1. **前置用例先在**（vai e2e YAML / TripTest 已有用例），它的场景（目标页面 + 商品特征：形态/结构/资源…）决定造数台筛什么模板；
2. **造数台产出符合该场景的 productId**（模板复制，副标题 = `<releaseKey>-<序号>`，可回溯）；
3. **productId 附回用例**：替换 YAML 里的 `{PRODUCT_ID}`（已有正式用例则复制一条改 URL 里的 productId）；替换后全文 grep 确认无 `{PRODUCT_ID}` 残留 → validate → 落 TripTest（用例名带 productId，双保险回溯）；
4. **台账物化关联**：`~/vbk-e2e/ledger/<releaseKey>.json` 一行串起 `templateId ↔ productId ↔ mainCaseId/runJobCaseId ↔ taskId ↔ reportUrl`，任一环节可回溯另一端。

替换纪律（2026-11-25 实测发现）：**带 `{PRODUCT_ID}` 占位的 URL 能通过平台校验**（平台只查 url 以 http/https 开头），所以替换是 skill 的自律动作——占位版禁止保存执行，替换后必须无残留再 validate。

## 配置（先读，一切的口径来源）

运行配置在 `~/vbk-e2e/config.json`，**加仓库（本地路径 + GitLab URL）、加页面（pageKey + urlTemplate）、改平台口径只改这个文件，不改技能**。Step 0 读取；不存在时把技能里的 [templates/config.template.json](templates/config.template.json) 复制到 `~/vbk-e2e/config.json`，**先跟用户确认 `repos[].localPath` 的真实际径**再继续。默认值：仓库 `imvc-vbk`（复杂版）+ `imvc-vbk-v2`（简版 6381），页面 `priceInventory`（已验证）+ `baseInfoMerge`（已验证），TripTest 项目 333 / appId 5072 / FAT，台账在 `~/vbk-e2e/ledger/`。

**登录不需要本地凭据文件**：cookie 每次问用户要（见 §登录口径），不落盘、不进仓库。旧的 `~/vbk-e2e/credentials.json` 已废弃。

## 输入形态（按优先级）

1. **前置用例**（关联模式，优先）：vai 生成的 e2e YAML（`{PRODUCT_ID}` 占位）/ TripTest 已有用例 ID（`mcp__get-case-detail` 读出 YAML 与场景）/ 用例描述文本——**从用例反推造数场景**，再去造数台找符合场景的产品 ID 附进用例；
2. **idev 链接**：`mcp__iDev2-issue-get(issueKey, include=feishuDoc)`，先经 Step 2 由 vai 生成用例，再走同一条关联路；
3. **PRD / 需求文本**：直接贴正文或飞书 docx 链接（lark-cli `docs +fetch`）；
4. **直接给筛选条件 + 页面 + 断言**。

releaseKey 默认 = `<idev号>-<标题摘要>`（如 `XLSP-5126-节演图片可裁切`），副标题、用例名、台账文件名都用它。

## 就绪自检（Step 0，七件，任一不过先报告再问要不要继续）

| 检查 | 怎么做 | 判据 |
|---|---|---|
| trip-test MCP | 调 `mcp__get-case-yaml-contract(platform=Web, appId=5072)` | `found: true`；调不通 → 停，让用户装 Trip.Test 插件或 `vai mcp install` |
| 本地仓库 | 逐个核 `config.json` 的 `repos[].localPath` 存在 | 缺哪个报哪个路径；换机器/挪目录改 config |
| 造数台登录态 | browser-control 打开 `http://tour.product.tools.fws.qa.nt.ctripcorp.com/zaoshutai/` | 被 302 到 `/accounts/login`/CAS → 停，请人扫码后继续；**绝不代填账号密码** |
| 中间态来源可用性（起点要中间态时才查） | 浏览器打开产品列表页 `…/ivbk/vendor/productListMerge?from=vbk`（与产品页同域，复用 VBK cookie）；要 DB 兜底时再用 DOT 试查 `pkgproductdb.prd_product_0` | 列表页落登录页 → 先按 §登录口径 要 cookie；DOT 查不通 → 只走列表页路径，别硬查库 |
| vai 可用性（**必需**） | `vai --version` + 仓库里有 `.aicoding/`（否则先 `vai init`） | 缺 CLI → `vai update`/安装；未 init → 在仓库跑一次 `vai init`；**两者都不可用才能走 manual-fallback** |
| 其他 MCP（按输入形态） | idev 输入 → `mcp__iDev2-issue-get`；PRD 链接 → lark-cli `docs +fetch` | 缺哪个就少哪条读取路径，可让用户贴正文代替 |
| 平台写权 | 建用例/任务不需要管理员；**建目录、草稿转正式、删除用例/目录需项目管理员** | 非管理员：目录改用已有目录（或请管理员建），用例直接 `draft=false` 建，删除动作交给管理员 |
| **登录 cookie（VBK FAT）** | 问用户要，并确认来源（见 §登录口径「自取五步」） | 没 cookie 就不要往下走：要么用户自取（推荐），要么拿同事一份——**别把取 cookie 拖到 Step 6 才提**，否则用例写完才发现跑不了 |

### 登录口径（2026-11-25 已跑通，**别再试账号密码**）

VBK FAT 云端执行只能用**纯 cookie**，详细字段与取得方式见 [references/trip-test-contract.md](references/trip-test-contract.md) §Web 登录。三条硬要求：

1. `tripStarter.cookie` 粘浏览器 DevTools 复制的**完整 Cookie 头**（关键 `vbkticket`/`bticket`/`w_tuid`/`offlineTicket=FAT_…`/`FAT_cas_principal`/`FAT_CCST_SECRET_PWD`/`Servers_Eid`/`FAT_Servers_Eid`）；
2. **不要配** `config_uid_login_info`，**也不要配** `config_init_network`/proxy；
3. 照抄参考用例的 `viewportWidth 1534` / `viewportHeight 950` / Chrome 151 的 UA。

cookie 来源：让用户在**已登录 vbooking FAT 的 Chrome** 里 F12 → Network → 任一 `20698/*` 请求 → Request Headers 的 `Cookie:` 整串发来；或连上浏览器扩展后用 CDP `Network.getCookies` 自己取。`vbkticket` 等是 HttpOnly，`document.cookie` 与内置浏览器抓包都读不到。

**已证伪的四条路（不要再试）**：`loginType: CTRIP` → 未取到 tickets；`loginType: CTRIPVBK` → 平台 `cookies[0].value: expected string, got object`；步骤里 aiInput 账号密码 → 滑块/拼图验证码；只塞可读 cookie（offlineTicket/w_tuid）→ 落登录页。页面跳回登录页 = cookie（尤其 `vbkticket`）过期，重新取一份即可，**不要反复重跑**。

### 新使用者：cookie 从哪来（自取五步）

cookie 跟**人**、跟**环境**绑定，不能从仓库/技能/别人那儿直接复用（会过期，且只能看到那个账号有权看的产品）。标准做法是自己登一次、自己取一份：

1. **准备账号**：一个能登录 vbooking FAT 的**测试商家账号**（VBK 账号）。没有就找测试/产品开一个，或让对方给一份他的 cookie（应急，受他账号权限限制）。登录入口：`https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/accountV2/login`
2. **浏览器登录**：用 Chrome 手动登录（「账号登录」页签；可能弹滑块，人手拖一下就行——**这一步只能人做，自动化必被风控拦**）。
3. **打开待测页**：访问你准备跑的产品页（如 `.../priceInventory?productId=<PID>&from=vbk`），确认右上角已显示账号名（不是登录框）。
4. **取 Cookie**：F12 → Network → 过滤框输 `20698` → 刷新页面 → 点任一条 `20698/*` 请求 → Headers → **Request Headers** → 复制 `Cookie:` 后面**整串**。
5. **自检后使用**：粘进 `tripStarter.cookie` 前先看串里必须有 `vbkticket=`、`bticket=`、`offlineTicket=FAT_`、`w_tuid=`、`FAT_cas_principal=`（缺 `vbkticket` 就是没登上/取错域，重来）；用例里的 productId 必须在**这个账号有权限**看的范围内。

时效：会话级（几小时到一天）；跑挂落登录页就回到第 3 步重取。cookie **只进 TripTest 平台用例**，不写进 `config.json`、台账、仓库、聊天记录。

## 主流程（八步）

### Step 1 解析意图 + 学习本地 B 端页面

1. 读输入（前置用例 / idev / PRD），产出意图 JSON（契约与受控词表见 [references/intent-schema.md](references/intent-schema.md)）：**从前置用例反推场景**——`agent.aiActContext` 前置段（@PAGE/登录态/关键测试数据）、flow 步骤文案、URL 里的页面与参数，都是 filters 的来源；`filters` 只从受控词表取值，映射不上标 unresolved 交人，**禁止自造枚举**；
2. **学页面**（方法见 [references/pages.md](references/pages.md)）：用需求关键词 grep `config.json` 里的本地仓库（页面都在 `src/ivbk/pages/<pageKey>/`），定位需求对应的页面目录，从代码里找断言文案的权威来源（页面 lang key / 中文提示语）；**前端只是渲染后端结果的地方（页签点亮、状态、能否复制）去后端仓 `product-input-service` 查真源**（见 [references/backend-reference.md](references/backend-reference.md)）；`urlTemplate` 优先用 `config.json` 的 `pages[]`，没有/待确认的按 URL 推导规则定候选并请用户确认，跑通后回填 config；
3. `targets[]` 每条例 = 页面 + urlTemplate + 断言点（断言来自需求验收点或页面真实文案，不编造）。

### Step 2 vai 生成 e2e 用例（**默认且必需**，本地，占位 productId）

> 完整命令契约、输入归一表、产物路径见 [references/vai-integration.md](references/vai-integration.md)。

**vai 是默认路径，manual-fallback 只能当备选。** 开工时先向用户声明走哪条，并记入台账 `casesSource`。

聚合方式是三件事：**① `vai core ensure-task` 把任意形态的需求归一成任务（含输入物化）→ ② `vai core run-stage cases` 拿到本阶段的 skill 与产物契约 → ③ 按契约产出后 `vai core record-stage` 收尾登记**。三步都跑完才算“vai 参与了”，只写用例不登记 = 没聚合。

```bash
# 必须在配好 .aicoding 的 B 端仓库里执行（cd <repo> 先）
vai core ensure-task --intent-json @intent.json --slug <releaseKey-kebab> [--prd <PRD url>]
#   idev 输入：先 `vai bind-idev XLSP-xxxx`，由 vai 经 iDev MCP 拉需求
#   → 返回 taskId / taskDir（.aicoding/tasks/changes/<taskId>/）

vai core run-stage cases --task-id <taskId>
#   → 返回 brief：mode=in-context、skill=vai-cases、inputs、输出槽位与 record-stage 命令

# 按 brief 执行完（必须先加载 vai-cases skill，产物落 cases/cases-report.md + cases/{hta,e2e,manual}/），再收尾：
vai core record-stage cases --task-id <taskId> --run-id <runId> --outputs cases=<cases实际路径>
```

**输入不一定是 idev**——三种形态都走同一条路（详见 vai-integration 的输入归一表）：

| 输入 | 怎么进 vai |
|---|---|
| idev 链接 / issueKey | `vai bind-idev XLSP-xxxx`（或 ensure-task 的 intent 里写 issueKey） |
| PRD（飞书 wiki / docx） | `ensure-task --prd <url>` → 物化成 `inputs/feishu/<docId>.md`，用 `record-input` 回写全文（可直接用 lark-cli fetch 的正文） |
| 纯需求文本 / 群聊描述 | 直接写进 intent JSON 的 `intent` 字段 |
| 已有设计文档 | 路径写进 intent，作为参考（不占用 requirement 槽位） |

**什么时候才允许 manual-fallback**（任一，且必须写进台账）：vai CLI 缺 / 仓库未 init（无 `.aicoding`）/ `run-stage` 失败且重试一次仍失败 / 产物不可用（`cases/e2e/` 为空或断言无权威来源）。除此之外**一律走 vai**。

vai 产物规范要点：`aiWaitFor`（稳定态）+ `aiAct`（主 CTA 加 `deepThink: true`）+ `aiAssert`；productId 用 `{PRODUCT_ID}` 占位（填前不可执行）。

- **适配层**：vai 的 Web 骨架（顶层 `web.url`/`web.loginType`）是旧格式，当前契约已退役顶层 `web`——按适配表转成 `tripStarter.config_jump_url` + `cookie`（完整 Cookie 头，见上文登录口径）+ `viewportWidth/Height` + `userAgent` + `meta.appId '5072'`，再进入 Step 6；
- **兜底**（vai 不可用或产出不适用）：用 [templates/case-template.yaml](templates/case-template.yaml) 按 vai 同款步骤规范手写最小用例。

### Step 3 人工确认点（全程唯一）

AskUserQuestion 一次回显：命中的模板（ID/标题/标签）、造几个（默认 1、上限 5）、每条例的 URL 与断言、vai 生成的步骤预览。确认或改一行后继续，后续不再逐步询问。

### Step 4 取起点数据（先分流：成品走造数台 / 中间态走列表页或 DB + 复制）

**先定这次要哪种起点**（完整判定表、操作步骤与红线见 [references/seed-data-sources.md](references/seed-data-sources.md)）：

| 场景信号 | 起点 | 走哪条 |
|---|---|---|
| 已上线 / 可订 / 分销可见 / 预览 | 成品（有效+上线+可订） | A 造数台一键造数 |
| 新建后 / 未上线 / 产品制作中 / 配置流程 / 说不清 | **中间态**（只亮「销售控制」「产品信息」两个页签） | B1 列表页搜索 → 打开 → 「复制」；搜不到再 B2 DB 兜底 |

两种都先查台账：`~/vbk-e2e/ledger/` 里已有「同场景 + 同起点状态」的产品可复用就先复用（需用户在 Step 3 确认）。

**A 造数台造数（成品）**：browser-control 按 filters 勾选 → 选模板 → 「一键造数」→ 副标题填 `<releaseKey>-<序号>` → 「开始复制」。前后各留一张截图。（细节见 [references/zaoshutai-guide.md](references/zaoshutai-guide.md)）

**B1 中间态 · 找源产品 + 页面复制（主路径）**：打开 `…/ivbk/vendor/productListMerge?from=vbk` → **先切到「全部」页签**（默认停在「有可售班期」，中间态产品没班期，在默认页签搜永远「暂无数据」）→ 在「产品IDs」框（`data-testid="product-id-search"`，支持逗号分隔）填候选 → 「查询」→ 点开行（或直接 `baseInfoMerge?productId=<ID>&from=vbk` 直开）→ **确认只剩「销售控制」「产品信息」可点、header 有「复制」** → 点「复制」→ 确认框点「确定」（锚点 `data-testid="copy-popconfirm"`）→ 等异步任务出新产品（草稿 ID ≥2e9；**前端自动开窗可能被拦，用 DB 或直接开新 ID 确认**）→ 把名称/副标题改成 `<releaseKey>-<序号>` 并保存。实测清单见 [seed-middle-state-measured.md](references/seed-middle-state-measured.md)。

**B2 中间态 · DB 兜底**：DOT 查 `pkgproductdb.prd_product_<ProductID%16>`（`VendorID` = cookie 账号的供应商，`IsDeleted='F' AND IsAbandoned='F' AND IsOnline<>'T' AND Active='F'`，按 `DataChange_LastTime` 倒序）→ 拿 ID 回 B1 打开。**DB 只负责缩范围，页签与「复制」按钮必须在页面上核**；别 16 片一次性 UNION（会超时）。

**B3/B4**：造数台若存在「只复制不补齐」的入口可用（未验证）；最后兜底才是页面新建（只填销售控制 + 产品信息）。

**一对一派生（用例里有写操作时必须）**：多个场景不能共用一个副本——写操作会推进后端 step，中间态就没了。两种做法：

- **A 链式复制（优先，可反复重跑，已实测）**：全部用例都指向**同一个模板产品 P0**，用例开头固定「点『复制』→ 确认 → sleep 20 → 断言产品 ID 已不是 P0」几步，后续都在副本上跑。P0 永远干净；实测 68 秒/条，WebAi 会跟随 `window.open` 跳到新产品页（task 1724888）。
- **B 执行前批量派生（A 不适用时）**：同一源产品连点「复制」N 次 → DB 按 `CreateTime` 窗口捞新草稿 ID → 一用例一个副本；破坏性用例跑完即废，重跑先重新派生。

自己派生/造的产品，名称必须带 **`triptest验证流程产品，勿动！！！`**（复制不继承名称，派生后先改名）。模板 P0 不可用时的兜底表见 [seed-data-sources.md](references/seed-data-sources.md) §一对一派生。

### Step 5 等起点可用（两套判据，别混用）

- **成品（造数台）**：状态链 `已提交 → ID已生成 → 补齐Tab → 有效 → 上线 → 可订 → 就绪`；ID 约 30 秒出但**页面提示「尚未就绪，请暂勿使用」，不许写入用例**；有效+上线+可订三项全过才算就绪；间隔 20-30 秒、总超时 5 分钟；失败重试一次仍败 → 截图 + 台账 + 停止上报。
- **中间态（复制）**：不等上线，五条全过即可用：① ID 是数字且页面能正常打开；② 页签状态符合预期（源产品=只有「销售控制」「产品信息」可点；**复制产物通常只有「销售控制」可点，要两页签就在销售控制保存一次**）；③ 源产品确有「复制」按钮；④ 新 ID ≠ 源 ID 且页签状态可复现；⑤ 新产品能保存一次（改名称/副标题）。复制走异步任务（`/15638/productDuplicate.json` → `/15638/getProductDuplicateResult`），60 秒内不出 ID 重试一次，再败即停。台账记 `state:"middle"`，`ready` 三项写 false 并注明「预期未上线，不是失败」。

### Step 6 落 TripTest（角色① 用例资产库，productId 附回用例）

1. **把 productId 附回用例**：替换 YAML 里全部 `{PRODUCT_ID}`（URL、用例名、aiActContext）；替换后全文 grep 确认无 `{PRODUCT_ID}` 残留（占位版禁止保存）；已有正式用例不想新建时，复制一条改 URL 里的 productId（陈亚军原路线）；
2. 登录走 `tripStarter.cookie`（见 Step 0 登录口径），**不要**再注入 uid/pwd；
3. 逐条 `mcp__validate-case-yaml(isNewCase=true, appId=5072, platform=Web)`，按返回字段路径修，修不过不落库；
4. **先定目录再落库（禁止平铺在根目录）**：`mcp__get-case-sections(projectId=333)` 读现有树 → 按「**一级=页面**（如 `价格库存/产品班期`）→ **二级=需求**（如 `XLSP-4422-旅行交友团人群团`）」两级建/复用目录（`mcp__save-case-section(projectId, sectionName, parentId)`；找不到用例所属页面的归类就放「其它页面」并在台账记一笔）→ 落库时带 `caseSectionId=<二级目录ID>`；已落库的平铺用例用 `mcp__move-cases(sourceCaseIds, targetSectionId)` 挪进去；
5. `mcp__save-case-yaml-batch(projectId=333, draft=true, items=…, caseSectionId=<二级目录ID>)`，用例名 `<releaseKey>-<页面要点>-<productId>`；
6. **一个 idev 的多条用例必须归到一个测试计划**：`mcp__save-plan(planName=<idev号>-<需求摘要>, projectId=333, platform=['Web'], tagList=[{tagName:'platform', tagValue:'Web'}], start/end, status=5)` → `mcp__save-plan-job(planId, jobGroupId=<Step 7 的任务组ID>, bindPlanJob=true)`；计划用例是跟任务派生的，**先建任务再绑计划**；同一 idev 已有计划就复用（`mcp__get-plans(projectId, planName)` 先查）；
7. mainCaseId / runJobCaseId / caseSectionId / planId 写台账（与 productId 同一条记录 = 关联）。默认**草稿**（草稿不能挂任务，见 §坑）；要跑就先确认权限，再按需转正式。

### Step 7 执行（角色② 云端执行引擎 + 角色③ 报告与自愈）

提交前确认执行账号问题已解决，否则半程模式收尾。Web/H5 云端执行只认**平台已保存版本**，改过 YAML 必须重存再跑；appId 5072 不在 run-yaml-case 的 jobId 推断表里，走任务路线：

1. `mcp__save-job-group(projectId=333, jobName=<releaseKey>-e2e, subJobList=[{appId:'5072', platform:'WEB', caseList:[{className:<runJobCaseId>, caseIndex:1, enableFolder:false}]}])`（WebAi/不装包自动补齐）；
2. 若这次属于某个测试计划，先 `mcp__save-plan-job(planId, jobId=<任务组ID>, bindPlanJob=true)` 把任务挂到计划上（计划用例随之派生）；
3. `mcp__run-job(projectId=333, jobId=<executionJobId>, mpaasPlanIds=[<planId>])` → taskId（**从计划视角跑必须带 mpaasPlanIds，否则结果不回写计划**）；
4. 轮询 `mcp__get-task-detail(taskId)` 到终态；`mcp__get-task-case-records(taskId)` 取报告链接（记录为空时 `source="snapshot"`）；
5. 失败 → `mcp__selfheal_get_failure_context(task_id)` 取证分类，**不直接改写用例步骤**。失败分类：`登录/cookie`（`cookies[0].value: expected string` = 配了 uid；落登录页 = cookie 过期）→ 换 cookie 重跑一次；`断言文案与线上 lang 不一致`（例：`老友团` 线上叫 `退休放飞团`）→ 断言别枚举其它选项、只断言目标项；`点错元素`（点到日期格子的 tooltip）→ 改成点按钮本身并补兜底步骤。

### Step 8 台账与收尾

- 台账写 `~/vbk-e2e/ledger/<releaseKey>.json`（字段见 [references/trip-test-contract.md](references/trip-test-contract.md) §台账）；
- 收尾汇总：通过率、报告链接、起点产品清单（productId / 起点状态 / 来源 / 模板或源 productId / 副标题）、失败分类、清理建议（**清理造数产品和复制出来的中间态产品都是破坏性动作，只建议、必问后执行**）。
- 页面 URL 是本次确认/推导出来的 → 回填 `~/vbk-e2e/config.json` 的 `pages[]`（`status` 改 `verified`）。

## 默认约定与红线

| 项 | 默认 |
|---|---|
| 环境 | FAT（config.tripTest.env + proxy） |
| 用例保存 | 草稿（isDelete=2）；草稿**不能挂任务**，要跑就得是正式用例，转正需项目管理员权限 |
| 用例目录 | 两级：一级=页面、二级=`<idev号>-<需求摘要>`；**禁止平铺在根目录** |
| 测试计划 | 一个 idev 一条计划，名下用例全挂进去；从计划视角跑必带 `mpaasPlanIds` |
| 登录 | 纯 cookie（`vbkticket` 那套）+ viewport 1534×950 + Chrome151 UA；不配 uid/pwd、不配 network/proxy |
| 造数数量 | 每份 PRD ≤5（config.defaults.maxCount），默认 1 |
| 起点状态 | 场景说清楚才选；说不清默认**中间态（复制）**，断言里含「可订/上线」才走造数台成品 |
| 复制源 | 列表页/DB 找到的源产品**只读**：不保存、不提交、不上线；写入只落复制出来的新产品 |
| 写用例 | **一场景一副本**；优先链式复制，否则执行前批量派生；`destructive: true` 写进台账 |
| 自造数据命名 | 名称带 `triptest验证流程产品，勿动！！！`；复制不继承名称，派生后先改名 |
| 清理 | 只删本次派生的副本，删前列 ID 清单请人确认；源产品与别人的产品不动 |
| 并发 | 造数与执行串行，一次一个 |
| 凭据 | 登录 cookie 只进 TripTest 平台用例；不进台账、日志、技能仓库。`~/vbk-e2e/credentials.json` 已随账号密码方案废弃，仅留作历史 |
| 破坏性动作 | 删除数据/清理产品/覆盖更新任务 → 必问 |
| 停机条件 | filters 映射不上、多模板无法收敛、用户浏览器登录态失效（要用户自己登录后给 cookie）、造数重试一次仍败、同一 cookie 连败两次、用例校验修不过 |

## 给别人用之前（移植检查清单）

技能本身可直接分享，但下面这些是**使用者侧**必预条件；逐条先确认，否则一定卡：

| # | 卡点 | 判断方式 | 处理 |
|---|---|---|---|
| 1 | **trip-test MCP** 未接 | `get-case-yaml-contract(platform=Web, appId=5072)` 调不通 | 装 Trip.Test 插件或 `vai mcp install`；没它整个链路跑不了 |
| 2 | **本地仓库路径** | `config.json` 的 `repos[].localPath` 不存在 | 只有度假 VBK 前端才能做「学页面」；无仓时用用户口述的页面文案代替，并在台账标 `pageSource=user` |
| 3 | **平台写权** | 建目录/转正/删除报「非当前项目管理员」 | 非管理员：借已有目录、`draft=false` 直建、删除交管理员 |
| 4 | **项目口径** | 当前写死 项目 `333` / appId `5072` / 模型 `qwen3.8-flash` | 换应用/项目要同时改：`save-case-yaml-batch(projectId)`、`save-job-group`、`save-plan`、`meta.appId`、`meta.aiModelName` |
| 5 | **登录 cookie** | 页面落登录页 | 每人**自己**取一份（cookie 绑个人账号与权限）；别人给的 cookie 不一定能看同一批产品 |
| 6 | **造数台登录态** | 302 到 CAS | 使用者自己扫码；没造数台也能跑——直接借现成产品（台账或用户指定） |
| 7 | **写数据副作用** | 用例含保存/提交类操作 | 跑前确认目标产品可写；模板产品（「勿动模板」）写入前**必须问用户** |
| 8 | **本机扩展执行** | `Cannot access a chrome-extension:// URL` | 用户侧扩展冲突：禁用冲突扩展或用干净 profile；云端 WebAi 不会碰这个错 |

另外：台账目录默认 `~/vbk-e2e/ledger/`、配置 `~/vbk-e2e/config.json` 都是**每个使用者本机**的，随技能分享并不携带任何人的配置/cookie/台账。

## 硬口径（会变的事实）

- 可配置的（仓库/页面/平台 ID/数量默认）：`~/vbk-e2e/config.json`；
- 历史事实与联调证据（母版用例 1115225/1115226、任务组 18870/18871、当前阻塞等）：[references/known-facts.md](references/known-facts.md)；
- 起点数据（成品 vs 中间态）的判定、列表页/DB 搜索与「复制」操作：[references/seed-data-sources.md](references/seed-data-sources.md)；
- 中间态链路的实测结论与现成样本产品（fat29）：[references/seed-middle-state-measured.md](references/seed-middle-state-measured.md)；
- 后端口径（页签点亮=step、复制实现、草稿/正式）：[references/backend-reference.md](references/backend-reference.md)。
