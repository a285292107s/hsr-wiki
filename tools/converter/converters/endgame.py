"""终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）转换器。

完整表→字段→输出映射见 docs/data/转换器字段映射.md（endgame 段），本文件只留硬约束：
- 排期按分组表 ScheduleDataID 指针解析（ADR 0038；旧「ScheduleID-200000=GroupID」推断废弃
  ——迷宫新赛季指针 291015/291016 已迁全局表且脱离编号约定），忘却之庭回退
  ScheduleDataGlobal 且允许单边日期；早于公测(2023-04-26)或 ≥2030 占位丢弃。
- 敌方以 StageConfig 波次为准（非关卡表 NpcMonsterIDList 代表怪，仅 61 个、缺 2/3）。
- 末日幻影层级敌方只取 EventIDList1/2 波次（ADR 0031）：ChallengeBossMazeExtra 的
  MonsterID1/2/3 是**节点**不是首领形态，末层第 3 项就是星启附加关、第 2 项在影将军
  那场是指南别名，故该表一律不读。
- floors 键 = 赛季最大层数统计；永屹之城遗秘(组100)无 Floor 字段，按 ID 升序取序号。
- 混淆解包字段：PHFMCACHFIJ=星启关ID / LOJCIDLKPKG=弱点 / GNOOAGPBNLD=回合 /
  OGEOMCGNNMP=目标ID组 / JEBMBCLBIOI=敌方ID（详见映射表）。
- 污染等级（ADR 0026）判据是 StageInvasionConfig.StageID ∈ EventIDList1/2（异相仲裁
  为 EventIDList），不是怪物 ID：末日幻影楼层只登记首领，被污染小怪由机制额外加入，
  按怪物 join 会整层漏判。
- 赛季增益按场次下发（末日幻影 BuffList1/2/3 = 上半场/下半场/星启模式），扁平 buffs
  仍是 1+2 的并集（目录卡与 AI 快照沿用），分场次落 buff_groups。
- 首领机制（末日幻影，官方文案；对照站与旧稿称「关卡效果」）= 首领特性（MonsterGuideConfig ×
  MonsterGuideTag）+ 阶段机制（MonsterGuidePhase × MonsterGuideSkill × MonsterGuideSkillText），
  按**敌方模板**聚合落赛季级 `boss_guides`，命中登记的敌方条目带 `boss_guide` 模板指针；
  配置表的敌方 ID 未必等于战斗敌方，缺失时用 Tag.SkillID // 100 唯一反查（见 _load_boss_guides）。
- param 字段前端未消费，置空数组贴合结构。
- 奖励（ADR 0051）：**单目标 → 奖励在本版数据里不可解析**——`ChallengeTargetConfig.RewardID`
  指向的 1001xx 段在 `RewardData`（9,515 条）里不存在（该段为空），属悬挂字段，勿再尝试。
  可解析的是两处：**逐层通关奖励**（`Challenge{Maze,StoryMaze,BossMaze}Config.RewardID`，逐层不同）
  与**累计星数奖励线**（分组表 `RewardLineGroupID` → `Challenge{Maze,Story,Boss}RewardLine`
  的 `StarCount` → `RewardData`）；异相仲裁取 `ChallengePeakReward` 的两类星数档
  （骑士星数 / 王棋星数，其余档位语义无官方文案，不上屏）。Hcoin = 星琼（并入物品 1）。
"""

import logging
from collections import defaultdict
from datetime import datetime

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value
from converters.monster_common import load_monsters

logger = logging.getLogger("converter")

_LAUNCH_TS = datetime(2023, 4, 26, 0, 0, 0)

# RewardData.Hcoin 即星琼：全表 9,515 行无一行把星琼写成 ItemID_1（`ItemConfig` 1 = 星琼），
# 而 32.6% 的行用它记星琼数量，故解析时并入物品 1。
_STAR_JADE_ITEM_ID = 1

# 异相仲裁星数奖励分档类型 → 官方文案（TextMap「骑士星数」/「王棋星数」）。
_PEAK_STAR_REWARD_TYPES = {"MOB_STAR_REWARD": "骑士星数", "BOSS_STAR_REWARD": "王棋星数"}

