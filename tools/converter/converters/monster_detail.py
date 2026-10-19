import logging

from config import OUTPUT_DIR
from utils import save_json
from converters.monster_common import load_elite_groups, load_level_curve, load_monsters
from converters.monster_guide import load_boss_guides
from converters.monsters import catalog_rows
from converters.monster_extra import (
    load_appearances, load_drops, load_event_sources, load_phases, load_skill_extra_effects,
    load_statuses,
)
from converters.voracity import load_invasion_map

logger = logging.getLogger("converter")


def _art_shared(monsters: dict, rows: list[dict]) -> dict[int, dict]:
    by_stem: dict[str, list[dict]] = {}
    for row in rows:
        stem = (row.get("icon") or "").rsplit("/", 1)[-1].removesuffix(".png")
        by_stem.setdefault(stem, []).append(row)
    figure_of = lambda mid: (monsters.get(mid) or {}).get("figure") or ""  # noqa: E731
    out: dict[int, dict] = {}
    for group in by_stem.values():
        if len({r["name"] for r in group}) < 2:
            continue
        for row in group:
            peers: list[dict] = []
            seen: set[str] = set()
            for p in group:
                if p["name"] == row["name"] or p["name"] in seen:
                    continue
                seen.add(p["name"])
                peers.append(p)
            if not peers:
                continue
            same_figure = [p for p in peers if figure_of(p["id"]) == figure_of(row["id"])]
            pick = same_figure[0] if same_figure else peers[0]
            out[row["id"]] = {
                "id": pick["id"],
                "name": pick["name"],
                "figure": figure_of(pick["id"]) == figure_of(row["id"]),
                "forms": len(peers) + 1,
            }
    return out


def convert() -> None:
    monsters = load_monsters()
    curve = load_level_curve()
    save_json(curve, OUTPUT_DIR / "monster-level-curve.json")
    save_json(load_elite_groups(), OUTPUT_DIR / "monster-elite-group.json")
    invaded = load_invasion_map(monsters)
    art_shared = _art_shared(monsters, catalog_rows(monsters))
    drops = load_drops()
    appearances = load_appearances()
    phases = load_phases()
    extra_effects = load_skill_extra_effects()
    statuses = load_statuses()
    events = load_event_sources()
    guides = load_boss_guides()
    output_dir = OUTPUT_DIR / "monsters"
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for mid in sorted(monsters):
        info = monsters[mid]
        skills = []
        for s in info["skills"]:
            fx = extra_effects.get(s["id"])
            skills.append({**s, "extra_effects": fx} if fx else s)
        detail = {
            "id": mid,
            "name": info["name"],
            "icon": info["icon"],
            "figure": info["figure"],
            "rank": info["rank"],
            "camp": info["camp"],
            **({"stance": info["stance"]} if "stance" in info else {}),
            "weak": info["weak"],
            "resist": info["resist"],
            "intro": info["intro"],
            "stats": info["stats"],
            "skills": skills,
            **({"stance_modify": info["stance_modify"]} if info.get("stance_modify") is not None else {}),
            **({"speed_modify": info["speed_modify"]} if info.get("speed_modify") is not None else {}),
            "stat_ratio": info["stat_ratio"],
            "level_group": info["level_group"],
            "elite_group": info.get("elite_group", 1),
        }
        tpl = info.get("_tpl") or mid
        if tpl in invaded:
            detail["invaded"] = invaded[tpl]
        if drops.get(tpl):
            detail["drops"] = drops[tpl]
        if appearances.get(tpl):
            detail["appearances"] = appearances[tpl]
        if phases.get(tpl):
            detail["phases"] = phases[tpl]
        if guides.get(tpl, {}).get("phases"):
            detail["guide_phases"] = guides[tpl]["phases"]
        if statuses.get(tpl):
            detail["statuses"] = statuses[tpl]
        if events.get(tpl):
            detail["event"] = events[tpl]
        if art_shared.get(tpl):
            detail["art_shared"] = art_shared[tpl]
        save_json(detail, output_dir / f"{mid}.json")
        count += 1

    logger.info("已保存 %d 个敌对物种详情到 %s", count, output_dir)
