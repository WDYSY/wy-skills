# 已验证事实与硬口径（改动前先更新本文件）

> 本文是 skill 的「事实层」：流程文件不写死数字，都用这里的口径。每次跑通/失败后把新事实记进来。

## 任务背景

- 需求方：陆生辉（2026-11-20 派调研「VAI 生成 e2e 用例是否适用于商品后台」→ 落地为「造数→用例→执行」skill 跑通）
- 方案与联调：陈亚军；方案文档（飞书 wiki `KAGnwudbiiwWumkQPeYcJTFKnse`，2026-11-23）：`PRD 到造数到用例的 E2E 方案（程小帮为入口）`
- 群：商品后台端到端测试讨论群（chat_id `oc_32a06dde6442f2a2ed26c84c8a1cda52`）

## P0 样本需求

- **XLSP-5126「节演图片可裁切」**（https://idev2.ctripcorp.com/issueDetail/XLSP-5126 ）
  - P0 Story，空间 XLSP（旅游_团队游_线路商品后台空间），父需求 VCP-6644（后台裁切预览调整&质量分计算调整）
  - 描述：图片来源 11 位节演图片，现状不可裁切 → 需变为可裁切、可裁切图片来源可配置
  - 前端 = 王妍，测试 = 张江英，状态 = 完成（2026-11-23）
  - **页面已定位**（2026-11-25 本地仓学习）：`imvc-vbk-v2/src/ivbk/pages/multiMedia/`——`productMediaList/`（图片列表页）、`component/PicCut.tsx` / `PicCutLegacy.tsx`（裁切组件）、`util/cutSource.js`（可裁切来源配置）；URL 待 P0 确认（config.pages 的 todo-confirm 条目）
- XLSP-5126 **没有跑过 vai 的 e2e**：本机 vai 任务目录 `imvc-vbk-v2/.aicoding/tasks/changes/20261123-xlsp-5126-cut-source-cases/` 是空壳（prd/clarifications/inputs/cases 全空、无 e2e 目录）；TripTest 项目 333 也无对应用例。

## TripTest 硬口径

> **口径真源已迁 `~/vbk-e2e/config.json`**（用户可编辑；仓库/页面/平台 ID/默认值都在那）。本表保留为快照，冲突以 config 为准。

| 项 | 值 |
|---|---|
| 平台入口 | https://mpaas.ctripcorp.com 「AI 测试工具」 |
| 项目 | `333`「6381商品录入test」 |
| 应用 | appId `5072` = VBOOKING；平台 Web-PC |
| 母版用例 | 主 `1115225` / Web 子 `1115226`「商品录入基本信息校验-请至少输入一个服务人员信息-造数8527546」（陈亚军建） |
| 既有任务组 | `18870`「造数8527546-Web验证」/ 子任务 `18871`（WebAi、不装包、timeout 60、挂 1115226） |
| 页面 URL 模板 | `https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/vendor/baseInfoMerge?productId={productId}&from=vbk`（用例 1115225 实存口径；编辑器截图另见 `/vbk/vendor/` 变体——**跑前和用户确认用哪个**） |
| 登录 | uid `vb30804`（VBK 账号，loginType 可用 CTRIPVBK），密码只在平台用例里维护 |
| FAT 网络代理 | `socks5://10.122.128.5:1080` |
| AI 模型 | `qwen3.8-flash` |

## 登录：已解除（2026-11-25）

2026-11-23 的「云端取不到登录票据」**已解决**，方案是**纯 cookie**（不再用账号密码）。完整配方、必带字段、四条已证伪路径都在 [trip-test-contract.md](trip-test-contract.md) §Web 登录。