def _load_schedules(
    group_table: str, schedule_tables: tuple[str, ...]
) -> tuple[dict[str, tuple[str, str]], set[int]]:
    """赛季排期：按分组表 ScheduleDataID 指针查排期记录（ADR 0038）。

    旧「ScheduleID - 200000 = GroupID」推断已废弃：迷宫 1034/1035 起指针脱离该编号
    约定（291015/291016）且记录迁入全局表。排期记录按 schedule_tables 顺序查找，
    先登记者胜（忘却之庭 = ScheduleDataChallengeMaze 优先、ScheduleDataGlobal 回退）。
    单边日期（Begin/End 其一为空）原样保留，排序/状态展示由前端取首个已知端点。
    占位过滤：任一已知端点年份 ≥2030 丢弃；End 早于公测为 beta 测试期（打测试标、
    不落日期）；仅 Begin 且早于公测视同 beta 残留丢弃。无指针的常驻组不进入结果。
    """
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
    """MazeBuff.json → {ID: {name, desc, param_list, icon}}（赛季增益名称 + 效果描述）。

    desc 保留原始富文本（#N[i] 参数占位 + color/unbreak 标签），供前端 fmtDesc 渲染；
    param_list 为 ParamList 的 Value 数组（占位符替换参数）；icon 为 BuffIcon
    去 SpriteOutput/ 前缀与 .png 后缀的相对路径（如 BuffIcon/Inlevel/xxx），
    前端经 bufficon CDN 分类加载 webp（资源未就绪时以 SVG 占位兜底）。
    """
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

def _load_guide_phases() -> dict[int, dict]:
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

