import logging
from collections import defaultdict
from datetime import datetime

from config import EXCEL_DIR, OUTPUT_DIR
from enum_labels import resolve as resolve_label
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value
from converters.monster_common import (
    load_elite_groups, load_level_curve, load_monsters, load_phase_hp_ratios,
    monster_hp_at, monster_hp_phases, stage_context,
)
from converters.monster_guide import load_boss_guides, load_guide_phases

logger = logging.getLogger("converter")

_LAUNCH_TS = datetime(2023, 4, 26, 0, 0, 0)

_HP_TABLES: tuple[dict, dict] | None = None

_INFINITE_GROUPS: dict[int, list[list[int]]] | None = None

_PLACEHOLDER_TEMPLATES: frozenset[int] | None = None
"""「无独立美术」的敌方模板（占位图）缓存，见 `_placeholder_templates`。"""


def _hp_tables() -> tuple[dict, dict]:
    global _HP_TABLES
    if _HP_TABLES is None:
        _HP_TABLES = (load_level_curve(), load_elite_groups())
    return _HP_TABLES


def _phase_ratios() -> dict[int, list[float]]:
    return load_phase_hp_ratios()

_STAR_JADE_ITEM_ID = 1

_PEAK_STAR_REWARD_TYPES = {
    "MOB_STAR_REWARD": ("knight", "peakStarKnight"),
    "BOSS_STAR_REWARD": ("king", "peakStarKing"),
}

def _load_schedules(
    group_table: str, schedule_tables: tuple[str, ...]
) -> tuple[dict[str, tuple[str, str]], set[int]]:
    pointers: dict[int, int] = {}
    for rec in load_json(EXCEL_DIR / group_table):
        gid = rec.get("GroupID")
        sid = rec.get("ScheduleDataID")
        if gid is not None and sid:
            pointers[gid] = sid
    tables: dict[int, dict] = {}
    for filename in schedule_tables:
        for rec in load_json(EXCEL_DIR / filename):
            sid = rec.get("ID")
            if sid and sid not in tables:
                tables[sid] = rec
    schedules: dict[str, tuple[str, str]] = {}
    test_periods: set[int] = set()
    for gid, sid in pointers.items():
        rec = tables.get(sid)
        if rec is None:
            continue
        begin = rec.get("BeginTime", "") or ""
        end = rec.get("EndTime", "") or ""
        if not begin and not end:
            continue
        try:
            bt = datetime.fromisoformat(begin.replace(" ", "T")) if begin else None
            et = datetime.fromisoformat(end.replace(" ", "T")) if end else None
        except ValueError:
            continue
        if (bt and bt.year >= 2030) or (et and et.year >= 2030):
            continue
        if et and et < _LAUNCH_TS:
            test_periods.add(gid)
            continue
        if bt and bt < _LAUNCH_TS and not (et and et >= _LAUNCH_TS):
            continue
        schedules[str(gid)] = (begin, end)
    return schedules, test_periods

def _load_maze_buffs() -> dict[int, dict]:
    data = load_json(EXCEL_DIR / "MazeBuff.json")
    out: dict[int, dict] = {}
    for rec in data:
        bid = rec.get("ID")
        if not bid:
            continue
        name = resolve_text(rec.get("BuffName", {}))
        if not name:
            continue
        icon_path = rec.get("BuffIcon", "") or ""
        icon = icon_path.removeprefix("SpriteOutput/").removesuffix(".png") if icon_path else ""
        out[bid] = {
            "name": name,
            "desc": resolve_text(rec.get("BuffDesc", {})),
            "param_list": [p.get("Value") for p in (rec.get("ParamList", []) or [])],
            "icon": icon,
        }
    return out

def _monster_out(
    mid: int,
    monsters: dict[int, dict],
    full: bool = False,
    hp_ctx: dict | None = None,
    curve: dict | None = None,
    elite_groups: dict | None = None,
) -> dict:
    info = monsters.get(mid) or {}
    out = {"id": str(mid)}
    tpl = info.get("_tpl")
    if tpl:
        out["tpl"] = str(tpl)
    for k, v in info.items():
        if k in ("figure", "_tpl", "stat_ratio", "level_group", "elite_group", "stance_modify", "speed_modify"):
            continue
        if k == "stats":
            if v.get("speed"):
                out["speed"] = v["speed"]
            continue
        if not full and k in ("intro", "skills", "debuff_resist"):
            continue
        if k == "skills":
            out[k] = [
                {"name": s["name"], "tag": s.get("tag"),
                 **({"phase_list": s["phase_list"]} if s.get("phase_list") else {})}
                for s in v
            ]
        else:
            out[k] = v
    stance_mod = info.get("stance_modify")
    if stance_mod is not None and "stance" in out:
        out["stance"] = out["stance"] + stance_mod
    speed_mod = info.get("speed_modify")
    if speed_mod is not None and "speed" in out:
        out["speed"] = out["speed"] + speed_mod
    if hp_ctx:
        c, e = curve, elite_groups
        if c is None or e is None:
            c, e = _hp_tables()
        hp = monster_hp_at(info, hp_ctx.get("level"), hp_ctx, c, e)
        if hp is not None:
            out["hp"] = hp
        phases = monster_hp_phases(
            info, hp_ctx.get("level"), hp_ctx, c, e,
            _phase_ratios().get(int(tpl or mid)),
        )
        if phases is not None:
            out["phase_hp"] = phases
    return out

def _load_targets(filename: str = "ChallengeTargetConfig.json") -> dict[int, dict]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, dict] = {}
    hash_params: dict[int, int] = {}
    raw: list[tuple[int, str, int | None, int | None, str]] = []
    for rec in data:
        tid = rec.get("ID")
        if tid is None:
            continue
        desc = resolve_text(rec.get("ChallengeTargetName", {}))
        if not desc:
            continue
        name_ref = rec.get("ChallengeTargetName", {}) or {}
        h = name_ref.get("Hash") if isinstance(name_ref, dict) else None
        p = rec.get("ChallengeTargetParam1")
        t = rec.get("ChallengeTargetType", "") or ""
        raw.append((tid, desc, h, p, t))
        if p is not None and h is not None and h not in hash_params:
            hash_params[h] = p
    for tid, desc, h, p, t in raw:
        if p is None and h is not None and h in hash_params:
            p = hash_params[h]
        entry: dict = {"text": desc, "param": p}
        if t:
            entry["type"] = t
        out[tid] = entry
    return out

