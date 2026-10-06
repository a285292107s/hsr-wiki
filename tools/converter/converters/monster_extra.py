"""敌对物种详情页的附加数据：掉落 / 出没 / 阶段 / 技能附带效果（合并点见 monster_detail.py）。

四块都**不进** `monster_common.load_monsters()` 的返回：该聚合被 endgame / voracity 共用，
按 2026-10 记录的坑位——聚合记录新增键会自动漏进它们的 payload（跳表要同步维护）。这里按需
单独读源表，只在 `monster_detail.py` 合并进 `monsters/{id}.json`。

判据（全部为实测值，不是估计）：

- **掉落** `MonsterDrop`（4,438 行 / 634 个模板）：目录 632 条**全部**有登记；按 `WorldLevel`
  （均衡等级；`None` = 基准档）分档。物品名称与图标经 `ItemConfig`（与 items.json 同一解析，
  见 `items.item_name_icon`）。
- **出没** `StageConfig`（29,515 关）的波次 `MonsterList` → 实例 ID 折算到模板；再沿
  `MonsterConfig.SummonIDList` 把「召唤者出场」计入被召唤者。**不沿召唤链会误判**：冰锋 /
  无尽寒冬之槊这类由首领召唤出场的小怪，波次里根本没有它们（实测只看波次 394 个模板命中，
  加召唤链 544 个）。样本取「不同 `StageType` 各一关」，名称只取玩家可见的关卡名
  （`load_player_stage_names`：活动表 / 终局四表 / 侵蚀隧洞·凝滞虚影入口表 / 强敌挑战·剑试表），
  源里没有关卡名的关卡只计入总数、不落样本——`StageConfig.StageName` 在这些玩法里是敌方标识
  （常与本怪同名），拿它当关卡名会让读者困惑（ADR 0047）。**不落 `StageType` 英文枚举**：全仓
  没有该枚举（33 种）的中文标签源，自造 33 个玩法名等于自建数据源。
- **阶段** `MonsterAtlasExtraPhase` / `MonsterAtlasExtraPhases`（9 + 12 行，字段同构的同名双表，
  按 `(TemplateGroupID, PhaseID)` 去重）按 `TemplateGroupID` 归属某族：给出该阶段的弱点与伤害
  抗性，可选名称/介绍（实测仅 3/9 有文本）。族内**每个成员**都带同一组阶段（阶段是族/战斗的
  属性，不是某一档的属性）。阶段块里的 `DebuffResist` **刻意不取**：它与 `monster_common` 的
  效果抵抗解析（`MonsterStatusResistanceType` 图标）同构，重复实现必然两处漂移。
"""
import logging
import re

from config import EXCEL_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value
from converters.items import item_name_icon

logger = logging.getLogger("converter")


def _item_index() -> dict[int, tuple[str, str]]:
    """{ItemID: (名称, 图标官方路径)}；无名称的条目不收录（掉落在页面上只呈现有名字的物品）。"""
    out: dict[int, tuple[str, str]] = {}
    for rec in load_json(EXCEL_DIR / "ItemConfig.json"):
        iid = rec.get("ID")
        if iid is None:
            continue
        name, icon = item_name_icon(rec)
        if name:
            out[iid] = (name, icon)
    return out


def load_drops() -> dict[int, list[dict]]:
    """MonsterDrop → {模板ID: [{world_level, avatar_exp, items:[{id, name, icon}]}]}。

    `world_level` 为 `None` 表示基准档（无均衡等级限制），排序时放在最前；其余按等级升序。
    `AvatarExpReward` 是该档的角色经验奖励。
    """
    items = _item_index()
    by_tpl: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterDrop.json"):
        tpl = rec.get("MonsterTemplateID")
        if tpl is None:
            continue
        rows: list[dict] = []
        for d in rec.get("DisplayItemList") or []:
            iid = d.get("ItemID")
            name, icon = items.get(iid, ("", ""))
            if name:
                rows.append({"id": iid, "name": name, "icon": icon})
        if not rows:
            continue
        by_tpl.setdefault(tpl, []).append({
            "world_level": rec.get("WorldLevel"),
            "avatar_exp": rec.get("AvatarExpReward") or 0,
            "items": rows,
        })
    for rows in by_tpl.values():
        rows.sort(key=lambda r: (r["world_level"] is not None, r["world_level"] or 0))
    return by_tpl


