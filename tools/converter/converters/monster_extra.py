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
  加召唤链 544 个）。样本取「不同 `StageType` 各一关」，名称用 `StageConfig.StageName` 的
  TextMap。**不落 `StageType` 英文枚举**：全仓没有该枚举（33 种）的中文标签源，自造 33 个玩法名
  等于自建数据源。
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


def load_appearances(sample_kinds: int = 3) -> dict[int, dict]:
    """StageConfig 波次 + 召唤链 → {模板ID: {total, samples:[{id, name}]}}。

    `total` = 该模板（含其被召唤出场）出现过的**关卡数**（同关多波只计一次）；
    `samples` = 至多 `sample_kinds` 个关卡样本，`StageType` 与关卡名都去重（避免同一场战斗刷屏：
    召唤型小怪的全部出场都是同一个首领战，只按类型去重会得到三条同名样本），名称为空时不收
    ——宁可少一条样本，不落无名关卡。
    """
    stages = load_json(EXCEL_DIR / "StageConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
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
        name = resolve_text(rec.get("StageName", {}))
        stype = rec.get("StageType") or ""
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
                book.append({"id": sid, "name": name, "type": stype})

    return {
        tpl: {
            "total": n,
            "samples": [{"id": s["id"], "name": s["name"]} for s in samples.get(tpl, [])],
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


def _frac(value: object) -> float:
    """逐层剥 `{"Value": …}`（个别记录双层包装；`unwrap_value` 单次只剥一层）。"""
    depth = 0
    while isinstance(value, dict) and depth < 4:
        value = value.get("Value")
        depth += 1
    return float(value) if isinstance(value, (int, float)) else 0.0