def _load_boss_guides() -> dict[int, dict]:
    """MonsterGuideConfig × MonsterGuideTag × MonsterGuidePhase → {敌方模板 ID: 首领机制}（末日幻影）。

    输出 {tpl: {"traits": [机制条目], "phases": [阶段条目]}}，**按敌方模板键**：绑定关系在
    上游只到「模板」这一层（TagList 挂在 MonsterID 实例上，实例 = 模板 ×100 + 难度序号），
    故按模板聚合一次——实测同模板的 4 个难度实例 TagList 与 PhaseList 都逐字相同（21/21）。
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

    phases = _load_guide_phases()
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

def _monster_out(mid: int, monsters: dict[int, dict], full: bool = False) -> dict:
    """敌方输出对象：{id, name, icon, weak, resist, rank, camp, stance, speed}。

    full=True 追加 intro/skills（星启信息卡消费；层级/赛季波次全量为轻量字段，
    避免图鉴介绍与技能在大量重复引用中膨胀体积）。skills 仅取名称 + 标签
    （技能全量字段由 monster_detail 转换器输出）。调用方需自行保证 mid 已注册
    （未注册返回空 dict，勿直接使用）。
    实例别名（MonsterID≠MonsterTemplateID）附 tpl=模板 ID，前端跳转怪物详情用
    （详情文件按模板 ID 命名）；stats 仅提升 speed（模板 SpeedBase，与韧性同源）。
    实例自带的 `{Stance,Speed}ModifyValue` **在此直接并入** stance/speed（敌方卡无等级语境：
    口径 = 基准 + 修正值，见 ADR 0045），故输出里没有这两个键；详情页因要支持等级滑条而保留
    原值、由前端按 `基准 × 修饰比 × 曲线 + 修正值` 合成。
    stat_ratio / level_group / elite_group（战斗数值合成链，ADR 0040/0049）同样不进终局 payload：
    终局敌方卡不显示这层合成，随归属详情页；
    full=True 追加 intro/skills/debuff_resist（敌方详情卡形态：末日幻影楼层 / 星启节点 /
    异相仲裁单关）；轻形态剥掉这三项——效果抵抗只在详情卡上有位，图标 + 百分比行落卡内。
    """
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
            out[k] = [{"name": s["name"], "tag": s.get("tag")} for s in v]
        else:
            out[k] = v
    # 实例修正值在此**直接并入**：敌方卡没有等级滑条（无等级语境），口径 = 基准 + 修正值
    # （`最终值 = 基准 × 修饰比 × 曲线 + 修正值` 在曲线缺位时退化为基准确认值与修正值相加）。
    # 判据与验证见 ADR 0045；详情页因要支持等级滑条而保留原值、由前端合成。
    stance_mod = info.get("stance_modify")
    if stance_mod is not None and "stance" in out:
        out["stance"] = out["stance"] + stance_mod
    speed_mod = info.get("speed_modify")
    if speed_mod is not None and "speed" in out:
        out["speed"] = out["speed"] + speed_mod
    return out

def _load_targets(filename: str = "ChallengeTargetConfig.json") -> dict[int, dict]:
    """目标表 → {ID: {text, param, type}}（挑战目标描述 + 参数 + 类型，三模式通用）。

    text 经 clean_text 清洗富文本标签，保留 #N[i] 占位符（参数另行输出，
    前端 fmtDesc 替换渲染）；param 取 ChallengeTargetParam1（缺省 None）；
    type 为 ChallengeTargetType（TOTAL_SCORE 分数档位 / ROUNDS_LEFT 剩余轮数 /
    DEAD_AVATAR 减员限制，前端按类型展示徽标——星启目标是整场挑战的评价条件，
    与 3 个节点（敌方配置）正交，非节点级条件）。
    上游个别目标缺 param（如 163 系列），按同文本 Hash 的其他记录参数补全。
    """
    data = load_json(EXCEL_DIR / filename)
    out: dict[int, dict] = {}
    hash_params: dict[int, int] = {}
    raw: list[tuple[int, str, int | None, int | None, str]] = []
    for rec in data:
        tid = rec.get("ID")
        if tid is None:
            continue
        desc = clean_text(resolve_text(rec.get("ChallengeTargetName", {})))
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
    """`RewardData` → {RewardID: [{id, num}]}（最多六槽位，Hcoin 并入星琼）。

    奖励线与逐层通关奖励都指到这张表；槽位空缺或数量为 0 的项跳过。前端经
    `items.json` 映射名称与图标（星琼 = 物品 1，与 items.json 同键）。
    """
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
    """奖励线表 → {GroupID: [(累计星数, RewardID)]}（按星数升序）。"""
    out: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for rec in load_json(EXCEL_DIR / filename):
        gid, star, rid = rec.get("GroupID"), rec.get("StarCount"), rec.get("RewardID")
        if gid is None or star is None or rid is None:
            continue
        out[int(gid)].append((int(star), int(rid)))
    return {g: sorted(v) for g, v in out.items()}

def _load_reward_line_groups(filename: str) -> dict[int, int]:
    """分组表 → {期 GroupID: 奖励线 GroupID}（`RewardLineGroupID` 指针）。"""
    out: dict[int, int] = {}
    for rec in load_json(EXCEL_DIR / filename):
        gid, rlg = rec.get("GroupID"), rec.get("RewardLineGroupID")
        if gid is None or rlg is None:
            continue
        out[int(gid)] = int(rlg)
    return out

def _season_star_caps(filename: str) -> dict[int, int]:
    """各期可达星数上限 = Σ 该期层记录的目标数（实测每层 3 个目标 = 3 星）。

    同一奖励线 Group 被层数不同的多期共用（如 10 层期与 12 层期同为 Group 2），
    上限用于把不可达的档位截掉。
    """
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
    """赛季累计星数奖励阶梯 → {期 GroupID: [{star, items}]}（升序）。

    指针链：分组表 `RewardLineGroupID` → 奖励线表（`StarCount` → `RewardID`）→ `RewardData`；
    超过本期星数上限的档位不展示（该档本期不可达）。
    """
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
    """`ChallengePeakReward` → {RewardGroupID: [{label, star, items}]}。

    只取两类有官方文案的星数档（TextMap「骑士星数」/「王棋星数」）；通关档
    （MOB_PASS_REWARD）/ 极限档（BOSS_STAR_LIMIT_REWARD）/ 彩色目标档
    （BOSS_COLOR_TARGET_REWARD）的档位语义无官方文案，本轮不上屏（ADR 0051）。
    """
    out: dict[int, list[dict]] = defaultdict(list)
    for rec in load_json(EXCEL_DIR / "ChallengePeakReward.json"):
        label = _PEAK_STAR_REWARD_TYPES.get(rec.get("RewardType", ""))
        gid, val, rid = rec.get("RewardGroupID"), rec.get("TypeValue"), rec.get("RewardID")
        if not label or gid is None or val is None or rid not in items:
            continue
        out[int(gid)].append({"label": label, "star": int(val), "items": items[int(rid)]})
    return {g: sorted(v, key=lambda x: (x["label"], x["star"])) for g, v in out.items()}

def _group_maze_buff(filename: str = "ChallengeGroupConfig.json") -> dict[int, list[int]]:
    """忘却之庭分组表 → {GroupID: [MazeBuffID]}（赛季增益单值）。"""
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
    """虚构叙事 / 末日幻影主题表 → {GroupID: [BuffID...]}（去重保序）。

    story 取 BuffList；boss 取 BuffList1/2 的并集（分场次见 _group_extra_buff_groups——
    BuffList3 = 星启模式增益，不进扁平 buffs）。
    """
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
    """末日幻影主题表 → {GroupID: {场次: [BuffID...]}}（分场次赛季增益，各场次去重保序）。

    末日幻影的赛季增益按场次下发：BuffList1 = 上半场、BuffList2 = 下半场、BuffList3 = 星启模式
    （每场次 3 条，与战斗内节点一一对应）。合并成一串会丢掉「哪三条属于哪一场」，故按场次分组
    输出；扁平 buffs 仍保留 BuffList1+2 的并集，供目录卡与 AI 快照沿用（口径为 6 条）。
    """
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
    """虚构叙事战意赛季主题机制 → {GroupID: [BuffID...]}（SubMazeBuffList，去重保序）。

    StoryType=Fever（战意）赛季专属：机制（追加攻击积累战意值）+ 效果
    （战熄潮平 / 战意汹涌 两阶段），Normal 赛季为空。
    """
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
    """分组表 → {GroupID: GroupName}（赛季名缺失时回退，如最新未命名赛季）。"""
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
    """常驻关卡分组：ScheduleDataID 为空的长期关卡（无赛季轮回）。

    忘却之庭 永屹之城遗秘(100) / 天艟求仙迷航录(900) 为长期关卡，
    官方以 ScheduleDataID 空标识无排期关联；其余赛季组均有排期 ID。
    """
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
    """分组表 → {GroupID: {background, tab, ...}}（赛季海报/标签图路径）。

    按 _GROUP_ART_FIELDS 映射全部图标字段（源表缺失的字段自动跳过）；
    多表合并（分组表 + 主题 extra 表）由 _merge_arts 逐键互补完成。
    前端经 endgameArtUrl 白名单 + 目录段小写规则消费，未收录前缀不渲染。
    """
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
    """多表 arts 逐键合并（同 GroupID 的字段互补，不互相覆盖）。"""
    out: dict[int, dict] = {}
    for m in arts_maps:
        for gid, arts in m.items():
            out.setdefault(gid, {}).update(arts)
    return out

def _load_mode_default_icons() -> dict[str, str]:
    """ChallengeGeneralConfig → {玩法键: 玩法级默认图标路径}。

    TabImgPath 为各玩法入口默认图（Memory/Story/Boss → UI/ChallengeBoss/
    ChallengeBossQuestTabImg{1,2,3}.png）；异相仲裁（Peak）无记录，缺省。
    供无赛季专属图标时兜底（前端 seasonArtUrl 回退消费）。
    """
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
    """玩法级默认图标兜底：并入各赛季 arts.default（无赛季专属图标时前端使用）。"""
    if not default_path:
        return
    for entry in entries.values():
        entry.setdefault("arts", {})["default"] = default_path

def _load_battle_targets() -> dict[int, dict]:
    """BattleTargetConfig → {ID: {text, param}}（异相仲裁挑战目标）。

    仅采集 Type=ChallengeTarget 记录；text 经 clean_text 清洗富文本标签，
    保留 #N[i] 占位符（参数另出，前端 fmtDesc 替换渲染）。
    """
    data = load_json(EXCEL_DIR / "BattleTargetConfig.json")
    out: dict[int, dict] = {}
    for rec in data:
        tid = rec.get("ID")
        if tid is None or rec.get("Type") != "ChallengeTarget":
            continue
        desc = clean_text(resolve_text(rec.get("TargetName", {})))
        if not desc:
            continue
        out[tid] = {"text": desc, "param": rec.get("TargetParam")}
    return out

def _stage_binding_buff(rec: dict) -> int | None:
    """StageConfig 自身登记的战斗内关卡增益（`StageConfigData._BindingMazeBuff`）→ BuffID；无则 None。

    末日幻影每层与星启附加关都在这里绑定当期「末法余烬」，与层记录 `MazeBuffID` 同值
    ——星启表没有 buff 字段。忘却之庭 / 虚构叙事的附加关无此绑定（缺失由调用方另行回退）。
    """
    for item in rec.get("StageConfigData") or []:
        if item.get("BFLIFKBEOPJ") != "_BindingMazeBuff":
            continue
        raw = item.get("MNDFOPKBHKP")
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None
    return None

def _load_stage_monsters_by_id(stage_ids: set[int]) -> dict[int, dict]:
    """StageConfig 按需提取 → {StageID: {level, waves, maze_buff}}。

    MonsterList 为波次列表（每波 {Monster0..N: ID} 字典），波内保序保留；
    波次顺序即战斗出场顺序。仅保留调用方关心的 StageID，避免 24MB 表整体驻留。
    maze_buff 为关卡自身绑定的关卡增益（仅星启节点 3 消费）。
    """
    if not stage_ids:
        return {}
    data = load_json(EXCEL_DIR / "StageConfig.json")
    out: dict[int, dict] = {}
    for rec in data:
        sid = rec.get("StageID")
        if sid not in stage_ids:
            continue
        waves: list[list[int]] = []
        for wave in rec.get("MonsterList", []) or []:
            mids = [v for v in wave.values() if v]
            if mids:
                waves.append(mids)
        out[sid] = {"level": rec.get("Level", 0) or 0, "waves": waves,
                    "maze_buff": _stage_binding_buff(rec)}
    return out

def _stage_mids(events: list[int], stages: dict[int, dict]) -> list[int]:
    """EventIDList → StageConfig 波次扁平 ID 列表（波内保序去重，未命中跳过）。"""
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
    """EventIDList → StageConfig 波次 → 带 wave 序号的敌方对象（波内保序，未注册跳过）。

    wave 为战斗波次序号（1 起，跨事件连续递增）；默认轻量字段输出（intro/skills
    仅星启信息卡 full=True 时输出，控制体积）。summons 传入时，**每个敌方条目**
    附加该实例自己的召唤物 `summons[]`（见 _monster_summons，ADR 0036）——召唤物归属
    召唤者，故不再在场次上单独出行；invasion 同时传入时，命中的召唤物带污染等级。
    """
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
                entry = {**_monster_out(mid, monsters, full), "wave": wave_no}
                if summons:
                    items = _monster_summons(mid, monsters, summons, polluted)
                    if items:
                        entry["summons"] = items
                out.append(entry)
    return out

def _load_story_turns() -> dict[str, int]:
    """ChallengeStoryMazeExtra.json → {GroupID: 最大回合限制}（层记录 ID // 10 = GroupID）。"""
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
    """ChallengeStoryMazeExtra.json → {GroupID: 通关分数线 ClearScore}（层记录 ID // 10）。

    虚构叙事为分数制：全层 ClearScore 统一（当前 30000），赛季级输出供详情页展示。
    """
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
    """解析星启模式（Tierce）表 → {GroupID: 星启条目}。

    关联规则：Tierce 记录 DLCKKJFMJOB（常规模式最后一关 ID）→ 查关卡表得 GroupID。
    每个 (Tierce 表, 关卡表) 二元组对应一种模式；targets 为三模式目标表合并。
    输出：id / damage_types（弱点）/ countdown（回合）/ score（仅虚构叙事）/
    targets（目标描述 + 参数，含**满分档**并标 `prism`）/ monsters（敌方配置）/ nodes（3 节点）/
    rewards（通关奖励 EGEEJLHBALB）/ prism_reward（满分档奖励 IMCMJHAMMKK，
    官方规则说明＝「棱彩星和额外的新奖励」）。
    星启 3 节点 = 常规最高难度关上下半场（节点 1/2，DLCKKJFMJOB → 关卡表
    EventIDList1/2 → StageConfig 波次）+ 星启附加关（节点 3，HFIAAGAKFMD →
    StageConfig 波次，未收录时回退 JEBMBCLBIOI）。monsters 为节点 3 敌方
    （星启附加关，兼容目录页/旧结构）。invasions 传入时，污染节点附加 invasion
    ——星启附加关（节点 3）本身就是污染关卡，不覆盖则整条只出现在上游表里。

    节点输出**完整场次内容**（与 _season_floors 同口径）：damage（该半场
    DamageType1/2）/ monsters / level（StageConfig.Level）/ countdown
    （ChallengeCountDown，星启附加关取 Tierce 回合限制）/ buff（该场次层级可用
    增益）/ invasion；另带 origin（场次键 stage1/stage2/tierce），供前端按场次取
    赛季级 `buff_groups`（赛季增益）——该项只有末日幻影产出，其余模式按缺省不渲染。
    首领机制不走场次键：它按**敌方模板**落赛季级 `boss_guides`，由敌方条目上的
    `boss_guide` 指针取（见 _attach_boss_guides）。

    节点 buff 的来源分两处：节点 1/2 取最高难度关记录的 `MazeBuffID`；节点 3 取附加关
    StageConfig 自身的 `_BindingMazeBuff`（星启表 14 个字段里没有 buff 字段），附加关未登记
    时回退同一条 `MazeBuffID`——附加关属同一模式、增益是模式级的，节点 1/2 已按此口径取。
    含星启的 5 个末日幻影赛季两处逐条相等（同为当期「末法余烬」）；虚构叙事 4 季两层都取不到
    （`MazeBuffID` 未在 MazeBuff 注册），不落该字段。

    节点 3（星启附加关）的 damage 取 Tierce 记录自身的 `LOJCIDLKPKG`（与赛季级
    `damage_types` 同值）：星启表只有这一处推荐属性口径，不能从敌方 `weak` 推导
    ——附加关关卡内登记的敌方可能是无弱点的机制本体（3019 猴把戏），或另有召唤首领。
    """
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
            # 附加关未登记绑定时回退同赛季末层的层级增益（节点 1/2 同源，ADR 0032 修订）
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
                # 满分档（GNGENMHNLAH）标 prism：它是 3 星之外的**棱彩星**条件档，
                # 官方规则说明「星启模式中第 N 关通关且获得 N 分，即可以获得棱彩星和额外的新奖励」
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
            # 棱彩星奖励（IMCMJHAMMKK = 满分档的奖励 RewardID，与通关奖励 EGEEJLHBALB 是两笔：
            # 前者 maze 101913 / story 102113 / boss 101713 = 星琼 100 + 信用点 20000 + 璧羽 100）
            prism_rid = rec.get("IMCMJHAMMKK")
            if reward_items and prism_rid in reward_items:
                entry["prism_reward"] = reward_items[prism_rid]
            if s_lv:
                entry["level"] = s_lv
            out[str(gid)] = entry
    return out

