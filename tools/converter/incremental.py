"""增量转换：基于源文件 mtime+size 跳过未变更模块。

状态文件存放于 tools/converter/.converter-state.json（已 gitignore）。
"""

import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, SOURCE_DIR, TEXTMAP_FILE, TEXTMAP_EN_FILE, OUTPUT_DIR

logger = logging.getLogger("converter")

STATE_FILE = Path(__file__).resolve().parent / ".converter-state.json"

MODULE_SOURCES: dict[str, list[str]] = {
    "paths": ["AvatarBaseType.json"],
    "elements": ["DamageType.json"],
    "properties": [],
    "items": ["ItemConfig.json"],
    "characters": ["AvatarConfig.json", "AvatarConfigLD.json"],
    "character_detail": [
        "AvatarConfig.json", "AvatarConfigLD.json",
        "AvatarSkillConfig.json", "AvatarSkillConfigLD.json",
        "AvatarRankConfig.json", "AvatarRankConfigLD.json",
        "AvatarSkillTreeConfig.json", "AvatarSkillTreeConfigLD.json",
        "AvatarPromotionConfig.json", "AvatarPromotionConfigLD.json",
        "AvatarAtlas.json", "AvatarCamp.json", "StoryAtlas.json",
        "AvatarEquipRecommend.json", "AvatarEquipRecommendLD.json",
        "AvatarRelicRecommend.json", "AvatarRelicRecommendLD.json",
        "AvatarServantConfig.json", "AvatarServantSkillConfig.json",
        "TeamBuildConfig.json",
        "AvatarConfigEnhanced.json", "AvatarEnhancedHintConfig.json",
        str(TEXTMAP_EN_FILE),
    ],
    "light_cones": ["EquipmentConfig.json", "EquipmentSkillConfig.json"],
    # AvatarEquipRecommend(+LD) 被本模块与 character_detail 同时读取（本模块出「适配角色」、
    # character_detail 出「推荐光锥」）——跨模块读取 ⇒ 两个模块都要登记（docs/memory/data-semantics.md:111）
    "light_cone_detail": ["EquipmentConfig.json", "EquipmentSkillConfig.json",
                          "EquipmentPromotionConfig.json", "ItemConfigEquipment.json",
                          "AvatarEquipRecommend.json", "AvatarEquipRecommendLD.json"],
    "relics": ["RelicSetConfig.json", "RelicConfig.json", "RelicSetSkillConfig.json",
                "RelicDataInfo.json"],
    "relic_affixes": ["RelicMainAffixConfig.json", "RelicSubAffixConfig.json"],
    "monsters": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                 "MonsterCamp.json", "MonsterSkillConfig.json",
                 "MonsterStatusResistanceType.json"],
    "monster_detail": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                         "MonsterCamp.json", "MonsterSkillConfig.json",
                         "StageInvasionConfig.json", "HardLevelGroup.json",
                         "MonsterStatusResistanceType.json", "MonsterStatusConfig.json",
                         "MonsterDrop.json", "ItemConfig.json", "StageConfig.json",
                         "MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json",
                         "ExtraEffectConfig.json", "ActivityPanel.json",
                         "ActivityQuestRewardData.json",
                         # 传递依赖：`guide_phases` 由 monster_guide 装配，只改这几张表也要重跑本模块，
                         # 否则增量会按「本模块自己的静态加载未变」跳过、留下过期的 guide_phases
                         "MonsterGuideConfig.json", "MonsterGuideTag.json",
                         "MonsterGuidePhase.json", "MonsterGuideSkill.json",
                         "MonsterGuideSkillText.json",
                         # 传递依赖：本模块是聚合者，下列表由被导入函数读取——
                         # EliteGroup ← monster_common.load_elite_groups（落 monster-elite-group.json）
                         # 关卡名链 ← monster_extra.load_appearances > load_player_stage_names
                         #          > load_activity_stage_names（落 `appearances` 的关卡名 / activity）
                         # scope 链 ← voracity.load_invasion_map > _invasion_index > _scope_index
                         #          读 ChallengePeak(Group)Config 等；**实测该链对本模块产物无效**：
                         #          本模块取的是 `_invasion_index(...)[1]`（usage），而 scopes 只落在
                         #          `[0]`（stages）⇒ 清空 `_scope_index` 后 `load_invasion_map` 返回值不变。
                         #          仍登记：登记代价是只多跑一次，漏登记是不可逆的静默陈旧
                         # 不同批登记则改这些表时本模块被增量跳过、产物静默陈旧
                         "EliteGroup.json",
                         "ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
                         "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
                         "ChallengePeakGroupConfig.json",
                         "ActivityTelevisionStage.json", "ActivityTelevisionLevel.json",
                         "ActivitySummonGroup.json", "ActivitySummonLevel.json",
                         "ActivityStarFightGroup.json", "StarFightStageConfig.json",
                         "FightFestStageInfo.json", "ElationBattleLevel.json",
                         "BoxingClubStage.json", "MappingInfo.json",
                         "CocoonConfig.json", "FarmElementConfig.json",
                         "StrongChallengeStage.json", "SwordTrainingExam.json",
                         # 同一条 `_scope_index` 链还会读这 6 张分组/层级表（`_SCOPE_TABLES`
                         # 的 group_table / tierce_table）。它们只喂 `stages[].scopes`，而本模块取的
                         # `load_invasion_map` 返回的是 usage（不含 scopes）⇒ 对本模块产物**无影响**，
                         # 属保守登记；登记代价仅为多跑一次，漏登记才是不可逆的
                         "ChallengeGroupConfig.json", "ChallengeStoryGroupConfig.json",
                         "ChallengeBossGroupConfig.json",
                         "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
                         "ChallengeBossMazeTierce.json"],
    "monster_extra": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                       "MonsterDrop.json", "ItemConfig.json", "StageConfig.json",
                       "MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json",
                       "ExtraEffectConfig.json", "MonsterSkillConfig.json",
                       "MonsterStatusConfig.json", "ActivityPanel.json",
                       "ActivityQuestRewardData.json",
                       # 关卡名链：`_load_table(name)` / `_absorb_*(表名)` 的实参是字面量，
                       # 但函数名不在 AST 守卫的 _LOAD_CALL_NAMES 里 ⇒ 曾整批漏登记（改这些表产物会静默陈旧）
                       "ActivityTelevisionStage.json", "ActivityTelevisionLevel.json",
                       "ActivitySummonGroup.json", "ActivitySummonLevel.json",
                       "ActivityStarFightGroup.json", "StarFightStageConfig.json",
                       "FightFestStageInfo.json", "ElationBattleLevel.json",
                       "BoxingClubStage.json", "ChallengeMazeConfig.json",
                       "ChallengeStoryMazeConfig.json", "ChallengeBossMazeConfig.json",
                       "ChallengePeakConfig.json", "MappingInfo.json",
                       "CocoonConfig.json", "FarmElementConfig.json",
                       "StrongChallengeStage.json", "SwordTrainingExam.json"],
    "monster_common": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                        "MonsterCamp.json", "MonsterSkillConfig.json",
                        "HardLevelGroup.json", "EliteGroup.json",
                        "MonsterStatusResistanceType.json"],
    # 首领机制共享装配：endgame 敌方卡与 monster_detail 详情页两处消费（同一份声明）
    "monster_guide": ["MonsterGuideConfig.json", "MonsterGuideTag.json",
                       "MonsterGuidePhase.json", "MonsterGuideSkill.json",
                       "MonsterGuideSkillText.json"],
    "endgame": ["ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
                 "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
                 "ScheduleDataChallengeMaze.json", "ScheduleDataChallengeStory.json",
                 "ScheduleDataChallengeBoss.json", "ScheduleDataGlobal.json",
                 "MazeBuff.json",
                 "MonsterTemplateConfig.json", "ChallengeTargetConfig.json",
                 "ChallengeGroupConfig.json", "ChallengeStoryGroupExtra.json",
                 "ChallengeBossGroupExtra.json", "ChallengeStoryMazeExtra.json",
                 "ChallengeMazeGroupExtra.json",
                 "ChallengeStoryGroupConfig.json", "ChallengeBossGroupConfig.json",
                 "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
                 "ChallengeBossMazeTierce.json", "ChallengeStoryTargetConfig.json",
                 "ChallengeBossTargetConfig.json", "ChallengePeakGroupConfig.json",
                 "ChallengePeakBossConfig.json", "BattleTargetConfig.json",
                 "StageConfig.json", "MonsterConfig.json", "MonsterCamp.json",
                 "MonsterSkillConfig.json", "ChallengeBadgeConfig.json",
                 "ChallengeGeneralConfig.json",
                 "ChallengeMazeRewardLine.json", "ChallengeStoryRewardLine.json",
                 "ChallengeBossRewardLine.json", "ChallengePeakReward.json",
                 "RewardData.json",
                 "StageInvasionConfig.json", "MonsterGuideConfig.json",
                 "MonsterGuideTag.json", "MonsterGuidePhase.json",
                 "MonsterGuideSkill.json", "MonsterGuideSkillText.json",
                 "MonsterStatusResistanceType.json"],
    "endgame_guide": ["IntroData.json", "ChallengeGroupConfig.json",
                       "ChallengeStoryGroupExtra.json", "ChallengeBossGroupExtra.json",
                       "ChallengePeakBossConfig.json"],
    "endgame_catalog": [
        str(OUTPUT_DIR / "maze.json"),
        str(OUTPUT_DIR / "maze_extra.json"),
        str(OUTPUT_DIR / "maze_boss.json"),
        str(OUTPUT_DIR / "maze_peak.json"),
    ],
    "currency": [
        "GridFightRoleBasicInfo.json", "AvatarConfig.json", "AvatarConfigLD.json",
        "GridFightRolePropertyConfig.json", "GridFightTraitBasicInfo.json", "GridFightRoleStar.json",
        "GridFightFrontSkill.json", "GridFightBackBESkillConfig.json",
        "GridFightTraitMazebuff.json", "GridFightTraitLayer.json",
        "GridFightBackRoleRank.json", "GridFightBackEquipment.json",
        "GridFightItems.json", "GridFightRoleRecommendEquip.json",
        "GridFightServantStar.json", "GridFightServantSkill.json",
        "GridFightBackSkillExtraDesc.json", "GridFightGenderOverride.json",
        "GridFightRoleBasicInfoOld.json",
    ],
    "currency_catalog": ["GridFightItems.json", "GridFightEquipment.json",
                          "GridFightEquipCategoryInfo.json", "GridFightEquipTag.json",
                          "GridFightEquipRecommendRole.json",
                          "AvatarConfig.json", "AvatarConfigLD.json",
                          "GridFightRoleBasicInfo.json", "GridFightTraitBasicInfo.json",
                          "GridFightRolePropertyConfig.json",
                          "GridFightTraitLayer.json", "GridFightTraitMazebuff.json",
                          "GridFightTraitLayerOld.json",
                          "GridFightTraitRemark.json", "GridFightAugment.json",
                          "GridFightConsumables.json", "GridFightForge.json",
                          "GridFightPortalBuff.json"],
    "achievements": ["AchievementData.json", "AchievementSeries.json",
                      "TextJoinConfig.json", "TextJoinItem.json"],
    "voracity": [
        "ActivityPanel.json", "ConstValueCommon.json",
        "ActivityVoracityInvasionPro.json", "ActivityVoracityInvasionBuf.json",
        "StageInvasionBuff.json", "StageInvasionConfig.json", "MazeBuff.json",
        "StatusConfig.json", "TutorialGuideData.json", "GridFightAffixConfig.json",
        "MonsterTemplateConfig.json", "MonsterConfig.json",
        "MonsterCamp.json", "MonsterSkillConfig.json",
        # 传递依赖：`load_monsters` 由 monster_common 装配
        # （voracity.py:33 导入 → :473 调用 → monster_common.py:202 load_status_resist_icons()
        #   → :125 读本表）。monster_common 自己已登记，本模块不同批登记则被增量跳过
        "MonsterStatusResistanceType.json",
        "ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
        "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
        "ChallengeGroupConfig.json", "ChallengeStoryGroupConfig.json",
        "ChallengeBossGroupConfig.json", "ChallengePeakGroupConfig.json",
        "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
        "ChallengeBossMazeTierce.json",
    ],
    "version": ["git:HEAD"],
}

