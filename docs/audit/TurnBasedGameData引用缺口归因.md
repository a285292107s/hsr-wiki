# TurnBasedGameData 引用 vs 导出盘缺口归因（2026-11-25）

> 起因：`ExcelOutput` 引用 23,317 条去重路径，其中 **199 条**在解包盘 `ui/assets/asbres/spriteoutput` 上按「忽略大小写」也找不到。
> 本文把这 199 条逐条归因，结论用于两件事：① 哪些该登记进 `config/sprite-map.json` 的 `knownDeadRefs`（已做）；
> ② AnimeStudio 该不该改（结论：**不需要为路径改**，见 §4）。

复跑命令：
```bash
python tools/ingest-icons.py --verify --scope excel
node tools/check-icon-coverage.mjs --scope excel
```

## 一、前置结论：路径差异只是「目录段大小写」

| 检查项 | 结果 |
|---|---|
| 23,317 条引用，**大小写敏感**命中盘上文件 | **0 条** |
| 忽略大小写命中 | 23,118 条（99.15%） |
| 文件名大小写与盘上不一致 | **0 个** |
| 引用目录在盘上不存在 | **仅 2 个**（`ui/nature/iconnatureforweak`、`ui/quest/trashcansummon/summonuniticon`） |
| 忽略大小写也找不到 | 199 条（本文主题） |

`game.map`（= 游戏 bundle 原始容器路径）里同一条是
`assets/asbres/spriteoutput/itemicon/IconBuffHPBoost.png`——**目录全小写、文件名保原样**。
`ExcelOutput` 写的是 `SpriteOutput/ItemIcon/IconBuffHPBoost.png`。
**大小写差异源自 TurnBasedGameData 自己的重新拼写（含 `MosterIcon` 这个官方错拼），不是 AnimeStudio 造成的**（导出器全仓无路径小写化逻辑，只对哈希文件名小写）。

## 二、199 条的最终归因

| 归因 | 数量 | 含义 | 处置 |
|---|---|---|---|
| **OK_LOCAL** | 68 | 本地 webp 库里已有（多数靠「同叶名借」或历史批次），只是源盘上没有 png | 不需处理 |
| **DUMP_STALE** | 97 | `game.map` 与导出盘**都没有** —— dump 里的旧赛季/活动条目，游戏已移除 | ✅ 已登记 `knownDeadRefs` |
| **FONT** | 15 | `UI/Fonts/RPG_*.png` 是**字体图集**，不是图标 | ✅ 已登记 |
| **TEMPLATE** | 13 | 源数据里 `%AvatarID` / `#1` / `%s` 占位符**从未被替换**（盘上 0 个真实文件含 `%` 或 `#`） | ✅ 已登记 |
| **REAL_MISS** | 6 | `game.map` 有、导出盘无、全盘无同名 —— **真漏导** | ⚠️ 待补（见 §3） |

其中 DUMP_STALE 97 再拆：**91 条游戏里彻底没有**（登记）、**6 条只是改了目录**（未登记，见 §3）。

## 三、9 条需要人决策的

### 3.1 REAL_MISS 6 条：真漏导，可用 `--from-refs` 补

| 路径 | 站点是否引用 |
|---|---|
| `GridFight/TraitIcon/MiniIcon/200802S.png` | ✅ 是（基线 2 条之一） |
| `GridFight/TraitIcon/MiniIcon/101102S.png` | ✅ 是（基线 2 条之一） |
| `MapPics/NaviIcons/IconMapComicDessert1.png` | ❌ |
| `BuffIcon/Inlevel/IconMonster_W5_Gluttony_00_Game01_Target.png` | ❌ |
| `BuffIcon/Inlevel/IconMonster_W5_Gluttony_00_Game02_Target.png` | ❌ |
| `TutorialPic/TutorialPage_1035001.png` | ❌ |

前 2 条是覆盖度基线里仅剩的 2 个缺口。**它们不是「上游没有」，而是「本地导出没做」**——如果按 §4 重导，会自然出现。

### 3.2 MOVED 6 条：dump 的目录名和游戏不一致（不是缺失）