def _load_table(name: str) -> list[dict]:
    """整表读取；表缺失返回空列表（活动名称各链相互独立，缺一张不影响其它链）。"""
    try:
        return load_json(EXCEL_DIR / f"{name}.json")
    except FileNotFoundError:
        return []


def _activity_panel_names() -> dict[int, str]:
    """`{ActivityPanel.PanelID: 活动名}`（`TitleName` 剥「」）。"""
    out: dict[int, str] = {}
    for rec in _load_table("ActivityPanel"):
        pid = rec.get("PanelID")
        name = resolve_text(rec.get("TitleName") or {}).strip("「」")
        if pid is not None and name:
            out[pid] = name
    return out


def _panel_name_for(module_id: object, panels: dict[int, str]) -> str:
    """`ActivityModuleID` 的前导 = `ActivityPanel.PanelID` → 活动名（取**最长**前缀，避免短号抢匹配）。

    与 `load_event_sources` 取活动页签用的是同一条约定（`ActivityModuleID` 以面板 ID 开头）；
    命不中返回空串——不给活动名，不猜活动。
    """
    if not isinstance(module_id, int):
        return ""
    text = str(module_id)
    best = ""
    for pid in panels:
        key = str(pid)
        if text.startswith(key) and len(key) > len(best):
            best = key
    return panels.get(int(best), "") if best else ""