def _file_sig(path: Path) -> str:
    """文件签名：mtime_ns:size（快速，无需读内容）。"""
    try:
        st = path.stat()
        return f"{st.st_mtime_ns}:{st.st_size}"
    except OSError:
        return "missing"

def _dir_sig(directory: Path) -> str:
    """目录签名：所有 .json 文件签名拼接的 md5（跨进程稳定）。"""
    if not directory.exists():
        return "missing"
    sigs = []
    for f in sorted(directory.rglob("*.json")):
        sigs.append(f"{f.name}:{_file_sig(f)}")
    return hashlib.md5("|".join(sigs).encode()).hexdigest()

def _git_sig(spec: str) -> str:
    """git 引用签名：取子模块指定引用当前指向的提交哈希（子模块更新即变化）。"""
    ref = spec.removeprefix("git:")
    try:
        proc = subprocess.run(
            ["git", "-C", str(SOURCE_DIR), "rev-parse", ref],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return "missing"
    if proc.returncode != 0:
        return "missing"
    return proc.stdout.strip()

def _module_sig(module_name: str) -> str:
    """计算模块当前源数据签名。"""
    sources = MODULE_SOURCES.get(module_name, [])
    if not sources:
        return "static"

    parts = []
    parts.append(f"TextMap:{_file_sig(TEXTMAP_FILE)}")
    for src in sources:
        if src.startswith("git:"):
            parts.append(f"{src}:{_git_sig(src)}")
            continue
        p = Path(src)
        if not p.is_absolute():
            p = EXCEL_DIR / p
        if p.is_dir():
            parts.append(f"{src}:{_dir_sig(p)}")
        else:
            parts.append(f"{src}:{_file_sig(p)}")

    return "|".join(parts)

def load_state() -> dict[str, str]:
    """加载上次转换状态。"""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}

def save_state(state: dict[str, str]) -> None:
    """保存转换状态。"""
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def should_skip(module_name: str, state: dict[str, str], force: bool = False) -> bool:
    """判断模块是否可跳过（源数据未变更）。"""
    if force:
        return False
    current = _module_sig(module_name)
    if current == "static":
        return module_name in state
    return state.get(module_name) == current

def update_state(module_name: str, state: dict[str, str]) -> None:
    """模块转换成功后更新状态。"""
    state[module_name] = _module_sig(module_name)
