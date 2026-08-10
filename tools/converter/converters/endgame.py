"""终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）转换器。

数据全部源自 vendor/TurnBasedGameData（与 CDN 同源，但走本地转换）：
- 忘却之庭：ChallengeMazeConfig（按 GroupID 分组，100+）
- 虚构叙事：ChallengeStoryMazeConfig（按 GroupID 分组，2001+）
- 末日幻影：ChallengeBossMazeConfig（按 GroupID 分组，3001+）
- 异相仲裁：ChallengePeakConfig（按 ID 分组，101+）

说明：
- 名称经 TextMap 解析（仅中文；en/ja/ko 源数据未提供，留空）。
- 排期：三张排期表（ScheduleDataChallengeMaze / ChallengeDataChallengeStory /
  ScheduleDataChallengeBoss）提供各模式赛季 BeginTime/EndTime。表无显式外键，
  经 ID 结构推断映射：ScheduleID - 200000 = 赛季 GroupID（200101↔101、
  202001↔2001、203001↔3001）。覆盖 maze 55 组中的 53 组 / story 25 组 / boss 20 组。
  占位过滤：整段早于公测上线（2023-04-26，beta/测试占位）或起点年份 ≥2030
  （未来占位）的排期丢弃，避免误导赛季"未开始/进行中"状态。
  异相仲裁无对应排期段，live_* 留空。
- 赛季统计：由组内全部层记录聚合（最大层数 / 阶段数 / 回合上限 / 弱点属性
  全层合并去重 + 逐层弱点 floor_damage）；异相仲裁结构不同，仅提供弱点属性。
- 赛季增益 buffs：忘却之庭取分组表 MazeBuffID（ChallengeGroupConfig）；虚构叙事 /
  末日幻影取主题表 BuffList（ChallengeStoryGroupExtra / ChallengeBossGroupExtra 前两阶段），
  名称经 MazeBuff 解析。虚构叙事战意（Fever）赛季另取 SubMazeBuffList 为主题机制
  sub_buffs（机制 + 战熄潮平/战意汹涌效果，Normal 赛季为空）。
- 赛季敌方 monsters：各层 StageConfig 波次（EventIDList1/2 → StageConfig.MonsterList，
  每波为 {Monster0..N} 字典）按层序收集 → MonsterTemplateConfig
  名称 + 头像图标（ManikinImagePath 取 basename，前端经 monstermiddleicon CDN 加载），
  并附 MonsterConfig 韧性弱点（StanceWeakList）/ 伤害抗性（DamageTypeResistance）/ 图鉴
  介绍（MonsterIntroduction）与模板分类 Rank（MinionLv2/Elite/LittleBoss/BigBoss →
  普通/精英/准首领/首领，前端映射）；阵营（MonsterCampID → MonsterCamp 名称）与韧性值
  （StanceBase）取模板表；技能（SkillList → MonsterSkillConfig）输出名称 + 标签。
  层级/赛季敌方为轻量字段（intro/skills 仅星启 full 输出，控制波次全量体积）。
  注：关卡表 NpcMonsterIDList 仅为代表怪（唯 61 个，缺失约 2/3），波次才是完整配置
  （唯 176 个，单阶段 1-3 波）。
- 逐层详情 floor_details：详情页以关卡层级为章节的完整内容（层序号 / 官方层名 Name /
  回合上限 / 上下半场推荐属性与敌方配置 / 层级增益 MazeBuffID / 层级挑战目标
  ChallengeTargetID）。永屹之城遗秘（组 100）无 Floor 字段，按 ID 升序取序号。
  （floors 键仍为赛季最大层数统计，勿混。）
- 挑战目标 targets：组内 ChallengeTargetID 全收集 → ChallengeTargetConfig 描述
  （clean_text 清洗后）+ ChallengeTargetParam1 参数，供详情页渲染。
- 异相仲裁 peak：每期由 3 个「骑士」试炼关卡 + 1 个「王棋」最终关卡组成（官方
  术语）。ChallengePeakGroupConfig（期表）给出 PreLevelIDList（骑士）/ BossLevelID
  （王棋）；ChallengePeakConfig（关卡表）给出关卡名 / 弱点 / Stage 事件 / 目标 /
  机制标签；ChallengePeakBossConfig（王棋扩展）给出王棋增益 BuffList 与「绝境」
  变体（HardTitle 如“将杀王棋•绝境” / HardEventIDList / HardTarget / HardTagList）；
  StageConfig（按 EventID 查）提供敌人配置 MonsterList（波次扁平化）与关卡等级；
  BattleTargetConfig（3000 系列 ChallengeTarget）提供目标文本；TagList / BuffList /
  HardTagList 均解析为 MazeBuff 名称。输出 levels 数组 + 全关卡合并 damage_types /
  monsters / buffs（供目录卡片）。
- 星启模式 tierce：三张 Tierce 表（ChallengeMazeTierce / ChallengeStoryMazeTierce /
  ChallengeBossMazeTierce）提供星启关卡配置（弱点 / 回合 / 目标 / Boss）。
  关联规则：Tierce 记录 DLCKKJFMJOB = 常规模式最后一关 ID，查关卡表得 GroupID。
  目标描述按模式走对应目标表（maze→ChallengeTargetConfig / story→ChallengeStoryTargetConfig /
  boss→ChallengeBossTargetConfig），score 仅虚构叙事提供（IDBJENCBJHM），
  满分档目标（GNGENMHNLAH，虚构叙事 99000）并入 targets 末尾；通关奖励取
  EGEEJLHBALB（ItemID/ItemNum 列表，虚构叙事每期固定）输出为 rewards。
  混淆字段名（解包变量名）含义：PHFMCACHFIJ=星启关 ID / LOJCIDLKPKG=弱点 /
  GNOOAGPBNLD=回合 / OGEOMCGNNMP=目标 ID 组 / JEBMBCLBIOI=敌方 ID。
- 虚构叙事回合上限：ChallengeStoryMazeExtra.TurnLimit（按层记录 ID 匹配）覆盖 countdown。
- param 字段前端未消费，置空数组以贴合结构。
"""