def load_activity_stage_names() -> dict[str, dict[int, dict]]:
    """活动关卡名 `{StageType: {EventID: {"name": 关卡名, "activity": 活动名}}}`。

    **为什么不能直接用 `StageConfig.StageName`**：活动关卡的该字段是**活动级常量**——FightFest
    134 关 / TelevisionActivity 70 关 / ElationActivity 49 关 / SummonActivity 70 关各自全类型
    共用一个文本，且该文本与关卡名单无关（「承露天人」是同一活动里的另一只敌人，模板 2023030；
    「裂界造物」「反物质军团」是阵营名）。真实关卡名在活动表里，各链都按 `EventID = StageID // 10`
    折算（调用方还会退回原值查一次，覆盖 FightFest 419000 这类「关卡号 = 活动号」的单关特例）：

    - FightFest → `FightFestStageInfo.ChallengeName`（擂台赛•其一 / 梦境训练•托帕 …）
    - ElationActivity → `ElationBattleLevel.StageName`（花火的千变假面 …）
    - TelevisionActivity → `ActivityTelevisionLevel.EventID → TelevisionID` →
      `ActivityTelevisionStage.StageName`（与银袋山同行 …）
    - SummonActivity → `ActivitySummonLevel.EventID → GroupID` → `ActivitySummonGroup.StageName`
    - BoxingClub → `BoxingClubStage.Name`（「很多鸽子」…；97/121 个活动号有行，缺行的关卡按无名处理）
    - StarFightActivity → `StarFightStageConfig.EventID → GroupID` → `ActivityStarFightGroup.GroupTitle`

    `activity`（活动名，用于样本标签前缀）只在**有验证链**时给，否则空串：

    - FightFest：`ActivityPanel.UIPrefab` basename == `StageType`（`load_event_sources` 同一约定）
    - TelevisionActivity / SummonActivity / StarFightActivity：关卡名来源表上的 `ActivityModuleID`
      → `ActivityPanel`（「惊梦电视台」「开拓，友谊魔法！」「星芒烁变 / 星芒启明」）
    - BoxingClub / ElationActivity：**给不出**——BoxingClub 只有 20/97 个活动号能连到挑战表
      （`BoxingClubChallenge.StageGroupList → BoxingClubStageGroup.EventIDList`，样本关仅 4/19），
      ElationActivity 全库无 `ActivityModuleID` 连接。宁缺前缀，不猜活动。

    其余活动类型（FightActivity / TreasureDungeon / GridFightActivity / FateRin / FateActivity /
    BattleCollege / Heliobus / AetherDivide）仓内没有可用的逐关名源，调用方对它们不落样本。
    字典**恒含这 6 个键**（哪怕某张表缺失、取到空字典）：调用方据此判定「该类型有实名源」，
    缺表时退化为不落样本，而不是退回活动级常量名。
    """
    panels = _activity_panel_names()
    festival = {
        (p.get("UIPrefab") or "").rsplit("/", 1)[-1].replace("Panel.prefab", ""): resolve_text(
            p.get("TitleName") or {}
        ).strip("「」")
        for p in _load_table("ActivityPanel")
    }
    tv_stage = {r.get("TelevisionID"): r for r in _load_table("ActivityTelevisionStage")}
    tv_key = {r.get("EventID"): r.get("TelevisionID") for r in _load_table("ActivityTelevisionLevel")}
    summon_group = {r.get("GroupID"): r for r in _load_table("ActivitySummonGroup")}
    summon_key = {r.get("EventID"): r.get("GroupID") for r in _load_table("ActivitySummonLevel")}
    star_group = {r.get("GroupID"): r for r in _load_table("ActivityStarFightGroup")}
    star_key = {r.get("EventID"): r.get("GroupID") for r in _load_table("StarFightStageConfig")}

    def entry(name: str, activity: str = "") -> dict:
        return {"name": name, "activity": activity}

    def chain(keys: dict, rows: dict, name_field: str, event_field: str = "EventID") -> dict[int, dict]:
        out: dict[int, dict] = {}
        for event, key in keys.items():
            row = rows.get(key)
            name = resolve_text(row.get(name_field, {})) if row else ""
            if name:
                out[event] = entry(name, _panel_name_for(row.get("ActivityModuleID"), panels))
        return out

    return {
        "FightFest": {
            r.get("EventID"): entry(
                resolve_text(r.get("ChallengeName", {})), festival.get("FightFest", "")
            )
            for r in _load_table("FightFestStageInfo")
        },
        "ElationActivity": {
            r.get("EventID"): entry(resolve_text(r.get("StageName", {})))
            for r in _load_table("ElationBattleLevel")
        },
        "TelevisionActivity": chain(tv_key, tv_stage, "StageName"),
        "SummonActivity": chain(summon_key, summon_group, "StageName"),
        "BoxingClub": {
            r.get("EventID"): entry(resolve_text(r.get("Name", {})))
            for r in _load_table("BoxingClubStage")
        },
        "StarFightActivity": chain(star_key, star_group, "GroupTitle"),
    }


def _absorb_id_names(out: dict[int, dict], table: str, key: str, allowed: set[str],
                     stage_types: dict[int, str], name_field: str = "Name") -> None:
    """精确连接：表内 `key` 的值**就是**关卡 ID（非活动关，无活动名）。"""
    for rec in _load_table(table):
        sid = rec.get(key)
        name = resolve_text(rec.get(name_field, {}))
        if name and isinstance(sid, int) and stage_types.get(sid) in allowed:
            out[sid] = {"name": name, "activity": ""}


def _absorb_list_names(out: dict[int, dict], table: str, fields: tuple[str, ...], allowed: set[str],
                       stage_types: dict[int, str], name_field: str = "Name") -> None:
    """精确连接：表内某个**列表**字段里装的关卡 ID（非活动关，无活动名）。"""
    for rec in _load_table(table):
        name = resolve_text(rec.get(name_field, {}))
        if not name:
            continue
        for field in fields:
            for sid in rec.get(field) or []:
                if isinstance(sid, int) and stage_types.get(sid) in allowed:
                    out[sid] = {"name": name, "activity": ""}


