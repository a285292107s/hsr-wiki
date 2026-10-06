"""敌方信息聚合（endgame 赛季敌方 / monster_detail 详情页共用）。

完整表→字段→输出映射见 docs/data/转换器字段映射.md（monster_common 段）。
源：MonsterTemplateConfig / MonsterConfig / MonsterCamp / MonsterSkillConfig / HardLevelGroup /
EliteGroup / MonsterStatusResistanceType。
输出 {模板ID: {name,icon,figure,weak,resist,rank,camp,intro,skills,stance,stats,
                stat_ratio,level_group,elite_group,debuff_resist}}；
实例别名 MonsterID(如200401009)≠模板ID时指向同模板，使波次引用直接命中。
战斗数值合成链（米游社《星铁数据机制通论》公式，参考站逐位反推验证，判据见 ADR 0040/0045/0049）：
  stat(level) = stats[基准] × stat_ratio[维度修饰比] × elite_ratio[精英组倍率]
                × level_curve[level_group][level] ＋ 修正值[曲线后加，ADR 0045]
等级曲线（745 行）与精英组倍率（1,423 组）都不进每怪物 payload，各共享一份，
由 monster_detail 分别落 monster-level-curve.json / monster-elite-group.json；
模板页基准值 stats 仍是官方模板原值，供列表与对照。
"""
import logging

from config import EXCEL_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value

logger = logging.getLogger("converter")

def _stat_ratio_from_cfg(cfg: dict) -> dict:
    """MonsterConfig 的维度修饰比 → {hp,atk,def,speed}；缺位或不可解析取 1（中性）。
    个别记录的 ratio 是双层 ValueWrap（{Value:{Value:n}}），逐层解到数值为止。"""
    def frac(field: str) -> float:
        v: object = cfg.get(field)
        depth = 0
        while isinstance(v, dict) and depth < 4:
            v = v.get("Value")
            depth += 1
        return float(v) if isinstance(v, (int, float)) else 1.0
    return {
        "hp": frac("HPModifyRatio"),
        "atk": frac("AttackModifyRatio"),
        "def": frac("DefenceModifyRatio"),
        "speed": frac("SpeedModifyRatio"),
    }

def load_level_curve() -> dict[str, dict[str, dict[str, float]]]:
    """HardLevelGroup 等级曲线 → {group: {level: {hp,atk,def,speed}}}（键 str 化以贴合 JSON）。
    战斗数值合成的第二段：与 MonsterTemplateConfig 基准、MonsterConfig 修饰比联乘；
    判据见 ADR 0040。比率缺位取中性 1，不静默归零。"""
    curve: dict[str, dict[str, dict[str, float]]] = {}
    for r in load_json(EXCEL_DIR / "HardLevelGroup.json"):
        g, lv = r.get("HardLevelGroup"), r.get("Level")
        if g is None or lv is None:
            continue
        def frac(field: str) -> float:
            v: object = r.get(field)
            depth = 0
            while isinstance(v, dict) and depth < 4:
                v = v.get("Value")
                depth += 1
            return float(v) if isinstance(v, (int, float)) else 1.0
        key = str(g)
        lv_key = str(lv)
        if lv_key in curve.get(key, {}):
            logger.warning("HardLevelGroup 曲线键重复：group=%s level=%s，保留首条", g, lv)
            continue
        curve.setdefault(key, {})[lv_key] = {
            "hp": frac("HPRatio"),
            "atk": frac("AttackRatio"),
            "def": frac("DefenceRatio"),
            "speed": frac("SpeedRatio"),
        }
    return curve


def _elite_group(cfg: dict) -> int:
    """`MonsterConfig.EliteGroup` → 精英组号（缺位/不可解析 → 1 基准组，组 1 全倍率为 1）。"""
    v: object = cfg.get("EliteGroup")
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return int(v) if isinstance(v, (int, float)) and v else 1