import logging
from collections import defaultdict
from datetime import datetime

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, resolve_text
from utils import load_json, save_json, map_icon_path
from converters.monster_common import load_monsters

logger = logging.getLogger("converter")

# 公测上线时间：整段早于此时段的排期视为 beta/测试占位
_LAUNCH_TS = datetime(2023, 4, 26, 0, 0, 0)


def _load_schedules(filename: str) -> dict[str, tuple[str, str]]:
    """读取赛季排期并按 GroupID 映射（ScheduleID - 200000 = GroupID）。

    过滤占位排期：整段早于公测上线（beta 占位）或起点年份 ≥2030（未来占位）。
    无排期的赛季（组 100 / 900 等）不进入结果。
    """
    data = load_json(EXCEL_DIR / filename)
    out: dict[str, tuple[str, str]] = {}
    for rec in data:
        sid = rec.get("ID")
        begin = rec.get("BeginTime", "")
        end = rec.get("EndTime", "")
        if not sid or not begin or not end:
            continue
        try:
            bt = datetime.fromisoformat(begin.replace(" ", "T"))
            et = datetime.fromisoformat(end.replace(" ", "T"))
        except ValueError:
            continue
        if et < _LAUNCH_TS or bt.year >= 2030:
            continue
        out[str(sid - 200000)] = (begin, end)
    return out


