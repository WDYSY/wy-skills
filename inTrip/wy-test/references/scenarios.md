# 场景标签体系（`kb_sync` 归类规则）

一条 bug 可命中多个标签（多标签，不取首个）。匹配范围：`title + contenttxt`。

| 标签 key | 中文 | 关键词（正则） |
|---|---|---|
| `gray_readonly` | 置灰 / 只读 | `置灰|不可点|不可点击|不可编辑|不能编辑|无法勾选|只读|无法保存` |
| `multi_language` | 多语言展示与拦截 | `多语言|多个服务语言|只显示一个|只能选一个|多个语言` |
| `language_check` | 服务语言校验（CN/普通话/目的地） | `普通话|中国大陆|CN|目的地|锁定|服务语言必须` |
| `mutex_link` | 互斥 / 联动 / 默认角色 | `互斥|联动|带出|移除|默认选中|包车游|自由行|领队|司兼导` |
| `clause` | 条款联动 | `条款` |
| `data_consistency` | 数据一致性（库/草稿/复制/同步） | `数据库|select |prd_|extend|草稿|复制|同步|落库` |
| `scope_out` | 范围外 / 灰度 | `签证|邮轮|灰度|6381|白框|5025` |
| `display_copy` | 展示 / 文案 / 交互 | `提示|文案|白框|标红|红字|不展示|去掉` |

## 归类注意

- **`gray_readonly` 与 `language_check` 常同时命中**（"地区含中国大陆…不可修改"），这是对的：既要验置灰也要验拦截
- 只命中 `mutex_link` 里的"领队/司兼导"这种角色名而正文讲的是条款 → 以 `clause` 为主标签，`mutex_link` 作为次标签即可，报告里按主标签分组
- 主标签优先级（用于 `kb/pages/*.md` 分组展示）：`gray_readonly` > `multi_language` > `language_check` > `mutex_link` > `clause` > `data_consistency` > `scope_out` > `display_copy` > 未分类

## 与「程小帮补充」场景的区别

- **历史 bug 标签**：来自 iDev，必须有 bug key
- **程小帮补充场景**：来自代码/DB 推导，**没有 bug key**，回写时写在 `kb/pages/<page>.md` 的 `## 程小帮补充场景` 区，格式 `- [场景名] 依据：<file:line 或 表.字段>（首次发现 YYYY-MM-DD）`