def load_elite_groups() -> dict[str, dict[str, float]]:
    """EliteGroup 精英组倍率 → {group: {hp,atk,def,speed,stance}}（键 str 化以贴合 JSON）。
    战斗数值合成链的第四段（ADR 0049）：不随等级变化的整体倍率，怪物自身
    （MonsterConfig.EliteGroup）与关卡侧指派（StageConfig.EliteGroup 等）共用本表、可叠乘。
    落全量——关卡指派的组（隧洞组 3、花萼组 7 等）不被任何怪物配置引用，但关卡语境合成要用。
    比率缺位取中性 1，不静默归零。"""
    out: dict[str, dict[str, float]] = {}
    for r in load_json(EXCEL_DIR / "EliteGroup.json"):
        g = r.get("EliteGroup")
        if g is None:
            continue

        def frac(field: str) -> float:
            v: object = r.get(field)
            depth = 0
            while isinstance(v, dict) and depth < 4:
                v = v.get("Value")
                depth += 1
            return float(v) if isinstance(v, (int, float)) else 1.0

        key = str(g)
        if key in out:
            logger.warning("EliteGroup 组键重复：group=%s，保留首条", g)
            continue
        out[key] = {
            "hp": frac("HPRatio"),
            "atk": frac("AttackRatio"),
            "def": frac("DefenceRatio"),
            "speed": frac("SpeedRatio"),
            "stance": frac("StanceRatio"),
        }
    return out


def load_status_resist_icons() -> dict[str, str]:
    """`MonsterStatusResistanceType` → {状态类别 Type: 免疫图标 basename}（11 条）。

    如 `STAT_CTRL_Frozen → IconImmuneFrozen`（源路径 `SpriteOutput/UI/Avatar/Icon/IconImmune*.png`）。
    **该表只有 Type + Icon 两列，没有任何文字名**（TextMap 搜「免疫冻结」类文案 0 命中、
    `MonsterStatusConfig` 无 `STAT_CTRL*` 同名 ModifierName）⇒ 消费侧只能呈现「效果抵抗 + 图标 +
    百分比」，**禁止**自造状态名或按后缀猜名（实测按后缀会得到「深寒 / 待岗 / 债务危机」这类无关状态）。
    """
    out: dict[str, str] = {}
    for rec in load_json(EXCEL_DIR / "MonsterStatusResistanceType.json"):
        key = rec.get("Type")
        icon = rec.get("Icon") or ""
        if key and icon:
            out[key] = icon.rsplit("/", 1)[-1].removesuffix(".png")
    return out

def _debuff_resist(cfg: dict, icons: dict[str, str]) -> list[dict]:
    """`MonsterConfig.DebuffResist` → [{key, value, icon}]（无图标的状态类别跳过）。

    值 = 该类负面效果的抵抗率（实测 0.5 / 0.75 / 1）。图标缺失即无视觉标识，宁缺勿列。
    逐层剥 `{"Value": …}` 包装（与 `_stat_ratio_from_cfg` 同理：个别记录是双层 ValueWrap，
    单次 unwrap 会留下一个 dict）。
    """
    out: list[dict] = []
    for rec in cfg.get("DebuffResist") or []:
        key = rec.get("Key")
        icon = icons.get(key or "")
        if not key or not icon:
            continue
        value: object = rec.get("Value")
        depth = 0
        while isinstance(value, dict) and depth < 4:
            value = value.get("Value")
            depth += 1
        out.append({"key": key, "value": value if isinstance(value, (int, float)) else 0, "icon": icon})
    return out

def _modify_value(cfg: dict, field: str) -> float | None:
    """`MonsterConfig.{Stance,Speed}ModifyValue` → 数值（缺位/不可解析 → None）。

    **刻意不并入 `stance` / `stats.speed`**：ADR 0040 只裁决了「基准 × 维度修饰比 × 等级曲线」，
    `*ModifyValue` 属它明确排除的「场景系数（社群术语修饰值 2）」一侧——实测 `*ModifyRatio` 全
    2722 条恒为 1（唯一旋钮是 Value）、`StanceModifyValue` 全是 30 的整数倍且 2250/2722 为空、
    stance 根本不在等级曲线链里，而**加法的位置（曲线前 / 曲线后）在仓内无据可验**。
    故只作透明度落盘（原值，含负值），由展示层标注「另有修正」，绝不代它算进任何数字。
    逐层剥 `{"Value": …}`（与 `_stat_ratio_from_cfg` 同理，个别记录双层包装）。
    """
    v: object = cfg.get(field)
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return float(v) if isinstance(v, (int, float)) else None


