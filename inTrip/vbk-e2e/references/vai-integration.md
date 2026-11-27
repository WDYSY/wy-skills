# vai 集成：用例生成 + 适配层（Step 2）

## vai 在链路里的位置

vai（本机 vai 插件，`vai-cases` 技能）负责**用例内容**：读 PRD + 本地前端代码，生成 TripTest E2E YAML（步骤 + 断言）。productId 在 vai 产物里是 `{PRODUCT_ID}` 占位（vai 规范：待补占位填入前不可执行）——**补齐它正是本技能造数环节的职责**。这正是群里陈亚军说的：「按 productId 生成用例，在 vai 生成用例的基础上，改一下 triptest 的 url 配置的产品 id」。

## 触发方式（2026-11-25 实测契约：走 `vai core`，不是敲 vai cases）

> **2026-11-25 已完整跑通一次**（XLSP-4422）：`ensure-task` → `record-input`（PRD 物化）→ 按 vai-cases 规范产出 3 个 E2E YAML + cases-report → `lint-features.py` OK（仅 `{PRODUCT_ID}` WARN）→ `record-stage` 回执 `sideEffects.usageLocal/moduleExecution/langfuse = ok`、`vai core status` 显示 `cases exec=done artifact=True`。

vai 的设计是「Agent 内编排」：CLI 只暴露工程工具 + 编排接口。所以聚合点是 **`vai core`** 三个命令，且必须在**配好 `.aicoding` 的仓库根目录**下执行。

| 命令 | 作用 | 关键产物/返回 |
|---|---|---|
| `vai core ensure-task --intent-json @intent.json --slug <kebab> [--prd <url>] [--task-id/--new]` | 建/复用任务，把需求归一进任务壳 | `taskId`、`taskDir`（`.aicoding/tasks/changes/<taskId>/`）、`sources.prd`、`inputs/` |
| `vai core run-stage cases --task-id <taskId> [--spawn] [--dry-run]` | 跑用例阶段，拿到本阶段要遵守的 skill 与产物契约 | **brief**（JSON）：`mode=in-context`、`skill=vai-cases`、`runId`、inputs、输出槽位 + **`record-stage` 收尾命令**；`--spawn` 则交给无头子 agent |
| `vai core record-stage cases --task-id <id> --run-id <id> --outputs cases=<path>` | 收尾登记（进度/用量/看板/飞书） | 不登记 = 没真正聚合 |

辅助：`vai core inputs`（看输入源 id）/ `record-input`（回写物化正文）/ `materialize-inputs` / `refresh-inputs` / `input-skip` / `status` / `capabilities --json`。

### 输入归一（idev / PRD / 纯文本都走同一条路）

| 输入形态 | 做法 | 备注 |
|---|---|---|
| idev 链接或 issueKey | `vai bind-idev XLSP-xxxx`；或把 issueKey 写进 intent 文本 | vai 经 iDev MCP 拉需求正文 |
| PRD（飞书 wiki/docx） | `ensure-task --prd <url>` → brief 会把 `feishu:<docId>` 列为待物化 → 写 `inputs/feishu/<docId>.md` 后 `vai core record-input --id <条目id> --kind feishu --path <文件> --source-ref <url>` | 必须写工具返回的**全文**，禁“待物化”占位；也可先用 `lark-cli docs +fetch` 取正文再回写 |
| 纯需求文本 / 群聊描述 | 直接放 intent JSON 的 `intent` 字段 | 最简路径 |
| 已有设计文档 | 路径写进 intent 作为参考 | 不占 `requirement` 槽位（该槽位认 `clarifications/result.md`） |

### 产物契约（brief 强制，别自创路径）

- 槽位 `cases`（必需）：`cases/cases-report.md` + `cases/{hta,e2e,manual}/`（taskDir 相对）；
- E2E 走 `cases/e2e/*.yaml`，TripTest 可直接消费（经本文下面的适配层转换）；
- 写完在同一次收尾里登记：`vai core record-stage cases ... --outputs cases=<cases实际路径>`；失败/部分完成加 `--status failed/partial`。

### 常见提示怎么处理

- **lint**：`cd <CLI 技能目录>/vai-cases && python3 scripts/lint-features.py <taskDir>/cases`（脚本不在仓库里）；`{PRODUCT_ID}` 等待补占位只 WARN 不阻断，但必须在 cases-report 的「E2E 待补执行参数」表里列出来。

- `必需输入槽位未解析到产物 —— requirement`：不阻断。已给够需求（正文/PRD/idev）就继续；真缺就回问用户，**不要编造需求**。
- 配置里 skill 改名提示（`generating-test-cases → vai-cases` 等）：内存生效，不影响本次；抽空在仓库里跑一次 `vai update` 写回配置。
- `多个任务，本会话请钉住`：`export VAI_FE_TASK_ID=<taskId>`，后续命令可省 `--task-id`。

