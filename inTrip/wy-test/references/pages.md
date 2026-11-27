# 商品录入页清单（判定口径：引入 `publicComponent/SubMenu`）

> 2026-11 实扫两仓库 `src/ivbk/pages/*` 得到。**只有这份清单里的页面算「商品录入/商品详情」**，
> 其它页面（登录、列表、报表、工具页等）不在知识库范围，遇到直接说明「不在范围」。

## imvc-vbk（复杂版 / vbk）

| 页面 key | 中文名 | 入口 URL | 备注 |
|---|---|---|---|
| `baseInfoMerge` | 基本信息（含服务人员） | `/ivbk/vendor/baseInfoMerge?producttype=<类目>&productid=<ID>&istab=1&from=vbk` | 二期主战场 |
| `productDescribe` | 产品图文 / 商品详情 | `/ivbk/vendor/productDescribe?...&productid=<ID>` | |
| `priceInventory` | 价格库存班期 | `/ivbk/vendor/priceInventory?...&productid=<ID>` | 包车游无套餐 |
| `saleControlMerge` | 销售控制 | `/ivbk/vendor/saleControlMerge?from=vbk&productType=0&productId=<ID>` | 包车游/私家团子类型在此设置 |
| `packageManage` | 套餐管理 | `/ivbk/vendor/packageManage?...` | |
| `tourdays` | 行程描述 | `/ivbk/vendor/tourdays?productid=<ID>` | |
| `newResourceClause` | 条款维护 | `/ivbk/vendor/newResourceClause?...` | 条款联动核验入口 |
| `trafficResource` | 资源配置（资源组/可选项） | `/ivbk/vendor/trafficResource/...` | 资源组、必选可选项 |
| `multiMedia` | 商品图文（多媒体） | `/ivbk/vendor/multiMedia/...` | |
| `app-media` | 图片/视频 | `/ivbk/vendor/app-media/...` | |
| `basicinfo` | 老基本信息页 | 历史入口 | 仍引 SubMenu，算在内 |
| `categoryContract` | 类目合同 | — | |
| `groupBudget` | 团预算 | — | |
| `recommendActList` | 推荐活动 | — | |
| `scheduleManage` | 班期管理 | — | |

## imvc-vbk-v2（简版 / 6381）

| 页面 key | 中文名 | 入口 URL | 备注 |
|---|---|---|---|
| `tripProduct` | 简版商品录入（基本信息/销售控制/套餐/价格） | `https://vendor.package.<env>/product/input/tripBasics?productId=<ID>&from=vbk&ssr=0` | 含 `TripBasics`/`TripSetup`/`TripPackageManage`/`TripResourceConfiguration` |
| `newResConfigure` | 资源配置（资源组/可选项） | `/ivbk/.../newResConfigure/...` | |
| `trafficResource` | 资源配置（老） | — | |
| `preSale` | 预售 | — | |
| `advancedSettings` | 高级设置 | — | |
| `promotionTag` | 促销标签 | — | |
| `multiMedia` | 商品图文 | — | |
| `cruiseScheduleManage` | 邮轮班期 | — | |

## 常用 DB（`pkgproductdb`，fat / pro 同构）

| 表 | 说明 | 分片 |
|---|---|---|
| `prd_product_0..15` | 产品主表（形态/类型/版本/预售/拼小团/直连/废弃） | `ProductID % 16` |
| `prd_productextend` | 产品扩展（`IsCityManage`、`AddonGuideServiceLanguage`、`AddonDriverServiceLanguage`、`ServiceLanguageSelectable`） | 单表 |
| `prd_product_service_personnel_0..15` | 服务人员（`role_type` / `service_language_ids` / `provides_*` / `active`） | `product_id % 16` |
| `prd_segmentresource_0..15` | 行程段资源关联（`ChoiceMode`：O 可选 / M 必选） | 产品ID % 16 |
| `prd_segment_resource_group` | 产品挂的资源组（`resource_group_id`） | 单表 |
| `res_resourcegroup` | 资源组（`resourcePICategoryId`：1037 导游组 / 1132 用车组） | 单表 |
| `prd_low_price_product_relation` | 省钱/低价产品关系（`low_price_product_id`） | 单表 |
| `prd_shell_product_relation` | 包装/壳产品（`shell_id` / `origin_id` / `active`） | 单表 |
| `prd_product_children` | 母子产品（`is_active`） | 单表 |
| `prd_productdistribution_0..15` | 分销渠道 / 售卖站点 | 产品ID % 16 |

> 查库走 DOT MCP（`mcp__sql_execute`），`env_type=fat`。跨分片查询用 16 段 `UNION ALL`，
> 注意该工具**不支持 `SELECT *` 参与 UNION**，列要写全。