def _load_reward_items() -> dict[int, list[dict]]:
    out: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "RewardData.json"):
        rid = rec.get("RewardID")
        if rid is None:
            continue
        items: list[dict] = []
        hcoin = rec.get("Hcoin") or 0
        if hcoin:
            items.append({"id": _STAR_JADE_ITEM_ID, "num": int(hcoin)})
        for i in range(1, 7):
            iid = rec.get(f"ItemID_{i}")
            if not iid:
                continue
            items.append({"id": int(iid), "num": int(rec.get(f"Count_{i}") or 0)})
        if items:
            out[int(rid)] = items
    return out

def _load_reward_line(filename: str) -> dict[int, list[tuple[int, int]]]:
    out: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for rec in load_json(EXCEL_DIR / filename):
        gid, star, rid = rec.get("GroupID"), rec.get("StarCount"), rec.get("RewardID")
        if gid is None or star is None or rid is None:
            continue
        out[int(gid)].append((int(star), int(rid)))
    return {g: sorted(v) for g, v in out.items()}

def _load_reward_line_groups(filename: str) -> dict[int, int]:
    out: dict[int, int] = {}
    for rec in load_json(EXCEL_DIR / filename):
        gid, rlg = rec.get("GroupID"), rec.get("RewardLineGroupID")
        if gid is None or rlg is None:
            continue
        out[int(gid)] = int(rlg)
    return out

def _season_star_caps(filename: str) -> dict[int, int]:
    out: dict[int, int] = defaultdict(int)
    for rec in load_json(EXCEL_DIR / filename):
        gid = rec.get("GroupID")
        if gid is None:
            continue
        out[int(gid)] += len(rec.get("ChallengeTargetID", []) or [])
    return dict(out)

def _star_reward_ladder(
    group_file: str, line_file: str, config_file: str, items: dict[int, list[dict]],
) -> dict[int, list[dict]]:
    lines = _load_reward_line(line_file)
    caps = _season_star_caps(config_file)
    out: dict[int, list[dict]] = {}
    for gid, rlg in _load_reward_line_groups(group_file).items():
        cap = caps.get(gid, 0)
        if not cap:
            continue
        ladder = [
            {"star": star, "items": items[rid]}
            for star, rid in lines.get(rlg, [])
            if star <= cap and rid in items
        ]
        if ladder:
            out[gid] = ladder
    return out

def _load_peak_star_rewards(items: dict[int, list[dict]]) -> dict[int, list[dict]]:
    out: dict[int, list[dict]] = defaultdict(list)
    for rec in load_json(EXCEL_DIR / "ChallengePeakReward.json"):
        entry = _PEAK_STAR_REWARD_TYPES.get(rec.get("RewardType", ""))
        label_key = entry[1] if entry else None
        label = resolve_label("ui_label", label_key, label_key or "") if label_key else None
        gid, val, rid = rec.get("RewardGroupID"), rec.get("TypeValue"), rec.get("RewardID")
        if not entry or not label or gid is None or val is None or rid not in items:
            continue
        out[int(gid)].append({
            "kind": entry[0], "label": label, "star": int(val), "items": items[int(rid)],
        })
    return {g: sorted(v, key=lambda x: (x["label"], x["star"])) for g, v in out.items()}

def _peak_tier_row(tier: dict) -> dict:
    return {"label": tier["label"], "star": tier["star"], "items": tier["items"]}

def _slice_peak_star_tiers(
    ladder: list[dict], stars_used: int, target_count: int,
) -> tuple[list[dict], int]:
    cap = stars_used + target_count
    tier = [
        _peak_tier_row(t) for t in ladder if stars_used < t["star"] <= cap
    ]
    return tier, cap

def _group_maze_buff(filename: str = "ChallengeGroupConfig.json") -> dict[int, list[int]]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, list[int]] = {}
    for rec in data:
        gid = rec.get("GroupID")
        bid = rec.get("MazeBuffID")
        if gid is None or not bid:
            continue
        out[gid] = [bid]
    return out

def _group_extra_buff(filename: str, keys: tuple[str, ...]) -> dict[int, list[int]]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, list[int]] = {}
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        ids: list[int] = []
        for key in keys:
            for bid in rec.get(key, []) or []:
                if bid and bid not in ids:
                    ids.append(bid)
        if ids:
            out[gid] = ids
    return out

_BUFF_GROUP_KEYS: dict[str, str] = {
    "BuffList1": "stage1",
    "BuffList2": "stage2",
    "BuffList3": "tierce",
}

def _group_extra_buff_groups(filename: str) -> dict[int, dict[str, list[int]]]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, dict[str, list[int]]] = {}
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        groups: dict[str, list[int]] = {}
        for key, group in _BUFF_GROUP_KEYS.items():
            ids: list[int] = []
            for bid in rec.get(key, []) or []:
                if bid and bid not in ids:
                    ids.append(bid)
            if ids:
                groups[group] = ids
        if groups:
            out[gid] = groups
    return out

def _group_extra_sub_buffs(filename: str = "ChallengeStoryGroupExtra.json") -> dict[int, list[int]]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, list[int]] = {}
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        ids: list[int] = []
        for bid in rec.get("SubMazeBuffList", []) or []:
            if bid and bid not in ids:
                ids.append(bid)
        if ids:
            out[gid] = ids
    return out

def _load_group_names(filename: str) -> dict[int, str]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, str] = {}
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        name = resolve_text(rec.get("GroupName", {}))
        if name:
            out[gid] = name
    return out

def _load_permanent_groups(filename: str = "ChallengeGroupConfig.json") -> set[int]:
    data = load_json(EXCEL_DIR / filename)
    return {r.get("GroupID") for r in data if r.get("GroupID") is not None
            and not r.get("ScheduleDataID")}

_GROUP_ART_FIELDS: dict[str, str] = {
    "BackGroundPath": "background",
    "TabPicPath": "tab",
    "TabPicSelectPath": "tab_select",
    "ThemePicPath": "theme_banner",
    "ThemeToastPicPath": "theme_toast",
    "ThemeIconPicPath": "theme_icon",
    "ThemePosterBgPicPath": "theme_bg",
    "ThemePosterTabPicPath": "poster_tab",
    "HandBookPanelBannerPath": "handbook_banner",
}

def _load_group_arts(filename: str) -> dict[int, dict]:
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, dict] = {}
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        arts: dict = {}
        for src_key, out_key in _GROUP_ART_FIELDS.items():
            val = rec.get(src_key)
            if val:
                arts[out_key] = val
        if arts:
            out[gid] = arts
    return out

def _merge_arts(*arts_maps: dict[int, dict]) -> dict[int, dict]:
    out: dict[int, dict] = {}
    for m in arts_maps:
        for gid, arts in m.items():
            out.setdefault(gid, {}).update(arts)
    return out

def _load_mode_default_icons() -> dict[str, str]:
    data = load_json(EXCEL_DIR / "ChallengeGeneralConfig.json")
    key_map = {"Memory": "maze", "Story": "story", "Boss": "boss"}
    out: dict[str, str] = {}
    for rec in data:
        gtype = rec.get("ChallengeGroupType")
        path = rec.get("TabImgPath")
        if gtype in key_map and path:
            out[key_map[gtype]] = path
    return out