def _absorb_entrance_names(out: dict[int, dict], table: str, stage_field: str,
                           mapping: dict, allowed: set[str], stage_types: dict[int, str]) -> None:
    """`MappingInfoID`（真外键，实测 100% 非空）→ `MappingInfo.Name`（玩家可见的入口名）。"""
    for rec in _load_table(table):
        name = mapping.get(rec.get("MappingInfoID"))
        if not name:
            continue
        raw = rec.get(stage_field)
        for sid in raw if isinstance(raw, list) else [raw]:
            if isinstance(sid, int) and stage_types.get(sid) in allowed:
                out[sid] = {"name": name, "activity": ""}


def load_player_stage_names(stage_types: dict[int, str]) -> dict[int, dict]:
    """`{关卡 ID: {"name": 玩家可见的关卡名, "activity": 活动名（可空）}}` —— 出没样本**唯一**的名称来源（ADR 0047）。

    判据：玩家在游戏里认得出的名字只活在这些表里，`StageConfig.StageName` 在若干玩法里只是
    **敌方标识**（实测 181 个「自己名字」样本里 160 个与 `MonsterTemplateConfig.MonsterName`
    是同一个 TextMap hash），故一律不取。四类源（各源按 `StageType` 互斥，实测覆盖 298/742 个样本）：

    ① 活动关卡（`load_activity_stage_names`，`EventID = StageID // 10` 折算 + 原值兜底）：62 个样本。
       `activity`（活动名）**原样带出、不拼进 `name`**——页面上活动名是弱化的上下文、关卡名才是值；
       拼接只发生在展示层（视图 / AI 快照各按同一格式），数据层保持两个字段各管一件事。
       BoxingClub / ElationActivity 无连接，`activity` 缺位（见 `load_activity_stage_names` 的证据）。
    ② 终局四表——`ChallengeMazeConfig` / `ChallengeStoryMazeConfig` / `ChallengeBossMazeConfig` 的
       `EventIDList1/2` 与 `ChallengePeakConfig` 的 `EventIDList` **直接装关卡 ID** → `Name`
       （「出故乡记其十」「支配恶兽·难度01」…，站点终局页已在用同一判据）：163 个样本
    ③ `CocoonConfig.StageIDList` / `FarmElementConfig.StageID` → `MappingInfoID` →
       `MappingInfo.Name`（「魔占之径 • 侵蚀隧洞」「焦炙之形 • 凝滞虚影」）：45 个样本
    ④ `StrongChallengeStage.EventID` → `Name`（「长生久视的一梦」）、`SwordTrainingExam.StageID` →
       `EnemyName`（「热血的云骑战士」）：28 个样本

    **不要退回的候选**：`MappingInfo.ID == StageID // 100` 是巧合——90 个 `FARM_ENTRANCE` 里只有 1 个
    存在 `ID*100+k` 关卡家族（非 FARM 的 923 里有 74 个），且逐关核对 `ShowMonsterList` 与波次 0 交集。
    """
    names: dict[int, dict] = {}
    activity = load_activity_stage_names()
    for sid, stype in stage_types.items():
        book = activity.get(stype)
        entry = (book.get(sid // 10) or book.get(sid)) if book else None
        if entry and entry["name"]:
            names[sid] = {"name": entry["name"], "activity": entry["activity"]}
    for table in ("ChallengeMazeConfig", "ChallengeStoryMazeConfig", "ChallengeBossMazeConfig"):
        _absorb_list_names(names, table, ("EventIDList1", "EventIDList2"), {"Challenge"}, stage_types)
    _absorb_list_names(names, "ChallengePeakConfig", ("EventIDList",), {"Challenge"}, stage_types)
    mapping = {
        r.get("ID"): resolve_text(r.get("Name", {}))
        for r in _load_table("MappingInfo")
    }
    _absorb_entrance_names(names, "CocoonConfig", "StageIDList", mapping, {"Cocoon"}, stage_types)
    _absorb_entrance_names(names, "FarmElementConfig", "StageID", mapping, {"FarmElement"}, stage_types)
    _absorb_id_names(names, "StrongChallengeStage", "EventID", {"StrongChallengeActivity"}, stage_types)
    _absorb_id_names(names, "SwordTrainingExam", "StageID", {"SwordTraining"}, stage_types, "EnemyName")
    return names


def load_appearances(sample_kinds: int = 3) -> dict[int, dict]:
    """StageConfig 波次 + 召唤链 → {模板ID: {total, samples:[{id, name}]}}。

    `total` = 该模板（含其被召唤出场）出现过的**关卡数**（同关多波只计一次）；
    `samples` = 至多 `sample_kinds` 个关卡样本：**同一 `StageType` 只取一关**（首个命中者）、
    关卡名不重复（同一场战斗在多个难度档各一行，只按类型去重会得到三条同名样本）。

    名称只有一档来源：`load_player_stage_names`（玩家可见关卡名，ADR 0047）。**解析不出名字的关卡
    只进 `total`、不落样本**——`StageConfig.StageName` 在 VerseSimulation / Trial / Mainline 等玩法里
    是敌方标识（常与本怪同名），拿它当关卡名只会让读者困惑（ADR 0046 的「已知边界」由此收口）。
    """
    stages = load_json(EXCEL_DIR / "StageConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    stage_types = {r.get("StageID"): (r.get("StageType") or "") for r in stages}
    names = load_player_stage_names({k: v for k, v in stage_types.items() if k is not None})
    id2tpl: dict[int, int] = {}
    summons: dict[int, list] = {}
    for rec in configs:
        mid = rec.get("MonsterID")
        if mid is None:
            continue
        tpl = rec.get("MonsterTemplateID")
        if tpl is not None:
            id2tpl[mid] = tpl
        summons[mid] = list(rec.get("SummonIDList") or [])

    total: dict[int, int] = {}
    samples: dict[int, list[dict]] = {}
    for rec in stages:
        sid = rec.get("StageID")
        stype = rec.get("StageType") or ""
        named = names.get(sid) or {}
        name = named.get("name", "")
        tpls: set[int] = set()
        for wave in rec.get("MonsterList") or []:
            for mid in wave.values():
                if not mid:
                    continue
                tpl = id2tpl.get(mid)
                if tpl is not None:
                    tpls.add(tpl)
                for sm in summons.get(mid, []):
                    stpl = id2tpl.get(sm)
                    if stpl is not None:
                        tpls.add(stpl)
        for tpl in tpls:
            total[tpl] = total.get(tpl, 0) + 1
            book = samples.setdefault(tpl, [])
            if (
                name
                and len(book) < sample_kinds
                and all(s["type"] != stype and s["name"] != name for s in book)
            ):
                sample = {"id": sid, "name": name, "type": stype}
                if named.get("activity"):
                    sample["activity"] = named["activity"]
                book.append(sample)

    return {
        tpl: {
            "total": n,
            "samples": [
                {"id": s["id"], "name": s["name"], **({"activity": s["activity"]} if s.get("activity") else {})}
                for s in samples.get(tpl, [])
            ],
        }
        for tpl, n in total.items()
    }


def load_phases() -> dict[int, list[dict]]:
    """MonsterAtlasExtraPhase(s) → {模板ID: [{phase_id, weak, resist, name?, intro?}]}。

    阶段按 `TemplateGroupID` 归属；模板自身 `TemplateGroupID` 为空（实测 160/632）时无阶段。
    两表同名且字段同构（9 / 12 行），按 `(组, 阶段)` 去重后取并集。
    """
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    group_of = {
        r.get("MonsterTemplateID"): r.get("TemplateGroupID")
        for r in templates if r.get("MonsterTemplateID") is not None
    }
    by_group: dict[int, list[dict]] = {}
    seen: set[tuple] = set()
    for table in ("MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json"):
        for rec in load_json(EXCEL_DIR / table):
            gid, pid = rec.get("TemplateGroupID"), rec.get("PhaseID")
            if gid is None or pid is None or (gid, pid) in seen:
                continue
            seen.add((gid, pid))
            entry = {
                "phase_id": pid,
                "weak": list(dict.fromkeys(rec.get("StanceWeakList") or [])),
                "resist": {
                    x["DamageType"]: _frac(x.get("Value"))
                    for x in (rec.get("DamageTypeResistance") or [])
                    if x.get("DamageType")
                },
            }
            name = resolve_text(rec.get("MonsterName", {}))
            intro = resolve_text(rec.get("MonsterIntroduction", {}))
            if name:
                entry["name"] = name
            if intro:
                entry["intro"] = intro
            by_group.setdefault(gid, []).append(entry)

    out: dict[int, list[dict]] = {}
    for tpl, gid in group_of.items():
        rows = by_group.get(gid)
        if rows:
            out[tpl] = sorted(rows, key=lambda r: r["phase_id"])
    return out


def load_skill_extra_effects() -> dict[int, list[dict]]:
    """`MonsterSkillConfig.ExtraEffectIDList` × `ExtraEffectConfig` → {技能ID: [{id, name, desc, param_list}]}。

    **完整外键**（不是命名约定猜测）：实测技能侧引用的 **118/118** 个 ID 全在 `ExtraEffectConfig`
    （315 条）里，0 未命中。文案是有信息的机制说明（「额外回合」「行动提前」+ 描述），
    描述含 `#N[i]` 占位符（315 条里 55 条带 `DescParamList`，前端 `fmtDesc` 同技能描述渲染）。
    实测覆盖 **215/632 个目录模板、937 次引用、118 种不同效果**。

    **图标不取**：`ExtraEffectIconPath` 全是 `BuffIcon/Inlevel/*`，而该目录在 nanoka 与 jsDelivr
    双侧 404（与 `MonsterStatusConfig.StatusIconPath` 同一问题）⇒ 无持久源，只出文本。
    """
    effects: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "ExtraEffectConfig.json"):
        eid = rec.get("ExtraEffectID")
        if eid is None:
            continue
        name = resolve_text(rec.get("ExtraEffectName", {}))
        if not name:
            continue
        effects[eid] = {
            "id": eid,
            "name": name,
            "desc": resolve_text(rec.get("ExtraEffectDesc", {})),
            "param_list": [unwrap_value(p) for p in (rec.get("DescParamList") or [])],
        }
    out: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterSkillConfig.json"):
        sid = rec.get("SkillID")
        if sid is None:
            continue
        rows = [effects[x] for x in (rec.get("ExtraEffectIDList") or []) if x in effects]
        if rows:
            out[sid] = rows
    return out


def _family_token(path: str) -> str:
    """配置路径 basename → 归属 token（去扩展名、去 `_Config`、去 `Manikin_`/`GridFight_` 前缀）。

    例：`Config/ConfigCharacter/Monster/Monster_W1_CocoliaP1_00_Config.json` → `Monster_W1_CocoliaP1_00`。
    """
    name = (path or "").rsplit("/", 1)[-1]
    for suf in (".json", ".prefab"):
        if name.endswith(suf):
            name = name[: -len(suf)]
    if name.endswith("_Config"):
        name = name[: -len("_Config")]
    for pre in ("Manikin_", "GridFight_"):
        if name.startswith(pre):
            name = name[len(pre):]
    return name


def _base_name(name: str) -> str:
    """去掉目录命名里的形态后缀：`杰帕德（完整）/（幻象）` → `杰帕德`。

    用途见 `load_statuses`：同一个 token 命中的模板必须「去形态后缀仍同名」才允许归属。
    """
    return re.sub(r"[（(][^）)]*[）)]", "", name or "").strip()


def load_statuses() -> dict[int, list[dict]]:
    """`MonsterStatusConfig` → {模板ID: [{id, name, type, dispel?, desc?}]}（**安全子集**）。

    归属桥是**命名约定**而非外键：`ModifierName = <怪物配置名>[_<SkillTriggerKey>]_<效果后缀>`
    （全仓 22 张含 `ModifierName` 的表与本表字符串交集为 0，真绑定在二进制技能配置里）。
    规则 = 「包含式**最长** token」+ 「该 token 命中的模板集合**去掉形态括号后缀后必须同名**」：
    实测 598 → **304 条**（覆盖 234/632 个目录模板），剔掉的正是真跨怪——可可利亚的 token 家族里
    混着「托帕幻象 / 无望冽风的幻灭者」，银鬃尉官的家族里混着「邓恩」；保留的是同一只怪的
    「（完整）/（幻象）/（错误）」等形态。宁可少归、不可错归。

    两处**刻意不落**：
    - `desc` 只在**既无 `#N[i]` 占位符、也无 `%宏`**（`%CasterName` / `%DynamicTargetName` 这类运行时
      文本替换）时落。状态描述的数值来自动态属性（`ReadParamList` 只有键名如 `MDF_PropertyValue`、
      没有数值，实测 313/706 条带占位符），运行时的施放者/目标名同样不可知；照仓规「缺参时消费方
      整段省略、不落残缺占位与 `?`」（`src/lib/format.ts → refsResolved`），不落不可渲染的描述
      （实测另有 4 条描述带 `%CasterName`，如「援军：受到%CasterName支援。」）；
    - 图标不落：`StatusIconPath` 全是 `BuffIcon/Inlevel/*`，该目录 nanoka 与 jsDelivr **双侧 404**。
    """
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    name_of: dict[int, str] = {}
    tok2tpl: dict[str, set[int]] = {}
    for rec in templates:
        mid = rec.get("MonsterTemplateID")
        name = resolve_text(rec.get("MonsterName", {}))
        if mid is None or not name:
            continue
        name_of[mid] = name
        for field in ("JsonConfig", "PrefabPath", "ManikinConfigPath"):
            tok = _family_token(rec.get(field, ""))
            if len(tok) >= 6:
                tok2tpl.setdefault(tok, set()).add(mid)

    by_tpl: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterStatusConfig.json"):
        mod = rec.get("ModifierName") or ""
        sid = rec.get("StatusID")
        if not mod or sid is None:
            continue
        name = resolve_text(rec.get("StatusName", {}))
        if not name:
            continue
        cands = [(len(tok), tok) for tok in tok2tpl if tok in mod]
        if not cands:
            continue
        best = max(cands)[0]
        tpls: set[int] = set()
        for ln, tok in cands:
            if ln == best:
                tpls |= tok2tpl[tok]
        if len({_base_name(name_of[m]) for m in tpls}) != 1:
            continue
        entry: dict = {"id": sid, "name": name, "type": rec.get("StatusType", "") or ""}
        if rec.get("CanDispel"):
            entry["dispel"] = True
        desc = resolve_text(rec.get("StatusDesc", {}))
        # 不可渲染的描述整段不落：`#N[i]` 的数值与 `%宏`（施放者/目标名）都在运行时才知道
        if desc and not re.search(r"#\d|%[A-Za-z]", desc):
            entry["desc"] = desc
        for m in tpls:
            by_tpl.setdefault(m, []).append(dict(entry))
    for rows in by_tpl.values():
        rows.sort(key=lambda r: r["id"])
        # 按**渲染签名**去重：实测同一怪物会挂到多个 StatusID 但名称/类型/描述/可否驱散全同的行
        # （69 行），照原样铺开就是同一条词条重复两遍；同名但**描述不同**的（61 行）是真数据，保留。
        seen: set[tuple] = set()
        kept: list[dict] = []
        for r in rows:
            sig = (r["name"], r["type"], r.get("desc", ""), bool(r.get("dispel")))
            if sig in seen:
                continue
            seen.add(sig)
            kept.append(r)
        rows[:] = kept
    return by_tpl


def load_event_sources() -> dict[int, dict]:
    """活动关卡的怪物 → 活动出处（`{模板ID: {name, tabs, levels, count}}`）。

    判据是**活动面板与关卡类型的同名约定**（`ActivityPanel.UIPrefab` basename = `StageConfig.StageType`，
    实测 `UI/Quest/Widget/FightFestPanel.prefab` ↔ `StageType = 'FightFest'`），活动名取该面板的
    `TitleName`（源文本「星天演武仪典」），页签名取 `ActivityQuestRewardData` 里
    `ActivityModuleID` 以该面板 ID 开头的行（实测 `5001801` ← `PanelID 50018`，页签「梦境训练」）。
    **两条都不是硬编码**：换活动只换表里那行；表对不上就整条不产出（静默降级，不猜）。
    用途：这类"活动专属敌人"的数值/美术常常直接复用别的怪物（实测托帕幻象复用可可利亚的
    模型、立绘与技能组），详情页需要一句出处说明，否则读者只能看到一堆对不上的引用。
    """
    try:
        panels = load_json(EXCEL_DIR / "ActivityPanel.json")
        rewards = load_json(EXCEL_DIR / "ActivityQuestRewardData.json")
        stages = load_json(EXCEL_DIR / "StageConfig.json")
        configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    except FileNotFoundError:
        return {}

    panels_by_token: dict[str, dict] = {}
    for p in panels:
        token = (p.get("UIPrefab") or "").rsplit("/", 1)[-1].replace("Panel.prefab", "")
        name = resolve_text(p.get("TitleName") or {}).strip("「」")
        if token and name:
            panels_by_token[token] = {"panel_id": p.get("PanelID"), "name": name}

    id2tpl = {c.get("MonsterID"): c.get("MonsterTemplateID") for c in configs}
    out: dict[int, dict] = {}
    for st in stages:
        panel = panels_by_token.get(st.get("StageType") or "")
        if not panel:
            continue
        ids: list[int] = []
        for wave in st.get("MonsterList") or []:
            if isinstance(wave, dict):
                ids.extend(v for k, v in wave.items() if k.startswith("Monster") and isinstance(v, int))
        levels = st.get("Level")
        for i in ids:
            tpl = id2tpl.get(i, i)
            if tpl not in out:
                out[tpl] = {"name": panel["name"], "tabs": [], "levels": [], "count": 0}
            rec = out[tpl]
            rec["count"] += 1
            if isinstance(levels, int) and levels not in rec["levels"]:
                rec["levels"].append(levels)
    for rec in out.values():
        rec["levels"].sort()
    for r in rewards:
        module = str(r.get("ActivityModuleID") or "")
        for panel in panels_by_token.values():
            if module.startswith(str(panel["panel_id"])):
                tab = resolve_text(r.get("QuestTabName") or {}).strip("「」")
                for rec in out.values():
                    if rec["name"] == panel["name"] and tab and tab not in rec["tabs"]:
                        rec["tabs"].append(tab)
    return out


def _frac(value: object) -> float:
    """逐层剥 `{"Value": …}`（个别记录双层包装；`unwrap_value` 单次只剥一层）。"""
    depth = 0
    while isinstance(value, dict) and depth < 4:
        value = value.get("Value")
        depth += 1
    return float(value) if isinstance(value, (int, float)) else 0.0