def _season_stats(recs: list[dict]) -> dict:
    """聚合赛季统计：最大层数 / 阶段数 / 回合上限 / 弱点属性 + 逐层弱点。

    逐层弱点按上下半场拆分：DamageType1 = 上半场（stage1），
    DamageType2 = 下半场（stage2），不再合并（三模式上下半场全异）。
    """
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
    """单阶段敌方：MonsterID 列表 → {id, name, icon, weak, resist, rank}（保序，未注册跳过）。"""
    out: list[dict] = []
    for mid in mid_list:
        if mid not in monsters:
            continue
        out.append(_monster_out(mid, monsters))
    return out

def _season_monsters(
    recs: list[dict], monsters: dict[int, dict], stages: dict[int, dict]
) -> list[dict]:
    """赛季敌方：各层 StageConfig 波次按层序收集 → 敌方对象（去重保序）。"""
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
    """卡片代表阵容：敌方池按 rank 优先级去重取前 n。

    目录卡片展示赛季终点挑战的真实阵容（Boss + 精英护卫，如「星核猎手」卡芙卡 / 可可利亚），
    而非第 1 层先出现的小怪；池为空（无层级数据）时按全赛季 fallback 回退。
    输出与 _season_monsters 同构（轻量字段，无 wave）。
    """
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
    """StageInvasionConfig → {StageID: {level, monster_ids}}（污染等级，ADR 0026）。

    污染等级是**关卡级**属性：MonsterInvasionList[].DBLDCKODNEN 为实例怪物 ID，
    被污染怪物的名称/图标由消费方经 monsters 注册表解析。上游全表 14 条，全部落
    在本模块读取的四张关卡表内（EventIDList1/2 / EventIDList）；按怪物级 join 会
    整层漏判（末日幻影楼层只登记首领，被污染小怪由机制额外加入）。
    """
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
    """半场（或异相仲裁单关）的污染信息：{level, stage_id, monsters}；无污染返回 None。

    events 为 EventIDList1/2（异相仲裁为 EventIDList）；命中多条时取首条（上游
    一个 EventIDList 内至多一条污染关卡）。monsters 只收录已注册的详情对象（未注册
    的实例 ID 无名称/图标可展示，跳过而不落空对象）。
    """
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
    """MonsterConfig.SummonIDList → {实例怪物 ID: [被召唤实例 ID]}（召唤物，ADR 0036）。

    只保留有召唤物的实例（全表 2722 条中 712 条）。被召唤者是**实例 ID**，与关卡
    波次、污染名单同一命名空间，故可与「同场次敌方」逐层精确求交。
    """
    out: dict[int, list[int]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterConfig.json"):
        mid = rec.get("MonsterID")
        summons = [s for s in (rec.get("SummonIDList") or []) if s]
        if mid is not None and summons:
            out[mid] = list(dict.fromkeys(summons))
    return out

def _summon_out(mid: int, monsters: dict[int, dict], polluted: int | None = None) -> dict:
    """召唤物条目（轻形态，ADR 0036）：{id, tpl?, name, icon, polluted?}。

    行内只消费图标 + 名称 + 污染徽标，故不出弱点/抗性/韧性/速度/技能——与「敌方配置」
    的 `_monster_out` 区分（全站 2337 条引用，用完整形态要多付约 320 KB）。
    调用方需自行保证 mid 已注册。
    """
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
    """invasion → {被污染实例 ID: 污染等级}（实例级，逐层精确）。"""
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
    """单个敌方实例自己的召唤物：该实例 `MonsterConfig.SummonIDList` → 轻形态条目。

    **归属到召唤者**（ADR 0036 修订）：同一召唤物被同场多个敌方列出时就出现在多张敌方
    卡片里——多召唤者不是歧义，而是各自都具备召唤该单位的技能（如幼蛰虫分裂出自己、
    银鬃尉官与布洛妮娅都能召出银鬃近卫）。未注册实例跳过（无名称/图标）。
    """
    out: list[dict] = []
    for sid in summons.get(mid, []):
        if sid not in monsters:
            continue
        out.append(_summon_out(sid, monsters, (polluted or {}).get(sid)))
    return out

def _guide_template(m: dict, guides: dict[int, dict]) -> int:
    """敌方条目 → 首领机制键（敌方模板 ID）。

    实例条目带 `tpl`（MonsterID ≠ MonsterTemplateID 时由 `_monster_out` 写出）直接用；
    不带 `tpl` 即 id 本身已是模板（如召唤物 2033022），此时先试 id 再试 id // 100——
    末日幻影的波次敌方恒为实例（id = 模板 ×100 + 难度序号），两条候选都取不到即无机制条目。
    """
    if m.get("tpl"):
        return int(m["tpl"])
    mid = int(m["id"])
    return mid if mid in guides else mid // 100

def _attach_boss_guides(entry: dict, guides: dict[int, dict]) -> None:
    """赛季级「首领机制」：命中登记的敌方条目加 `boss_guide` 模板指针，正文按模板去重落 `boss_guides`。

    归属域 = **波次清单里的敌方**（层级上下半场 / 星启节点 / 星启整场 / 赛季代表阵容）。
    召唤物是同一首领组的部件与形态（灭星兽的左右手与引擎、幻灭者的虚妄之母、影将军的蚀心兽
    都与本场首领同组，实测 44/44），一并挂会在同一场里把同一组机制渲染多份，故不挂。
    指针写在**每一层**的敌方条目上（机制随难度不变，但卡片要按当前层各自的条目取）；
    正文只落一份，避免 191 个场次块各存一份 4 条特性 + 阶段文本。无命中不落该字段。
    """
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
    """按条目自身的污染节点写赛季级汇总 {count, levels}（ADR 0026）。

    扫描层半场 + 异相仲裁单关 + 星启节点，按 stage_id 去重后计数：星启节点 1/2
    就是常规最后一层的上下半场（同一关卡重复出现），不按节点数计数。逐关详情
    （层 / 半场 / 怪物）留在各自节点上，此处只放目录卡与筛选所需的轻量汇总。
    无污染赛季不落该字段。
    """
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
    """逐层详情：详情页以关卡层级为章节的完整内容。

    每层输出：floor（永屹之城遗秘无 Floor 字段 → 按 ID 升序取序号）/ 官方层名
    Name / 回合上限 / 上下半场推荐属性与敌方配置（stage1=DamageType1+EventIDList1
    → StageConfig 波次，stage2 同理，单阶段层下半场为空）/ 层级增益 buff
    （MazeBuffID 解析）/ 层级挑战目标 targets（ChallengeTargetID 解析）。
    敌方带 wave 序号（战斗波次，前端分组展示）；full=True 时输出 intro/skills
    （末日幻影纯 Boss 战，前端以完整信息卡展示）；level 为关卡等级（上下半场
    StageConfig.Level，同级取首事件）。invasions 传入时，污染关卡所在半场附加
    invasion（{level, stage_id, monsters}，见 _stage_invasion）；summons 传入时，
    召唤物按召唤者挂进该半场的敌方条目（`monsters[].summons[]`，见 _monster_summons）。
    rewards 传入时（RewardData），该层记录 `RewardID` 命中的逐层通关奖励落 `reward`。
    star_rewards 传入时（本赛季累计星数奖励阶梯），按**层序累计目标数**把阶梯切片挂到该层
    `star_rewards`（第 N 层满星 = 该层目标数，四模式实测每层 3 个 → 3 星）：勋章式「累计星数」
    口径在前端不重算，每层 tab 只渲染属于它这一档。累计跨越层序（前一层目标数多则档位顺延），
    与 `_season_star_caps` 的上限同源。
    """
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
    """赛季挑战目标：组内 ChallengeTargetID 全收集 → {text, param}（去重保序）。"""
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
    """读取挑战配置，按 GroupID 聚合为赛季条目。

    赛季名取分组表 GroupName（如"琥珀恩赐"），缺失时回退首层关卡 Name
    （如"琥珀恩赐其一"）——第一关名带期数后缀，不作卡片标题。
    full_monsters=True（末日幻影）时层级敌方输出 intro/skills 全字段；
    permanent 传入时（忘却之庭常驻关卡 100/900）条目输出 permanent 标记；
    test_period 传入时（beta/CBT 测试期）条目输出 test 标记；
    invasions 传入时（StageInvasionConfig）污染关卡所在半场附加 invasion，
    并在赛季级写出 pollution 汇总（{count, levels}，供目录卡与筛选）；
    summons 传入时（MonsterConfig.SummonIDList）召唤物按召唤者挂进敌方条目
    （见 _monster_summons；与污染标记同一行内消费）。
    buff_groups 传入时（末日幻影分场次增益）条目附加 buff_groups（场次 → 增益列表），
    扁平 buffs 口径不变。
    rewards / star_rewards 传入时（ADR 0051）逐层输出通关奖励 `floor_details[].reward`，
    条目附加累计星数奖励阶梯 `star_rewards`。
    """
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
    """异相仲裁单关节点：名称 / 弱点 / 敌人 / 目标 / 机制标签。

    kind 为官方术语：knight=骑士试炼 / king=王棋最终关；敌人取自
    EventIDList 首项引用的 StageConfig；目标取自 NormalTargetList 引用的
    BattleTargetConfig；标签 TagList 解析为 MazeBuff 名称。invasions 传入时，
    污染关卡附加 invasion（异相仲裁无层/半场，污染直接落在单关上）；summons
    传入时召唤物按召唤者挂进敌方条目（见 _monster_summons）。
    full=True 时单关敌方输出 intro/skills 全字段（详情页以敌方详情卡展示，
    与末日幻影层看板同口径；绝境变体一并全字段）。
    """
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
            buffs[t]["name"] for t in (rec.get("TagList", []) or []) if t in buffs
        ],
    }
    if stage and stage["level"]:
        node["level"] = stage["level"]
    if inv:
        node["invasion"] = inv
    return node

