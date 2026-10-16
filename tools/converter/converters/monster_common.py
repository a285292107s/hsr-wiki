"""敌方信息聚合（endgame 赛季敌方 / monster_detail 详情页共用）。

完整表→字段→输出映射见 docs/data/转换器字段映射.md（monster_common 段）。
源：MonsterTemplateConfig / MonsterConfig / MonsterCamp / MonsterSkillConfig / HardLevelGroup /
EliteGroup / MonsterStatusResistanceType。
输出 {模板ID: {name,icon,figure,weak,resist,rank,camp,intro,skills,stance,stats,
                stat_ratio,level_group,elite_group,debuff_resist}}；
实例别名 MonsterID(如200401009)≠模板ID时指向同模板，使波次引用直接命中。
`stance` 与 `stats` 内的四维基准**缺位不落键**（源表只有 StanceBase/SpeedBase 会缺，见 `_base_stat`）。
战斗数值合成链（米游社《星铁数据机制通论》公式，参考站逐位反推验证，判据见 ADR 0040/0045/0049）：
  stat(level) = stats[基准] × stat_ratio[维度修饰比] × elite_ratio[精英组倍率]
                × level_curve[level_group][level] ＋ 修正值[曲线后加，ADR 0045]
等级曲线（745 行）与精英组倍率（1,423 组）都不进每怪物 payload，各共享一份，
由 monster_detail 分别落 monster-level-curve.json / monster-elite-group.json；
模板页基准值 stats 仍是官方模板原值，供列表与对照。
关卡语境（`StageConfig` 行的 Level/HardLevelGroup/EliteGroup）由 `stage_context` 单点解析，
两处消费：monster_extra 的出没样本（透传给前端合成）与 endgame 的敌方卡 HP（`monster_hp_at`
在转换期落单值——终局轻形态不带合成链输入，前端无法自行合成）。
战斗阶段生命（`PhaseMaxHPRatio`）**只在 `Config/ConfigCharacter` 客户端配置里**
（ExcelOutput 零命中），由 `load_phase_hp_ratios` 读，`monster_hp_phases` 按它把上面那条链
展开成逐阶段值（ADR 0058）。
"""
import json
import logging
import math

from config import EXCEL_DIR, SOURCE_DIR
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


def stage_context(rec: dict) -> dict:
    """`StageConfig` 行 → 关卡语境 {level, level_group, elite_group}（缺位不落键，ADR 0050）。

    「N 关 M 级怪的实际面板」的原始三件套：等级与难度组定曲线行，关卡精英组与怪物自身组
    **叠乘**（Π精英组别系数）。只透传关卡行原值，合成留在消费侧（前端 `monster-stats.ts` /
    转换期 `monster_hp_at`）。个别行的嵌套 `{Value:…}` 包装逐层解开。
    """
    def val(field: str):
        v = rec.get(field)
        depth = 0
        while isinstance(v, dict) and depth < 4:
            v = v.get("Value")
            depth += 1
        return v if isinstance(v, int) and not isinstance(v, bool) else None

    ctx: dict = {}
    for key, field in (("level", "Level"), ("level_group", "HardLevelGroup"),
                       ("elite_group", "EliteGroup")):
        v = val(field)
        if v is not None:
            ctx[key] = v
    return ctx


def _hp_ratio(row: dict | None) -> float:
    """精英组倍率行的生命维（缺行 / 缺位 / 非正 → 中性 1，ADR 0049）。"""
    v = (row or {}).get("hp")
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0 else 1.0


def _js_round1(v: float) -> float:
    """取一位小数，半值向 +∞——对齐前端 `Math.round(v * 10) / 10`（内建 `round` 是 banker's
    rounding，`.5` 处逐值不同，见 docs/memory/data-semantics.md）。"""
    return math.floor(v * 10 + 0.5) / 10


