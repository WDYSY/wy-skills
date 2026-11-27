# TripTest 侧契约与工具用法（Web 渠道 · appId 5072）

## 硬口径（变更记录在 known-facts.md）

| 项 | 值 |
|---|---|
| 平台入口 | mpaas.ctripcorp.com「AI 测试工具」（TripTest） |
| 项目 | `333`（名「6381商品录入test」） |
| 应用 | `5072` = VBOOKING，平台 `Web-PC` |
| 母版用例 | 主 `1115225` / Web 子用例 `1115226`（2026-11-23 联调实测产物） |
| 既有任务组 | `18870`（子任务 `18871`，WebAi、不装包、挂 1115226） |
| AI 模型 | `qwen3.8-flash`（母版用例同款） |

## 用例 YAML（Web）契约要点

- 顶层 `tripStarter` 与 `meta`、`tasks` 平级；只读 `tasks[0]`；
- **Web 必须有 `tripStarter.config_jump_url`**（JSON 字符串，url 为 http/https）；
- 常用启动参数（`get-case-yaml-contract(platform=Web, appId=5072)` 实测合法）：
  - `config_jump_url`：`{"jump_type":"navigateTo","url":"…"}`（url 必填）
  - `cookie`：**VBK 登录就靠它**（纯 cookie，完整 Cookie 头，见下节 §Web 登录）；同时照抄参考用例的 `viewportWidth 1534` / `viewportHeight 950` / Chrome151 的 `userAgent`
  - `config_uid_login_info`：**不要用**（带 uid 会触发平台 `cookies[0].value` bug，见下节）
  - `config_init_network`：**不要配**（参考用例没配，云端直连内网；配了 proxy 反而触发风控/滑块）
  - 其它可用键：`flybirds_mode`、`create_pay_order_link`、`config_set_abtest`、`config_url_ext`、`config_set_headers`、`config_web_options`、`config_set_storage`、`viewportWidth/Height`、`userAgent`、`location` 等（以 get-case-yaml-contract 输出为准）
- 步骤关键字（写在每步第一个键，主值为自然语言描述）：`aiAct`、`aiTap`、`click`、`aiInput`（需 locate）、`aiScroll`、`aiExecuteScript`、`aiAssert`、`aiDataAssert`、`aiNetworkAssert`、`aiUrlAssert`、`sleep`（数值字符串）、`aiQuery`、`aiWaitFor`、`aiHover`、`recordToReport`（截图留证用）
- meta 建议带：`owner`、`appId: '5072'`、`platform: Web`、`aiModelName: qwen3.8-flash`（新建时落库）

## 工具链（trip-test MCP）

| 动作 | 工具 | 要点与坑 |
|---|---|---|
| 契约查询 | `get-case-yaml-contract` | 每次开跑前刷新；`available=false` 时别凭记忆补 |
| 校验 | `validate-case-yaml(isNewCase=true, appId=5072, platform=Web)` | 新建模式；报错带字段路径与修复示例 |
| 批量落库 | `save-case-yaml-batch(projectId=333, draft=true, items)` | 一批 ≤20 条；dedupe 默认开（同名已存在会标 exists 返回旧 id，要在汇总里告诉用户）；返回 mainCaseId + channels[].runJobCaseId |
| 单条更新 | `save-case-yaml(id=<主用例ID>)` | id 只能是主用例；模式 2 只吃 yamlContent 等，改名会同步全部子用例 |
| 调试执行 | `run-yaml-case` | **Web 只认平台已保存版本**（必须能解析出 executeCaseId），改过 YAML 不重存不生效；jobId 自动推断表只有 Trip/Ctrip/智行，**不含 5072** |
| 建任务 | `save-job-group(projectId=333, jobName=…, subJobList=[{appId:'5072', platform:'WEB', caseList:[…]}])` | platform 枚举是大写 `WEB`；WebAi/不装包自动补；subJobList 是全量声明。**AI 项目必须带 `projectType=1` + `caseSectionIds=[<二级目录ID>]`（目录整选），否则响应里 `caseList` 为空、`caseCount=0`，任务建了也没用例可跑**；更新已有任务时每个子任务要带 `jobType`（否则报“缺少 jobType”）；换上 caseSectionIds 后 executionJobId 会变（取最新那个） |
| 运行 | `run-job(projectId=333, jobId=<executionJobId>)` | jobId 是子任务 ID，不是任务组 ID |
| 轮询 | `get-task-detail(taskId)` → `get-task-case-records(taskId)` | 记录为空（快照批次）时用 `source="snapshot"`，记录 ID 取 latestCaseRecordId |
| 失败取证 | `selfheal_get_failure_context(task_id)` | 证据分类，不直接改用例 |
| 绑计划 | `save-plan-job(planId, jobId=任务组ID, bindPlanJob=true)` | 计划用例跟任务派生；绑定后回读 `get-plan-jobs` |
| 查用例 | `get-cases(projectId=333, caseIds=[…], isDelete=[0,2])` | 默认列表不含草稿，查草稿必须带 isDelete 或 caseIds |
| 建目录 | `save-case-section(projectId, sectionName, parentId)` | 一级=页面、二级=`<idev号>-<需求摘要>`；落库带 `caseSectionId` |
| 挪用例 | `move-cases(sourceCaseIds, targetSectionId)` | 已平铺的用例归位 |
| 建计划 | `save-plan(planName, projectId, platform, tagList, start, end)` | 同项目重名 400；`platform` 与 `tagList` 必须成对传 |
| 转正式 | `batch-update-cases(field=isDelete, value=0)` | **需项目管理员权限**；非管理员只能 `draft=false` 直建 |
| 跑并回写计划 | `run-job(..., mpaasPlanIds=[planId])` | 不带则不回写计划通过率 |

