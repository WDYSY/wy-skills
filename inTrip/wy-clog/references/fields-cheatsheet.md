# CLOG 查日志速查表（配 clog.py 用）

> 工具位置：`~/.chengxiaobang/skills/wy-clog/scripts/clog.py`（源码 `~/Projects/Mine/wy-skills/inTrip/wy-clog/scripts/clog.py`）　默认 appId：`~/.chengxiaobang/tools/clog.conf`
> 底层走 BAT MCP（`bat-clog`），和页面同一个数据源，只是不用手填那一大坨 `left=` JSON。

## 一、四个高频场景，直接抄

```bash
# 1) 页面 Share 出来的链接看不懂 → 翻译成人话参数 + 可复用命令
clog decode @链接.txt          # 或 clog decode 'https://bat.fx.ctripcorp.com/clog?...'

# 2) 只知道工号/时间和大概的关键字 → 先看这个窗口里到底有哪些 title
clog titles --user TR004363 --last 1h

# 3) 拿到 title 再精确查（title 是精确值，写错一个字就是 0 条）
clog search --user TR004363 --title searchResourceList.req --last 30m --pretty

# 4) 从 Network 面板/日志里拿到 traceId → 一次拉全链路（req/res/cost/依赖/打点）
clog trace 100029702-0a2d01dd-498444-1623807 --from "2026-11-11 20:59:00" --to "2026-11-11 20:59:30"
```

查 0 条时不要自己猜：`search` 会自动逐级放宽（先去掉 title，再去掉 tag），把这个窗口里**真实的
title / user 组合和条数**打出来，并给一条能直接复制的命令。

## 二、字段口径（记不住的时候记这张表就够）

| 维度 | 取值规律 | 备注 |
|---|---|---|
| `title` | `<方法名>.req` / `.res` / `.cost`，自定义打点用点号命名（`tour.product.offline.search.empty`） | **精确匹配**；要模糊得写成 `searchResourceList*` |
| `user` | 工号（`TR004363`）**或**端上标识（`advisor__WeChat239547203`） | 两种都存在，查不到先怀疑这一栏 |
| `method` | `searchResourceList`、`inSwitch`… 不带 `.req/.res` 后缀 | 业务方法级 |
| `vendorId` | 纯数字（`35561`、`1196906`） | 供应商维度 |
| `class` | 写入类全名，如 `com.ctrip.tour.product.input.service.soa.ProductInputServiceImpl` | 定位代码入口 |
| `source` | 打印日志的类 + 方法 + 行号（`ProductMetaProxy.java:1264`） | 支持 like |
| `cat-msg-id` / `messageId` | `100029702-0a2d01dd-498444-1623807` | 就是 traceId |
| `logLevel` | INFO / WARN / ERROR / FATAL（MCP 只认这 4 档，页面的 DEBUG 传不过去） | `--level error` |
| 时间 | 一律北京时间输入，工具转 UTC | `--last 30m` / `--from .. --to ..` |
| region | SHA / FRA-AWS / SGP-ALI（pro 生效） | `--idc SGP-ALI` |
| `_subEnv_` | 子环境，大写（`FAT28135`），来自 URL 的 `subEnv` | `--tag _subEnv_=FAT28135` |
| `productId` / `group` | 日志里会带上的业务维度 | `--tag productId=8816860` |

## 三、为什么"格式不对就查不到"（四个真实坑）

1. **title 是精确值**，不是包名也不是方法名——`.req` 写成 `.Req`、漏了后缀，直接 0 条。
2. **`user` 有两种值**：工号 和 `advisor__WeChatxxxx`。前端 Network 面板里那个用户标识和后台工号不是一回事。
3. **时间窗**：链接里的 `range.from/to` 是毫秒时间戳，页面默认窗口常常只覆盖十几秒；过了就查不到。
4. **分页**：`totalSize` 这个字段 MCP 常返回 0，别拿它判断"有没有数据"，以实际返回条数为准。
5. **浏览器响应头里的 CAT id ≠ CLOG 里的 messageId**（2026-11-12 实测）：`X-Cat-Id` / `Rootmessageid` / `Sermessageid`
   是入口链路的 id，应用自己打日志时用的是它派生出的新 messageId（前 3 段相同、最后一段不同），拿头里的 id 查一定 0 条。
   要从浏览器请求反推日志，用 `X-Service-Appid` + `X-Service-Call` + 时间窗 + `_subEnv_`。

## 四、和页面配合的两个小技巧

- 页面右上角 **字段值分布**：点开能直接看到某字段的真实取值列表，比记忆可靠。
- 页面上 **Share** 出来的链接本身就编码了完整查询（`left=` 那段 JSON），收藏一条"模板链接"，下次改时间即可；用 `clog decode` 反向读懂它。