def _monster_hp_raw(info: dict, level: object, stage: dict, curve: dict, elite_groups: dict) -> float | None:
    """合成链的**未取整**结果（`monster_hp_at` 与 `monster_hp_phases` 共用同一算式）。

    取整只做一次、且发生在最外层：阶段血量是「未取整基准 × 各阶段比例」后逐项取整，
    若在中间先取整再乘比例，末位会与「基准 × 比例」的直算值差 0.1（ADR 0058 决策 2）。
    """
    base = (info.get("stats") or {}).get("hp")
    if not isinstance(base, (int, float)) or isinstance(base, bool):
        return None
    if not isinstance(level, int) or isinstance(level, bool) or level <= 0:
        return None
    row = (curve.get(str(stage.get("level_group") or 1)) or {}).get(str(level))
    if not row:
        return None
    curve_hp = row.get("hp")
    if not isinstance(curve_hp, (int, float)) or isinstance(curve_hp, bool):
        return None
    ratio = (info.get("stat_ratio") or {}).get("hp")
    if not isinstance(ratio, (int, float)) or isinstance(ratio, bool) or ratio <= 0:
        ratio = 1.0
    out = (base * ratio
           * _hp_ratio(elite_groups.get(str(info.get("elite_group") or 1)))
           * _hp_ratio(elite_groups.get(str(stage.get("elite_group") or 1)))
           * curve_hp)
    return out if math.isfinite(out) else None


def monster_hp_at(info: dict, level: object, stage: dict, curve: dict, elite_groups: dict) -> float | None:
    """敌方实例在**已知关卡语境**下的生命值（战斗数值合成链，ADR 0040/0049/0050）。

    口径 = `stats.hp × stat_ratio.hp × (自身精英组.hp × 关卡精英组.hp) × 曲线[关卡难度组][等级]`
    ——与前端 `monster-stats.ts → monsterStatAt('hp', …)` 同一算式；此处供终局敌方卡在**转换期落
    单值** HP（终局轻形态不带合成链输入，前端无法自行合成，见 `endgame._monster_out`）。
    任何一段缺位即 None（调用方不落 `hp` 键，宁缺不假）：基准缺失、等级不可用、曲线缺组 / 缺行。
    关卡精英组缺位等价于「不参与叠乘」（中性 1），与前端 `monsterEliteRatiosProduct` 同判据。
    """
    out = _monster_hp_raw(info, level, stage, curve, elite_groups)
    return _js_round1(out) if out is not None else None


def monster_hp_phases(
    info: dict,
    level: object,
    stage: dict,
    curve: dict,
    elite_groups: dict,
    ratios: list[float] | None,
) -> list[float] | None:
    """敌方实例在**该关卡语境**下、**逐战斗阶段**的生命值（ADR 0058）。

    `ratios` 取自 `load_phase_hp_ratios()[模板 ID]`（该模板的战斗阶段生命倍率，阶段序）；
    每阶段 = `未取整合成基准 × ratios[i]`，逐项一位小数、半值向 +∞（与 `monster_hp_at` 同取整口径）。
    单阶段（`ratios` 缺位或长度 < 2）返回 None —— 调用方不落 `phase_hp` 键，由单值 `hp` 承担呈现，
    避免给单阶段敌方各挂一个「只有一项、值与 `hp` 相同」的数组（实测 473/632 个模板属此列）。
    合成链缺段（基准 / 等级 / 曲线）或无有效比例时同样 None。
    """
    if not ratios or len(ratios) < 2:
        return None
    raw = _monster_hp_raw(info, level, stage, curve, elite_groups)
    if raw is None:
        return None
    out: list[float] = []
    for r in ratios:
        if not isinstance(r, (int, float)) or isinstance(r, bool) or r <= 0:
            return None
        out.append(_js_round1(raw * r))
    return out


_PHASE_HP_RATIOS: dict[int, list[float]] | None = None
"""`load_phase_hp_ratios` 的进程内缓存（12 MB 客户端配置只扫一遍）。"""


