# ADR-0006: 数据格式与映射策略

**Status**: Accepted（策略性结论仍成立；「StarRailRes 扁平索引输出清单」与「第一期分期计划」已失效——现况以工具与现成 JSON 为准）

## 背景

ADR-0005 确定转换工具架构，本 ADR 锁定数据格式与字段映射策略，是转换工具实现的直接依据。

## 仍然有效的结论

1. **输出为站点自用的精简 JSON**，不追求与外部仓库格式兼容；前端数据层按本站格式消费。
2. **TextMap 解析**：源端 key 为字符串形式的哈希值；引用有 `{"Hash": ...}` 对象与字面量 key 两种形态，统一由一个 resolve 函数识别；未命中返回空值并记 warning，不阻断转换。现况实现：`tools/converter/textmap.py` / `textmap_db.py`（本地 sqlite 缓存）。
3. **图标路径映射**：转换器内置路径映射表，输出相对路径，前端拼 CDN 基址。现况：相对路径 + `src/services/cdn/` 三级解析（本地 → nanoka → jsDelivr），映射表以代码为准。
4. **枚举值规范**：key 用英文标识、name 用中文。
5. **图片路径映射完整性必须对照真实 CDN 校验**（历史坑位：avatarshopicon 部分 ID 真 404）。

## Considered Options

- **输出与外部仓库（StarRailRes 等）格式兼容**：放弃——站点自用格式优先，兼容外部格式会引入本站不消费的字段与命名约束。
- **TextMap 引用只接受字面量 key**：放弃——源端同时存在 `{"Hash": ...}` 对象与字面量两种形态，只认一种会大面积落空；改为统一 resolve 函数识别，未命中记 warning 不阻断。
- **图片路径映射写在文档里**：放弃——路径映射表以转换器代码为权威（文档抄录必然漂移）；文档只保留「必须对照真实 CDN 校验」这条判据。

## 已失效内容（禁止再依据）

- 「StarRailRes 索引文件清单」（`characters.json` / `character_ranks.json` / `character_skills.json` / …）与各文件的字段范围：**第一批结构已多次演进**，`character_ranks.json` / `character_skills.json` 已删除（详情自建，见 docs/audit/）；现况清单与字段一律以 `public/data/cn/` 产物 + `tools/converter/converters/` 为准。
- 「第一期只做索引级、第二期补详情」的分期表：**已全部完成并超越**，无操作价值。
- 「前端 src/services/api.ts 与 types.ts 将在第二期重写」：已发生，勿按旧路径找文件（现为 `src/services/api/` 目录 + `src/services/types/` barrel）。

## 现状指针

- 字段结构与裁决：`tools/converter/converters/*.py`、`tools/converter/DATA_CATALOG.md`（源数据结构索引，`gen_catalog.py` 生成）、docs/audit/。
- 数据消费契约：`src/services/types/`（按域拆分）。