def _attach_default_icon(entries: dict, default_path: str | None) -> None:
    if not default_path:
        return
    for entry in entries.values():
        entry.setdefault("arts", {})["default"] = default_path

def _load_battle_targets() -> dict[int, dict]:
    data = load_json(EXCEL_DIR / "BattleTargetConfig.json")
    out: dict[int, dict] = {}
    for rec in data:
        tid = rec.get("ID")
        if tid is None or rec.get("Type") != "ChallengeTarget":
            continue
        desc = resolve_text(rec.get("TargetName", {}))
        if not desc:
            continue
        out[tid] = {"text": desc, "param": rec.get("TargetParam")}
    return out

def _stage_binding_buff(rec: dict) -> int | None:
    for item in rec.get("StageConfigData") or []:
        if item.get("BFLIFKBEOPJ") != "_BindingMazeBuff":
            continue
        raw = item.get("MNDFOPKBHKP")
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None
    return None

def _stage_infinite_group(rec: dict) -> int | None:
    for item in rec.get("StageConfigData") or []:
        if item.get("BFLIFKBEOPJ") != "_StageInfiniteGroup":
            continue
        raw = item.get("MNDFOPKBHKP")
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None
    return None


def _infinite_groups() -> dict[int, list[list[int]]]:
    global _INFINITE_GROUPS
    if _INFINITE_GROUPS is None:
        wave_ids = {
            r.get("WaveGroupID"): r.get("WaveIDList") or []
            for r in load_json(EXCEL_DIR / "StageInfiniteGroup.json")
        }
        wave_cfg = {
            r.get("InfiniteWaveID"): r
            for r in load_json(EXCEL_DIR / "StageInfiniteWaveConfig.json")
        }
        pools = {
            r.get("InfiniteMonsterGroupID"): r.get("MonsterList") or []
            for r in load_json(EXCEL_DIR / "StageInfiniteMonsterGroup.json")
        }
        out: dict[int, list[list[int]]] = {}
        for gid, wids in wave_ids.items():
            if gid is None:
                continue
            waves: list[list[int]] = []
            for wid in wids:
                seq: list[int] = []
                for mgid in (wave_cfg.get(wid) or {}).get("MonsterGroupIDList") or []:
                    seq.extend(pools.get(mgid) or [])
                species = [m for m in dict.fromkeys(seq) if m]
                if species:
                    waves.append(species)
            if waves:
                out[gid] = waves
        _INFINITE_GROUPS = out
    return _INFINITE_GROUPS


def _placeholder_templates() -> frozenset[int]:
    global _PLACEHOLDER_TEMPLATES
    if _PLACEHOLDER_TEMPLATES is None:
        out: set[int] = set()
        for rec in load_json(EXCEL_DIR / "MonsterTemplateConfig.json"):
            tid = rec.get("MonsterTemplateID")
            if tid is None:
                continue
            for field in ("IconPath", "RoundIconPath", "ImagePath"):
                path = str(rec.get(field) or "")
                if path.rsplit("/", 1)[-1] == "Monster_Unknown.png":
                    out.add(tid)
                    break
        _PLACEHOLDER_TEMPLATES = frozenset(out)
    return _PLACEHOLDER_TEMPLATES


def _load_stage_monsters_by_id(stage_ids: set[int]) -> dict[int, dict]:
    if not stage_ids:
        return {}
    data = load_json(EXCEL_DIR / "StageConfig.json")
    out: dict[int, dict] = {}
    dropped: dict[int, set[int]] = {}
    for rec in data:
        sid = rec.get("StageID")
        if sid not in stage_ids:
            continue
        waves: list[list[int]] = []
        for wave in rec.get("MonsterList", []) or []:
            mids = [v for v in wave.values() if v]
            if mids:
                waves.append(mids)
        gid = _stage_infinite_group(rec)
        if gid is not None:
            placeholders = _placeholder_templates()
            kept: list[list[int]] = []
            for wave in waves:
                species = list(dict.fromkeys(wave))
                for mid in species:
                    if mid in placeholders:
                        dropped.setdefault(mid, set()).add(sid)
                kept.append([m for m in species if m not in placeholders])
            waves = kept
            pool = _infinite_groups().get(gid) or []
            if len(pool) > len(waves):
                logger.warning(
                    "StageConfig %s 的 ∞ 造怪组 %s 有 %d 个波次，超出关卡声明的 %d 波"
                    "（尾部波次不并入，需人工核对是否漏波）",
                    sid, gid, len(pool), len(waves))
            for i, species in enumerate(pool[: len(waves)]):
                for mid in species:
                    if mid in placeholders:
                        dropped.setdefault(mid, set()).add(sid)
                    elif mid not in waves[i]:
                        waves[i].append(mid)
        ctx = stage_context(rec)
        node = {"level": rec.get("Level", 0) or 0, "waves": waves,
                "maze_buff": _stage_binding_buff(rec)}
        node.update({k: ctx[k] for k in ("level_group", "elite_group") if k in ctx})
        out[sid] = node
    for mid, sids in sorted(dropped.items()):
        logger.warning(
            "波次剔除占位美术模板 %s（无独立美术的机制载具）：命中 %d 个关卡（示例 %s）",
            mid, len(sids), ",".join(str(s) for s in sorted(sids)[:5]))
    return out


def _stage_mids(events: list[int], stages: dict[int, dict]) -> list[int]:
    out: list[int] = []
    for eid in events or []:
        stage = stages.get(eid)
        if not stage:
            continue
        for wave in stage.get("waves", []):
            for mid in wave:
                if mid not in out:
                    out.append(mid)
    return out

def _stage_waves_monsters(
    events: list[int],
    stages: dict[int, dict],
    monsters: dict[int, dict],
    full: bool = False,
    summons: dict[int, list[int]] | None = None,
    invasion: dict | None = None,
) -> list[dict]:
    polluted = _polluted_index(invasion)
    out: list[dict] = []
    wave_no = 0
    for eid in events or []:
        stage = stages.get(eid)
        if not stage:
            continue
        for wave in stage.get("waves", []):
            wave_no += 1
            for mid in wave:
                if mid not in monsters:
                    continue
                entry = {**_monster_out(mid, monsters, full, hp_ctx=stage), "wave": wave_no}
                if summons:
                    items = _monster_summons(mid, monsters, summons, polluted)
                    if items:
                        entry["summons"] = items
                out.append(entry)
    return out