- 发现路径（方法论）：本项目内 5072(VBOOKING) 用例**没有任何一条有成功记录**（项目 333 的 10 条 + 项目 304 的 1 条，`latestSuccessTime` 全空）——去**别的项目**找同应用的可用模板，最终靠用户给的 **项目 83 / 用例 285172** 打通。
- 首条云端 SUCCESS：task 1720529（XLSP-4422 批量/预设弹窗，85 秒）。
- `~/vbk-e2e/credentials.json`（uid vb30804/pwd）随账号密码方案**已废弃**，仅留作历史。
- 造数台登录态仍靠人扫码维持，无接口凭据。

## 2026-11-26 中间态起点（新增数据源，读码 + DB 实测）

- **中间态定义**：「刚新建成功，顶部页签只点亮『销售控制』『产品信息』」。页签由后端 `getSubMenu`（SOA 15638）下发，前端只按 `menus[].enabled == 'F'` 置灰（`imvc-vbk/src/ivbk/publicComponent/SubMenu.js:961`）——所以「只亮两个」是后端算的，前端无本地判定。
- **复制入口**：header 右上「复制」按钮，出现条件 `meta.isBaseInfoSwitched == 'T'` 且非子产品（6381 还要求 `vendorId === 0`），合同失效（`canEdit === 'C'`）不允许复制（同上文件 :744）。确认框「确定」带 **`data-testid="copy-popconfirm"`**（:768）——稳定的 E2E 锚点。
- **复制接口与落点**：`POST /15638/productDuplicate.json {productId, allowAsync:true[, copyChildren]}` → `taskId` → 轮询 `/15638/getProductDuplicateResult`；成功后 toast「复制成功」，约 1 秒自动打开 `/ivbk/vendor/saleControlMerge?from=<from>&productType=0&productId=<newProductId>`（:1041-1110、:1075）——复制产物天然就是中间态。
- **产品列表页**：`/ivbk/vendor/productListMerge?from=vbk`（同域，同 cookie）；「产品ID」输入框支持逗号分隔，「上线状态」「有效」可筛（`pages/productListMerge/component/SearchForm.js`）。
- **DB 兜底字段**（`pkgproductdb.prd_product_0..15`，`shard = ProductID % 16`，fat 可读）：`VendorID / Active / IsOnline / IsDeleted / IsAbandoned / CreateTime / DataChange_LastTime / Name / productVersion / InputLocale`。中间态候选：`Active='F' AND IsOnline='F' AND IsDeleted='F' AND IsAbandoned='F'` + `Name` 空/很短 + 创建时间近。
- **fat 实测样本（VendorID 30804，shard 0，2026-11-26 查）**：**两页签中间态 = `8911072` / `8909984`**（只有销售控制+产品信息可点，header 有「复制」）；`8913824` / `8912256` 虽然 DB 字段一模一样（Active=F/IsOnline=F/Name 空），实测却是 5 个页签可点且**无「复制」** → **DB 条件只能缩范围，页签与复制按钮必须页面核**；`8911120` 是 Active=T/IsOnline=T 成品。
- **复制产物**（本次模拟 8911072 → `2145289681`）：草稿 ID ≥ 2e9、`Active='D'`；打开后前端把 baseInfoMerge 重写到 `saleControlMerge`；页签**只有「销售控制」可点**（比源早一档）；前端 `window.open` 新窗口在内置浏览器下可能被拦 → 用 DB `CreateTime` 或直接开新 ID 确认。
- **列表页**：`/ivbk/vendor/productListMerge` 会被重写到 `/product/input/productListMerge?from=vbk`；产品ID 输入框 `data-testid="product-id-search"`，**能搜，但必须先切到「全部」页签**（默认停在「有可售班期」，中间态产品无班期，默认页签下搜永远「暂无数据」）。实测（2026-11-26 复测）：切「全部」→ 填 `8911072` → 查询，能出结果（`自由行/境内短途旅游｜产品尚未审核通过｜无启用｜无效 下线`）。
- 详细实测记录：[seed-middle-state-measured.md](seed-middle-state-measured.md)。
- **两个必须记的边界**：① 中间态不能写「可订/上线」类断言；② 源产品只读，写入只落复制出的新产品，且新产品必须改名 `<releaseKey>-<序号>` 才能回收。
- **链式复制实测可行（2026-11-26，task 1724888）**：用例只指向模板 `2145289661`，用例内点「复制→确定→sleep 20」→ WebAi **跟着 window.open 跳到了新产品** `2145289656`，「产品 ID 不再是 P0」断言通过，68 秒 SUCCESS；模板执行后仍只有「销售控制」可点。结论：**每次执行都会产生一个新草稿产品**，台账要记 taskId ↔ 新产品 ID 并配合清理。