## vai 的 Web E2E 规范（vai-cases v1.2.0 摘要，写用例时遵守）

- 站点判定：商品后台 = Web·C 站（内网域名，非 Trip.com 国际站）；
- 步骤三件套：`aiWaitFor`（稳定态 + `timeout: 20000`）→ `aiAct`（「在哪·对谁·做什么」；主 CTA/提交/确定类点击同级加 `deepThink: true`）→ `aiAssert`（**每条带 snake_case `name`**，如 `treasure01_resource_header_type`）；输入用 `aiInput`（带 `locate`）；
- 断言权威（G6）：断言文案必须有权威来源（需求验收点或页面真实文案），无权威的观察点不写进 E2E；断言内容用**权威原文**；
- `agent.aiActContext` 三段（前置 `@CaseID/@PAGE/@PRIORITY/@TAGS/@sourceId`；流程一句话；断言规则：终止态 + 弹窗浮层处理）；
- 占位符：`{PRODUCT_ID}`（待补，造数后替换）；`{USER_ID}/{PASSWORD}`（永久占位=TripTest 项目全局变量）；**账号不落明文**；
- 关键字白名单：`aiWaitFor`/`aiAct`/`aiTap`/`aiInput`/`aiScroll`/`aiAssert`/`aiNetworkAssert`（只断埋点 key 触发）/`recordToReport`/`sleep`/`aiQuery`；一条用例 `tasks` 长度恒 1。

## 适配层：vai Web 骨架 → 当前 TripTest 契约（web-v1，2026-11-25 实测）

vai 参考骨架的顶层 `web:` 块（`web.url`/`web.loginType`/`viewport`/`location`）是**旧格式**——当前契约已退役顶层 `web`（`validate-case-yaml` 会拦）。落库前按下表转换（转换后的形态已用 `validate-case-yaml` 实测通过）：

| vai 骨架（旧） | 当前契约（web-v1） |
|---|---|
| `web.url` | `tripStarter.config_jump_url`：`'{"jump_type":"navigateTo","url":"<url 替换掉 {PRODUCT_ID}>"}'` |
| `web.loginType: CTRIP`（C 站默认） | **删掉**，改 `tripStarter.cookie`：粘贴从已登录 vbooking FAT 的 Chrome 复制的完整 Cookie 头（含 `vbkticket`/`bticket`，详见 trip-test-contract.md §Web 登录）。**不要**转成 `config_uid_login_info`（带 uid 会触发平台 `cookies[0].value` bug） |
| `aiAssert` 同级的 `name`（vai 规范要求） | **删除**（Web 契约 aiAssert 只开放 `xpath`/`action`/`errorMessage`/`ignoreError`；实测 2026-11-25 带 name 报 `STEP_PARAM_UNSUPPORTED`） |
| （vai 骨架无） | 补 `tripStarter.viewportWidth: 1534` / `viewportHeight: 950` / Chrome151 的 `userAgent`；**不要补 config_init_network/proxy**（参考用例未配，配了反而触发风控） |
| `meta` 不写 appId | 补 `meta.appId: '5072'`、`meta.platform: Web` |
| `meta.aiModelName: qwen3.6-plus`（vai 默认） | 项目 333 口径 `qwen3.8-flash`（config.tripTest.aiModelName） |
| `agent.aiActContext` | 保留（平台落 caseAiContext；更新已有用例时不写则沿用）；`agent.cache` 可留 |
| `web.viewportWidth/Height` | `tripStarter.viewportWidth` / `viewportHeight`（同名平铺） |

其余（flow 步骤、meta.owner）原样保留。转换后必须过 `validate-case-yaml(isNewCase=true, appId=5072, platform=Web)` 再落库。实测兼容项（2026-11-25 验证通过）：`aiWaitFor` + `timeout`、`aiAct` + `deepThink`、`aiAssert` 纯文案、`agent` 块。

## 常见坑

- vai 产物里 `flow[0]` 若有 `tripStarter: null` 启动段（App 骨架）→ Web 用例删除该段，启动参数全部走顶层 `tripStarter`；
- Web flow 内出现 `tripStarter` 是旧写法，校验直接拦；
- 含 `{PRODUCT_ID}` 的 YAML **能通过平台校验**（平台只查 url 以 http/https 开头，2026-11-25 实测）——替换纪律靠本 skill 自律：占位版禁止保存执行，替换后全文 grep 无残留再 validate（顺序：造数 → 替换 → 查残留 → validate → save）；
- `aiAssert` 带 `name` 会被拦（见适配表），适配时删；
- vai 的 `meta.packageNames`（App 用）Web 用例不写。
