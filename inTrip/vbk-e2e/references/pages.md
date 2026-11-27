# 学习本地 B 端页面（Step 1 用）

> 目标：从一份需求（idev/PRD）定位到「页面目录 + 入口 URL + 断言文案」，都从**本地前端代码**里找，不靠猜。

## 数据源（先读配置）

- 仓库与页面清单在 `~/vbk-e2e/config.json`：`repos[]`（key/localPath/gitlabUrl/pageRoot）+ `pages[]`（pageKey/name/repo/urlTemplate/status）。**加仓库、加页面只改 config，不改本文件**；
- `pages[].urlTemplate` 的 `{productId}` 占位在 Step 6 由造数 productId 替换；
- 页面清单的**主册**在 `wy-test` 技能的 `references/pages.md`（含商品录入页判定口径 + 入口 URL + 相关 DB 表）——两册重叠时以 config 为准（config 是运行真源），并同步更新。

## 仓库结构（两仓，页面同构）

| 仓库 | 角色 | 页面根 |
|---|---|---|
| `imvc-vbk`（复杂版 vbk） | `src/ivbk/pages/<pageKey>/`，URL ≈ `https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/vendor/<pageKey>?productId=<ID>&from=vbk` | 例：`baseInfoMerge`（基本信息，服务人员校验所在） |
| `imvc-vbk-v2`（简版 6381） | 同构 `src/ivbk/pages/<pageKey>/`；页面常为页签/子页（如 `multiMedia/productMediaList`） | 简版主入口 `tripProduct`（TripBasics，`vendor.package.<env>/product/input/tripBasics`） |

页面目录内：`controller`（入口/数据）、`view`（UI）、`Model/model`（数据模型）、`component` / `FormComponents`（子组件）、`util`（工具）。

## 定位流程（从需求到页面）

1. **关键词 → grep 两仓**：拿需求标题/描述里的业务词（如「节演」「裁切」「服务人员」「班期」）grep 两仓 `src/ivbk/pages/`，命中的页面目录记为候选；
2. **判定是否商品录入/详情页**：页面引入 `publicComponent/SubMenu` 才算商品录入系页面（`wy-test` 的判定口径）；非商品页（登录、列表、工具页）不在 e2e 范围，向用户说明；
3. **确定 urlTemplate**：优先 `config.json` 的 `pages[]`；没有的按两仓 URL 规则推候选（`/ivbk/vendor/<pageKey>?productId={productId}&from=vbk`），**推不准（页签式入口、路由拼接复杂）就请用户确认**，不许拿猜的 URL 落用例；
4. **找断言文案**：aiAssert 的文案要有权威来源——grep 候选页面的校验/提示文案（中文串或 `lang["key.xxx"]` 国际化 key，`lang` 的默认值就是页面真实文案）。例：母版用例断言「请至少添加一个服务人员」就来自 `baseInfoMerge` 系页面的服务人员校验代码；
5. **回填**：跑通后把 pageKey/repo/urlTemplate/status=verified 回填 `config.json` 的 `pages[]`。

## 已定位的例子

- **XLSP-5126 节演图片可裁切**：改动在 `imvc-vbk-v2/src/ivbk/pages/multiMedia/`——`productMediaList/`（图片列表页）、`component/PicCut.tsx` / `PicCutLegacy.tsx`（裁切组件）、`util/cutSource.js`（可裁切来源配置）。页面候选「商品图文/图片管理」；URL 待 P0 从页面菜单/浏览器确认（见 config `pages[]` 的 todo-confirm 条目）。
- **中间态数据源的两个页面**（代码已核，未实跑）：产品列表 `/ivbk/vendor/productListMerge?from=vbk`（`pages/productListMerge/component/SearchForm.js`：产品ID 逗号分隔、「上线状态」「有效」可筛）；销售控制 `/ivbk/vendor/saleControlMerge?from=vbk&productType=0&productId={productId}`（复制成功后的跳转目标，`SubMenu.js:1075`）。详见 [seed-data-sources.md](seed-data-sources.md)。

`config.json` 的 `pages[].status` 三档：`verified`（已实跑）、`code-verified`（代码里核过 URL/入口，未实跑）、`todo-confirm`（待确认，不许拿去落用例）。

## GitLab 链接（给人看，不给 grep 用）

需要给用户贴代码链接时用 `config.json` 的 `gitlabUrl` + 相对路径（如 `…/imvc-vbk-v2/-/tree/master/src/ivbk/pages/multiMedia`）；机器定位一律用本地 `localPath`（快且不受网络影响）。