## 2026-11-25 其他实测（XLSP-4422 旅行交友团）

- 页面口径：`priceInventory`「价格库存 → 产品班期」已验证；**默认 tab 是「套餐价格库存」，人群团类型行只在产品班期 tab 内**，用例必须先点页签。
- 造数产物**不继承模板的「是否拼小团」标识**（销售控制里是「否」且单选 disabled，前端不可改）；换模板 7098885 造的 8908649 卡在「待审核转正式数据」，均达不到「拼小团 + 就绪」→ 这类功能直接借用现成的拼小团产品（8616469）。
- in-switch 是**商家维度**：新造产品的 `product_schedule_crowd_group`/`product_default_crowd_group`/`product_crowd_group_single` 均 true。查法（已登录 vbooking 的页面上下文）：`fetch('//online.ctrip.fws.qa.nt.ctripcorp.com/restapi/soa2/20698/inSwitches?subEnv=...',{method:'POST',body:JSON.stringify({inSwitchInputs:[{key,id}]})})`；相对路径会 404。
- 线上 lang 与设计稿可能不一致：`老友团` 实际渲染为「退休放飞团」，`crowdGroup.single` 渲染为「旅行交友团」（PRD 11.4 改名）。断言只写目标项原文。

## 2026-11-23 旧阻塞（已过时，留作历史）

## 2026-11-25 关联实验（核心能力验证，未落库未执行）

三段产物链（XLSP-5126 节演图片可裁切，实验目录在当次会话工作区 `vbk-e2e-experiment/`）：

| 段 | 产物 | 结果 |
|---|---|---|
| 前置用例（vai 原样骨架，`{PRODUCT_ID}` 占位、顶层 `web:` 块、`aiAssert` 带 `name`） | 01-vai-raw-web-block.yaml | ——（旧格式，需适配） |
| 适配后占位版（tripStarter + appId 5072 + 占位 URL） | 02-adapted-placeholder.yaml | 仅 `aiAssert.name` 一处报错（删掉后结构合法）；**占位 URL 能过平台校验** |
| 关联版（附上真实造数 productId 8880320） | 03-linked-product-8880320.yaml | **validate 通过：valid、0 错 0 警**（契约 web-v1） |

两个发现：① vai 规范的 `aiAssert.name` 与 TripTest Web 契约冲突（aiAssert 仅开放 xpath/action/errorMessage/ignoreError）→ 适配层删；② `{PRODUCT_ID}` 占位混在 URL 中能过平台校验 → 替换纪律必须 skill 自律（替换后查残留）。实测兼容项：`aiWaitFor`+`timeout`、`aiAct`+`deepThink`、`agent` 块、`loginType: CTRIPVBK`。

## 2026-11-23 联调已验证（可行性的证据）

| 环节 | 结果 |
|---|---|
| 按 productId 生成用例 | ✅ 主 1115225 / Web 子 1115226 |
| 建 Web 执行任务 | ✅ 任务组 18870 / 子任务 18871 |
| 云端执行 | ❌ 登录票据，未进步骤 |
| 造数台一键造数 | ✅ 模板 8527535 → 8880320，142s，有效/上线/可订全过 |

## 更新时机

- 项目/应用/任务组 ID 变化、URL 模板变化、登录账号变化、造数台页面改版 → 先改本文再跑；
- 每次跑通/失败，把新事实（productId、taskId、报告链接口径）追加进「已验证」表。