def _phase_ratio_expr(ratio: dict, dyn: dict, own_cfg: dict, skills: dict[int, dict]) -> float | None:
    """`PhaseMaxHPRatio` → 数值（静态字面量直接取，动态表达式沿「读值表」解析到技能参数）。

    上游两种形态（按转换器实际读的口径，402 条阶段条目：331 条未声明、70 条动态、1 条静态）：
    - 未声明（`PhaseMaxHPRatio` 键缺失）由调用方按中性 1 处理，不走本函数；
    - 静态：`{"IsDynamic": false, "FixedValue": {"Value": n}}`；
    - 动态：`{"IsDynamic": true, "PostfixExpr": {"DynamicHashes": [h]}}` —— `h` 指向同文件
      `DynamicValues.Floats[str(h)].ReadInfo`，形如 `{Type: SkillParam, TriggerKey, Index}`，
      再经「该模板 `MonsterConfig.SkillList` 里 `SkillTriggerKey` 匹配的技能」的
      `ParamList[Index].Value` 取到实参。`ReadInfo.Type` 三类实测：`SkillParam`（可解析）、
      `None`（指向属性而非技能参数）、`ClientOnly`（客户端专有，无实参）；**本用途下 70 条动态
      表达式全部是 `SkillParam`**，另两类按「解析不出」处理，不猜语义。
    解析不出即 None（调用方按「该模板整条不落」处理并 warning 留痕，不静默填 1）。
    """
    if not ratio.get("IsDynamic"):
        v = (ratio.get("FixedValue") or {}).get("Value")
        return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
    for h in ((ratio.get("PostfixExpr") or {}).get("DynamicHashes") or []):
        info = (dyn.get(str(h)) or {}).get("ReadInfo") or {}
        if info.get("Type") != "SkillParam":
            return None
        tk, idx = info.get("TriggerKey"), info.get("Index")
        if not isinstance(idx, int):
            return None
        for sid in own_cfg.get("SkillList") or []:
            skill = skills.get(sid)
            if skill and skill.get("SkillTriggerKey") == tk:
                params = skill.get("ParamList") or []
                if idx < len(params):
                    v = params[idx].get("Value")
                    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
                return None
        return None
    return None