| dump 写的路径 | 游戏里实际在 |
|---|---|
| `UI/Quest/FeverTime/RankIcon/CommonRankBg_A.png` | `rankicon/CommonRankBg_A.png` |
| `UI/Quest/FeverTime/RankIcon/CommonRankBg_SS.png` | `rankicon/CommonRankBg_SS.png` |
| `UI/Nature/IconAttribute/IconAttributeQuantum.png` | `ui/nature/iconattributemiddle/IconAttributeQuantum.png` |
| `UI/Nature/IconAttribute/IconAttributeThunder.png` | `ui/nature/iconattributemiddle/IconAttributeThunder.png` |
| `DrawCardPic/GachaTabIcon/TabIcon_MultiAvatar.png` | `drawcardpic/gachatabiconlimited/TabIcon_MultiAvatar.png` |
| `DrawCardPic/GachaTabIcon/TabIcon_MultiLightcone.png` | `drawcardpic/gachatabiconlimited/TabIcon_MultiLightcone.png` |

**未登记为死链**（因为游戏里确实有这张图），但它们**站点没有引用**，所以当前不影响渲染。若将来要用，需在 `sprite-map.json` 的 `routes` 前加一条别名路由。

## 四、AnimeStudio 该不该改？——结论：不需要为「路径一致性」改

1. **大小写**：目录小写是游戏资源本身的命名，AnimeStudio 忠实照搬（`game.map` 证据）。要「和 dump 一致」就得把导出物改成非原始状态，失去可回溯性。且 Windows 大小写不敏感，本机 / 站点都不受影响（站点走 `sprite-map.json` 归一）。
2. **REAL_MISS 6 条 + 199 条整体**：根因是**导出不完整**（分批导出 + `--dedupe_names`/`--dedupe_content` 的 run 级去重），不是路径算错。改 `ExportPathResolver` 解决不了。

所以按 §「重导建议」执行即可：
- 重导前**先重建 `index/game.map`**（否则全落 `Unresolved\`）
- **分批 / 按容器导出**（两个 dedupe 是 run 级作用域，一次性全量会塌掉 4606 组同名、1026 组同字节）
- 重导后跑 `python tools/ingest-icons.py --verify --scope site`，应为 0 缺口

**唯一可选的 AnimeStudio 改动**：若导出物要供 Linux / case-sensitive 工具链消费，可加 `--lowercase-dirs`（仅小写目录段、保留文件名）。属于「可选项」，非缺陷修复。

## 五、本次落盘改动

- `config/sprite-map.json` → `knownDeadRefs`：4 条（ADR 0057）→ **96 条 pattern**，分 4 组（pattern 数 ≠ 命中引用条数：15 条字体引用由 1 条 `^uiart/ui/fonts/` 前缀覆盖，91 条失联引用去重/合并后为 78 条 pattern）
  - `legacy_0057` 4 条
  - `dump_stale_vanished` 78 条（91 条「游戏里彻底没有」的引用合并为 78 条正则；`ui/fonts` 与 `ui/nature/iconnatureforweak` 用目录前缀，其余精确）
  - `non_icon_fonts` 1 条前缀（覆盖 15 条 `UI/Fonts/RPG_*.png` 引用）
  - `unresolved_templates` 13 条
  - **覆盖验证：119/119 命中，对已导出文件 0 误伤**
- 效果：`--scope excel` 的「无源」1226 → **1218**；`cdnBacked` 12467 → **12356**（111 条不再被当缺口统计）
- `--scope site` 不变（0 missing，2 unsourced），678 单测 / vue-tsc / 9 守卫全绿

## 六、顺带修掉的一个真 bug

`tools/ingest-icons.py` 的 `lowerDirs` 模式把**文件名也小写了**（应为「目录小写、文件名保留」），与 `sprite-map.json` 的 `localModes` 声明及 TS / Node 实现不一致。
影响：`uiart` 分类（fallback 透传）会算出全小写路径，导致「明明有图却报缺」。
已修正为 `[...目录段小写, 原文件名]`，三端一致。