def _load_story_turns() -> dict[str, int]:
    data = load_json(EXCEL_DIR / "ChallengeStoryMazeExtra.json")
    out: dict[str, int] = {}
    for rec in data:
        rid = rec.get("ID")
        turn = rec.get("TurnLimit")
        if not rid or not turn:
            continue
        gid = str(rid // 10)
        out[gid] = max(out.get(gid, 0), turn)
    return out

def _load_story_scores() -> dict[str, int]:
    data = load_json(EXCEL_DIR / "ChallengeStoryMazeExtra.json")
    out: dict[str, int] = {}
    for rec in data:
        rid = rec.get("ID")
        score = rec.get("ClearScore")
        if not rid or not score:
            continue
        out[str(rid // 10)] = max(out.get(str(rid // 10), 0), score)
    return out

def _load_tierce(
    tierce_files: list[tuple[str, str]],
    targets: dict[int, dict],
    monsters: dict[int, dict],
    invasions: dict[int, dict] | None = None,
    buffs: dict[int, dict] | None = None,
    summons: dict[int, list[int]] | None = None,
    reward_items: dict[int, list[dict]] | None = None,
) -> dict[str, dict]:
    out: dict[str, dict] = {}
    by_id_maps: dict[str, dict[int, dict]] = {}
    id2gid_maps: dict[str, dict[int, int]] = {}
    stage_ids: set[int] = set()
    for tierce_fn, maze_fn in tierce_files:
        maze_data = load_json(EXCEL_DIR / maze_fn)
        by_id: dict[int, dict] = {
            r.get("ID"): r for r in maze_data if r.get("ID") is not None
        }
        by_id_maps[maze_fn] = by_id
        id2gid_maps[maze_fn] = {
            r.get("ID"): r.get("GroupID")
            for r in maze_data if r.get("ID") is not None
        }
        for rec in load_json(EXCEL_DIR / tierce_fn):
            stage_ids.update(rec.get("HFIAAGAKFMD", []) or [])
            prev = rec.get("DLCKKJFMJOB")
            prev_rec = by_id.get(prev) if prev is not None else None
            if prev_rec:
                stage_ids.update(prev_rec.get("EventIDList1", []) or [])
                stage_ids.update(prev_rec.get("EventIDList2", []) or [])
    stages = _load_stage_monsters_by_id(stage_ids)
    for tierce_fn, maze_fn in tierce_files:
        by_id = by_id_maps[maze_fn]
        id2gid = id2gid_maps[maze_fn]
        tdata = load_json(EXCEL_DIR / tierce_fn)
        for rec in tdata:
            prev = rec.get("DLCKKJFMJOB")
            gid = id2gid.get(prev) if prev is not None else None
            if gid is None:
                continue
            inv3 = _stage_invasion(
                rec.get("HFIAAGAKFMD", []) or [], invasions, monsters) if invasions else None
            node3_mons = _stage_waves_monsters(
                rec.get("HFIAAGAKFMD", []) or [], stages, monsters, full=True,
                summons=summons, invasion=inv3,
            ) or [
                _monster_out(mid, monsters, full=True)
                for mid in (rec.get("JEBMBCLBIOI", []) or []) if mid in monsters
            ]
            prev_rec = by_id.get(prev) if prev is not None else None
            nodes: list[dict] = []
            for evkey, half, dmgkey in (
                ("EventIDList1", "stage1", "DamageType1"),
                ("EventIDList2", "stage2", "DamageType2"),
            ):
                events = (prev_rec or {}).get(evkey, []) or []
                inv = _stage_invasion(events, invasions, monsters) if invasions else None
                node: dict = {
                    "idx": len(nodes) + 1,
                    "origin": half,
                    "damage": list(dict.fromkeys((prev_rec or {}).get(dmgkey, []) or [])),
                    "monsters": _stage_waves_monsters(
                        events, stages, monsters, full=True, summons=summons, invasion=inv),
                }
                lv = next(
                    (stages[e]["level"] for e in events
                     if e in stages and stages[e]["level"]),
                    None,
                )
                if lv:
                    node["level"] = lv
                cd = (prev_rec or {}).get("ChallengeCountDown", 0) or 0
                if cd:
                    node["countdown"] = cd
                bid = (prev_rec or {}).get("MazeBuffID")
                if bid and buffs and bid in buffs:
                    node["buff"] = {"id": bid, **buffs[bid]}
                if inv:
                    node["invasion"] = inv
                nodes.append(node)
            damage_types = sorted(rec.get("LOJCIDLKPKG", []) or [])
            node3: dict = {
                "idx": 3,
                "origin": "tierce",
                "damage": damage_types,
                "monsters": node3_mons,
            }
            s_eid = (rec.get("HFIAAGAKFMD", []) or [None])[0]
            s_lv = stages[s_eid]["level"] if s_eid in stages else None
            if s_lv:
                node3["level"] = s_lv
            cd3 = rec.get("GNOOAGPBNLD", 0) or 0
            if cd3:
                node3["countdown"] = cd3
            bid3 = next(
                (b for b in (
                    (stages.get(e) or {}).get("maze_buff")
                    for e in (rec.get("HFIAAGAKFMD", []) or [])
                ) if b),
                None,
            )
            if not bid3:
                bid3 = (prev_rec or {}).get("MazeBuffID")
            if bid3 and buffs and bid3 in buffs:
                node3["buff"] = {"id": bid3, **buffs[bid3]}
            if inv3:
                node3["invasion"] = inv3
            nodes.append(node3)
            tids = list(rec.get("OGEOMCGNNMP", []) or [])
            full_tid = rec.get("GNGENMHNLAH")
            if full_tid and full_tid not in tids:
                tids.append(full_tid)
            rewards = [
                {"id": r.get("ItemID"), "num": r.get("ItemNum", 0)}
                for r in (rec.get("EGEEJLHBALB", []) or []) if r.get("ItemID")
            ]
            entry = {
                "id": rec.get("PHFMCACHFIJ"),
                "damage_types": damage_types,
                "countdown": rec.get("GNOOAGPBNLD", 0) or 0,
                "score": rec.get("IDBJENCBJHM"),
                "targets": [
                    {**{k: v for k, v in targets[t].items() if k in ("text", "param", "type")},
                     **({"prism": True} if t == full_tid else {})}
                    for t in tids if t in targets
                ],
                "monsters": node3_mons,
                "nodes": nodes,
            }
            if rewards:
                entry["rewards"] = rewards
            prism_rid = rec.get("IMCMJHAMMKK")
            if reward_items and prism_rid in reward_items:
                entry["prism_reward"] = reward_items[prism_rid]
            if s_lv:
                entry["level"] = s_lv
            out[str(gid)] = entry
    return out

def _season_stats(recs: list[dict]) -> dict:
    floors = stage = countdown = 0
    damage: set[str] = set()
    floor_damage: list[dict] = []
    for r in sorted(recs, key=lambda x: x.get("ID", 0)):
        floors = max(floors, r.get("Floor", 0) or 0)
        stage = max(stage, r.get("StageNum", 0) or 0)
        countdown = max(countdown, r.get("ChallengeCountDown", 0) or 0)
        stage_types: list[list[str]] = []
        for key in ("DamageType1", "DamageType2"):
            f_types: list[str] = []
            for d in r.get(key, []) or []:
                damage.add(d)
                if d not in f_types:
                    f_types.append(d)
            stage_types.append(f_types)
        f = r.get("Floor", 0) or 0
        if f and any(stage_types):
            floor_damage.append({
                "floor": f,
                "stage1": stage_types[0],
                "stage2": stage_types[1],
            })
    return {
        "damage_types": sorted(damage),
        "floors": floors,
        "stage_num": stage,
        "countdown": countdown,
        "floor_damage": floor_damage,
    }

def _stage_monsters(
    mid_list: list[int], monsters: dict[int, dict]
) -> list[dict]:
    out: list[dict] = []
    for mid in mid_list:
        if mid not in monsters:
            continue
        out.append(_monster_out(mid, monsters))
    return out

def _season_monsters(
    recs: list[dict], monsters: dict[int, dict], stages: dict[int, dict]
) -> list[dict]:
    out: list[dict] = []
    seen: set[int] = set()
    for r in sorted(recs, key=lambda x: x.get("ID", 0)):
        for key in ("EventIDList1", "EventIDList2"):
            for mid in _stage_mids(r.get(key, []) or [], stages):
                if mid in seen:
                    continue
                if mid not in monsters:
                    continue
                seen.add(mid)
                out.append(_monster_out(mid, monsters))
    return out

_RANK_ORDER = {
    "BigBoss": 5, "LittleBoss": 4, "Elite": 3, "MinionLv2": 2, "Minion": 1,
}

def _final_monsters(pool: list[dict], fallback: list[dict], n: int = 4) -> list[dict]:
    pool = pool or fallback
    seen: set[str] = set()
    out: list[dict] = []
    for m in sorted(
        pool, key=lambda x: _RANK_ORDER.get(str(x.get("rank", "")), 0), reverse=True
    ):
        key = str(m.get("tpl") or m.get("id"))
        if key in seen:
            continue
        seen.add(key)
        out.append({k: v for k, v in m.items() if k != "wave"})
        if len(out) >= n:
            break
    return out

def _load_invasion_index() -> dict[int, dict]:
    data = load_json(EXCEL_DIR / "StageInvasionConfig.json")
    out: dict[int, dict] = {}
    for rec in data:
        stage_id = rec.get("StageID")
        if stage_id is None:
            continue
        mids: list[int] = []
        for item in rec.get("MonsterInvasionList") or []:
            mid = item.get("DBLDCKODNEN")
            if mid is not None and mid not in mids:
                mids.append(mid)
        out[stage_id] = {"level": rec.get("InvasionID"), "monster_ids": mids}
    return out

def _stage_invasion(
    events: list[int], invasions: dict[int, dict], monsters: dict[int, dict]
) -> dict | None:
    for eid in events or []:
        inv = invasions.get(eid)
        if not inv:
            continue
        node: dict = {"level": inv["level"], "stage_id": eid}
        mons = [
            _monster_out(mid, monsters)
            for mid in inv["monster_ids"] if mid in monsters
        ]
        if mons:
            node["monsters"] = mons
        return node
    return None

def _load_summon_index() -> dict[int, list[int]]:
    out: dict[int, list[int]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterConfig.json"):
        mid = rec.get("MonsterID")
        summons = [s for s in (rec.get("SummonIDList") or []) if s]
        if mid is not None and summons:
            out[mid] = list(dict.fromkeys(summons))
    return out

def _summon_out(mid: int, monsters: dict[int, dict], polluted: int | None = None) -> dict:
    info = monsters.get(mid) or {}
    out: dict = {
        "id": str(mid),
        "name": info.get("name") or "",
        "icon": info.get("icon") or "",
    }
    tpl = info.get("_tpl")
    if tpl:
        out["tpl"] = str(tpl)
    if polluted:
        out["polluted"] = polluted
    return out

def _polluted_index(invasion: dict | None) -> dict[int, int]:
    level = (invasion or {}).get("level")
    if not level:
        return {}
    return {
        int(m["id"]): level
        for m in (invasion or {}).get("monsters") or []
        if m.get("id") is not None
    }

def _monster_summons(
    mid: int,
    monsters: dict[int, dict],
    summons: dict[int, list[int]],
    polluted: dict[int, int] | None = None,
) -> list[dict]:
    out: list[dict] = []
    for sid in summons.get(mid, []):
        if sid not in monsters:
            continue
        out.append(_summon_out(sid, monsters, (polluted or {}).get(sid)))
    return out

def _guide_template(m: dict, guides: dict[int, dict]) -> int:
    if m.get("tpl"):
        return int(m["tpl"])
    mid = int(m["id"])
    return mid if mid in guides else mid // 100

def _attach_boss_guides(entry: dict, guides: dict[int, dict]) -> None:
    used: dict[str, dict] = {}

    def walk(mons: list[dict] | None) -> None:
        for m in mons or []:
            key = str(_guide_template(m, guides))
            block = guides.get(int(key))
            if not block:
                continue
            used[key] = block
            m["boss_guide"] = key

    for f in entry.get("floor_details") or []:
        for k in ("stage1", "stage2"):
            walk((f.get(k) or {}).get("monsters"))
    tierce = entry.get("tierce") or {}
    for nd in tierce.get("nodes") or []:
        walk(nd.get("monsters"))
    walk(tierce.get("monsters"))
    walk(entry.get("monsters"))
    walk(entry.get("final_monsters"))
    if used:
        entry["boss_guides"] = used

def _apply_pollution(entry: dict) -> None:
    nodes: list[dict] = []
    for f in entry.get("floor_details") or []:
        for key in ("stage1", "stage2"):
            inv = (f.get(key) or {}).get("invasion")
            if inv:
                nodes.append(inv)
    for lv in entry.get("levels") or []:
        if lv.get("invasion"):
            nodes.append(lv["invasion"])
    for n in (entry.get("tierce") or {}).get("nodes") or []:
        if n.get("invasion"):
            nodes.append(n["invasion"])
    levels_by_stage: dict[int, int | None] = {}
    for n in nodes:
        stage_id = n.get("stage_id")
        if stage_id is not None:
            levels_by_stage[stage_id] = n.get("level")
    if not levels_by_stage:
        return
    entry["pollution"] = {
        "count": len(levels_by_stage),
        "levels": sorted({lv for lv in levels_by_stage.values() if lv}),
    }

def _season_floors(
    recs: list[dict],
    monsters: dict[int, dict],
    buffs: dict[int, dict],
    targets: dict[int, dict],
    stages: dict[int, dict],
    full: bool = False,
    invasions: dict[int, dict] | None = None,
    summons: dict[int, list[int]] | None = None,
    rewards: dict[int, list[dict]] | None = None,
    star_rewards: list[dict] | None = None,
) -> list[dict]:
    out: list[dict] = []
    stars_used = 0
    for i, r in enumerate(sorted(recs, key=lambda x: x.get("ID", 0)), start=1):
        floor = r.get("Floor") or i
        lv = next(
            (stages[e]["level"] for key in ("EventIDList1", "EventIDList2")
             for e in (r.get(key, []) or []) if e in stages and stages[e]["level"]),
            None,
        )
        events1 = r.get("EventIDList1", []) or []
        events2 = r.get("EventIDList2", []) or []
        halves: dict[str, dict] = {}
        for key, events in (("stage1", events1), ("stage2", events2)):
            inv = _stage_invasion(events, invasions, monsters) if invasions else None
            half: dict = {
                "damage": list(dict.fromkeys(r.get(
                    "DamageType1" if key == "stage1" else "DamageType2", []) or [])),
                "monsters": _stage_waves_monsters(
                    events, stages, monsters, full, summons=summons, invasion=inv),
            }
            if inv:
                half["invasion"] = inv
            halves[key] = half
        node: dict = {
            "floor": floor,
            "name": resolve_text(r.get("Name", {})),
            "countdown": r.get("ChallengeCountDown", 0) or 0,
            "stage1": halves["stage1"],
            "stage2": halves["stage2"],
        }
        if lv:
            node["level"] = lv
        bid = r.get("MazeBuffID")
        if bid and bid in buffs:
            node["buff"] = {"id": bid, **buffs[bid]}
        tids = r.get("ChallengeTargetID", []) or []
        if tids:
            node["targets"] = [
                {k: v for k, v in targets[t].items() if k in ("text", "param", "type")}
                for t in tids if t in targets
            ]
        rid = r.get("RewardID")
        if rewards and rid in rewards:
            node["reward"] = rewards[rid]
        if star_rewards:
            cap = stars_used + len(tids)
            tier = [t for t in star_rewards if stars_used < t["star"] <= cap]
            if tier:
                node["star_rewards"] = tier
            stars_used = cap
        out.append(node)
    return out

def _season_targets(recs: list[dict], targets: dict[int, dict]) -> list[dict]:
    out: list[dict] = []
    seen: set[int] = set()
    for r in recs:
        for tid in r.get("ChallengeTargetID", []) or []:
            if tid in seen:
                continue
            info = targets.get(tid)
            if not info:
                continue
            seen.add(tid)
            out.append(info)
    return out

def _group_seasons(
    filename: str,
    name_field: str,
    schedules: dict[str, tuple[str, str]],
    *,
    buff_map: dict[int, list[int]] | None = None,
    buff_groups: dict[int, dict[str, list[int]]] | None = None,
    buffs: dict[int, dict] | None = None,
    monsters: dict[int, tuple[str, str]] | None = None,
    targets: dict[int, dict] | None = None,
    turns: dict[str, int] | None = None,
    scores: dict[str, int] | None = None,
    group_names: dict[int, str] | None = None,
    arts: dict[int, dict] | None = None,
    full_monsters: bool = False,
    sub_buffs: dict[int, list[int]] | None = None,
    permanent: set[int] | None = None,
    test_period: set[int] | None = None,
    invasions: dict[int, dict] | None = None,
    summons: dict[int, list[int]] | None = None,
    rewards: dict[int, list[dict]] | None = None,
    star_rewards: dict[int, list[dict]] | None = None,
) -> dict:
    data = load_json(EXCEL_DIR / filename)
    groups: dict[int, list] = defaultdict(list)
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        groups[gid].append(rec)

    stage_ids: set[int] = set()
    for rec in data:
        stage_ids.update(rec.get("EventIDList1", []) or [])
        stage_ids.update(rec.get("EventIDList2", []) or [])
    stages = _load_stage_monsters_by_id(stage_ids)

    buff_map = buff_map or {}
    buffs = buffs or {}
    monsters = monsters or {}
    targets = targets or {}
    group_names = group_names or {}
    invasions = invasions or {}
    summons = summons or {}

    result: dict[str, dict] = {}
    for gid, recs in groups.items():
        rep = min(recs, key=lambda r: r.get("ID", 0))
        live_begin, live_end = schedules.get(str(gid), ("", ""))
        entry = {
            "id": str(gid),
            "zh": group_names.get(gid, "") or resolve_text(rep.get(name_field, {})),
            "en": "",
            "ja": "",
            "ko": "",
            "param": [],
            "begin": "",
            "end": "",
            "live_begin": live_begin,
            "live_end": live_end,
        }
        if permanent and gid in permanent:
            entry["permanent"] = True
        if test_period and gid in test_period:
            entry["test"] = True
        entry.update(_season_stats(recs))
        entry["floor_details"] = _season_floors(
            recs, monsters, buffs, targets, stages, full=full_monsters,
            invasions=invasions, summons=summons, rewards=rewards,
            star_rewards=(star_rewards or {}).get(gid))
        entry["buffs"] = [
            {"id": bid, **buffs[bid]}
            for bid in buff_map.get(gid, []) if bid in buffs
        ]
        if buff_groups and gid in buff_groups:
            grouped = {
                key: [{"id": bid, **buffs[bid]} for bid in ids if bid in buffs]
                for key, ids in buff_groups[gid].items()
            }
            grouped = {key: items for key, items in grouped.items() if items}
            if grouped:
                entry["buff_groups"] = grouped
        if sub_buffs:
            entry["sub_buffs"] = [
                {"id": bid, **buffs[bid]}
                for bid in sub_buffs.get(gid, []) if bid in buffs
            ]
        entry["monsters"] = _season_monsters(recs, monsters, stages)
        floors = entry.get("floor_details") or []
        final_pool: list[dict] = []
        if floors:
            s1 = (floors[-1].get("stage1") or {}).get("monsters") or []
            s2 = (floors[-1].get("stage2") or {}).get("monsters") or []
            final_pool = list(s1) + list(s2)
        entry["final_monsters"] = _final_monsters(final_pool, entry["monsters"])
        entry["targets"] = _season_targets(recs, targets)
        if star_rewards and gid in star_rewards:
            entry["star_rewards"] = star_rewards[gid]
        if turns and str(gid) in turns:
            entry["countdown"] = turns[str(gid)]
        if scores and str(gid) in scores:
            entry["clear_score"] = scores[str(gid)]
        if arts and gid in arts:
            entry["arts"] = arts[gid]
        result[str(gid)] = entry
    return result

def _peak_level_node(
    rec: dict | None,
    stages: dict[int, dict],
    monsters: dict[int, dict],
    buffs: dict[int, dict],
    targets: dict[int, dict],
    kind: str,
    invasions: dict[int, dict] | None = None,
    summons: dict[int, list[int]] | None = None,
    full: bool = False,
) -> dict:
    if rec is None:
        return {}
    events = rec.get("EventIDList", []) or []
    stage = stages.get(events[0]) if events else None
    inv = _stage_invasion(events, invasions, monsters) if invasions else None
    node: dict = {
        "id": rec.get("ID"),
        "kind": kind,
        "name": resolve_text(rec.get("Title", {})),
        "damage": sorted(rec.get("DamageType", []) or []),
        "monsters": _stage_waves_monsters(
            events, stages, monsters, full, summons=summons, invasion=inv),
        "targets": [
            {"text": targets[t]["text"], "param": targets[t]["param"]}
            for t in (rec.get("NormalTargetList", []) or []) if t in targets
        ],
        "tags": [
            {"id": t, "name": buffs[t]["name"], "desc": buffs[t]["desc"],
             "param_list": buffs[t]["param_list"]}
            for t in (rec.get("TagList", []) or []) if t in buffs
        ],
    }
    if stage and stage["level"]:
        node["level"] = stage["level"]
    if inv:
        node["invasion"] = inv
    return node

def _load_peak_badges() -> dict[int, list[dict]]:
    data = load_json(EXCEL_DIR / "ChallengeBadgeConfig.json")
    out: dict[int, list[dict]] = defaultdict(list)
    for rec in data:
        gid = rec.get("ChallengePeakGroupID")
        lv = rec.get("ChallengePeakLevel")
        if gid is None or not lv:
            continue
        name = resolve_text(rec.get("Name", {}))
        if not name:
            continue
        out[gid].append({
            "level": lv,
            "name": name,
            "desc": resolve_text(rec.get("Desc", {})),
            "icon": map_icon_path(rec.get("IconFigurePath", "") or ""),
        })
    return out

def _lean_monster(m: dict) -> dict:
    return {k: v for k, v in m.items() if k not in ("wave", "intro", "skills", "debuff_resist")}

def _peak_seasons(full_monsters: bool = False) -> dict:
    groups = load_json(EXCEL_DIR / "ChallengePeakGroupConfig.json")
    level_data = load_json(EXCEL_DIR / "ChallengePeakConfig.json")
    boss_ext: dict[int, dict] = {
        r.get("ID"): r for r in load_json(EXCEL_DIR / "ChallengePeakBossConfig.json")
    }
    monsters = load_monsters()
    buffs = _load_maze_buffs()
    targets = _load_battle_targets()
    badges_map = _load_peak_badges()
    invasions = _load_invasion_index()
    summons = _load_summon_index()
    peak_star_rewards = _load_peak_star_rewards(_load_reward_items())

    stage_ids: set[int] = set()
    for r in level_data:
        stage_ids.update(r.get("EventIDList", []) or [])
    for r in boss_ext.values():
        stage_ids.update(r.get("HardEventIDList", []) or [])
    stages = _load_stage_monsters_by_id(stage_ids)
    level_by_id: dict[int, dict] = {
        r.get("ID"): r for r in level_data if r.get("ID") is not None
    }

    result: dict[str, dict] = {}
    for g in groups:
        gid = g.get("ID")
        if gid is None:
            continue
        dmg: set[str] = set()
        all_mons: list[dict] = []
        seen: set[int] = set()
        all_buffs: list[dict] = []
        levels: list[dict] = []
        ladder = peak_star_rewards.get(g.get("RewardGroupID")) or []
        knight_ladder = [t for t in ladder if t["kind"] == "knight"]
        king_ladder = [t for t in ladder if t["kind"] == "king"]
        knight_stars = 0
        for lid in g.get("PreLevelIDList", []) or []:
            node = _peak_level_node(
                level_by_id.get(lid), stages, monsters, buffs, targets, "knight",
                invasions, summons, full_monsters)
            if node:
                tier, knight_stars = _slice_peak_star_tiers(
                    knight_ladder, knight_stars, len(node.get("targets") or []))
                if tier:
                    node["star_rewards"] = tier
            levels.append(node)
            dmg.update(node["damage"])
            for m in node["monsters"]:
                if int(m["id"]) not in seen:
                    seen.add(int(m["id"]))
                    all_mons.append(_lean_monster(m))
        boss_id = g.get("BossLevelID")
        if boss_id is not None:
            node = _peak_level_node(
                level_by_id.get(boss_id), stages, monsters, buffs, targets, "king",
                invasions, summons, full_monsters)
            ext = boss_ext.get(boss_id)
            if ext:
                node["buffs"] = [
                    {"id": bid, **buffs[bid]}
                    for bid in (ext.get("BuffList", []) or []) if bid in buffs
                ]
                all_buffs = node["buffs"]
                hard_events = ext.get("HardEventIDList", []) or []
                hard_stage = stages.get(hard_events[0]) if hard_events else None
                hard: dict = {
                    "name": resolve_text(ext.get("HardTitle", {})),
                    "monsters": _stage_waves_monsters(
                        hard_events, stages, monsters, full_monsters, summons=summons),
                    "targets": [
                        {"text": targets[t]["text"], "param": targets[t]["param"]}
                        for t in [ext.get("HardTarget")] if t in targets
                    ],
                    "tags": [
                        {"id": t, "name": buffs[t]["name"], "desc": buffs[t]["desc"],
                         "param_list": buffs[t]["param_list"]}
                        for t in (ext.get("HardTagList", []) or []) if t in buffs
                    ],
                }
                if hard_stage and hard_stage["level"]:
                    hard["level"] = hard_stage["level"]
                top = max((t for t in king_ladder), key=lambda x: x["star"], default=None)
                if top is not None:
                    hard["star_rewards"] = [_peak_tier_row(top)]
                node["hard"] = hard
            tier, _ = _slice_peak_star_tiers(
                king_ladder, 0, len(node.get("targets") or []))
            if tier:
                node["star_rewards"] = tier
            levels.append(node)
            dmg.update(node["damage"])
            for m in node["monsters"]:
                if int(m["id"]) not in seen:
                    seen.add(int(m["id"]))
                    all_mons.append(_lean_monster(m))
        king = next((l for l in levels if l.get("kind") == "king"), None)
        final_pool = ((king or levels[-1]).get("monsters") or []) if levels else []
        result[str(gid)] = {
            "id": str(gid),
            "zh": resolve_text(g.get("Title", {})),
            "en": "",
            "ja": "",
            "ko": "",
            "param": [],
            "begin": "",
            "end": "",
            "live_begin": "",
            "live_end": "",
            "damage_types": sorted(dmg),
            "levels": levels,
            "monsters": all_mons,
            "final_monsters": _final_monsters(final_pool, all_mons),
            "buffs": all_buffs,
        }
        _apply_pollution(result[str(gid)])
        if gid in badges_map:
            result[str(gid)]["badges"] = badges_map[gid]
        ladder = peak_star_rewards.get(g.get("RewardGroupID"))
        if ladder:
            result[str(gid)]["star_rewards"] = [_peak_tier_row(t) for t in ladder]
        icon_path = g.get("ThemeIconPicPath") or ""
        if icon_path:
            result[str(gid)].setdefault("arts", {})["tab"] = icon_path
        poster_path = g.get("ThemePosterTabPicPath") or ""
        if poster_path:
            result[str(gid)].setdefault("arts", {})["poster_tab"] = poster_path
        banner_path = g.get("HandBookPanelBannerPath") or ""
        if banner_path:
            result[str(gid)].setdefault("arts", {})["handbook_banner"] = banner_path
    return result

def convert() -> None:
    schedules_maze, maze_test_periods = _load_schedules(
        "ChallengeGroupConfig.json",
        ("ScheduleDataChallengeMaze.json", "ScheduleDataGlobal.json"),
    )
    schedules_story, _ = _load_schedules(
        "ChallengeStoryGroupConfig.json", ("ScheduleDataChallengeStory.json",)
    )
    schedules_boss, _ = _load_schedules(
        "ChallengeBossGroupConfig.json", ("ScheduleDataChallengeBoss.json",)
    )
    buffs = _load_maze_buffs()
    monsters = load_monsters()
    targets = _load_targets()
    maze_buff_map = _group_maze_buff()
    story_buff_map = _group_extra_buff("ChallengeStoryGroupExtra.json", ("BuffList",))
    boss_buff_map = _group_extra_buff(
        "ChallengeBossGroupExtra.json", ("BuffList1", "BuffList2")
    )
    boss_buff_groups = _group_extra_buff_groups("ChallengeBossGroupExtra.json")
    boss_guides = load_boss_guides()
    story_turns = _load_story_turns()
    story_scores = _load_story_scores()
    story_sub_buffs = _group_extra_sub_buffs()
    mode_default_icons = _load_mode_default_icons()
    invasions = _load_invasion_index()
    summons = _load_summon_index()

    targets_all = {
        **_load_targets("ChallengeTargetConfig.json"),
        **_load_targets("ChallengeStoryTargetConfig.json"),
        **_load_targets("ChallengeBossTargetConfig.json"),
    }
    rewards = _load_reward_items()
    tierce = _load_tierce(
        [
            ("ChallengeMazeTierce.json", "ChallengeMazeConfig.json"),
            ("ChallengeStoryMazeTierce.json", "ChallengeStoryMazeConfig.json"),
            ("ChallengeBossMazeTierce.json", "ChallengeBossMazeConfig.json"),
        ],
        targets_all,
        monsters,
        invasions=invasions,
        buffs=buffs,
        summons=summons,
        reward_items=rewards,
    )

    maze = _group_seasons(
        "ChallengeMazeConfig.json", "Name", schedules_maze,
        buff_map=maze_buff_map, buffs=buffs, monsters=monsters, targets=targets,
        group_names=_load_group_names("ChallengeGroupConfig.json"),
        arts=_merge_arts(
            _load_group_arts("ChallengeGroupConfig.json"),
            _load_group_arts("ChallengeMazeGroupExtra.json"),
        ),
        permanent=_load_permanent_groups(),
        test_period=maze_test_periods,
        invasions=invasions,
        summons=summons,
        rewards=rewards,
        star_rewards=_star_reward_ladder(
            "ChallengeGroupConfig.json", "ChallengeMazeRewardLine.json",
            "ChallengeMazeConfig.json", rewards),
    )
    for k in maze:
        if k in tierce:
            maze[k]["tierce"] = tierce[k]
    for entry in maze.values():
        _apply_pollution(entry)
    _attach_default_icon(maze, mode_default_icons.get("maze"))
    save_json(maze, OUTPUT_DIR / "maze.json")

    story = _group_seasons(
        "ChallengeStoryMazeConfig.json", "Name", schedules_story,
        buff_map=story_buff_map, buffs=buffs, monsters=monsters,
        targets=_load_targets("ChallengeStoryTargetConfig.json"),
        turns=story_turns,
        scores=story_scores,
        group_names=_load_group_names("ChallengeStoryGroupConfig.json"),
        arts=_merge_arts(
            _load_group_arts("ChallengeStoryGroupConfig.json"),
            _load_group_arts("ChallengeStoryGroupExtra.json"),
        ),
        sub_buffs=story_sub_buffs,
        invasions=invasions,
        summons=summons,
        rewards=rewards,
        star_rewards=_star_reward_ladder(
            "ChallengeStoryGroupConfig.json", "ChallengeStoryRewardLine.json",
            "ChallengeStoryMazeConfig.json", rewards),
    )
    for k in story:
        if k in tierce:
            story[k]["tierce"] = tierce[k]
    for entry in story.values():
        _apply_pollution(entry)
    _attach_default_icon(story, mode_default_icons.get("story"))
    save_json(story, OUTPUT_DIR / "maze_extra.json")

    boss = _group_seasons(
        "ChallengeBossMazeConfig.json", "Name", schedules_boss,
        buff_map=boss_buff_map, buffs=buffs, monsters=monsters,
        buff_groups=boss_buff_groups,
        targets=_load_targets("ChallengeBossTargetConfig.json"),
        group_names=_load_group_names("ChallengeBossGroupConfig.json"),
        full_monsters=True,
        arts=_merge_arts(
            _load_group_arts("ChallengeBossGroupConfig.json"),
            _load_group_arts("ChallengeBossGroupExtra.json"),
        ),
        invasions=invasions,
        summons=summons,
        rewards=rewards,
        star_rewards=_star_reward_ladder(
            "ChallengeBossGroupConfig.json", "ChallengeBossRewardLine.json",
            "ChallengeBossMazeConfig.json", rewards),
    )
    for k in boss:
        if k in tierce:
            boss[k]["tierce"] = tierce[k]
    for entry in boss.values():
        _attach_boss_guides(entry, boss_guides)
    for entry in boss.values():
        _apply_pollution(entry)
    _attach_default_icon(boss, mode_default_icons.get("boss"))
    save_json(boss, OUTPUT_DIR / "maze_boss.json")

    peak = _peak_seasons(full_monsters=True)
    save_json(peak, OUTPUT_DIR / "maze_peak.json")
