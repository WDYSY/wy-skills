# 王妍在 Captain 上的应用速查

数据来源：`https://captain.release.ctripcorp.com/app` 的「我参与的 / 我关注的应用」两栏，2026-11-05 抓取。
仓库地址取自 `mcp__get_application_info` 的 `ci_repo`。

## 简写解析规则（最常用）

AppID 固定是 `1000` + 5 位数字，用户口语里只报后 5 位：

| 用户说 | AppID |
|---|---|
| 13904 | 100013904 |
| 28686 | 100028686 |
| 37548 | 100037548 |

解析顺序：
1. 纯 4–5 位数字 → 拼成 `1000<数字>`，先在本文件「我参与的」表里找；命中直接用。
2. 不在表里 → 调 `get_application_info` 验证这个 ID 是否存在。存在但要提醒用户「这个应用不在你参与/关注的清单里」，确认后再发。
3. 用户给中文名/英文名 → 在下面两张表里做模糊匹配。
4. 表里没有但确实是你负责的新应用 → 让用户去 Captain「我参与的」确认，然后把这条补进本文件。

## 我参与的（12 个，已核对仓库）

| 简称 | AppID | 中文名 | 仓库（ci_repo） | 容器 |
|---|---|---|---|---|
| 13904 | 100013904 | vbk中台产品IMVC架构 | `vacation-web/imvc-vbk` | nginx_nodejs |
| 19995 | 100019995 | 11129后台web站点 | `vacation-product/product.configure.input` | nginx_nodejs |
| 21009 | 100021009 | 供应商管理系统-IMVC | `vacation-web/vendor` | nginx_nodejs |
| 21111 | 100021111 | 单选项机票offline输入端服务 | `vacation-product/tour.vacation.flight.input` | nginx_nodejs |
| 21854 | 100021854 | 度假AI产品推荐服务 | `vacation-data/productrecommend` | tomcat |
| 25121 | 100025121 | 供应商H5项目-IMVC框架 | `vacation-H5/vbooking` | nginx_nodejs |
| 26995 | 100026995 | 商品中台前端管理系统 | `vacation-web/product-management` | nginx_nodejs |
| 28686 | 100028686 | 度假商品录入系统-antdv4版本 | `vacation-web/imvc-vbk-v2` | nginx_nodejs |
| 29015 | 100029015 | 旅游后台.net转node系统 | `vacation-web/product-operation` | nginx_nodejs |
| 32884 | 100032884 | 邮轮offlineWeb应用 | `cruise/cruise-offline-web` | nginx_nodejs |
| 37548 | 100037548 | 度假运营offline平台-采购平台 | `vacation-web/tour-operation-offline` | nginx_nodejs |
| 56195 | 100056195 | EPR订单服务相关系统 | `diy-common/erp-order-service-publish` | nginx_nodejs |

仓库地址补全成 `git@git.dev.sh.ctripcorp.com:<上面这串>.git`。
除 `21854` 是 tomcat（Java 服务，不适用本技能的镜像发布），其余都是 nodejs 前端应用，可以走 `gitlab-ci/<appId>:<tag>` 的镜像发布。

## 我关注的（21 个，发布前用 get_application_info 补仓库）

| 简称 | AppID | 中文名 | 英文名 |
|---|---|---|---|
| 03744 | 100003744 | 度假机票服务JAVA | tour-shopping-vacationflight-service |
| 06501 | 100006501 | 度假-图片及视频服务 | tour-image-service |
| 06691 | 100006691 | vbk-pc-node环境 | tour-vbkpcnode-application |
| 13904 | 100013904 | vbk中台产品IMVC架构 | tour-ivbk-application |
| 14943 | 100014943 | 玩乐运营中台-irmp | tour-globalization-irmp-adminportal-application |
| 15065 | 100015065 | 门票玩乐商品后台 | ttd-activity-vbk-ottd-application |
| 16554 | 100016554 | 度假产品维护后台服务 | tour-product-input-service |
| 18077 | 100018077 | 玩乐产品审核及利润率维护后台 | ttd-activity-product-nodejs-application |
| 19995 | 100019995 | 11129后台web站点 | tour-productconfigure-input-application |
| 21009 | 100021009 | 供应商管理系统-IMVC | tour-vendor-node-application |
| 21111 | 100021111 | 单选项机票offline输入端服务 | tour-vacation-flight-application |
| 23879 | 100023879 | 度假供应商照妖镜系统 | tour-demon-detector-application |
| 25121 | 100025121 | 供应商H5项目-IMVC框架 | tour-vbooking-h5-application |
| 26995 | 100026995 | 商品中台前端管理系统 | tour-product-management-application |
| 28678 | 100028678 | 度假商品中台-类目中台 | tour-product-category-application |
| 28686 | 100028686 | 度假商品录入系统-antdv4版本 | tour-product-input-application |
| 29015 | 100029015 | 旅游后台.net转node系统 | tour-product-package-application |
| 30241 | 100030241 | 门票玩乐移动vbk系统 | ttd-ttd-vbk-h5-application |
| 32884 | 100032884 | 邮轮offlineWeb应用 | tour-cruise-offline-web-application |
| 37548 | 100037548 | 度假运营offline平台-采购平台 | tour-operation-offline-application |
| 38623 | 100038623 | 供应商微前端-imvc | tour-vbk-imvc-micro-application |

「我的应用」栏为空，所以没有第三张表。

## 维护

- 用户新参与一个应用、或某个应用的仓库/名字变了 → 直接改本文件，不用重新抓页面。
- 想整体刷新：内置浏览器打开 `https://captain.release.ctripcorp.com/app`，点「我参与的」，用 `js` 抓 `table tbody tr` 的单元格即可（页面是内置登录态的，扩展没连也能开）。