def load_monsters() -> dict[int, dict]:
    """敌方信息聚合 → {ID: {name, icon, figure, weak, resist, rank, camp, intro, skills, stance, stats,
                             stat_ratio, level_group, elite_group, debuff_resist}}。"""
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    resist_icons = load_status_resist_icons()
    camps = {
        r["ID"]: resolve_text(r.get("Name", {}))
        for r in load_json(EXCEL_DIR / "MonsterCamp.json") if r.get("ID") is not None
    }
    skills = {}
    for r in load_json(EXCEL_DIR / "MonsterSkillConfig.json"):
        sid = r.get("SkillID")
        if sid is None:
            continue
        name = resolve_text(r.get("SkillName", {}))
        if not name:
            continue
        skills[sid] = {
            "id": sid,
            "name": name,
            "tag": resolve_text(r.get("SkillTag", {})),
            "type_desc": resolve_text(r.get("SkillTypeDesc", {})),
            "damage_type": r.get("DamageType", "") or "",
            "attack_type": r.get("AttackType", "") or "",
            "desc": resolve_text(r.get("SkillDesc", {}), clean=False),
            "param_list": [unwrap_value(p) for p in (r.get("ParamList") or [])],
        }
    cfg_by_id = {r.get("MonsterID"): r for r in configs}
    cfg_by_tpl = {r.get("MonsterTemplateID"): r for r in configs}
    out: dict[int, dict] = {}
    for rec in templates:
        mid = rec.get("MonsterTemplateID")
        if mid is None:
            continue
        name = resolve_text(rec.get("MonsterName", {}))
        if not name:
            continue
        icon = rec.get("ManikinImagePath", "") or ""
        figure = rec.get("ImagePath", "") or ""
        cfg = cfg_by_id.get(mid) or cfg_by_tpl.get(mid) or {}
        out[mid] = {
            "name": name,
            "icon": icon.rsplit("/", 1)[-1].replace(".png", "") if icon else "",
            "figure": figure.rsplit("/", 1)[-1].replace(".png", "") if figure else "",
            "weak": list(dict.fromkeys(cfg.get("StanceWeakList", []) or [])),
            "resist": {
                x["DamageType"]: x["Value"]["Value"]
                for x in (cfg.get("DamageTypeResistance") or [])
            },
            "rank": rec.get("Rank", "") or "",
            "camp": camps.get(rec.get("MonsterCampID"), "") or "",
            "intro": resolve_text(cfg.get("MonsterIntroduction", {})),
            "skills": [skills[sid] for sid in (cfg.get("SkillList") or []) if sid in skills],
            "stance": unwrap_value(rec.get("StanceBase", {})) or 0,
            "stats": {
                "hp": unwrap_value(rec.get("HPBase", {})) or 0,
                "atk": unwrap_value(rec.get("AttackBase", {})) or 0,
                "def": unwrap_value(rec.get("DefenceBase", {})) or 0,
                "speed": unwrap_value(rec.get("SpeedBase", {})) or 0,
            },
            # 维度修饰比/难度组/精英组：战斗合成链第二/三/四段（ADR 0040/0049）。模板自身 cfg 缺位时按中性 1 / 组 1。
            "stat_ratio": _stat_ratio_from_cfg(cfg) if cfg else {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": (cfg.get("HardLevelGroup") or 1) if cfg else 1,
            "elite_group": _elite_group(cfg) if cfg else 1,
            # 效果抵抗（DebuffResist × MonsterStatusResistanceType）：按状态类别给图标，无文字名
            "debuff_resist": _debuff_resist(cfg, resist_icons),
        }
        # 场景修正值（透明度透出，口径见 _modify_value）：非空才落键，缺位不占 payload
        for key, field in (("stance_modify", "StanceModifyValue"), ("speed_modify", "SpeedModifyValue")):
            mv = _modify_value(cfg, field)
            if mv is not None:
                out[mid][key] = mv
    for rec in configs:
        mid, tpl = rec.get("MonsterID"), rec.get("MonsterTemplateID")
        if mid is not None and tpl is not None and mid != tpl and tpl in out:
            # 实例变体的修饰比/难度组/精英组用**它自己**的 config 记录：模板与变体的同四项不同值
            # （1002011 hpR=1，100201101 hpR=0.266667；1002050 精英组 1，100205006 精英组 2），
            # 沿用模板值会把变体战斗数值算错；效果抵抗同理按实例自己的 DebuffResist（逐实例登记的抵抗率可能不同）
            variant = {
                **out[tpl],
                "_tpl": tpl,
                "stat_ratio": _stat_ratio_from_cfg(rec),
                "level_group": rec.get("HardLevelGroup") or 1,
                "elite_group": _elite_group(rec),
                "debuff_resist": _debuff_resist(rec, resist_icons),
            }
            # 修正值同样以实例自己的记录为准：**不得继承模板的**（模板有 +30 而实例无值时，
            # 继承会让这张卡凭空多出一个不属于它的修正标注）
            for key, field in (("stance_modify", "StanceModifyValue"), ("speed_modify", "SpeedModifyValue")):
                mv = _modify_value(rec, field)
                if mv is None:
                    variant.pop(key, None)
                else:
                    variant[key] = mv
            out.setdefault(mid, variant)
    return out