def load_phase_hp_ratios() -> dict[int, list[float]]:
    """多阶段敌方的**逐战斗阶段生命倍率** → {模板 ID: [阶段 1 比例, 阶段 2 比例, …]}（ADR 0058）。

    源 = `Config/ConfigCharacter/**/*_Config*.json`（经 `MonsterTemplateConfig.JsonConfig` 指针；
    619/632 指向 `Monster/*`，12 条 `GridFight/*`，1 条 `FinalityBattle/*`）的
    `PhaseList[].PhaseMaxHPRatio`。该字段**在 ExcelOutput 零命中**（2,253 份全表扫描），
    是本仓第一处消费客户端实体配置的产物字段，故单点封装在此、增量依赖登记整个目录。

    语义（判据见 ADR 0058）：比例是「该阶段最大生命 = 基准 × 比例」，**不是**「占总量份额」——
    取值可 > 1（解析后实测 6 / 9 / 2.5 / 2 / 1.9 / 1.66 / 1.5 / 1.4，也有 0.5 / 0.6 / 0.7 / 0.75），
    且同一模板里阶段 1 未声明而阶段 2 显式 `1`（模板 2004021/2004022）说明**未声明等价 1**。
    脚本层零消费（`Config/ConfigAbility/**` 里该字段 0 命中）⇒ 由引擎在 `SetMonsterPhase` 时读取；
    站内只做展示，不做战斗时序推导。

    三条取舍：
    1. **只落跨 ≥2 阶段的模板**：单阶段（473/632）与无该字段的模板不落键——给单阶段敌方各挂一个
       「只有一项、值与 `hp` 相同」的数组是纯冗余；
    2. **阶段序按 `PhaseNum` 排序**，不依赖 `PhaseList` 的数组顺序（上游是保序的，但不做前提）；
       并要求 `PhaseNum` 恰为 1..n 连续（实测 185/185 满足）——数组下标即阶段号，前端据此出
       「阶段 N」；有洞即整条不落（同下条，宁缺不假）；
    3. 比例解析不出即**整条不落**并 warning 留痕（宁可退回单值 `hp`，不填半真数据）。
    """
    global _PHASE_HP_RATIOS
    if _PHASE_HP_RATIOS is not None:
        return _PHASE_HP_RATIOS
    skills = {r["SkillID"]: r for r in load_json(EXCEL_DIR / "MonsterSkillConfig.json")}
    cfg_by_tpl: dict[int, dict] = {}
    for r in load_json(EXCEL_DIR / "MonsterConfig.json"):
        cfg_by_tpl.setdefault(r.get("MonsterTemplateID"), r)
    out: dict[int, list[float]] = {}
    unparsed: list[int] = []
    unordered: list[int] = []
    missing: list[int] = []
    for rec in load_json(EXCEL_DIR / "MonsterTemplateConfig.json"):
        tpl = rec.get("MonsterTemplateID")
        ptr = rec.get("JsonConfig") or ""
        if tpl is None or not ptr:
            continue
        path = SOURCE_DIR / ptr
        if not path.exists():
            missing.append(tpl)
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            unparsed.append(tpl)
            continue
        phases = data.get("PhaseList")
        if not phases:
            continue
        dyn = ((data.get("DynamicValues") or {}).get("Floats") or {})
        own = cfg_by_tpl.get(tpl) or {}
        ordered = sorted((p for p in phases if isinstance(p, dict)),
                         key=lambda p: p.get("PhaseNum") or 0)
        # 阶段号必须是 1..n 连续（实测 185/185 个带 PhaseList 的模板全部满足）：前端按
        # 下标 +1 出「阶段 N」，序号有洞就会错位。不满足即整条不落 + warning（宁缺不假）。
        if [p.get("PhaseNum") for p in ordered] != list(range(1, len(ordered) + 1)):
            unordered.append(tpl)
            continue
        ratios: list[float] = []
        for ph in ordered:
            ratio = ph.get("PhaseMaxHPRatio")
            # 未声明 = 中性 1（判据：模板 2004021/2004022 里阶段 1 未声明、阶段 2 显式 1，行为一致）
            value = 1.0 if ratio is None else _phase_ratio_expr(ratio, dyn, own, skills)
            if value is None or value <= 0:
                unparsed.append(tpl)
                ratios = []
                break
            ratios.append(value)
        if len(ratios) >= 2:
            out[tpl] = ratios
    if missing:
        logger.warning("MonsterTemplateConfig 的 JsonConfig 指向不存在的实体配置：%d 个模板（ID：%s）",
                       len(missing), ",".join(str(i) for i in sorted(missing)))
    if unparsed:
        logger.warning("实体配置的 PhaseMaxHPRatio 无法解析，这些模板不落 phase_hp（ID：%s）",
                       ",".join(str(i) for i in sorted(set(unparsed))))
    if unordered:
        logger.warning("实体配置的 PhaseNum 不是 1..n 连续，这些模板不落 phase_hp（ID：%s）",
                       ",".join(str(i) for i in sorted(set(unordered))))
    logger.info("战斗阶段生命倍率：%d/%d 个模板跨 ≥2 阶段", len(out), len(cfg_by_tpl))
    _PHASE_HP_RATIOS = out
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


_BASE_STATS = (("hp", "HPBase"), ("atk", "AttackBase"), ("def", "DefenceBase"), ("speed", "SpeedBase"))
"""基准属性源字段 → 输出键（`stats` 的落键顺序即此顺序）。"""


