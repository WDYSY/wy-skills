# 意图 JSON 契约（Step 1 产物）

```json
{
  "releaseKey": "XLSP-5126-节演图片可裁切",
  "env": "FAT",
  "seed": { "state": "middle", "source": "auto", "candidateProductId": 0 },
  "filters": {
    "形态": ["跟团"],
    "境内外": ["境内短途"],
    "结构": ["含子的母产品"],
    "资源": ["系统酒"],
    "报价": ["按人"],
    "渠道": ["VBK"]
  },
  "targets": [
    {
      "page": "商品基本信息",
      "urlTemplate": "https://vbooking.ctrip.fat29.qa.nt.ctripcorp.com/ivbk/vendor/baseInfoMerge?productId={productId}&from=vbk",
      "assertions": ["提交后提示：请至少添加一个服务人员"]
    }
  ],
  "count": 1
}
```

## 字段规则

| 字段 | 规则 |
|---|---|
| `releaseKey` | `<idev号>-<标题摘要>`；无 idev 时用 `<日期>-<主题>` |
| `env` | 默认 FAT；只有 FAT 已验证 |
| `seed.state` | 起点状态：`ready`（成品：有效+上线+可订）或 `middle`（中间态：刚建成功、只亮「销售控制」「产品信息」两页签、未上线未置有效）。**说不清填 `middle`**；判定与操作见 [seed-data-sources.md](seed-data-sources.md) |
| `seed.source` | `auto`（默认，按 state 分流）/ `zaoshutai`（造数台）/ `list`（产品列表页搜索）/ `db`（DOT 查 prd_product 兜底）/ `create`（页面新建）；用户指定了来源就填死，不要自行换 |
| `seed.candidateProductId` | DB 兜底或台账复用拿到的候选 ID；0 = 没定，Step 4 现找。填了就从「打开 → 核页签 → 复制」开始 |
| `filters` | 键值都只能从下方受控词表取；映射不上标 `unresolved` 交人，**禁止自造枚举值** |
| `targets[].page` | 页面名（用于人读），urlTemplate 决定真实落点 |
| `targets[].urlTemplate` | `{productId}` 是唯一占位符，Step 5 逐条替换成真实数字 |
| `targets[].assertions` | 断言必须来自需求验收点或用户口述，逐字可核；不编造 |
| `count` | 默认 1，上限 5（= 造数产品数 = 用例条数） |

## 受控词表（与造数台筛选器对齐）

维度（键）：`形态`、`境内外`（含长短途）、`结构`、`资源`、`报价`、`渠道和站点`、`多语言`、`其它`。

选项值以造数台页面实际可勾选项为准——**每次 Step 3 打开页面时先读一遍筛选项**，与本文冲突时以页面为准，并回来更新本文件。当前已知选项（2026-11 联调口径）：

- 形态：跟团 / 私家团 / …（页面枚举为准）
- 境内外：境内短途 / 境内长途 / 境外 / …
- 结构：单产品 / 含子的母产品 / 子产品 / …
- 资源：系统酒 / 采购酒 / …
- 报价：按人 / 按团 / …
- 渠道：VBK / TC / …

## 同义词表（PRD 用语 → 受控词表）

| PRD 里可能写 | 归一到 |
|---|---|
| 母子团 / 母子结构 / 带子产品 | 结构=含子的母产品 |
| 出境 / 国外 | 境内外=境外 |
| 国内周边 / 短线 | 境内外=境内短途 |
| 刚新建 / 新建成功 / 未上线 / 产品制作中 / 中间态 / 还没配行程 | `seed.state=middle` |
| 已上线 / 可订 / 分销可见 / 预览 / 成品 | `seed.state=ready` |

映射不上的新词：先问用户，确认后把新对子补进本表。

## 解析来源优先级

idev 描述 → 附件飞书文档（`include=feishuDoc`）→ 本地页面代码（references/pages.md 的定位流程）→ 用户口述。描述太薄（如 XLSP-5126 只有「节演图片可裁切，可裁切来源可配置」）时，**必须**先学本地页面（grep 定位页面目录、找真实提示文案），再问用户：测哪个页面（URL 模板）、验收断言是什么——不许拿需求标题直接编断言。

## 例 2（P0 样本 XLSP-5126，骨架待跑通时填实）

```json
{
  "releaseKey": "XLSP-5126-节演图片可裁切",
  "env": "FAT",
  "filters": { "形态": ["跟团"], "渠道": ["VBK"] },
  "targets": [
    {
      "page": "商品图片（节演/来源11 图片）",
      "urlTemplate": "<config.json pages[] 的 multiMedia/productMediaList 条目，URL 待 P0 确认后回填>",
      "assertions": ["<待用户给验收点，如：节演图片出现可裁切操作入口>"]
    }
  ],
  "count": 1
}
```

> 例 1（上文完整 JSON）是 2026-11-23 联调真实跑通过的口径；例 2 的 URL 与断言在 P0 跑通时向用户确认后回填本文件与 `~/vbk-e2e/config.json`。