## Web 登录（2026-11-25 云端首次 SUCCESS，task 1720529，85 秒）

**唯一可用：纯 cookie。** 平台参考用例：项目 83 / 用例 **285172「vbk路线库-FAT-12-编辑线路图文详情」**（付俊）——它在 `tripStarter` 里只配 cookie，没有 uid/pwd、也没有 network 配置，能正常跑。

### ① tripStarter 形状（已验证可跑）

```yaml
tripStarter:
  config_jump_url: >-
    {"url":"https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/vendor/priceInventory?productId=<PID>&from=vbk"}
  viewportWidth: 1534
  viewportHeight: 950
  cookie: '<完整 Cookie 头（见下）>'
  userAgent: >-
    Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
```

不要配 `config_uid_login_info`、不要配 `config_init_network`/proxy。

### ② cookie 必须覆盖的字段

`vbkticket`、`bticket`（**VBK 鉴权核心**）、`w_tuid`、`offlineTicket=FAT_…`、`FAT_cas_principal`、`FAT_CCST_SECRET_ADFC`、`FAT_CCST_SECRET_PWD`、`Servers_Eid`、`FAT_Servers_Eid`、`BDUID`、`vbk_login_cid`、`vbk-locale-lang`、`vbk-menu-business-id`、`vbk-menu-business-parameter`、`_RGTOKEN`。

### ③ 怎么拿到 cookie（新使用者自取为主）

cookie 跟**人**和**环境**绑定，不能从技能/仓库/台账复用；每人自己登一次取一份。

| 步骤 | 操作 | 自检点 |
|---|---|---|
| 1 准备账号 | 能登录 vbooking FAT 的**测试商家账号**（VBK）；没有就找测试/产品开，或临时用同事的 | 无账号 → 无法自取 |
| 2 浏览器登录 | Chrome 打开 `https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/accountV2/login`，账号登录取手动登录 | 弹滑块就人工拖——**自动化必被风控** |
| 3 打开待测页 | 访问目标产品页（`...?productId=<PID>&from=vbk`） | 右上角显示账号名，不是登录框 |
| 4 取 Cookie | F12 → Network → 过滤 `20698` → 刷新 → 点任一条 `20698/*` → Headers → Request Headers → 拷 `Cookie:` 整串 | 串里必须有 `vbkticket=`/`bticket=`/`offlineTicket=FAT_`/`w_tuid=`/`FAT_cas_principal=` |
| 5 用 | 整串贴进 `tripStarter.cookie`；productId 必须在**该账号有权看**的范围内 | 过期就回步骤 3 重取 |

其他两条备选：

| 方式 | 做法 | 限制 |
|---|---|---|
| 同事代取 | 让对方按上面 1–4 取一份给你 | 只能看到**他账号**有权看的产品；几小时就过期 |
| 程小帮浏览器扩展 + cdp | 扩展连上后 `Network.getCookies` 导出（含 HttpOnly） | 必须用户装/连扩展；内置浏览器不支持 cdp |