def _base_stat(rec: dict, field: str) -> float | None:
    """`MonsterTemplateConfig` 的基准字段（`StanceBase` / `{HP,Attack,Defence,Speed}Base`）→ 数值。

    **缺字段或非数值一律 None，由调用方决定不落键**（取代旧的 `or 0`）。实测源表 632 条：
    `StanceBase` 缺 33、`SpeedBase` 缺 13，且这两个字段**只要存在就从不取 0** ⇒ 0 从来不是官方
    数值，只是「上游没给」的伪造值——它在详情页与终局敌方卡上都会把「未知」显示成 0，比缺数据
    更误导（仓规「缺位按中性 1，绝不按 0」讲的是**比率**维度；基准值没有中性值可言，故这里只区分
    「有 / 没有」，不做任何代偿）。逐层剥 `{"Value": …}`（与 `_stat_ratio_from_cfg` 同理）。
    """
    v: object = rec.get(field)
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return v if isinstance(v, (int, float)) else None


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
                             stat_ratio, level_group, elite_group, debuff_resist}}。

    `stance` 与 `stats.{hp,atk,def,speed}` **缺位不落键**（不再是 `or 0`）：源表里这几个字段
    `HPBase`/`AttackBase`/`DefenceBase` 全 632 条都有值，只有 `StanceBase`(缺 33) 与 `SpeedBase`(缺 13)
    会缺，故实际只影响这两维；缺位按字段汇总 `logger.warning`（带模板 ID）。"""
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
            # 战斗阶段门控（`MonsterSkillConfig.PhaseList`，阶段号从 1 起）：该技能在哪些阶段可用。
            # 上游按阶段切换技能表（同族里「阶段 3 专属」的技能只挂后段），这是站内唯一有来源的
            # 「阶段」结构——首领机制的阶段**文案**另走 `MonsterGuideConfig`（未登记的首领没有，
            # 见 docs/memory/data-pipeline.md）。空表 = 无阶段门控，按「缺位不落键」不输出。
            **({"phase_list": [int(p) for p in r["PhaseList"]]} if r.get("PhaseList") else {}),
        }
    cfg_by_id = {r.get("MonsterID"): r for r in configs}
    cfg_by_tpl = {r.get("MonsterTemplateID"): r for r in configs}
    out: dict[int, dict] = {}
    # 基准字段缺位登记：源表 632 条里只有 StanceBase(33) / SpeedBase(13) 会缺，逐条 warning 会刷 46+ 行，
    # 故按**字段**汇总成一行，行内列出模板 ID（可定位到具体哪只怪，仓规「缺位必须留痕」）。
    missing: dict[str, list[int]] = {}
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
        # 基准值：有值才落键（缺位见 _base_stat）；缺位记进 missing，循环后**每字段一行**汇总告警
        stance = _base_stat(rec, "StanceBase")
        stats: dict[str, float] = {}
        for key, field in _BASE_STATS:
            v = _base_stat(rec, field)
            if v is None:
                missing.setdefault(field, []).append(mid)
            else:
                stats[key] = v
        if stance is None:
            missing.setdefault("StanceBase", []).append(mid)
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
            # 韧性/四维基准：**缺位不落键**（不再是 `or 0`），前端按「键缺失 = 未知」呈现（见 _base_stat）
            **({"stance": stance} if stance is not None else {}),
            "stats": stats,
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
    # 缺位汇总告警（每字段一行，且**只在真缺位时**出）：不落键这件事必须留痕，否则「上游没给」
    # 会被当成「官方就是没有」而无人察觉（仓规：缺位的静默中性化只做一半仍是静默错）。
    for field, ids in missing.items():
        logger.warning("MonsterTemplateConfig 缺基准字段 %s：%d 个模板不落该键（ID：%s）",
                       field, len(ids), ",".join(str(i) for i in sorted(ids)))
    return out