def _load_peak_badges() -> dict[int, list[dict]]:
    """ChallengeBadgeConfig → {期 ID: [段位徽章]}（Bronze/Silver/Gold/Ultra 四段）。

    异相仲裁段位徽章系统：每期 4 段位（部分期缺省），输出 level / name / desc /
    icon（IconFigurePath 经 map_icon_path 映射，前端 itemIconUrl 消费）。
    """
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
    """单关敌方 → 期级合并列表用的轻形态（去 wave 与 full 形态的 intro/skills/debuff_resist）。

    期级 `monsters` 只服务目录卡代表阵容与 AI 快照（名称/阵营/弱点），与另外三种模式的
    期级列表同口径；单关节点保留全字段供详情页敌方详情卡，两处不共用同一份引用。
    实例修正值已在 `_monster_out` 并入 stance/speed，此处无需再剥。
    """
    return {k: v for k, v in m.items() if k not in ("wave", "intro", "skills", "debuff_resist")}

def _peak_seasons(full_monsters: bool = False) -> dict:
    """异相仲裁：每期 = 3 骑士试炼 + 1 王棋最终关（含「绝境」变体）。

    期表 ChallengePeakGroupConfig 给出骑士（PreLevelIDList）与王棋（BossLevelID）
    的关卡 ID 组；王棋扩展表 ChallengePeakBossConfig 提供增益 BuffList 与绝境
    配置（HardTitle / HardEventIDList / HardTarget / HardTagList）。
    输出 levels 数组 + 全关卡合并 damage_types / monsters / buffs（供目录卡片）；
    污染关卡在单关上附加 invasion，并在期级写出 pollution 汇总（见 _merge_pollution）。
    full_monsters=True 时单关敌方输出 intro/skills 全字段（详情页以敌方详情卡展示）；
    期级合并列表 `monsters` 始终轻量——它只服务目录卡代表阵容与 AI 快照
    （渲染名称/阵营/弱点），与另外三种模式的期级列表同口径，不带图鉴介绍与技能。
    奖励：期表 `RewardGroupID` → `ChallengePeakReward` 的两类星数档落 `star_rewards`
    （骑士星数 / 王棋星数，见 _load_peak_star_rewards）。
    """
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
        for lid in g.get("PreLevelIDList", []) or []:
            node = _peak_level_node(
                level_by_id.get(lid), stages, monsters, buffs, targets, "knight",
                invasions, summons, full_monsters)
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
                        buffs[t]["name"]
                        for t in (ext.get("HardTagList", []) or []) if t in buffs
                    ],
                }
                if hard_stage and hard_stage["level"]:
                    hard["level"] = hard_stage["level"]
                node["hard"] = hard
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
            result[str(gid)]["star_rewards"] = ladder
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
    boss_guides = _load_boss_guides()
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