**页面跳回登录页 = cookie 过期**（尤其 `vbkticket`），重新取一份即可；同一 cookie 连败两次就停，不要盲重跑。

### ④ 已证伪的四条路（勿再试）

| 配法 | 报错/现象 |
|---|---|
| `loginType: CTRIP` | `web 登录失败，未取到 tickets`（携程账号不签 VBK 票） |
| `loginType: CTRIPVBK` | `添加登录 cookie 失败：cookies[0].value: expected string, got object`（带了 uid 就触发，平台侧 bug） |
| 步骤里 aiInput 账号密码（proxy on/off 都试） | 弹滑块/拼图验证码「向右滑动填充拼图」——机房出口必被风控 |
| 只塞可读 cookie（`offlineTicket`/`w_tuid`） | 落登录页（缺 `vbkticket`） |

### ⑥ cookie 集中管（启动参数模版）—— 现状：未跑通

目标：cookie 只存一份「启动参数模版」，用例引用模版，过期只改一处。

已验证的部分：
- 模版资产可建：`save-mock-template(projectId, name, paramType='startup', mockData)`，`mockData` 里 cookie/viewport/UA 用 `{key:原值}` 形式，如 `{"cookie":{"cookie":"<串>"},"viewportWidth":{"viewportWidth":"1534"}}`；返回 `mockId`，`get-mock-templates(mockId)` 可回读。
- 引用入口：用例编辑器 → 「执行环境配置」→ 「启动参数」→ 「模版配置」→ 搜模版名 → 「添加」；面板顶部写明「参数卡片打开『使用模版』后可按顺序合并或指定某个模版，关闭则本用例单独填写」——**光添加模版还不够，还得把 Cookie 参数卡片的『使用模版』打开**。

**卡点（2026-11-25 实测）**：`save-mock-template` 建的模版**不带「应用渠道」**（详情里只有 projectId/department，没有 appId/platform），用例里点「添加」报 `应用渠道不一致，无法添加`；往 mockData 里塞 `appId`/`platform` 也无效。模版配置面板只能「搜索已有模版」，**没有新建入口**。

结论：当前只能用「每份用例内联 cookie」（可接受：一 idev 通常 2–3 条）；要走模版，得先拿到带 appId=5072 / platform=Web 的模版（平台「模版管理」入口建，或让平台在 create/update 接口开放渠道字段），然后再逐个用例挂一次 + 开启参数卡片「使用模版」。谁打通了请回写本节。

### ⑤ 本机扩展执行路径的另一类错
`Cannot access a chrome-extension:// URL of different extension` = 别的 Chrome 扩展往页面注入了 iframe/script，midscene 访问被拦。解法：F12 找到注入的 `chrome-extension://{ID}` → `chrome://extensions` 禁用该插件 → 刷新重跑；根治用干净 profile。**只在「本机 Chrome + 扩展」链路出现，云端 WebAi 不会。**

## 用例目录与测试计划（资产组织硬要求）

- **目录（`caseSection`）**：两级 —— 一级 = 页面（例：`价格库存/产品班期`），二级 = `<idev号>-<需求摘要>`（例：`XLSP-4422-旅行交友团人群团`）。**禁止平铺在根目录**。流程：`get-case-sections`（读树）→ `save-case-section`（建/复用）→ 落库带 `caseSectionId`；已平铺的用 `move-cases` 挪。
- **测试计划（`Plan`）**：一个 idev 多条用例 → 一条计划。`save-plan` → 建任务后 `save-plan-job(bindPlanJob=true)` 绑任务 → `run-job(..., mpaasPlanIds=[planId])` 回写。

### ⑦ cookie 失效后怎么维护（N 条用例）

**现状：cookie 内联在每条用例的 `tripStarter.cookie` → N 条用例 = N 处。** 两条「改一处」的路线都已证伪：

| 路线 | 结果 |
|---|---|
| 启动参数模版 | 模版能建、能搜到，但 API 建的模版**无应用渠道**，用例「添加」报 `应用渠道不一致，无法添加`（详见 §⑥） |
| 变量占位 + 任务 ext | `cookie: '{VBK_COOKIE}'` 能过 validate，但 `run-job(ext={'VBK_COOKIE': ...})` **运行时不解析**（task 1720960 落登录页）——ext 只影响环境变量，不注入启动参数 |

所以现阶段靠「**脚本批量刷新**」，不靠人手：

