# 数据源与字段探索（docs/data）

> **定位：现行口径为主**。本目录写「数据从哪来、字段怎么落到输出 JSON」——源数据探索、转换器字段映射、文本标签规则。不可逆裁决在 ADR，机制规则在 agents，坑位在 memory。

## 与其它目录的分工（写之前先判落位）

| 你手上的内容 | 该去哪 |
| --- | --- |
| 转换机制 / 增量 / 数据边界（规则） | [data-pipeline.md](../agents/data-pipeline.md) |
| 不可逆数据裁决（字段归属 / 口径 / 赛季代际） | [docs/adr/](../adr/) |
| 静默失效、反直觉字段事实、取数与取证顺序 | [docs/memory/data-pipeline.md](../memory/data-pipeline.md) |
| 逐表字段全集（生成物，禁止手改） | [DATA_CATALOG.md](../../tools/converter/DATA_CATALOG.md) 总索引 + `tools/converter/DATA_CATALOG.parts/` 按需分片 |
| **表 → 字段 → 输出 JSON 的映射、源数据探索、富文本标签** | **本目录** |

## 文件清单

| 文件 | 用途 | 状态 |
| --- | --- | --- |
| [转换器字段映射.md](转换器字段映射.md) | `tools/converter/converters/*.py` 的表→字段→输出映射，各段带判据与禁令；文首有模块索引、每节首行是 `产物 ｜ 源` 契约行 | **现行 · 单一事实源**（结构由 `tools/check-field-map.mjs` 机检） |
| [数据源总结.md](数据源总结.md) | vendor 五层结构、ExcelOutput 分域索引与取数优先级、Config/ 清单与坑 | **现行**（文件数为快照口径，权威值见 DATA_CATALOG.md 头部） |
| [角色数据探索.md](角色数据探索.md) | 角色相关数据的跨目录全景与拼装链路（源数据侧） | **现行**（通用形态，不含单角色数值） |
| [黄泉_角色数据还原样例.md](黄泉_角色数据还原样例.md) | 单角色端到端还原实例（AvatarID 1308） | **现行**（实例；数值取当时快照） |
| [星魂图标双体系数据源图谱.md](星魂图标双体系数据源图谱.md) | 星魂两套图标体系（本体展示 / buff 栏）的数据源、路径规则与前端约定 | **现行**（条数为扫描时点，结构结论不受影响） |
| [hsr-rich-text-tags.md](hsr-rich-text-tags.md) | TextMap 富文本标签 / 占位符全量参考与渲染处理约定 | **现行**（出现次数为扫描时点） |
| [currency-war-season-expansion.md](currency-war-season-expansion.md) | 货币战争赛季扩充说明的 TextMap Hash ↔ 文案出处 | **出处档案**（前端展示已下线，`season.py` / `season.json` 已移除；保留 Hash 对应关系） |

## 读法

- **按需读单份**：改字段先读 [转换器字段映射.md](转换器字段映射.md) 对应段，再按需查 [角色数据探索.md](角色数据探索.md) 或 DATA_CATALOG 分片。
- 两份角色文档分工：全景与目录职责看 [角色数据探索.md](角色数据探索.md)，单角色逐字段实例看 [黄泉_角色数据还原样例.md](黄泉_角色数据还原样例.md)，互相指路不复述。
- 条数 / 文件数 / 命中率都是**扫描时点快照**，硬编码前用 `query.py --schema` 或 DATA_CATALOG 复核。
- 禁止直接读 `vendor/TurnBasedGameData`；探索一律走 `tools/converter/query.py`。