def _load_test_periods(filename: str = "ScheduleDataChallengeMaze.json") -> set[int]:
    """测试期分组：排期整段早于公测上线的 beta/CBT 测试期数。

    测试期（如忘却之庭 101-107/116 的"琥珀恩赐/霜痕旧梦/永冬试炼"轮换试炼）
    与未来占位（起点 ≥2030）均被 _load_schedules 过滤（无 live_*）；本函数仅
    识别测试期，供前端打"测试期"徽章与正式赛季区分。
    """
    data = load_json(EXCEL_DIR / filename)
    out: set[int] = set()
    for rec in data:
        sid = rec.get("ID")
        begin = rec.get("BeginTime", "")
        end = rec.get("EndTime", "")
        if not sid or not begin or not end:
            continue
        try:
            et = datetime.fromisoformat(end.replace(" ", "T"))
        except ValueError:
            continue
        if et < _LAUNCH_TS:
            out.add(sid - 200000)
    return out


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


def _monster_out(mid: int, monsters: dict[int, dict], full: bool = False) -> dict:
    """敌方输出对象：{id, name, icon, weak, resist, rank, camp, stance, speed}。

    full=True 追加 intro/skills（星启信息卡消费；层级/赛季波次全量为轻量字段，
    避免图鉴介绍与技能在大量重复引用中膨胀体积）。skills 仅取名称 + 标签
    （技能全量字段由 monster_detail 转换器输出）。调用方需自行保证 mid 已注册
    （未注册返回空 dict，勿直接使用）。
    实例别名（MonsterID≠MonsterTemplateID）附 tpl=模板 ID，前端跳转怪物详情用
    （详情文件按模板 ID 命名）；stats 仅提升 speed（模板 SpeedBase，与韧性同源）。
    """
    info = monsters.get(mid) or {}
    out = {"id": str(mid)}
    tpl = info.get("_tpl")
    if tpl:
        out["tpl"] = str(tpl)
    for k, v in info.items():
        if k in ("figure", "_tpl"):
            continue  # 详情页专属字段（共享聚合表带来的字段）不泄漏进赛季输出
        if k == "stats":
            if v.get("speed"):
                out["speed"] = v["speed"]
            continue
        if not full and k in ("intro", "skills"):
            continue
        if k == "skills":
            # skills 仅取名称 + 标签（技能全量字段由 monster_detail 转换器输出）
            out[k] = [{"name": s["name"], "tag": s.get("tag")} for s in v]
        else:
            out[k] = v
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
    # 文本 Hash → 首个非 None 参数（供缺失记录补全）
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

    story 取 BuffList；boss 取 BuffList1/2（前两阶段增益，第三阶段缺省）。
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