1. `get-cases(projectId=333, caseSectionId=<二级目录ID>, isDelete=[0], pageSize=100)` —— **按目录捞**该需求的全部用例（不按名字猜）；
2. 逐条 `get-case-detail(caseId, includeYaml=false)` 读 `mockConfig.data.*` 现值；
3. 只把 cookie 串换成新的，其它启动参数（jump_url/viewport/UA）原样保留 —— **别整份重建**，否则容易丢参数；
4. `save-case-yaml(id=主用例ID, defaultOnly=false, appId='5072', platform='Web', yamlContent=改后YAML)` 逐条写回（一条一次调用）；
5. **先抽 1 条跑通**（`run-job`）再批量刷剩下 99 条。

100 条 ≈ 100 次调用，脚本化几分钟；人工只在「取新 cookie + 抽 1 条验收」两步。

降低维护量的三个习惯：① 按页面/需求建目录（已强制），cookie 失效只刷受影响的目录；② 同类断言合并成一条用例（一 idev 建议 2–3 条）；③ 等平台开放「模版带渠道」或「项目级全局变量」后回到一套方案（那时真只改一处）。

## 坑（2026-11-25 实测）
| 坑 | 现象 | 解法 |
|---|---|---|
| 页签「灰置」类断言飘 | 同一用例一次 FAIL（AI 认为文字颜色不够淡）、复跑又 SUCCESS | 弱视觉信号不要枚举多个元素：改成单目标（如「价格库存班期」页签禁用）；更稳的是 `aiExecuteScript` 读 DOM 的 `ant-tabs-tab-disabled` class |
| 任务长时间排队 | `queuedCount=N` 持续 10-16 分钟，设备已分配但用例不开跑 | 不是失败；分批/单条调试执行往往更快。演示/定时任务要把排队时长单独算，别与用例时长混为一谈 |
|---|---|---|
| 任务建了 caseCount=0 | `save-job-group` 返回 `caseList: []`，run-job 后无用例执行 | AI 项目补 `projectType=1` + `caseSectionIds`（目录整选），别只传 `caseList[].className` |
| 草稿挂不上任务 | `save-job-group` 报「AI direct 配置的 case 不存在，className=…」 | 任务只能用**正式**用例；先转正（需管理员）或 `draft=false` 直建 |
| 断言枚举了其它选项 | AI 判定「老友团不存在」而失败——线上 lang 实际叫「退休放飞团」 | 只断言目标项（选项名+描述原文），不要写「除了 A/B/C 之外」 |
| 点错元素 | 点日期格子弹了 tooltip，没打开弹窗 | 明写「点按钮本身，不要点日期数字/价格/库存单元格」；历史班期有二次确认，补一步「点『确 认』继续」 |
| cookie 过期 | 页面落登录页 | 重新取 cookie，同一 cookie 不一再重跑 |

## 台账字段（~/vbk-e2e/ledger/<releaseKey>.json）

```json
{
  "releaseKey": "XLSP-5126-节演图片可裁切",
  "idevUrl": "https://idev2.ctripcorp.com/issueDetail/XLSP-5126",
  "createdAt": "2026-11-25T15:30:00+08:00",
  "casesSource": "vai | manual-fallback（含原因）",
  "products": [
    {
      "state": "ready | middle",
      "source": "zaoshutai | list | db | create",
      "templateId": 8527535,
      "sourceProductId": 0,
      "productId": 8880320,
      "subtitle": "XLSP-5126-01",
      "ready": { "valid": true, "online": true, "bookable": true },
      "elapsedSeconds": 142,
      "mainCaseId": 1115225,
      "runJobCaseId": 1115226,
      "caseSectionId": 44346,
      "caseDraft": true
    }
  ],
  "execution": { "jobGroupId": 18870, "executionJobId": 18871, "taskId": 1700362, "result": "FAIL", "reportUrl": "", "failureClass": "login-ticket" },
  "plan": { "planId": 0, "planName": "<idev号>-<需求摘要>" },
  "notes": []
}
```

`failureClass` 四类：`zaoshutai`（造数/复制）、`login`（登录态/账号）、`case`（用例本身）、`page`（页面行为），用于周复盘。

中间态那条必须写清三样：`state: "middle"`、`source`（`list`/`db`/`create`）、`sourceProductId`（复制源）；`ready` 三项照实写 false 并注明「预期未上线」，**别把中间态记成失败，也别当成成品就绪**。
