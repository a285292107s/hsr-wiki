"""首领机制：`MonsterGuideConfig` × `MonsterGuidePhase` × `MonsterGuideTag` 的共享装配。

两处消费（**同一份判据只在这一个模块里**）：
- `converters/endgame.py` → 末日幻影敌方卡的「首领特性 + 阶段机制」（赛季级 `boss_guides`）；
- `converters/monster_detail.py` → 敌方详情页的 `guide_phases`（阶段名自带「阶段一：…」前缀）。

绑定关系在上游只到「模板」这一层（`TagList` / `PhaseList` 挂在 MonsterID 实例上，实例 = 模板 ×100
+ 难度序号），故本模块按模板聚合一次：实测同模板的 4 个难度实例 TagList 与 PhaseList 都逐字相同（21/21）。
"""
from collections import defaultdict

from config import EXCEL_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value


def load_guide_phases() -> dict[int, dict]:
    """MonsterGuidePhase × MonsterGuideSkill × MonsterGuideSkillText → {PhaseID: 阶段条目}。

    阶段条目 = 阶段名（PhaseName 自带「阶段一：…」前缀）+ 机制说明（PhaseDescription）+
    官方应对策略（PhaseAnswer）+ 小节问答（SkillList → MonsterGuideSkill.SkillName 是问句，
    正文在 MonsterGuideSkillText.SkillDescription，如「如何高效削减首领幻影的韧性」）。
    实测 29 个被引用阶段的三段文本均无 #N[i] 占位符、57 个招式各只有 1 条文本，故不落
    param_list；PhasePic 全为空串，不消费。
    """
    texts: dict[int, str] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideSkillText.json"):
        tid = rec.get("SkillTextID")
        if tid is not None:
            texts[tid] = resolve_text(rec.get("SkillDescription", {}), clean=False)
    skills: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideSkill.json"):
        sid = rec.get("SkillID")
        if sid is None:
            continue
        skills[sid] = {
            "name": resolve_text(rec.get("SkillName", {})),
            "desc": " ".join(t for t in (texts.get(t) for t in (rec.get("SkillTextIDList") or [])) if t),
        }
    out: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuidePhase.json"):
        pid = rec.get("PhaseID")
        if pid is None:
            continue
        out[pid] = {
            "id": pid,
            "name": resolve_text(rec.get("PhaseName", {})),
            "desc": resolve_text(rec.get("PhaseDescription", {}), clean=False),
            "answer": resolve_text(rec.get("PhaseAnswer", {}), clean=False),
            "skills": [skills[s] for s in (rec.get("SkillList") or []) if s in skills],
        }
    return out


def load_boss_guides() -> dict[int, dict]:
    """MonsterGuideConfig × MonsterGuideTag × MonsterGuidePhase → {敌方模板 ID: 首领机制}。

    输出 {tpl: {"traits": [机制条目], "phases": [阶段条目]}}，**按敌方模板键**（`MonsterID // 100`）。
    首领特性 = 首领幻影的战斗机制条目（如「坚防守备」，游戏内教程「◆ 首领特性 ◆」；
    对照站与旧稿把它称「关卡效果」，但游戏内「关卡效果」实指每期「末法余烬」）。
    **配置表的敌方 ID 未必等于战斗敌方**——业火焚心的影将军战斗模板 2035012 在配置表里
    登记为蚀心兽 2033022，直接按模板 join 会整层漏。缺失时用 Tag.SkillID // 100 反查
    （技能 ID = 模板 ×100 + 技能序号），**仅当反查结果唯一**时采用：技能 ID 会被多个首领
    共享（如 100401410），不唯一即放弃，宁缺勿错挂。
    """
    tags: dict[int, dict] = {}
    tag_skill: dict[int, int] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideTag.json"):
        tid = rec.get("TagID")
        if tid is None:
            continue
        name = resolve_text(rec.get("TagName", {}))
        desc = resolve_text(rec.get("TagBriefDescription", {}), clean=False)
        if not name and not desc:
            continue
        tags[tid] = {
            "id": tid,
            "name": name,
            "desc": desc,
            "param_list": [unwrap_value(p) for p in (rec.get("ParameterList") or [])],
        }
        if rec.get("SkillID"):
            tag_skill[tid] = rec["SkillID"]

    tpl_tag_ids: dict[int, list[int]] = {}
    tpl_phase_ids: dict[int, list[int]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideConfig.json"):
        mid = rec.get("MonsterID")
        if mid is None:
            continue
        tpl = mid // 100
        ids = tpl_tag_ids.setdefault(tpl, [])
        for tid in rec.get("TagList", []) or []:
            if tid in tags and tid not in ids:
                ids.append(tid)
        phase_ids = tpl_phase_ids.setdefault(tpl, [])
        for pid in rec.get("PhaseList", []) or []:
            if pid not in phase_ids:
                phase_ids.append(pid)

    phases = load_guide_phases()
    out: dict[int, dict] = {}
    for tpl, ids in tpl_tag_ids.items():
        block: dict = {}
        if ids:
            block["traits"] = [tags[t] for t in ids]
        items = [phases[p] for p in tpl_phase_ids.get(tpl, []) if p in phases]
        if items:
            block["phases"] = items
        if block:
            out[tpl] = block

    # 技能 ID 反查：只补配置表缺失的模板，且同一反查键必须唯一命中一个登记模板
    alias: dict[int, set[int]] = defaultdict(set)
    for tpl, ids in tpl_tag_ids.items():
        for tid in ids:
            sk = tag_skill.get(tid)
            if not sk:
                continue
            alt = sk // 100
            if alt == tpl:
                continue
            alias[alt].add(tpl)
    for alt, srcs in alias.items():
        if alt in out or len(srcs) != 1:
            continue
        src = next(iter(srcs))
        if src in out:
            out[alt] = out[src]
    return out