# 分组表 → arts 字段映射（源字段名 → 输出键；仅收录语义适合展示的路径，
# 排除 AbyssSwitch 开关图等 UI 控件——前端白名单另有语义闸门双重把关）
_GROUP_ART_FIELDS: dict[str, str] = {
    "BackGroundPath": "background",             # 3D 场景背景（仅忘却之庭）
    "TabPicPath": "tab",                        # 赛季专属页签图
    "TabPicSelectPath": "tab_select",           # 开关图 On 态（与 tab 同资源）
    "ThemePicPath": "theme_banner",             # 赛季横幅（宣传 BANNER）
    "ThemeToastPicPath": "theme_toast",         # 主题小图（虚构叙事）
    "ThemeIconPicPath": "theme_icon",           # 主题图标（虚构叙事/末日幻影）
    "ThemePosterBgPicPath": "theme_bg",         # 海报背景（虚构叙事）
    "ThemePosterTabPicPath": "poster_tab",      # 海报页签（虚构/末日/仲裁）
    "HandBookPanelBannerPath": "handbook_banner",  # 图鉴横幅（异相仲裁）
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


def _load_stage_monsters_by_id(stage_ids: set[int]) -> dict[int, dict]:
    """StageConfig 按需提取 → {StageID: {level, waves}}。

    MonsterList 为波次列表（每波 {Monster0..N: ID} 字典），波内保序保留；
    波次顺序即战斗出场顺序。仅保留调用方关心的 StageID，避免 24MB 表整体驻留。
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
        out[sid] = {"level": rec.get("Level", 0) or 0, "waves": waves}
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
) -> list[dict]:
    """EventIDList → StageConfig 波次 → 带 wave 序号的敌方对象（波内保序，未注册跳过）。

    wave 为战斗波次序号（1 起，跨事件连续递增）；默认轻量字段输出（intro/skills
    仅星启信息卡 full=True 时输出，控制体积）。
    """
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
                out.append({**_monster_out(mid, monsters, full), "wave": wave_no})
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
) -> dict[str, dict]:
    """解析星启模式（Tierce）表 → {GroupID: 星启条目}。

    关联规则：Tierce 记录 DLCKKJFMJOB（常规模式最后一关 ID）→ 查关卡表得 GroupID。
    每个 (Tierce 表, 关卡表) 二元组对应一种模式；targets 为三模式目标表合并。
    输出：id / damage_types（弱点）/ countdown（回合）/ score（仅虚构叙事）/
    targets（目标描述 + 参数）/ monsters（敌方配置）/ nodes（3 节点敌方）。
    星启 3 关卡 = 常规最高难度关上下半场（节点 1/2，DLCKKJFMJOB → 关卡表
    EventIDList1/2 → StageConfig 波次）+ 星启附加关（节点 3，HFIAAGAKFMD →
    StageConfig 波次，未收录时回退 JEBMBCLBIOI）。monsters 为节点 3 敌方
    （星启附加关，兼容目录页/旧结构）。
    """
    out: dict[str, dict] = {}
    # 预载关卡表（GroupID 映射 + 按 ID 查常规最高难度关），收集全部 StageID
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
            # 星启附加关敌方（节点 3）：HFIAAGAKFMD → StageConfig 波次，未收录回退 Boss 代表
            node3 = _stage_waves_monsters(
                rec.get("HFIAAGAKFMD", []) or [], stages, monsters, full=True
            ) or [
                _monster_out(mid, monsters, full=True)
                for mid in (rec.get("JEBMBCLBIOI", []) or []) if mid in monsters
            ]
            # 3 节点敌方：节点 1/2 = 常规最高难度关（DLCKKJFMJOB）上下半场；节点 3 = 星启附加关
            prev_rec = by_id.get(prev) if prev is not None else None
            nodes: list[dict] = []
            for evkey in ("EventIDList1", "EventIDList2"):
                nodes.append({
                    "idx": len(nodes) + 1,
                    "monsters": _stage_waves_monsters(
                        (prev_rec or {}).get(evkey, []) or [], stages, monsters, full=True),
                })
            nodes.append({"idx": 3, "monsters": node3})
            # 目标档位：OGEOMCGNNMP（60000/75000/90000）+ GNGENMHNLAH（99000 满分档，
            # 官网关卡奖励表五档中的最高档，追加保持分数升序）
            tids = list(rec.get("OGEOMCGNNMP", []) or [])
            full_tid = rec.get("GNGENMHNLAH")
            if full_tid and full_tid not in tids:
                tids.append(full_tid)
            # 通关奖励（EGEEJLHBALB 全量含数量；OGALGHMIIAH 仅为展示顺序，取前者）；
            # 仅虚构叙事提供（每期固定），其他模式缺省不输出
            rewards = [
                {"id": r.get("ItemID"), "num": r.get("ItemNum", 0)}
                for r in (rec.get("EGEEJLHBALB", []) or []) if r.get("ItemID")
            ]
            entry = {
                "id": rec.get("PHFMCACHFIJ"),
                "damage_types": sorted(rec.get("LOJCIDLKPKG", []) or []),
                "countdown": rec.get("GNOOAGPBNLD", 0) or 0,
                "score": rec.get("IDBJENCBJHM"),
                "targets": [
                    {k: v for k, v in targets[t].items() if k in ("text", "param", "type")}
                    for t in tids if t in targets
                ],
                "monsters": node3,
                "nodes": nodes,
            }
            if rewards:
                entry["rewards"] = rewards
            s_eid = (rec.get("HFIAAGAKFMD", []) or [None])[0]
            s_lv = stages[s_eid]["level"] if s_eid in stages else None
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


# 敌方模板分类权重（BigBoss > LittleBoss > Elite > MinionLv2 > Minion）
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


def _load_boss_phases() -> dict[int, list[int]]:
    """ChallengeBossMazeExtra → {层记录 ID: [阶段敌人 MonsterID 列表]}（阶段制）。

    末日幻影为阶段制战斗：每层 1-3 阶段，各阶段一个 Boss 形态（MonsterID1/2/3，
    实例 ID → _load_monsters 已注册的同模板信息）。部分层第 3 阶段仅存在于本表
    （StageConfig 波次不含），据此补全层级敌人。
    """
    data = load_json(EXCEL_DIR / "ChallengeBossMazeExtra.json")
    out: dict[int, list[int]] = {}
    for rec in data:
        rid = rec.get("ID")
        if rid is None:
            continue
        mids = [v for v in (rec.get("MonsterID1"), rec.get("MonsterID2"), rec.get("MonsterID3")) if v]
        if mids:
            out[rid] = mids
    return out


def _season_floors(
    recs: list[dict],
    monsters: dict[int, dict],
    buffs: dict[int, dict],
    targets: dict[int, dict],
    stages: dict[int, dict],
    full: bool = False,
    phases: dict[int, list[int]] | None = None,
) -> list[dict]:
    """逐层详情：详情页以关卡层级为章节的完整内容。

    每层输出：floor（永屹之城遗秘无 Floor 字段 → 按 ID 升序取序号）/ 官方层名
    Name / 回合上限 / 上下半场推荐属性与敌方配置（stage1=DamageType1+EventIDList1
    → StageConfig 波次，stage2 同理，单阶段层下半场为空）/ 层级增益 buff
    （MazeBuffID 解析）/ 层级挑战目标 targets（ChallengeTargetID 解析）。
    敌方带 wave 序号（战斗波次，前端分组展示）；full=True 时输出 intro/skills
    （末日幻影纯 Boss 战，前端以完整信息卡展示）；level 为关卡等级（上下半场
    StageConfig.Level，同级取首事件）。
    """
    out: list[dict] = []
    for i, r in enumerate(sorted(recs, key=lambda x: x.get("ID", 0)), start=1):
        floor = r.get("Floor") or i
        lv = next(
            (stages[e]["level"] for key in ("EventIDList1", "EventIDList2")
             for e in (r.get(key, []) or []) if e in stages and stages[e]["level"]),
            None,
        )
        node: dict = {
            "floor": floor,
            "name": resolve_text(r.get("Name", {})),
            "countdown": r.get("ChallengeCountDown", 0) or 0,
            "stage1": {
                "damage": list(dict.fromkeys(r.get("DamageType1", []) or [])),
                "monsters": _stage_waves_monsters(
                    r.get("EventIDList1", []) or [], stages, monsters, full),
            },
            "stage2": {
                "damage": list(dict.fromkeys(r.get("DamageType2", []) or [])),
                "monsters": _stage_waves_monsters(
                    r.get("EventIDList2", []) or [], stages, monsters, full),
            },
        }
        if lv:
            node["level"] = lv
        # 末日幻影阶段制：ChallengeBossMazeExtra 每层 1-3 阶段 Boss 清单（含 StageConfig 缺失的第 3 阶段）
        if phases and r.get("ID") in phases:
            node["phases"] = [
                _monster_out(mid, monsters, full=True)
                for mid in phases[r["ID"]] if mid in monsters
            ]
        bid = r.get("MazeBuffID")
        if bid and bid in buffs:
            node["buff"] = {"id": bid, **buffs[bid]}
        tids = r.get("ChallengeTargetID", []) or []
        if tids:
            node["targets"] = [
                {k: v for k, v in targets[t].items() if k in ("text", "param", "type")}
                for t in tids if t in targets
            ]
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
    buffs: dict[int, dict] | None = None,
    monsters: dict[int, tuple[str, str]] | None = None,
    targets: dict[int, dict] | None = None,
    turns: dict[str, int] | None = None,
    scores: dict[str, int] | None = None,
    group_names: dict[int, str] | None = None,
    arts: dict[int, dict] | None = None,
    full_monsters: bool = False,
    phases: dict[int, list[int]] | None = None,
    sub_buffs: dict[int, list[int]] | None = None,
    permanent: set[int] | None = None,
    test_period: set[int] | None = None,
) -> dict:
    """读取挑战配置，按 GroupID 聚合为赛季条目。

    赛季名取分组表 GroupName（如"琥珀恩赐"），缺失时回退首层关卡 Name
    （如"琥珀恩赐其一"）——第一关名带期数后缀，不作卡片标题。
    full_monsters=True（末日幻影）时层级敌方输出 intro/skills 全字段；
    phases 传入时（末日幻影）层级敌方追加阶段制清单（ChallengeBossMazeExtra）；
    permanent 传入时（忘却之庭常驻关卡 100/900）条目输出 permanent 标记；
    test_period 传入时（beta/CBT 测试期）条目输出 test 标记。
    """
    data = load_json(EXCEL_DIR / filename)
    groups: dict[int, list] = defaultdict(list)
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        groups[gid].append(rec)

    # 收集全部 StageID（上下半场事件），一次性按需提取波次配置
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
        # 常驻关卡（无赛季轮回的长期关卡；如忘却之庭 100/900）
        if permanent and gid in permanent:
            entry["permanent"] = True
        # 测试期（beta/CBT 排期整段早于公测的试炼翻版；如忘却之庭 101-107/116）
        if test_period and gid in test_period:
            entry["test"] = True
        entry.update(_season_stats(recs))
        # 逐层详情：关卡层级章节（推荐属性 / 敌方配置（波次） / 可用增益 / 挑战目标）
        entry["floor_details"] = _season_floors(
            recs, monsters, buffs, targets, stages, full=full_monsters, phases=phases)
        # 赛季增益：组级 BuffID 列表 → {id, name, desc, param_list}（描述供详情页渲染）
        entry["buffs"] = [
            {"id": bid, **buffs[bid]}
            for bid in buff_map.get(gid, []) if bid in buffs
        ]
        # 战意赛季主题机制（SubMazeBuffList：机制 + 战熄潮平/战意汹涌；仅 Fever 赛季）
        if sub_buffs:
            entry["sub_buffs"] = [
                {"id": bid, **buffs[bid]}
                for bid in sub_buffs.get(gid, []) if bid in buffs
            ]
        entry["monsters"] = _season_monsters(recs, monsters, stages)
        # 卡片代表阵容：最终层（最高层）上下半场敌方按 rank 去重取前 4
        # （目录卡片展示赛季终点真实阵容——Boss + 精英护卫，而非第 1 层先出现的小怪）
        floors = entry.get("floor_details") or []
        final_pool: list[dict] = []
        if floors:
            s1 = (floors[-1].get("stage1") or {}).get("monsters") or []
            s2 = (floors[-1].get("stage2") or {}).get("monsters") or []
            final_pool = list(s1) + list(s2)
        entry["final_monsters"] = _final_monsters(final_pool, entry["monsters"])
        entry["targets"] = _season_targets(recs, targets)
        # 虚构叙事回合上限：ChallengeStoryMazeExtra.TurnLimit 覆盖 countdown
        if turns and str(gid) in turns:
            entry["countdown"] = turns[str(gid)]
        # 虚构叙事通关分数线：ChallengeStoryMazeExtra.ClearScore（全层统一）
        if scores and str(gid) in scores:
            entry["clear_score"] = scores[str(gid)]
        # 赛季海报/标签图（CDN 未就绪，数据层先行）
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
) -> dict:
    """异相仲裁单关节点：名称 / 弱点 / 敌人 / 目标 / 机制标签。

    kind 为官方术语：knight=骑士试炼 / king=王棋最终关；敌人取自
    EventIDList 首项引用的 StageConfig；目标取自 NormalTargetList 引用的
    BattleTargetConfig；标签 TagList 解析为 MazeBuff 名称。
    """
    if rec is None:
        return {}
    events = rec.get("EventIDList", []) or []
    stage = stages.get(events[0]) if events else None
    node: dict = {
        "id": rec.get("ID"),
        "kind": kind,
        "name": resolve_text(rec.get("Title", {})),
        "damage": sorted(rec.get("DamageType", []) or []),
        "monsters": _stage_waves_monsters(events, stages, monsters),
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


def _peak_seasons() -> dict:
    """异相仲裁：每期 = 3 骑士试炼 + 1 王棋最终关（含「绝境」变体）。

    期表 ChallengePeakGroupConfig 给出骑士（PreLevelIDList）与王棋（BossLevelID）
    的关卡 ID 组；王棋扩展表 ChallengePeakBossConfig 提供增益 BuffList 与绝境
    配置（HardTitle / HardEventIDList / HardTarget / HardTagList）。
    输出 levels 数组 + 全关卡合并 damage_types / monsters / buffs（供目录卡片）。
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

    # 收集全部 StageID（关卡事件 + 绝境事件），一次性按需提取
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
        # 骑士试炼关卡（PreLevelIDList 保序）
        for lid in g.get("PreLevelIDList", []) or []:
            node = _peak_level_node(
                level_by_id.get(lid), stages, monsters, buffs, targets, "knight")
            levels.append(node)
            dmg.update(node["damage"])
            for m in node["monsters"]:
                if int(m["id"]) not in seen:
                    seen.add(int(m["id"]))
                    all_mons.append({k: v for k, v in m.items() if k != "wave"})
        # 王棋最终关（BossLevelID）
        boss_id = g.get("BossLevelID")
        if boss_id is not None:
            node = _peak_level_node(
                level_by_id.get(boss_id), stages, monsters, buffs, targets, "king")
            ext = boss_ext.get(boss_id)
            if ext:
                # 王棋增益（BuffList → MazeBuff）
                node["buffs"] = [
                    {"id": bid, **buffs[bid]}
                    for bid in (ext.get("BuffList", []) or []) if bid in buffs
                ]
                all_buffs = node["buffs"]
                # 绝境变体（困难王棋）
                hard_events = ext.get("HardEventIDList", []) or []
                hard_stage = stages.get(hard_events[0]) if hard_events else None
                hard: dict = {
                    "name": resolve_text(ext.get("HardTitle", {})),
                    "monsters": _stage_waves_monsters(hard_events, stages, monsters),
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
                    all_mons.append({k: v for k, v in m.items() if k != "wave"})
        # 卡片代表阵容：王棋最终关（无则最后一关）敌方按 rank 去重取前 4
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
        # 段位徽章：ChallengeBadgeConfig 按期分组（Bronze/Silver/Gold/Ultra）
        if gid in badges_map:
            result[str(gid)]["badges"] = badges_map[gid]
        # 赛季主题图标：ChallengePeakGroupConfig.ThemeIconPicPath → arts.tab
        # （每赛季专属 ChallengePeakIcon_4xxx；前端 seasonArtUrl 优先解析）
        icon_path = g.get("ThemeIconPicPath") or ""
        if icon_path:
            result[str(gid)].setdefault("arts", {})["tab"] = icon_path
        # 海报页签 / 图鉴横幅（BtnChallengePeak_4xxx / ChallengePeakPanelBanner*）
        poster_path = g.get("ThemePosterTabPicPath") or ""
        if poster_path:
            result[str(gid)].setdefault("arts", {})["poster_tab"] = poster_path
        banner_path = g.get("HandBookPanelBannerPath") or ""
        if banner_path:
            result[str(gid)].setdefault("arts", {})["handbook_banner"] = banner_path
    return result


def convert() -> None:
    schedules_maze = _load_schedules("ScheduleDataChallengeMaze.json")
    schedules_story = _load_schedules("ScheduleDataChallengeStory.json")
    schedules_boss = _load_schedules("ScheduleDataChallengeBoss.json")
    buffs = _load_maze_buffs()
    monsters = load_monsters()
    targets = _load_targets()
    maze_buff_map = _group_maze_buff()
    story_buff_map = _group_extra_buff("ChallengeStoryGroupExtra.json", ("BuffList",))
    boss_buff_map = _group_extra_buff(
        "ChallengeBossGroupExtra.json", ("BuffList1", "BuffList2")
    )
    story_turns = _load_story_turns()
    story_scores = _load_story_scores()
    story_sub_buffs = _group_extra_sub_buffs()
    mode_default_icons = _load_mode_default_icons()

    # 三模式目标表合并（ID 不冲突：maze 6xx / story 4xxx / boss 5xxx）
    targets_all = {
        **_load_targets("ChallengeTargetConfig.json"),
        **_load_targets("ChallengeStoryTargetConfig.json"),
        **_load_targets("ChallengeBossTargetConfig.json"),
    }
    tierce = _load_tierce(
        [
            ("ChallengeMazeTierce.json", "ChallengeMazeConfig.json"),
            ("ChallengeStoryMazeTierce.json", "ChallengeStoryMazeConfig.json"),
            ("ChallengeBossMazeTierce.json", "ChallengeBossMazeConfig.json"),
        ],
        targets_all,
        monsters,
    )

    # 忘却之庭
    maze = _group_seasons(
        "ChallengeMazeConfig.json", "Name", schedules_maze,
        buff_map=maze_buff_map, buffs=buffs, monsters=monsters, targets=targets,
        group_names=_load_group_names("ChallengeGroupConfig.json"),
        # 分组表 + 主题 extra 表合并（ThemePosterBgPicPath → theme_bg 2D 场景背景，
        # 与虚构叙事/末日幻影同构——勿漏 GroupExtra）
        arts=_merge_arts(
            _load_group_arts("ChallengeGroupConfig.json"),
            _load_group_arts("ChallengeMazeGroupExtra.json"),
        ),
        permanent=_load_permanent_groups(),
        test_period=_load_test_periods(),
    )
    for k in maze:
        if k in tierce:
            maze[k]["tierce"] = tierce[k]
    _attach_default_icon(maze, mode_default_icons.get("maze"))
    save_json(maze, OUTPUT_DIR / "maze.json")

    # 虚构叙事（挑战目标走 ChallengeStoryTargetConfig，勿传 maze 目标表）
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
    )
    for k in story:
        if k in tierce:
            story[k]["tierce"] = tierce[k]
    _attach_default_icon(story, mode_default_icons.get("story"))
    save_json(story, OUTPUT_DIR / "maze_extra.json")

    # 末日幻影（挑战目标走 ChallengeBossTargetConfig，勿传 maze 目标表；
    # 层级敌方按 ChallengeBossMazeExtra 阶段制补全，含 StageConfig 缺失的第 3 阶段）
    boss = _group_seasons(
        "ChallengeBossMazeConfig.json", "Name", schedules_boss,
        buff_map=boss_buff_map, buffs=buffs, monsters=monsters,
        targets=_load_targets("ChallengeBossTargetConfig.json"),
        group_names=_load_group_names("ChallengeBossGroupConfig.json"),
        full_monsters=True,  # 末日幻影纯 Boss 战：层级敌方输出全字段供信息卡展示
        phases=_load_boss_phases(),
        arts=_merge_arts(
            _load_group_arts("ChallengeBossGroupConfig.json"),
            _load_group_arts("ChallengeBossGroupExtra.json"),
        ),
    )
    for k in boss:
        if k in tierce:
            boss[k]["tierce"] = tierce[k]
    _attach_default_icon(boss, mode_default_icons.get("boss"))
    save_json(boss, OUTPUT_DIR / "maze_boss.json")

    # 异相仲裁
    peak = _peak_seasons()
    save_json(peak, OUTPUT_DIR / "maze_peak.json")
