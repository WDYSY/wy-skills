# 后端口径参考（product-input-service，只读）

> 前端只是渲染结果的地方，都去后端仓库查真源。仓库路径在 `~/vbk-e2e/config.json` 的 `repos[]`（key `product-input-service`）。
> 用途：判定「中间态到底卡在哪一步」「复制发生了什么」「草稿和正式怎么分」——**不改它的代码**。

## 1. 页签点亮 = 后端 step，不是数据完整度

链路：`getSubMenu`（`ProductInputServiceImpl.java:1143`）→ `OfflineMenuBiz.getTabMenus`（`tourinfo/biz/OfflineMenuBiz.java:157`）→ 逐个 `buildMenuDto(..., enabled, ...)`，最终 `tabMenuDto.setEnabled(enabled ? "T" : "F")`（同文件 `:424-437`）。

- enabled 的来源是 **`stepBiz.getInitStep(productId, isChild)` 返回的 step**，加上 `productStepBiz.getLowerSteps(...)` 的模块解锁集合（`TraStepEnum` / `TraStepEnumV2` 的 moduleName）；
- 已知阈值（同一方法內）：条款 `step>=4`（`meneResortSwtich` 时 `step>7`）、分销设置与高级设置 `step>=8`、价格库存/套餐 `step>=10`、子产品行程段 `step>=SubDeparture`；
- 结论：**「只点亮销售控制+产品信息」= step 停在最初几步**。想找/造这种起点，看 step 而不是看 DB 里某个字段；DB 没有「step」列，它是 `initStep` 服务算出来的；
- 拿 step 的最快方式：`getSubMenu` 响应里就有 `maxStep`（`responseType.setMaxStep(step)`）——页面里也能从接口响应直接读。

## 2. 复制按钮与复制实现

- 前端可见性：`meta.isBaseInfoSwitched == 'T'` 且非子产品（`imvc-vbk/src/ivbk/publicComponent/SubMenu.js:744`）；
- 后端 `isBaseInfoSwitched()` 在 `ProductInfoBiz.java:1237` **当前直接 `return true`**，`GetProductBaseInfoBiz` 也无条件 `setIsBaseInfoSwitched("T")`（`:147`、`:172`）——所以 2026-11 之后「复制不显示」基本是**子产品 / 产品类型**原因，不是灰度开关；
- 复制接口：`productDuplicate.json`（async，返回 `taskId`）→ `getProductDuplicateResult` 轮询；实现在本仓 `ProductInputServiceImpl` 里搜 `productDuplicate` / `ProductDuplicate`；
- 复制产物是**草稿产品**（ID ≥ 2e9，DB `Active='D'`），到要跑用例时它已经是可用的被测产品。

## 3. 草稿 vs 正式

- 草稿产品 ID 段 ≥ 2000000000（`ProductConstants.DRAFT_PRODUCT_START_ID`），DB 里和正式产品同表（`prd_product_*`），靠 ID 段 + `Active` 区分；
- 所以 DB 兜底候选时：**`Active='D'` 且 ID ≥ 2e9 = 我们自己复制出来的草稿**；`Active='F'` 可能是正式产品但未置有效。

## 4. 其他已知可查点

| 想确认的事 | 去哪看 |
|---|---|
| 某个 tab 的 key / url / 中文名 | `OfflineMenuBiz.buildTabMenuMap` + `ProductInfoTabType` 常量 |
| 页签顺序与「菜单重排」灰度 | `stepBiz.traStepOptimizedSwitch`、qconfig `product_input_opt`（[known-facts.md] 里有开关细节） |
| 6381 简版入口行为 | `getMenuFromVbk` / `getCurrentStep6381`（`OfflineMenuBiz.java:336` 起） |
| 线上 lang 与设计不一致 | 文案仍在前端 lang，后端只提供 title key |

## 5. 使用纪律

- 后端仓**只读**：grep 找口径、贴行号给结论；不要为了测试去改后端代码或配置；
- 结论写回本文件或 [known-facts.md](known-facts.md)，带文件:行号，方便下次直接跳转；
- 后端逻辑与线上表现冲突时，**以线上页面实测为准**（fat29 与仓内 master 可能不同步），并在台账 note 里记一句。
