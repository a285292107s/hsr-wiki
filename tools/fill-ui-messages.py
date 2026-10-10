#!/usr/bin/env python3
"""UI 词典的「官方术语」条目回填 / 漂移检查。

    cd tools && python fill-ui-messages.py            # 用官方译文回填（保留其它键、按键排序）
    cd tools && python fill-ui-messages.py --check    # 只报告：哪些键能溯源、当前值是否与官方一致

为什么需要它：目录页筛选标签里有一批**官方术语**（全部 / 命途 / 稀有度 / 弱点 / 玩法名…）。
自己译会与游戏内用词打架，逐语言抄又极易漂移 ⇒ 值一律取自官方文本表，本工具负责回填与复查。

判据：
- 中文标签在 TextMap 里有**唯一义项**才自动取自官方；同形多义（如「命途」既有剧情义 "Fate" 又有
  界面义 "Path"）必须由 `OVERRIDE_HASH` 人工指定正确义项——宁可显式，不靠猜。
- 官方没有对应词的站点自造标签（系列 / 品质 / 套装类型…）由 `AUTHORED` 表人工撰写，本工具只负责写入。
"""

from __future__ import annotations
import re

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "converter"))
from languages import LANGUAGES  # noqa: E402

TM = ROOT / "vendor" / "TurnBasedGameData" / "TextMap"
MSG_DIR = ROOT / "src" / "lib" / "i18n" / "messages"

# 词典键 → 中文标签（与界面/产物里出现的中文一致）
LABELS: dict[str, str] = {
    "catalog.all": "全部",
    "catalog.filter.path": "命途",
    "catalog.filter.element": "属性",
    "catalog.filter.rarity": "稀有度",
    "catalog.filter.expert": "专家",
    "catalog.filter.lightcone": "光锥",
    "catalog.filter.weak": "弱点",
    "catalog.filter.camp": "阵营",
    "catalog.filter.type": "类型",
    "catalog.option.modeMaze": "忘却之庭",
    "catalog.option.modeStory": "虚构叙事",
    "catalog.option.modeBoss": "末日幻影",
    "catalog.option.modePeak": "异相仲裁",
    "monster.rank.elite": "精英",
    "monster.rank.boss": "首领",
    "catalog.position.front": "前台",
    "catalog.position.back": "后台",
    "catalog.position.both": "前后台",
    "catalog.charge.speed": "速度",
    "catalog.charge.maxHp": "生命上限",
    "catalog.charge.sp": "战技点",
    "catalog.traitCat.faction": "阵营",
    "catalog.traitCat.special": "特殊",
    "catalog.quality.silver": "银色",
    "catalog.quality.gold": "金色",
    "catalog.quality.prismatic": "棱彩",
    "catalog.cost.1": "1费",
    "catalog.cost.2": "2费",
    "catalog.cost.3": "3费",
    "catalog.cost.4": "4费",
    "catalog.cost.5": "5费",
    "catalog.cost.special": "特殊",
    "catalog.sig.resist": "抗性",
    "catalog.sig.stance": "韧性",
    "catalog.sig.atk": "攻击",
    "catalog.sig.def": "防御",
    "catalog.sig.skills": "技能",
    "catalog.sig.intro": "图鉴介绍",
    "catalog.sig.figure": "立绘",
    "catalog.sig.invaded": "侵蚀名单",
    "catalog.quality.multicolor": "彩",
    "catalog.quality.unique": "独特",
    "catalog.qualityBase": "基础",
    # 物品类别（ItemSubType → 展示名；官方无对应词条，多数需人工撰写）
    "itemType.Material": "材料",
    "itemType.CommonMonsterDrop": "怪物掉落",
    "itemType.WeeklyMonsterDrop": "周本掉落",
    "itemType.TracePath": "行迹素材",
    "itemType.AvatarRank": "星魂素材",
    "itemType.AvatarExp": "角色经验",
    "itemType.EquipmentExp": "光锥经验",
    "itemType.RelicExp": "遗器经验",
    "itemType.PlanetFesItem": "星穹电影节道具",
    "itemType.MuseumStuff": "博物馆藏品",
    "itemType.MuseumExhibit": "博物馆展件",
    "itemType.AetherSkill": "以太战线·技能",
    "itemType.AetherSpirit": "以太战线·精灵",
    "itemType.ElfRestaurantItem": "精灵餐厅道具",
    "itemType.HipplenOutfit": "希儿朋服装",
    "itemType.FightFestSkill": "角斗大会技能",
    "itemType.DiceCombatDice": "模拟宇宙·战斗骰",
    "itemType.DiceCombatAvatar": "模拟宇宙·命途骰",
    "itemType.IdleLiveItem": "摸鱼道具",
    "itemType.MatchThreeV2": "三消道具",
    "itemType.PixAirMaterial": "像素飞机道具",
    "itemType.Virtual": "货币",
    "itemType.Book": "书籍",
    "itemType.Food": "食物",
    "itemType.Gift": "礼物",
    "itemType.Formula": "配方",
    "itemType.TravelBrochurePaster": "旅行手帐贴纸",
    "itemType.ChessRogueDiceSurface": "诡弈骰子面",
    "itemType.ForceOpitonalGift": "剧情赠礼",
    "itemType.RogueMedal": "模拟宇宙勋章",
    "itemType.FindChest": "寻宝道具",
    "itemType.Mission": "任务道具",
    # 物品主类别：Material / Virtual 与 sub-type 同名同义 ⇒ 直接复用 itemType.* 键（不设第二处事实）
    "itemMainType.Usable": "可用",
    "itemMainType.Mission": "任务",
    # 货币角色详情的属性名兜底表（PROP_LABEL → 词典键；多数可溯源到官方词条）
    # 货币角色详情的其它文案（技能分组 / 推荐优先级 / 随从属性 / 后台属性条）
    "skillGroup.front": "前台技能",
    "skillGroup.back": "后台技能",
    "skillGroup.servant": "随从技能",
    "cwRole.priorityFirst": "首选",
    "cwRole.prioritySecond": "次选",
    "cwRole.hpInherit": "生命继承",
    "cwRole.speedInherit": "速度继承",
    "cwRole.backEnergyBar": "后台充能条",
    "cwRole.backInitialEnergy": "后台初始充能",
    "cwRole.backMaxEnergy": "后台最大能量",
    "cwRole.backInitialSp": "后台初始能量",
    "cwRole.backSpeedRewrite": "后台速度重写",
    "cwRole.backSpeedBoost": "后台速度提升",
    "cwRole.frontPowerBase": "基础前台强度",
    "cwRole.backPowerBase": "基础后台强度",
    # 技能类型 / 削韧架势标签（无数据载体 → 词典；多数可溯源到官方词条）
    "skillType.Normal": "普攻",
    "skillType.Assist": "助战技",
    "skillType.ElationDamage": "欢愉技",
    "skillType.BPSkill": "战技",
    "skillType.Ultra": "终结技",
    "skillType.Passive": "天赋",
    "skillType.Maze": "秘技",
    "skillType.Servant": "忆灵技",
    "skillType.ServantPassive": "忆灵天赋",
    "stanceTag.SingleAttack": "单攻",
    "stanceTag.AoEAttack": "群攻",
    "stanceTag.Blast": "扩散",
    # 敌方详情页的界面标签（节标题 / 数值标签 / 空态；长句方法论说明另批处理）
    # 货币角色详情页的界面文案
    # 贪饕污染专题页 / 终局玩法页的界面文案
    "vor.sec.overview": "玩法概览",
    "vor.sec.scores": "污染等级与愿力",
    "vor.sec.invasion": "「贪饕」侵蚀",
    "vor.sec.stages": "波及关卡",
    "vor.sec.statuses": "状态词条",
    "vor.sec.tutorials": "教程图文",
    "vor.sec.affixes": "位面词条",
    "vor.sec.disambig": "同形词说明",
    "vor.loadingAria": "贪饕污染数据加载中",
    "vor.errorTitle": "贪饕污染数据加载失败",
    "vor.field.actId": "活动编号",
    "vor.field.unlockQuest": "解锁任务",
    "vor.willTier": "愿力档位",
    "vor.enemyBoost": "敌方强化",
    "vor.playerSupport": "玩家支援",
    "vor.willProgress": "愿力进度",
    "vor.noDispel": "不可驱散",
    "egm.stat.floors": "关卡层级",
    "egm.stat.halfs": "每层场次",
    "egm.stat.levels": "关卡组成",
    "egm.stat.knights": "骑士试炼",
    "egm.stat.kings": "王棋关卡",
    "egm.stat.targets": "设挑战目标",
    "egm.stat.countdown": "回合上限",
    "egm.stat.scoreCap": "分数上限",
    "egm.stat.tierce": "星启模式",
    "egm.value.tierceOn": "含",
    "egm.value.tierceOff": "不含",
    "egm.sec.rules": "玩法规则",
    "egm.sec.structure": "结构口径",
    "egm.sec.buffs": "赛季增益",
    "egm.sec.seasons": "赛季列表",
    "egm.note": "以当期赛季为准（层数与场次历史上变动过，故不取多季统计值）",
    "egm.currentSeason": "当期赛季",
    "egm.latestSeason": "最新赛季",
    "egm.whichCurrent": "当期",
    "egm.whichLatest": "最新",
    "egm.buffCount": "每期 {n} 条",
    "egm.viewSeasonBuffs": "查看{which}赛季（{name}）的增益",
    "egm.crumbsAria": "面包屑",
    "egm.othersAria": "其它玩法",
    "egm.errorTitle": "玩法说明加载失败",
    "common.none": "无",
    "common.param": "参数",
    "common.retry": "重试",
    "vor.invasionLevel": "污染等级 {n}",
    "vor.stageCount": "{n} 关",
    "egm.value.floors": "{n} 层",
    "egm.value.halfs": "{n} 场",
    "egm.value.countdown": "{n} 轮",
    "egm.unknownMode": "未知的终局玩法: {key}",
    # 光锥详情页 / 首页（版本上新）
    "common.stat.hp": "生命值",
    "common.stat.atk": "攻击力",
    "common.stat.def": "防御力",
    "common.credits": "信用点",
    "lc.loadingAria": "光锥详情加载中",
    "lc.errorTitle": "光锥数据加载失败",
    "lc.maxStats": "满级属性",
    "lc.sec.skill": "技能",
    "lc.sec.ascension": "晋阶",
    "lc.sec.recommended": "适配角色",
    "lc.rankTableCaption": "光锥技能各叠影等级参数",
    "lc.sec.story": "卡面",
    "lc.superimposeAria": "叠影等级",
    "lc.noAscendMaterial": "无晋阶材料",
    "lc.superimpose": "叠影 {n}",
    "lc.phase": "晋阶 {n}",
    "home.releaseTitle": "{version} 版本上新",
    "home.releaseTitleNoVersion": "版本上新",
    "home.tagline": "角色 · 光锥 · 遗器，全图鉴数据",
    "home.editionAria": "角色、光锥与遗器",
    "home.loadingAria": "版本上新加载中",
    "home.errorTitle": "版本索引加载失败",
    "home.errorDetail": "{labels}三类索引都没取到，无法判定本版本新增，重试即可恢复。",
    "home.partialDetail": "有 {n} 类索引未取到，本次未包含其分区。",
    "home.viewAll": "全部{label}",
    "home.viewArchive": "查看档案",
    "home.empty": "本版本暂无新增条目",
    # 角色/遗器/技能相关组件与视图
    "char.sec.stats": "属性",
    "char.sec.eidolons": "星魂",
    "char.sec.talents": "附加",
    "char.sec.bonuses": "加成",
    "char.sec.teams": "队伍",
    "char.sec.stories": "档案",
    "char.sec.profile": "配音",
    "char.state.original": "原始",
    "char.state.compare": "对比",
    "char.enhForm": "强化形态",
    "char.enhModeAria": "强化模式切换",
    "char.enhNotes": "强化内容",
    "char.loadingAria": "角色详情加载中",
    "char.errorTitle": "角色数据加载失败",
    "char.state.enhanced": "V{n} 强化",
    "relic.setType.cavern": "隧洞遗器",
    "relic.setType.planar": "位面饰品",
    "relic.loadingAria": "遗器详情加载中",
    "relic.errorTitle": "遗器数据加载失败",
    "relic.parts": "部位",
    "relic.affixCol": "词条",
    "relic.tier": "数值档位",
    "relic.maxLevel": "满级",
    "relic.nextEnhance": "次强化",
    "relic.maxMultiplier": "满值倍率",
    "relic.noAffixAria": "该部位无此词条",
    "relic.pieceCount": "{n} 件",
    "relic.setPieces": "{n}件套",
    "relic.affixNote": "初始 → 满级（+{n}）",
    "relic.maxValue": "满值 {value}",
    "relic.tierTitle": "第 {n} 档",
    "relic.dropNote": "掉落随机取 1 档；强化在 +3/+6/+9/+12/+15 随机累加 1 条 1 档，理论满值 = 最高档 × {mult}。",
    "skill.energy": "能量",
    "skill.energyNeed": "能量需求",
    "skill.consume": "消耗",
    "skill.enhSources": "强化来源",
    "skill.enhSourcesOpen": "收起强化来源",
    "skill.anim": "技能预览",
    "skill.animOpen": "收起技能预览",
    "skill.table": "技能数据",
    "skill.tableOpen": "收起技能数据",
    "skill.animAlt": "{name} 技能预览",
    "cmp.spNote": "终结技能量需求：{v}",
    "cmp.noChange": "本区块无变化",
    "cmp.changed": "变化",
    "cmp.enhanced": "强化",
    "cmp.talentsTag": "附加能力",
    "stat.taunt": "嘲讽",
    "stat.energyCap": "能量上限",
    "stat.stage": "突破 {n}",
    "stat.levelAria": "角色等级",
    "stat.levelValue": "Lv.{level} 突破 {stage}",
    "stat.perLevel": "每级 +{v}",
    "stat.note": "口径：基础面板，不含光锥与遗器加成。",
    "ctrait.sec.members": "羁绊成员",
    "ctrait.sec.layers": "层级效果",
    "ctrait.scope.member": "成员",
    "ctrait.memberCount": "（{n} 人）",
    "skill.levelAria": "{name} 等级",
    "ctrait.loadingAria": "羁绊详情加载中",
    "ctrait.errorTitle": "羁绊数据加载失败",
    "ctrait.notFound": "未找到该羁绊",
    "ctrait.sec.effect": "效果说明",
    "ctrait.sec.mechanics": "机制详情",
    # 敌方卡片 / 终局页面 / 污染标注
    "card.effectResLabel": "效果抵抗",
    "card.value.stance": "韧性 {v}",
    "card.value.speed": "速度 {v}",
    "card.weak": "弱点：{list}",
    "card.resist": "抗性：{list}",
    "card.effectRes": "效果抵抗 {v}",
    "card.viewDetail": "查看 {name} 详情",
    "cwHub.tagline": "赢者通吃的零和博弈。招募、羁绊、站位、策略，构筑你的最强阵容。",
    "cwHub.releaseTitle": "本赛季新增",
    "cwHub.loadingAria": "本赛季新增加载中",
    "cwHub.errorTitle": "赛季索引加载失败",
    "cwHub.errorDetail": "{labels}索引都没取到，无法判定本赛季新增，重试即可恢复。",
    "cwHub.empty": "本赛季暂无新增条目",
    "egd.rule.cycles": "回合限制 CYCLES",
    "egd.rule.score": "通关分数线 SCORE",
    "egd.wavesEnemies": "{waves} 波 · {mons} 敌",
    "egd.score.total": "分数",
    "egd.score.rounds": "回合",
    "egd.score.dead": "减员",
    "egd.unknownMode": "未知的终局模式: {mode}",
    "egd.seasonNotFound": "未找到赛季 {mode}/{id}",
    "egd.loadingAria": "赛季详情加载中",
    "egd.errorTitle": "赛季数据加载失败",
    "egd.empty.stages": "本赛季暂无关卡数据",
    "egd.navAria": "相邻赛季",
    "egd.prevSeason": "← 上一赛季",
    "egd.nextSeason": "下一赛季 →",
    "skill.noCost": "不消耗",
    "egd.pollution.tierceExtra": "星启附加关",
    "egd.pollution.stage": "关卡",
    "egd.pollution.half1": "上半场",
    "egd.pollution.half2": "下半场",
    "egd.pollution.floorHalf": "第 {n} 层 · {half}",
    # 非 endgame 收尾批次（toast / 目录页 / 卡片 / 面板 / 主题色 / 404）
    "toast.cdnDown": "CDN 资源暂不可用，图片与动画已降级展示",
    "toast.cdnUp": "CDN 已恢复，图片自动重载",
    "catalog.loadError": "数据加载失败",
    "catalog.loadingAria": "{title}加载中",
    "catalog.emptyFiltered": "当前搜索或筛选条件下没有匹配条目。",
    "catalog.emptyAll": "该分类暂无可展示的条目。",
    "catalog.clearFilters": "清除搜索与筛选",
    "common.loadFailed": "加载失败: {msg}",
    "common.unknownError": "未知错误",
    "common.trailblazer": "开拓者",
    "cwTrait.layerCount": "{n}层",
    "egd.pollutionTitle": "本季 {n} 处污染关卡 · 等级 {levels}",
    "mob.badge.variant": "变体 {i}/{n}",
    "mob.noWeak": "无弱点",
    "mob.card.weak": "弱点 {list}",
    "char.idFallback": "角色 {id}",
    "char.noAnimation": "该角色暂无动画展示",
    "char.animation": "动画",
    "char.eidolonIndex": "星魂索引",
    "char.skillIndex": "技能索引",
    "char.bonusAbility": "附加能力 {n}",
    "char.storyLabel": "角色档案 · {idx}",
    "char.cv.zh": "CV · 中文",
    "char.cv.ja": "CV · 日语",
    "char.cv.ko": "CV · 韩语",
    "char.cv.en": "CV · 英语",
    "build.team": "配队",
    "build.currentChar": "当前角色",
    "build.recommendedSub": "推荐副词条",
    "build.empty": "暂无配装数据",
    "relic.sec.effect": "套装效果",
    "relic.sec.main": "主词条",
    "relic.sec.sub": "副词条",
    "relic.sec.story": "来历",
    "notfound.title": "数据节点未连接",
    "notfound.desc": "请求的路径不存在或已被移除。",
    "notfound.back": "返回首页",
    "theme.accent.terracotta": "赤陶",
    "theme.accent.olive": "橄榄青",
    "theme.accent.slate": "雾霭蓝灰",
    "theme.accent.sand": "暖沙棕",
    "theme.accent.iris": "暮山紫",
    # 终局组件收尾批
    "egd.bossTraits": "首领特性",
    "egd.buffs.title": "战意机制 FURY",
    "egd.buffs.mech": "战意机制",
    "egd.buffs.effect": "战意效果",
    "egd.clearCondition": "通关条件",
    "egd.rule.enemies": "击败首领 ENEMIES",
    "egd.rewards": "通关奖励",
    "egd.halfTabs": "半场",
    "egd.guideLabel": "玩法说明",
    "egd.seasonId": "赛季编号 {id}",
    "egd.label.attr": "推荐属性",
    "egd.peak.king": "王棋",
    "egd.peak.knight": "骑士",
    "egd.mechanic": "机制",
    "egd.peak.hard": "绝境",
    "egd.starRewards": "星数奖励 STAR REWARDS",
    "egd.starRewardsNote": "每达成 1 个挑战目标计 1 星，累计达下列档位可领取",
    "egd.starGoal": "星级目标",
    "egd.challengeGoal": "挑战目标",
    "egd.starTierTitle": "{name} · 星级奖励",
    "egd.prismStar": "棱彩星",
    "egd.accumStars": "累计 {n}★",
    "egd.summons": "召唤物",
    "egd.node.1": "节点一",
    "egd.node.2": "节点二",
    "egd.node.3": "节点三",
    "egd.node.n": "节点{n}",
    "egd.rule.nodes": "通关节点 NODES",
    "egd.tierceNodes": "星启节点",
    "egd.choice.fixed": "随层生效，不可选择",
    "egd.choice.perTeam": "挑战关卡前每支队伍选 1 条",
    "egd.choice.perStage": "每场首领挑战前选 1 条（上/下半场各一套）",
    "egd.choice.perKing": "挑战王棋前为队伍选 1 条",
    "egd.levelLabel": "关卡 {n}",
    "egd.floorLabel": "第 {n} 层",
    "egd.enemySetup": "敌方配置",
    "egd.waveLabel": "第 {n} 波",
    "meta.description": "崩坏：星穹铁道游戏数据 Wiki",
    "cwRole.sec.growth": "成长总览",
    "cwRole.sec.skills": "技能详情",
    "cwRole.sec.ranks": "后台星魂",
    "cwRole.sec.cones": "专属光锥",
    "cwRole.sec.equips": "推荐装备",
    "cwRole.loadingAria": "角色详情加载中",
    "cwRole.errorTitle": "角色数据加载失败",
    "cwRole.navAria": "内容区块导航",
    "cwRole.topAria": "返回顶部",
    "cwRole.starSwitchAria": "星级切换",
    "cwRole.descModeAria": "技能描述模式",
    "cwRole.simple": "简略",
    "cwRole.full": "详细",
    "cwRole.gainEnergy": "获得能量",
    "cwRole.costEnergy": "消耗能量",
    "cwRole.stance": "削韧",
    "cwRole.scopeSelf": "自身",
    "cwRole.scopeAll": "全员",
    "cwRole.empty.growth": "该角色没有成长数据",
    "cwRole.empty.skills": "该角色没有技能数据",
    "cwRole.empty.ranks": "该角色没有后台星魂数据",
    "cwRole.empty.cones": "该角色没有专属光锥数据",
    "cwRole.empty.equips": "该角色没有推荐装备数据",
    "cwRole.coneHint": "角色放置在后台时，拥有对应光锥可获得特殊加成。",
    "common.loadErrorDetail": "可能是网络波动或该条目暂时不可用，重试即可恢复。",
    "mob.sec.weakness": "弱点与抗性",
    "mob.sec.record": "图鉴记录",
    "mob.sec.guide": "阶段机制",
    "mob.sec.stats": "战斗数值",
    "mob.sec.skills": "技能",
    "mob.sec.status": "状态词条",
    "mob.sec.appear": "出没关卡",
    "mob.sec.drop": "掉落",
    "mob.sec.variants": "同族变体",
    "mob.resist.stance": "韧性弱点",
    "mob.resist.damage": "伤害抗性",
    "mob.empty.weak": "无弱点信息",
    "mob.empty.resist": "无抗性信息",
    "mob.empty.intro": "暂无图鉴介绍",
    "mob.empty.appear": "暂无关卡出场记录。",
    "mob.phase.other": "其他形态",
    "mob.stat.hp": "HP 生命",
    "mob.stat.atk": "ATK 攻击",
    "mob.stat.def": "DEF 防御",
    "mob.stat.spd": "SPD 速度",
    "mob.stat.stance": "韧性",
    "mob.status.dispel": "可驱散",
    "mob.atlas.k": "图鉴族",
    "mob.event.k": "活动出处",
    "mob.census.k": "统计口径",
    "mob.error.title": "怪物数据加载失败",
    "propGroup.power": "强度",
    "propGroup.survival": "生存",
    "propGroup.speed": "速度",
    "propGroup.damage": "伤害",
    "propGroup.mechanic": "机制",
    "propGroup.other": "其它",
    "prop.CriticalChanceBase": "暴击率",
    "prop.CriticalDamageBase": "暴击伤害",
    "prop.HealRatioBase": "治疗量",
    "prop.StatusResistanceBase": "效果抵抗",
    "prop.SPRatioBase": "能量恢复效率",
    "prop.AllDamageTypeAddedRatio": "全属性伤害",
    "prop.AllDamageTypePenetrate": "全属性抗性穿透",
    "prop.IcePenetrate": "冰属性抗性穿透",
    "prop.ElationDamageAddedRatioBase": "欢愉伤害",
    "prop.BreakDamageExtraAddedRatio": "击破伤害",
    "prop.ExtraAllDamageTypeAddedRatio4": "伤害增幅",
    "prop.ExtraAllDamageTypeAddedRatio1": "伤害增幅",
    "prop.ExtraAllDamageTypeAddedRatio5": "伤害增幅",
    "prop.ExtraDamageAddedRatio1": "伤害增幅",
    "prop.ExtraInitSP": "初始能量",
    "prop.ExtraHPAddedRatio1": "生命增幅",
    "prop.ExtraHPAddedRatio2": "生命增幅",
    "prop.ExtraSpeedAddedRatio1": "速度增幅",
    "prop.ExtraSpeedAddedRatio2": "速度增幅",
    "prop.ExtraAttackAddedRatio": "攻击增幅",
    "prop.ExtraDefenceAddedRatio": "防御增幅",
    "prop.ExtraCriticalChanceBase": "暴击率增幅",
    "prop.ExtraCriticalDamageBase": "暴击伤害增幅",
    "prop.StanceBreakAddedRatio": "击破效率",
    "prop.ExtraBreakDamageAddedRatio": "击破特攻",
    "prop.BreakDamageAddedRatioBase": "击破特攻",
    "prop.ExtraHealBase": "基础治疗强度",
    "prop.ExtraHealRatioBase": "治疗强度",
    "prop.ExtraHealAddedRatio": "治疗强度",
    "prop.ExtraShieldBase": "基础护盾强度",
    "prop.ExtraShieldRatioBase": "护盾强度",
    "prop.ExtraShieldAddedRatio": "护盾强度",
    "prop.ExtraLuckChance": "幸运一击率",
    "prop.ExtraLuckDamage": "幸运一击伤害",
    "prop.ExtraFrontPowerAddedRatio1": "前台强度",
    "prop.ExtraBackPowerAddedRatio1": "后台强度",
    "prop.ExtraDOTDamageAddedRatio1": "持续伤害增幅",
    "prop.ExtraElementDamageAddedRatio1": "击破伤害增幅",
    "prop.ExtraInsertDamageAddedRatio1": "追加攻击伤害增幅",
    "prop.ExtraNormalDamageAddedRatio1": "普攻伤害增幅",
    "prop.ExtraSkillDamageAddedRatio1": "战技伤害增幅",
    "prop.ExtraUltraDamageAddedRatio1": "终结技伤害增幅",
    "prop.ExtraElationDamageAddedRatio1": "欢愉伤害增幅",
    "prop.ExtraAllDamageReduce": "伤害减免",
    "prop.ExtraQuantumResonance": "同频",
    "prop.SpeedAddedRatio": "速度增幅",
    "prop.AttackAddedRatio": "攻击增幅",
    "prop.DefenceAddedRatio": "防御增幅",
    "prop.HPAddedRatio": "生命增幅",
    "ui.footerMotto": "愿此行，终抵群星",
    "catalog.currencyWar": "货币战争",
}

# 同形多义：人工指定义项（命途 → 界面义的 Path，而不是剧情义的 Fate）
OVERRIDE_HASH: dict[str, str] = {
    "catalog.filter.path": "7061335346406904483",
    "catalog.filter.element": "10084575826669248660",
    "catalog.filter.type": "14018818632678621583",
}

# 站点自造标签（官方无对应词）：人工撰写。cn 必须与界面现状逐字一致，否则就是改了中文界面。
# 显式删除清单：**只删这里点名的键**。本工具不是词典键集的唯一所有者（实测有 50 个键只存在于
# JSON 里，见 docs/memory/docs-process.md 的事故记录），故禁止通用剪枝——下线一个键时把它写进这里。
REMOVED_KEYS: set[str] = {
    # `char.sec.*` 区块改版后遗留；`mob.appear*` 组合句改版后遗留（守卫的「未被引用」报告点出）
    "char.sec.relics",
    "mob.appearTotal",
}

AUTHORED: dict[str, dict[str, str]] = {
    "catalog.filter.series": {
        "cn": "系列", "cht": "系列", "en": "Series", "jp": "シリーズ", "kr": "시리즈",
        "es": "Serie", "fr": "Série", "de": "Serie", "pt": "Série", "ru": "Серия",
        "th": "ซีรีส์", "vi": "Chuỗi", "id": "Seri",
    },
    "catalog.filter.showType": {
        "cn": "显示状态", "cht": "顯示狀態", "en": "Visibility", "jp": "表示状態", "kr": "표시 상태",
        "es": "Visibilidad", "fr": "Affichage", "de": "Sichtbarkeit", "pt": "Visibilidade",
        "ru": "Отображение", "th": "การแสดงผล", "vi": "Hiển thị", "id": "Visibilitas",
    },
    "catalog.filter.quality": {
        "cn": "品质", "cht": "品質", "en": "Quality", "jp": "品質", "kr": "품질",
        "es": "Calidad", "fr": "Qualité", "de": "Qualität", "pt": "Qualidade", "ru": "Качество",
        "th": "คุณภาพ", "vi": "Phẩm chất", "id": "Kualitas",
    },
    "catalog.filter.cost": {
        "cn": "费用", "cht": "費用", "en": "Cost", "jp": "コスト", "kr": "비용",
        "es": "Coste", "fr": "Coût", "de": "Kosten", "pt": "Custo", "ru": "Стоимость",
        "th": "ค่าใช้จ่าย", "vi": "Chi phí", "id": "Biaya",
    },
    "catalog.filter.category": {
        "cn": "分类", "cht": "分類", "en": "Category", "jp": "カテゴリ", "kr": "분류",
        "es": "Categoría", "fr": "Catégorie", "de": "Kategorie", "pt": "Categoria", "ru": "Категория",
        "th": "หมวดหมู่", "vi": "Phân loại", "id": "Kategori",
    },
    "catalog.filter.tag": {
        "cn": "标签", "cht": "標籤", "en": "Tag", "jp": "タグ", "kr": "태그",
        "es": "Etiqueta", "fr": "Étiquette", "de": "Tag", "pt": "Etiqueta", "ru": "Метка",
        "th": "แท็ก", "vi": "Thẻ", "id": "Tag",
    },
    "catalog.filter.position": {
        "cn": "位置", "cht": "位置", "en": "Position", "jp": "位置", "kr": "위치",
        "es": "Posición", "fr": "Position", "de": "Position", "pt": "Posição", "ru": "Позиция",
        "th": "ตำแหน่ง", "vi": "Vị trí", "id": "Posisi",
    },
    "catalog.filter.chargeType": {
        "cn": "充能类型", "cht": "充能類型", "en": "Charge Type", "jp": "チャージ型", "kr": "충전 유형",
        "es": "Tipo de carga", "fr": "Type de charge", "de": "Aufladetyp", "pt": "Tipo de carga",
        "ru": "Тип заряда", "th": "ประเภทชาร์จ", "vi": "Kiểu nạp", "id": "Jenis Isi Daya",
    },
    "catalog.option.expertOnly": {
        "cn": "仅专家", "cht": "僅專家", "en": "Experts only", "jp": "専門家のみ", "kr": "전문가만",
        "es": "Solo expertos", "fr": "Experts uniquement", "de": "Nur Experten",
        "pt": "Apenas especialistas", "ru": "Только эксперты", "th": "เฉพาะผู้เชี่ยวชาญ",
        "vi": "Chỉ chuyên gia", "id": "Hanya ahli",
    },
    "catalog.option.hasBackLightcone": {
        "cn": "有后台光锥", "cht": "有後台光錐", "en": "Has backline Light Cone", "jp": "後衛用光円錐あり",
        "kr": "후방 광추 보유", "es": "Con cono de luz trasero", "fr": "Avec cône de lumière arrière",
        "de": "Mit Backline-Lichtkegel", "pt": "Com Cone de Luz reserva",
        "ru": "Есть световой конус резерва", "th": "มีกรวยแสงสำรอง", "vi": "Có Nón Ánh Sáng dự bị",
        "id": "Punya Light Cone cadangan",
    },
    "catalog.filter.setType": {
        "cn": "套装类型", "cht": "套裝類型", "en": "Set Type", "jp": "セット種別", "kr": "세트 유형",
        "es": "Tipo de conjunto", "fr": "Type d'ensemble", "de": "Settyp", "pt": "Tipo de conjunto",
        "ru": "Тип набора", "th": "ประเภทเซ็ต", "vi": "Loại bộ", "id": "Jenis Set",
    },
    "catalog.option.set4Cavern": {
        "cn": "4件套 · 隧洞", "cht": "4件套 · 隧洞", "en": "4-pc · Cavern", "jp": "4セット · トンネル",
        "kr": "4세트 · 터널", "es": "4 piezas · Caverna", "fr": "4 pièces · Caverne",
        "de": "4 Teile · Höhle", "pt": "4 peças · Caverna", "ru": "4 предмета · Пещера",
        "th": "4 ชิ้น · ถ้ำ", "vi": "4 món · Hang", "id": "4 pc · Gua",
    },
    "catalog.option.set2Planar": {
        "cn": "2件套 · 位面", "cht": "2件套 · 位面", "en": "2-pc · Planar", "jp": "2セット · 次元界",
        "kr": "2세트 · 차원", "es": "2 piezas · Planar", "fr": "2 pièces · Plan",
        "de": "2 Teile · Planar", "pt": "2 peças · Planar", "ru": "2 предмета · Планар",
        "th": "2 ชิ้น · มิติ", "vi": "2 món · Vị diện", "id": "2 pc · Planar",
    },
    "catalog.filterAria": {
        "cn": "{name}筛选", "cht": "{name}篩選", "en": "{name} filter", "jp": "{name}で絞り込み",
        "kr": "{name} 필터", "es": "Filtro: {name}", "fr": "Filtre : {name}", "de": "Filter: {name}",
        "pt": "Filtro: {name}", "ru": "Фильтр: {name}", "th": "ตัวกรอง {name}", "vi": "Lọc theo {name}",
        "id": "Filter {name}",
    },
    "catalog.titleWithMode": {
        "cn": "{mode} · {name}", "cht": "{mode} · {name}", "en": "{mode} · {name}", "jp": "{mode} · {name}",
        "kr": "{mode} · {name}", "es": "{mode} · {name}", "fr": "{mode} · {name}", "de": "{mode} · {name}",
        "pt": "{mode} · {name}", "ru": "{mode} · {name}", "th": "{mode} · {name}", "vi": "{mode} · {name}",
        "id": "{mode} · {name}",
    },
    "catalog.character.title": {
        "cn": "角色图鉴", "cht": "角色圖鑑", "en": "Characters", "jp": "キャラクター図鑑", "kr": "캐릭터 도감",
        "es": "Personajes", "fr": "Personnages", "de": "Charaktere", "pt": "Personagens", "ru": "Персонажи",
        "th": "ตัวละคร", "vi": "Nhân vật", "id": "Karakter",
    },
    "catalog.lightcone.title": {
        "cn": "光锥图鉴", "cht": "光錐圖鑑", "en": "Light Cones", "jp": "光円錐図鑑", "kr": "광추 도감",
        "es": "Conos de luz", "fr": "Cônes de lumière", "de": "Lichtkegel", "pt": "Cones de Luz",
        "ru": "Световые конусы", "th": "กรวยแสง", "vi": "Nón Ánh Sáng", "id": "Light Cone",
    },
    "catalog.relic.title": {
        "cn": "遗器图鉴", "cht": "遺器圖鑑", "en": "Relics", "jp": "遺物図鑑", "kr": "유물 도감",
        "es": "Reliquias", "fr": "Reliques", "de": "Relikte", "pt": "Relíquias", "ru": "Реликвии",
        "th": "รีลิก", "vi": "Di Vật", "id": "Relic",
    },
    "catalog.monster.title": {
        "cn": "敌对物种", "cht": "敵對物種", "en": "Hostile Species", "jp": "敵対種族", "kr": "적대 종족",
        "es": "Especies hostiles", "fr": "Espèces hostiles", "de": "Feindliche Spezies",
        "pt": "Espécies hostis", "ru": "Враждебные виды", "th": "สปีชีส์ศัตรู", "vi": "Chủng Loài Địch",
        "id": "Spesies Musuh",
    },
    "catalog.endgame.title": {
        "cn": "终局内容", "cht": "終局內容", "en": "Endgame", "jp": "エンドコンテンツ", "kr": "엔드 콘텐츠",
        "es": "Contenido final", "fr": "Contenu final", "de": "Endgame", "pt": "Conteúdo final",
        "ru": "Эндгейм", "th": "เอนด์เกม", "vi": "Nội dung cuối", "id": "Endgame",
    },
    "common.unknown": {
        "cn": "未知", "cht": "未知", "en": "Unknown", "jp": "不明", "kr": "알 수 없음",
        "es": "Desconocido", "fr": "Inconnu", "de": "Unbekannt", "pt": "Desconhecido", "ru": "Неизвестно",
        "th": "ไม่ทราบ", "vi": "Không rõ", "id": "Tidak diketahui",
    },
    "route.modeDetail": {
        "cn": "玩法详情", "cht": "玩法詳情", "en": "Mode", "jp": "モード詳細", "kr": "모드 상세",
        "es": "Modo", "fr": "Mode", "de": "Modus", "pt": "Modo", "ru": "Режим",
        "th": "โหมด", "vi": "Chế độ", "id": "Mode",
    },
    "route.seasonDetail": {
        "cn": "赛季详情", "cht": "賽季詳情", "en": "Season", "jp": "シーズン詳細", "kr": "시즌 상세",
        "es": "Temporada", "fr": "Saison", "de": "Saison", "pt": "Temporada", "ru": "Сезон",
        "th": "ซีซัน", "vi": "Mùa", "id": "Musim",
    },
    "route.notFound": {
        "cn": "页面未找到", "cht": "頁面未找到", "en": "Page not found", "jp": "ページが見つかりません",
        "kr": "페이지를 찾을 수 없음", "es": "Página no encontrada", "fr": "Page introuvable",
        "de": "Seite nicht gefunden", "pt": "Página não encontrada", "ru": "Страница не найдена",
        "th": "ไม่พบหน้า", "vi": "Không tìm thấy trang", "id": "Halaman tidak ditemukan",
    },
    "endgame.status.live": {
        "cn": "进行中", "cht": "進行中", "en": "Ongoing", "jp": "開催中", "kr": "진행 중",
        "es": "En curso", "fr": "En cours", "de": "Laufend", "pt": "Em andamento", "ru": "Идёт",
        "th": "กำลังดำเนินการ", "vi": "Đang diễn ra", "id": "Berlangsung",
    },
    "endgame.status.ended": {
        "cn": "已结束", "cht": "已結束", "en": "Ended", "jp": "終了", "kr": "종료",
        "es": "Finalizado", "fr": "Terminé", "de": "Beendet", "pt": "Encerrado", "ru": "Завершено",
        "th": "สิ้นสุด", "vi": "Đã kết thúc", "id": "Berakhir",
    },
    "endgame.status.unknown": {
        "cn": "未知", "cht": "未知", "en": "Unknown", "jp": "不明", "kr": "알 수 없음", "es": "Desconocido", "fr": "Inconnu", "de": "Unbekannt", "pt": "Desconhecido", "ru": "Неизвестно", "th": "ไม่ทราบ", "vi": "Không rõ", "id": "Tidak diketahui",
    },
    "endgame.status.upcoming": {
        "cn": "未开始", "cht": "未開始", "en": "Upcoming", "jp": "開始前", "kr": "시작 전",
        "es": "Próximamente", "fr": "À venir", "de": "Bevorstehend", "pt": "Em breve", "ru": "Скоро",
        "th": "ยังไม่เริ่ม", "vi": "Sắp diễn ra", "id": "Akan datang",
    },
    "catalog.modeGuideAria": {
        "cn": "{name}玩法说明", "cht": "{name}玩法說明", "en": "{name} guide", "jp": "{name}の説明",
        "kr": "{name} 설명", "es": "Guía de {name}", "fr": "Guide de {name}", "de": "Leitfaden: {name}",
        "pt": "Guia de {name}", "ru": "Описание: {name}", "th": "คำแนะนำ {name}",
        "vi": "Hướng dẫn {name}", "id": "Panduan {name}",
    },
    "catalog.charge.specialEnergy": {
        "cn": "特殊充能", "cht": "特殊充能", "en": "Special Charge", "jp": "特殊チャージ", "kr": "특수 충전",
        "es": "Carga especial", "fr": "Charge spéciale", "de": "Spezialaufladung", "pt": "Carga especial",
        "ru": "Особый заряд", "th": "ชาร์จพิเศษ", "vi": "Nạp đặc biệt", "id": "Isi Daya Khusus",
    },
    "catalog.charge.ultEnergy": {
        "cn": "终结技能量", "cht": "終結技能量", "en": "Ultimate Energy", "jp": "必殺技エネルギー", "kr": "필살기 에너지",
        "es": "Energía de ultimate", "fr": "Énergie d'ultime", "de": "Ultimative Energie",
        "pt": "Energia de ultimate", "ru": "Энергия сверхспособности", "th": "พลังงานไม้ตาย",
        "vi": "Năng lượng Tuyệt Kỹ", "id": "Energi Ultimate",
    },
    "catalog.traitCat.combat": {
        "cn": "流派", "cht": "流派", "en": "Combat Style", "jp": "流派", "kr": "유파",
        "es": "Estilo de combate", "fr": "Style de combat", "de": "Kampfstil", "pt": "Estilo de combate",
        "ru": "Стиль боя", "th": "สายการต่อสู้", "vi": "Phái chiến đấu", "id": "Gaya Bertarung",
    },
    "catalog.chargeChip": {
        "cn": "充能·{name}", "cht": "充能·{name}", "en": "Charge · {name}", "jp": "チャージ·{name}",
        "kr": "충전 · {name}", "es": "Carga · {name}", "fr": "Charge · {name}", "de": "Aufladung · {name}",
        "pt": "Carga · {name}", "ru": "Заряд · {name}", "th": "ชาร์จ · {name}", "vi": "Nạp · {name}",
        "id": "Isi Daya · {name}",
    },
    "catalog.quality.multicolor": {
        "cn": "彩", "cht": "彩", "en": "Multicolor", "jp": "虹", "kr": "무지개",
        "es": "Multicolor", "fr": "Multicolore", "de": "Mehrfarbig", "pt": "Multicolor",
        "ru": "Радужный", "th": "หลากสี", "vi": "Nhiều màu", "id": "Multiwarna",
    },
    "catalog.quality.unique": {
        "cn": "独特", "cht": "獨特", "en": "Unique", "jp": "独特", "kr": "고유",
        "es": "Único", "fr": "Unique", "de": "Einzigartig", "pt": "Único", "ru": "Уникальный",
        "th": "พิเศษเฉพาะ", "vi": "Độc nhất", "id": "Unik",
    },
    "catalog.qualityBase": {
        "cn": "基础", "cht": "基礎", "en": "Base", "jp": "基本", "kr": "기본",
        "es": "Base", "fr": "Base", "de": "Basis", "pt": "Base", "ru": "Базовое",
        "th": "พื้นฐาน", "vi": "Cơ bản", "id": "Dasar",
    },
    "catalog.sig.figure": {
        "cn": "立绘", "cht": "立繪", "en": "Artwork", "jp": "立ち絵", "kr": "일러스트",
        "es": "Ilustración", "fr": "Illustration", "de": "Artwork", "pt": "Ilustração", "ru": "Арт",
        "th": "ภาพตัวละคร", "vi": "Hình ảnh", "id": "Gambar",
    },
    "catalog.sig.invaded": {
        "cn": "侵蚀名单", "cht": "侵蝕名單", "en": "Corruption list", "jp": "侵食リスト", "kr": "침식 목록",
        "es": "Lista de corrupción", "fr": "Liste de corruption", "de": "Korruptionsliste",
        "pt": "Lista de corrupção", "ru": "Список заражения", "th": "รายชื่อการกัดกร่อน",
        "vi": "Danh sách ăn mòn", "id": "Daftar korupsi",
    },
    "catalog.sig.hp": {
        "cn": "HP", "cht": "HP", "en": "HP", "jp": "HP", "kr": "HP",
        "es": "HP", "fr": "HP", "de": "HP", "pt": "HP", "ru": "HP",
        "th": "HP", "vi": "HP", "id": "HP",
    },
    "catalog.variantDiffHelp": {
        "cn": "「差分」列出的字段是本档与本页当前档不同的全部差异。",
        "cht": "「差分」列出的欄位是本檔與本頁當前檔不同的全部差異。",
        "en": "“Differs” lists every field that differs between this entry and the one shown on this page.",
        "jp": "「差分」はこの項目と本ページの項目で異なる全フィールドを列挙します。",
        "kr": "「차이」는 이 항목과 현재 페이지 항목에서 다른 모든 필드를 나열합니다.",
        "es": "«Diferencias» enumera todos los campos que difieren entre esta entrada y la de esta página.",
        "fr": "« Écarts » liste tous les champs qui diffèrent entre cette entrée et celle de cette page.",
        "de": "„Abweichung“ listet alle Felder, die sich von dem auf dieser Seite gezeigten Eintrag unterscheiden.",
        "pt": "“Diferenças” lista todos os campos que diferem entre esta entrada e a desta página.",
        "ru": "«Отличия» перечисляет все поля, отличающиеся от записи на этой странице.",
        "th": "“ต่างจาก” จะแสดงทุกฟิลด์ที่แตกต่างจากรายการในหน้านี้",
        "vi": "“Khác biệt” liệt kê mọi trường khác với mục trên trang này.",
        "id": "“Beda” mencantumkan semua bidang yang berbeda dengan entri di halaman ini.",
    },
    # ─── 物品类别（官方无对应词条；事件/机制名用官方译名：Aetherium Wars / Simulated Universe / Pixel Plane） ───
    "itemType.Material": {
        "cn": "材料", "cht": "材料", "en": "Material", "jp": "素材", "kr": "재료",
        "es": "Material", "fr": "Matériaux", "de": "Material", "pt": "Materiais", "ru": "Материалы",
        "th": "วัสดุ", "vi": "Nguyên liệu", "id": "Material",
    },    "itemType.ComposeMaterial": {
        "cn": "合成材料", "cht": "合成材料", "en": "Synthesis Material", "jp": "合成素材", "kr": "합성 재료",
        "es": "Material de síntesis", "fr": "Matériau de synthèse", "de": "Synthesematerial",
        "pt": "Material de síntese", "ru": "Материал синтеза", "th": "วัสดุสังเคราะห์",
        "vi": "Nguyên liệu tổng hợp", "id": "Material Sintesis",
    },

    "itemType.CommonMonsterDrop": {
        "cn": "怪物掉落", "cht": "怪物掉落", "en": "Enemy Drop", "jp": "敵ドロップ", "kr": "적 드롭",
        "es": "Botín de enemigos", "fr": "Butin d'ennemis", "de": "Gegnerbeute", "pt": "Drop de inimigos",
        "ru": "Добыча с врагов", "th": "ดรอปจากศัตรู", "vi": "Rơi từ kẻ địch", "id": "Drop musuh",
    },
    "itemType.WeeklyMonsterDrop": {
        "cn": "周本掉落", "cht": "週本掉落", "en": "Weekly Boss Drop", "jp": "週ボスドロップ", "kr": "주간 보스 드롭",
        "es": "Botín de jefe semanal", "fr": "Butin de boss hebdo", "de": "Wochenboss-Beute",
        "pt": "Drop de chefe semanal", "ru": "Добыча с недельного босса", "th": "ดรอปบอสประจำสัปดาห์",
        "vi": "Rơi từ boss tuần", "id": "Drop bos mingguan",
    },
    "itemType.TracePath": {
        "cn": "行迹素材", "cht": "行跡素材", "en": "Trace Material", "jp": "軌跡素材", "kr": "행적 재료",
        "es": "Material de rastro", "fr": "Matériau de trace", "de": "Pfad-Material", "pt": "Material de traço",
        "ru": "Материал пути", "th": "วัสดุรอยทาง", "vi": "Nguyên liệu Vết Tích", "id": "Material Jejak",
    },
    "itemType.AvatarRank": {
        "cn": "星魂素材", "cht": "星魂素材", "en": "Eidolon Material", "jp": "星魂素材", "kr": "성혼 재료",
        "es": "Material de eidolón", "fr": "Matériau d'eidolon", "de": "Eidolon-Material",
        "pt": "Material de eidolon", "ru": "Материал эйдолона", "th": "วัสดุอีดอลอน",
        "vi": "Nguyên liệu Tinh Hồn", "id": "Material Eidolon",
    },
    "itemType.AvatarExp": {
        "cn": "角色经验", "cht": "角色經驗", "en": "Character EXP", "jp": "キャラ経験値", "kr": "캐릭터 경험치",
        "es": "EXP de personaje", "fr": "EXP de personnage", "de": "Charakter-EXP", "pt": "EXP de personagem",
        "ru": "Опыт персонажа", "th": "ประสบการณ์ตัวละคร", "vi": "EXP nhân vật", "id": "EXP karakter",
    },
    "itemType.EquipmentExp": {
        "cn": "光锥经验", "cht": "光錐經驗", "en": "Light Cone EXP", "jp": "光円錐経験値", "kr": "광추 경험치",
        "es": "EXP de cono de luz", "fr": "EXP de cône de lumière", "de": "Lichtkegel-EXP",
        "pt": "EXP de Cone de Luz", "ru": "Опыт светового конуса", "th": "ประสบการณ์กรวยแสง",
        "vi": "EXP Nón Ánh Sáng", "id": "EXP Light Cone",
    },
    "itemType.RelicExp": {
        "cn": "遗器经验", "cht": "遺器經驗", "en": "Relic EXP", "jp": "遺物経験値", "kr": "유물 경험치",
        "es": "EXP de reliquia", "fr": "EXP de relique", "de": "Relikt-EXP", "pt": "EXP de relíquia",
        "ru": "Опыт реликвии", "th": "ประสบการณ์รีลิก", "vi": "EXP Di Vật", "id": "EXP Relic",
    },
    "itemType.PlanetFesItem": {
        "cn": "星穹电影节道具", "cht": "星穹電影節道具", "en": "Astral Film Festival Item",
        "jp": "星穹映画祭アイテム", "kr": "성궁 영화제 아이템", "es": "Objeto del festival de cine",
        "fr": "Objet du festival du film", "de": "Filmfestival-Item", "pt": "Item do festival de cinema",
        "ru": "Предмет кинофестиваля", "th": "ไอเทมเทศกาลภาพยนตร์", "vi": "Vật phẩm liên hoan phim",
        "id": "Item festival film",
    },
    "itemType.MuseumStuff": {
        "cn": "博物馆藏品", "cht": "博物館藏品", "en": "Museum Collection", "jp": "博物館収蔵品",
        "kr": "박물관 소장품", "es": "Pieza de museo", "fr": "Pièce de musée", "de": "Museumsstück",
        "pt": "Peça de museu", "ru": "Музейный экспонат", "th": "ของสะสมพิพิธภัณฑ์",
        "vi": "Cổ vật bảo tàng", "id": "Koleksi museum",
    },
    "itemType.MuseumExhibit": {
        "cn": "博物馆展件", "cht": "博物館展件", "en": "Museum Exhibit", "jp": "博物館展示品",
        "kr": "박물관 전시품", "es": "Exhibición de museo", "fr": "Pièce exposée", "de": "Museumsausstellung",
        "pt": "Exposição de museu", "ru": "Экспонат музея", "th": "สิ่งจัดแสดงพิพิธภัณฑ์",
        "vi": "Hiện vật trưng bày", "id": "Pameran museum",
    },
    "itemType.AetherSkill": {
        "cn": "以太战线·技能", "cht": "以太戰線·技能", "en": "Aetherium Wars · Skill",
        "jp": "エーテル戦線·スキル", "kr": "에테르 전선·스킬", "es": "Aetherium Wars · Habilidad",
        "fr": "Aetherium Wars · Compétence", "de": "Aetherium Wars · Fertigkeit",
        "pt": "Aetherium Wars · Habilidade", "ru": "Aetherium Wars · Навык",
        "th": "Aetherium Wars · สกิล", "vi": "Aetherium Wars · Kỹ năng", "id": "Aetherium Wars · Skill",
    },
    "itemType.AetherSpirit": {
        "cn": "以太战线·精灵", "cht": "以太戰線·精靈", "en": "Aetherium Wars · Spirit",
        "jp": "エーテル戦線·精霊", "kr": "에테르 전선·정령", "es": "Aetherium Wars · Espíritu",
        "fr": "Aetherium Wars · Esprit", "de": "Aetherium Wars · Geist",
        "pt": "Aetherium Wars · Espírito", "ru": "Aetherium Wars · Дух",
        "th": "Aetherium Wars · วิญญาณ", "vi": "Aetherium Wars · Tinh linh", "id": "Aetherium Wars · Roh",
    },
    "itemType.ElfRestaurantItem": {
        "cn": "精灵餐厅道具", "cht": "精靈餐廳道具", "en": "Spirit Restaurant Item",
        "jp": "精霊レストランアイテム", "kr": "정령 식당 아이템", "es": "Objeto del restaurante",
        "fr": "Objet du restaurant", "de": "Restaurant-Item", "pt": "Item do restaurante",
        "ru": "Предмет ресторана", "th": "ไอเทมร้านอาหาร", "vi": "Vật phẩm nhà hàng", "id": "Item restoran",
    },
    "itemType.HipplenOutfit": {
        "cn": "希儿朋服装", "cht": "希兒朋服裝", "en": "Hipplen Outfit", "jp": "ヒッペン服",
        "kr": "히플렌 의상", "es": "Traje de Hipplen", "fr": "Tenue de Hipplen", "de": "Hipplen-Outfit",
        "pt": "Roupa de Hipplen", "ru": "Костюм Хипплена", "th": "ชุดฮิปเพลน",
        "vi": "Trang phục Hipplen", "id": "Pakaian Hipplen",
    },
    "itemType.FightFestSkill": {
        "cn": "角斗大会技能", "cht": "角鬥大會技能", "en": "Fight Fest Skill", "jp": "格闘大会スキル",
        "kr": "격투 대회 스킬", "es": "Habilidad del torneo", "fr": "Compétence du tournoi",
        "de": "Turnier-Fertigkeit", "pt": "Habilidade do torneio", "ru": "Навык турнира",
        "th": "สกิลการประลอง", "vi": "Kỹ năng đấu trường", "id": "Skill turnamen",
    },
    "itemType.DiceCombatDice": {
        "cn": "模拟宇宙·战斗骰", "cht": "模擬宇宙·戰鬥骰", "en": "Simulated Universe · Combat Die",
        "jp": "模擬宇宙·戦闘ダイス", "kr": "시뮬레이션 우주·전투 주사위",
        "es": "Universo Simulado · Dado de combate", "fr": "Univers simulé · Dé de combat",
        "de": "Simuliertes Universum · Kampfwürfel", "pt": "Universo Simulado · Dado de combate",
        "ru": "Симулированная вселенная · Боевой кубик", "th": "Simulated Universe · ลูกเต๋าต่อสู้",
        "vi": "Vũ Trụ Mô Phỏng · Xúc xắc chiến đấu", "id": "Simulated Universe · Dadu tempur",
    },
    "itemType.DiceCombatAvatar": {
        "cn": "模拟宇宙·命途骰", "cht": "模擬宇宙·命途骰", "en": "Simulated Universe · Path Die",
        "jp": "模擬宇宙·運命ダイス", "kr": "시뮬레이션 우주·운명 주사위",
        "es": "Universo Simulado · Dado de senda", "fr": "Univers simulé · Dé de voie",
        "de": "Simuliertes Universum · Pfadwürfel", "pt": "Universo Simulado · Dado de via",
        "ru": "Симулированная вселенная · Кубик пути", "th": "Simulated Universe · ลูกเต๋าเส้นทาง",
        "vi": "Vũ Trụ Mô Phỏng · Xúc xắc Vận Mệnh", "id": "Simulated Universe · Dadu Path",
    },
    "itemType.IdleLiveItem": {
        "cn": "摸鱼道具", "cht": "摸魚道具", "en": "Idle Item", "jp": "サボリアイテム", "kr": "딴짓 아이템",
        "es": "Objeto de ocio", "fr": "Objet d'oisiveté", "de": "Müßiggang-Item", "pt": "Item de ócio",
        "ru": "Предмет безделья", "th": "ไอเทมขี้เกียจ", "vi": "Vật phẩm lười biếng", "id": "Item bermalas",
    },
    "itemType.MatchThreeV2": {
        "cn": "三消道具", "cht": "三消道具", "en": "Match-3 Item", "jp": "マッチ3アイテム",
        "kr": "삼매치 아이템", "es": "Objeto de match-3", "fr": "Objet de match-3", "de": "Match-3-Item",
        "pt": "Item de match-3", "ru": "Предмет «три в ряд»", "th": "ไอเทมจับคู่ 3",
        "vi": "Vật phẩm match-3", "id": "Item match-3",
    },
    "itemType.PixAirMaterial": {
        "cn": "像素飞机道具", "cht": "像素飛機道具", "en": "Pixel Plane Item", "jp": "ピクセル飛行機アイテム",
        "kr": "픽셀 비행기 아이템", "es": "Objeto de Pixel Plane", "fr": "Objet Pixel Plane",
        "de": "Pixel-Plane-Item", "pt": "Item de Pixel Plane", "ru": "Предмет Pixel Plane",
        "th": "ไอเทม Pixel Plane", "vi": "Vật phẩm Pixel Plane", "id": "Item Pixel Plane",
    },
    "itemType.Virtual": {
        "cn": "货币", "cht": "貨幣", "en": "Currency", "jp": "通貨", "kr": "화폐",
        "es": "Moneda", "fr": "Monnaie", "de": "Währung", "pt": "Moeda", "ru": "Валюта",
        "th": "สกุลเงิน", "vi": "Tiền tệ", "id": "Mata uang",
    },
    "itemType.Food": {
        "cn": "食物", "cht": "食物", "en": "Food", "jp": "食べ物", "kr": "음식",
        "es": "Comida", "fr": "Nourriture", "de": "Nahrung", "pt": "Comida", "ru": "Еда",
        "th": "อาหาร", "vi": "Thức ăn", "id": "Makanan",
    },
    "itemType.TravelBrochurePaster": {
        "cn": "旅行手帐贴纸", "cht": "旅行手帳貼紙", "en": "Travel Journal Sticker", "jp": "旅行手帳シール",
        "kr": "여행 다이어리 스티커", "es": "Pegatina de diario", "fr": "Autocollant de carnet",
        "de": "Reisetagebuch-Sticker", "pt": "Adesivo de diário", "ru": "Наклейка дневника",
        "th": "สติกเกอร์ไดอารี่เดินทาง", "vi": "Nhãn dán nhật ký", "id": "Stiker jurnal",
    },
    "itemType.ChessRogueDiceSurface": {
        "cn": "诡弈骰子面", "cht": "詭弈骰子面", "en": "Chess Rogue Die Face", "jp": "チェスローグダイス面",
        "kr": "체스 로그 주사위 면", "es": "Cara de dado de Chess Rogue", "fr": "Face de dé Chess Rogue",
        "de": "Chess-Rogue-Würfelfläche", "pt": "Face de dado Chess Rogue", "ru": "Грань кубика Chess Rogue",
        "th": "หน้าลูกเต๋า Chess Rogue", "vi": "Mặt xúc xắc Chess Rogue", "id": "Sisi dadu Chess Rogue",
    },
    "itemType.ForceOpitonalGift": {
        "cn": "剧情赠礼", "cht": "劇情贈禮", "en": "Story Gift", "jp": "ストーリー贈り物", "kr": "스토리 선물",
        "es": "Regalo de historia", "fr": "Cadeau d'histoire", "de": "Story-Geschenk",
        "pt": "Presente de história", "ru": "Сюжетный подарок", "th": "ของขวัญเนื้อเรื่อง",
        "vi": "Quà tặng cốt truyện", "id": "Hadiah cerita",
    },
    "itemType.RogueMedal": {
        "cn": "模拟宇宙勋章", "cht": "模擬宇宙勳章", "en": "Simulated Universe Medal",
        "jp": "模擬宇宙メダル", "kr": "시뮬레이션 우주 훈장", "es": "Medalla del Universo Simulado",
        "fr": "Médaille de l'univers simulé", "de": "Simuliertes-Universum-Medaille",
        "pt": "Medalha do Universo Simulado", "ru": "Медаль Симулированной вселенной",
        "th": "เหรียญ Simulated Universe", "vi": "Huy chương Vũ Trụ Mô Phỏng", "id": "Medali Simulated Universe",
    },
    "itemType.FindChest": {
        "cn": "寻宝道具", "cht": "尋寶道具", "en": "Treasure Hunt Item", "jp": "宝探しアイテム",
        "kr": "보물찾기 아이템", "es": "Objeto de búsqueda del tesoro", "fr": "Objet de chasse au trésor",
        "de": "Schatzsuche-Item", "pt": "Item de caça ao tesouro", "ru": "Предмет поиска сокровищ",
        "th": "ไอเทมล่าสมบัติ", "vi": "Vật phẩm tìm kho báu", "id": "Item berburu harta",
    },
    "cwRole.hpInherit": {
        "cn": "生命继承", "cht": "生命繼承", "en": "HP Inheritance", "jp": "HP継承", "kr": "HP 계승", "es": "Herencia de HP", "fr": "Héritage de PV", "de": "HP-Vererbung", "pt": "Herança de HP", "ru": "Наследование HP", "th": "สืบทอด HP", "vi": "Kế thừa HP", "id": "Warisan HP",
    },
    "cwRole.speedInherit": {
        "cn": "速度继承", "cht": "速度繼承", "en": "SPD Inheritance", "jp": "速度継承", "kr": "속도 계승", "es": "Herencia de VEL", "fr": "Héritage de VIT", "de": "GES-Vererbung", "pt": "Herança de VEL", "ru": "Наследование скорости", "th": "สืบทอดความเร็ว", "vi": "Kế thừa tốc độ", "id": "Warisan SPD",
    },
    "cwRole.backEnergyBar": {
        "cn": "后台充能条", "cht": "後台充能條", "en": "Backline Energy Bar", "jp": "後衛エネルギーゲージ", "kr": "후방 에너지 바", "es": "Barra de energía trasera", "fr": "Barre d'énergie arrière", "de": "Backline-Energieleiste", "pt": "Barra de energia reserva", "ru": "Шкала энергии резерва", "th": "แถบพลังงานแนวหลัง", "vi": "Thanh năng lượng dự bị", "id": "Bilah energi cadangan",
    },
    "cwRole.backInitialEnergy": {
        "cn": "后台初始充能", "cht": "後台初始充能", "en": "Backline Initial Charge", "jp": "後衛初期チャージ", "kr": "후방 초기 충전", "es": "Carga inicial trasera", "fr": "Charge initiale arrière", "de": "Backline-Startaufladung", "pt": "Carga inicial reserva", "ru": "Начальный заряд резерва", "th": "ชาร์จเริ่มต้นแนวหลัง", "vi": "Nạp ban đầu dự bị", "id": "Isi awal cadangan",
    },
    "cwRole.backMaxEnergy": {
        "cn": "后台最大能量", "cht": "後台最大能量", "en": "Backline Max Energy", "jp": "後衛最大エネルギー", "kr": "후방 최대 에너지", "es": "Energía máxima trasera", "fr": "Énergie max arrière", "de": "Backline-Max.-Energie", "pt": "Energia máxima reserva", "ru": "Макс. энергия резерва", "th": "พลังงานสูงสุดแนวหลัง", "vi": "Năng lượng tối đa dự bị", "id": "Energi maks cadangan",
    },
    "cwRole.backInitialSp": {
        "cn": "后台初始能量", "cht": "後台初始能量", "en": "Backline Initial Energy", "jp": "後衛初期エネルギー", "kr": "후방 초기 에너지", "es": "Energía inicial trasera", "fr": "Énergie initiale arrière", "de": "Backline-Startenergie", "pt": "Energia inicial reserva", "ru": "Начальная энергия резерва", "th": "พลังงานเริ่มต้นแนวหลัง", "vi": "Năng lượng ban đầu dự bị", "id": "Energi awal cadangan",
    },
    "cwRole.backSpeedRewrite": {
        "cn": "后台速度重写", "cht": "後台速度重寫", "en": "Backline SPD Override", "jp": "後衛速度上書き", "kr": "후방 속도 재정의", "es": "Reemplazo de VEL trasera", "fr": "Remplacement de VIT arrière", "de": "Backline-GES-Überschreibung", "pt": "Substituição de VEL reserva", "ru": "Перезапись скорости резерва", "th": "เขียนทับความเร็วแนวหลัง", "vi": "Ghi đè tốc độ dự bị", "id": "Timpa SPD cadangan",
    },
    "cwRole.backSpeedBoost": {
        "cn": "后台速度提升", "cht": "後台速度提升", "en": "Backline SPD Boost", "jp": "後衛速度上昇", "kr": "후방 속도 증가", "es": "Aumento de VEL trasera", "fr": "Augm. VIT arrière", "de": "Backline-GES-Boost", "pt": "Aumento de VEL reserva", "ru": "Прирост скорости резерва", "th": "เพิ่มความเร็วแนวหลัง", "vi": "Tăng tốc độ dự bị", "id": "Peningkatan SPD cadangan",
    },
    "skillGroup.front": {
        "cn": "前台技能", "cht": "前台技能", "en": "On-Field Abilities", "jp": "前衛スキル", "kr": "전방 스킬", "es": "Habilidades en campo", "fr": "Compétences au front", "de": "Front-Auftritt-Fähigkeiten", "pt": "Habilidades em campo", "ru": "Навыки в поле", "th": "สกิลแนวหน้า", "vi": "Kỹ năng tiền tuyến", "id": "Skill garis depan",
    },
    "skillGroup.back": {
        "cn": "后台技能", "cht": "後台技能", "en": "Off-Field Abilities", "jp": "後衛スキル", "kr": "후방 스킬", "es": "Habilidades en reserva", "fr": "Compétences en réserve", "de": "Backline-Fähigkeiten", "pt": "Habilidades reserva", "ru": "Навыки в резерве", "th": "สกิลแนวหลัง", "vi": "Kỹ năng dự bị", "id": "Skill garis belakang",
    },
    "skillGroup.servant": {
        "cn": "随从技能", "cht": "隨從技能", "en": "Servant Abilities", "jp": "召喚物スキル", "kr": "소환물 스킬", "es": "Habilidades de sirviente", "fr": "Compétences de serviteur", "de": "Diener-Fähigkeiten", "pt": "Habilidades de servo", "ru": "Навыки слуги", "th": "สกิลผู้รับใช้", "vi": "Kỹ năng tay sai", "id": "Skill pelayan",
    },
    "cwRole.priorityFirst": {
        "cn": "首选", "cht": "首選", "en": "First choice", "jp": "第一候補", "kr": "1순위", "es": "Primera opción", "fr": "Premier choix", "de": "Erste Wahl", "pt": "Primeira escolha", "ru": "Первый выбор", "th": "ตัวเลือกแรก", "vi": "Ưu tiên đầu", "id": "Pilihan utama",
    },
    "cwRole.prioritySecond": {
        "cn": "次选", "cht": "次選", "en": "Second choice", "jp": "第二候補", "kr": "2순위", "es": "Segunda opción", "fr": "Deuxième choix", "de": "Zweite Wahl", "pt": "Segunda escolha", "ru": "Второй выбор", "th": "ตัวเลือกที่สอง", "vi": "Ưu tiên sau", "id": "Pilihan kedua",
    },
    "cwRole.sec.growth": {
        "cn": "成长总览", "cht": "成長總覽", "en": "Growth Overview", "jp": "成長概要", "kr": "성장 개요", "es": "Resumen de crecimiento", "fr": "Aperçu de progression", "de": "Wachstumsübersicht", "pt": "Visão de progresso", "ru": "Обзор роста", "th": "ภาพรวมการเติบโต", "vi": "Tổng quan tăng trưởng", "id": "Ringkasan pertumbuhan",
    },
    "cwRole.sec.cones": {
        "cn": "专属光锥", "cht": "專屬光錐", "en": "Signature Light Cones", "jp": "専用光円錐", "kr": "전용 광추", "es": "Conos de luz exclusivos", "fr": "Cônes de lumière exclusifs", "de": "Exklusive Lichtkegel", "pt": "Cones de Luz exclusivos", "ru": "Личные световые конусы", "th": "กรวยแสงเฉพาะ", "vi": "Nón Ánh Sáng riêng", "id": "Light Cone eksklusif",
    },
    "cwRole.loadingAria": {
        "cn": "角色详情加载中", "cht": "角色詳情載入中", "en": "Loading character data", "jp": "キャラ詳細を読み込み中", "kr": "캐릭터 상세 로드 중", "es": "Cargando datos del personaje", "fr": "Chargement des données", "de": "Charakterdaten werden geladen", "pt": "Carregando dados do personagem", "ru": "Загрузка данных персонажа", "th": "กำลังโหลดข้อมูลตัวละคร", "vi": "Đang tải dữ liệu nhân vật", "id": "Memuat data karakter",
    },
    "cwRole.errorTitle": {
        "cn": "角色数据加载失败", "cht": "角色資料載入失敗", "en": "Failed to load character data", "jp": "キャラデータの読み込みに失敗", "kr": "캐릭터 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Charakterdaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลตัวละครไม่สำเร็จ", "vi": "Không tải được dữ liệu nhân vật", "id": "Gagal memuat data karakter",
    },
    "cwRole.navAria": {
        "cn": "内容区块导航", "cht": "內容區塊導覽", "en": "Section navigation", "jp": "セクションナビ", "kr": "섹션 내비게이션", "es": "Navegación de secciones", "fr": "Navigation par sections", "de": "Abschnittsnavigation", "pt": "Navegação de seções", "ru": "Навигация по разделам", "th": "นำทางส่วนเนื้อหา", "vi": "Điều hướng mục", "id": "Navigasi bagian",
    },
    "cwRole.topAria": {
        "cn": "返回顶部", "cht": "返回頂部", "en": "Back to top", "jp": "トップへ戻る", "kr": "맨 위로", "es": "Volver arriba", "fr": "Retour en haut", "de": "Nach oben", "pt": "Voltar ao topo", "ru": "Наверх", "th": "กลับขึ้นด้านบน", "vi": "Về đầu trang", "id": "Kembali ke atas",
    },
    "cwRole.starSwitchAria": {
        "cn": "星级切换", "cht": "星級切換", "en": "Star switch", "jp": "星級切り替え", "kr": "성급 전환", "es": "Cambio de estrellas", "fr": "Changement d'étoiles", "de": "Stufenwechsel", "pt": "Troca de estrelas", "ru": "Переключение звёзд", "th": "สลับระดับดาว", "vi": "Chuyển mức sao", "id": "Ganti bintang",
    },
    "cwRole.descModeAria": {
        "cn": "技能描述模式", "cht": "技能描述模式", "en": "Ability description mode", "jp": "スキル説明モード", "kr": "스킬 설명 모드", "es": "Modo de descripción", "fr": "Mode de description", "de": "Fähigkeitsbeschreibung", "pt": "Modo de descrição", "ru": "Режим описания навыка", "th": "โหมดคำอธิบายสกิล", "vi": "Chế độ mô tả kỹ năng", "id": "Mode deskripsi skill",
    },
    "cwRole.simple": {
        "cn": "简略", "cht": "簡略", "en": "Brief", "jp": "簡易", "kr": "간략", "es": "Breve", "fr": "Bref", "de": "Kurz", "pt": "Breve", "ru": "Кратко", "th": "ย่อ", "vi": "Ngắn gọn", "id": "Singkat",
    },
    "cwRole.full": {
        "cn": "详细", "cht": "詳細", "en": "Full", "jp": "詳細", "kr": "상세", "es": "Completo", "fr": "Complet", "de": "Ausführlich", "pt": "Completo", "ru": "Подробно", "th": "ละเอียด", "vi": "Đầy đủ", "id": "Terperinci",
    },
    "cwRole.stance": {
        "cn": "削韧", "cht": "削韌", "en": "Toughness DMG", "jp": "靭性削り", "kr": "강인도 감소", "es": "Daño de robustez", "fr": "Dégâts de robustesse", "de": "Robustheitsschaden", "pt": "Dano de robustez", "ru": "Урон прочности", "th": "ลดความแข็งแกร่ง", "vi": "Sát thương Độ Bền", "id": "DMG Ketangguhan",
    },
    "cwRole.scopeSelf": {
        "cn": "自身", "cht": "自身", "en": "Self", "jp": "自身", "kr": "자신", "es": "Propio", "fr": "Soi-même", "de": "Selbst", "pt": "Próprio", "ru": "Себе", "th": "ตนเอง", "vi": "Bản thân", "id": "Diri sendiri",
    },
    "cwRole.scopeAll": {
        "cn": "全员", "cht": "全員", "en": "All allies", "jp": "全体", "kr": "전원", "es": "Todos", "fr": "Tous", "de": "Alle", "pt": "Todos", "ru": "Все", "th": "ทั้งหมด", "vi": "Toàn đội", "id": "Semua",
    },
    "cwRole.empty.growth": {
        "cn": "该角色没有成长数据", "cht": "該角色沒有成長資料", "en": "No growth data for this character", "jp": "成長データがありません", "kr": "성장 데이터가 없습니다", "es": "Sin datos de crecimiento", "fr": "Aucune donnée de progression", "de": "Keine Wachstumsdaten", "pt": "Sem dados de crescimento", "ru": "Нет данных о росте", "th": "ไม่มีข้อมูลการเติบโต", "vi": "Không có dữ liệu tăng trưởng", "id": "Tidak ada data pertumbuhan",
    },
    "cwRole.empty.skills": {
        "cn": "该角色没有技能数据", "cht": "該角色沒有技能資料", "en": "No ability data for this character", "jp": "スキルデータがありません", "kr": "스킬 데이터가 없습니다", "es": "Sin datos de habilidades", "fr": "Aucune donnée de compétence", "de": "Keine Fähigkeitsdaten", "pt": "Sem dados de habilidades", "ru": "Нет данных о навыках", "th": "ไม่มีข้อมูลสกิล", "vi": "Không có dữ liệu kỹ năng", "id": "Tidak ada data skill",
    },
    "cwRole.empty.ranks": {
        "cn": "该角色没有后台星魂数据", "cht": "該角色沒有後台星魂資料", "en": "No backline eidolon data", "jp": "後衛星魂データがありません", "kr": "후방 성혼 데이터가 없습니다", "es": "Sin datos de eidolones traseros", "fr": "Aucune donnée d'eidolon", "de": "Keine Backline-Eidolon-Daten", "pt": "Sem dados de eidolon reserva", "ru": "Нет данных эйдолонов резерва", "th": "ไม่มีข้อมูลอีดอลอนแนวหลัง", "vi": "Không có dữ liệu Tinh Hồn dự bị", "id": "Tidak ada data eidolon cadangan",
    },
    "cwRole.empty.cones": {
        "cn": "该角色没有专属光锥数据", "cht": "該角色沒有專屬光錐資料", "en": "No signature Light Cone data", "jp": "専用光円錐データがありません", "kr": "전용 광추 데이터가 없습니다", "es": "Sin conos de luz exclusivos", "fr": "Aucun cône exclusif", "de": "Keine exklusiven Lichtkegel", "pt": "Sem Cone de Luz exclusivo", "ru": "Нет личных световых конусов", "th": "ไม่มีกรวยแสงเฉพาะ", "vi": "Không có Nón Ánh Sáng riêng", "id": "Tidak ada Light Cone eksklusif",
    },
    "cwRole.empty.equips": {
        "cn": "该角色没有推荐装备数据", "cht": "該角色沒有推薦裝備資料", "en": "No recommended gear data", "jp": "推奨装備データがありません", "kr": "추천 장비 데이터가 없습니다", "es": "Sin equipo recomendado", "fr": "Aucun équipement recommandé", "de": "Keine empfohlene Ausrüstung", "pt": "Sem equipamento recomendado", "ru": "Нет рекомендованного снаряжения", "th": "ไม่มีข้อมูลอุปกรณ์แนะนำ", "vi": "Không có dữ liệu trang bị gợi ý", "id": "Tidak ada data peralatan rekomendasi",
    },
    "cwRole.coneHint": {
        "cn": "角色放置在后台时，拥有对应光锥可获得特殊加成。", "cht": "角色放置在後台時，擁有對應光錐可獲得特殊加成。", "en": "While on the backline, holding the matching Light Cone grants a special bonus.", "jp": "後衛時に対応する光円錐を所持すると特殊な強化を得られます。", "kr": "후방에 있을 때 해당 광추를 보유하면 특별 보너스를 얻습니다.", "es": "En reserva, con el cono de luz correspondiente obtienes una bonificación especial.", "fr": "En réserve, posséder le cône de lumière correspondant donne un bonus spécial.", "de": "In der Backline gewährt der passende Lichtkegel einen Spezialbonus.", "pt": "Na reserva, com o Cone de Luz correspondente você ganha um bônus especial.", "ru": "В резерве соответствующий световой конус даёт особый бонус.", "th": "เมื่ออยู่แนวหลัง การมีกรวยแสงที่ตรงกันจะได้โบนัสพิเศษ", "vi": "Khi ở dự bị, sở hữu Nón Ánh Sáng tương ứng sẽ nhận thêm hiệu ứng đặc biệt.", "id": "Saat di garis belakang, memiliki Light Cone yang sesuai memberi bonus khusus.",
    },
    "common.loadErrorDetail": {
        "cn": "可能是网络波动或该条目暂时不可用，重试即可恢复。", "cht": "可能是網路波動或該條目暫時無法使用，重試即可恢復。", "en": "The network may be unstable or this entry is temporarily unavailable. Retrying should fix it.", "jp": "通信状況か一時的な問題の可能性があります。再試行してください。", "kr": "네트워크 문제이거나 일시적으로 사용할 수 없습니다. 다시 시도해 주세요.", "es": "Puede ser la red o que la entrada no esté disponible. Reintenta.", "fr": "Réseau instable ou entrée indisponible. Réessayez.", "de": "Netzwerkproblem oder Eintrag vorübergehend nicht verfügbar. Bitte erneut versuchen.", "pt": "Rede instável ou entrada indisponível. Tente novamente.", "ru": "Возможны проблемы с сетью или запись недоступна. Попробуйте снова.", "th": "เครือข่ายอาจสะดุดหรือรายการใช้งานไม่ได้ชั่วคราว ลองอีกครั้ง", "vi": "Có thể do mạng hoặc mục tạm không khả dụng. Thử lại.", "id": "Mungkin jaringan atau entri tidak tersedia. Coba lagi.",
    },
    "cwRole.unlockAt": {
        "cn": "该技能于 {stars}★ 解锁", "cht": "該技能於 {stars}★ 解鎖", "en": "Unlocks at {stars}★", "jp": "{stars}★で解放", "kr": "{stars}★에 해금", "es": "Se desbloquea a {stars}★", "fr": "Débloqué à {stars}★", "de": "Ab {stars}★ freigeschaltet", "pt": "Desbloqueia em {stars}★", "ru": "Открывается на {stars}★", "th": "ปลดล็อกที่ {stars}★", "vi": "Mở khóa ở {stars}★", "id": "Terbuka di {stars}★",
    },
    "cwRole.recFor": {
        "cn": "{pos}推荐", "cht": "{pos}推薦", "en": "{pos} picks", "jp": "{pos}おすすめ", "kr": "{pos} 추천", "es": "Recomendado: {pos}", "fr": "Recommandé : {pos}", "de": "{pos}-Empfehlung", "pt": "Recomendado: {pos}", "ru": "Рекомендации: {pos}", "th": "แนะนำ {pos}", "vi": "Gợi ý {pos}", "id": "Rekomendasi {pos}",
    },
    "cwRole.season": {
        "cn": "赛季 {list}", "cht": "賽季 {list}", "en": "Season {list}", "jp": "シーズン {list}", "kr": "시즌 {list}", "es": "Temporada {list}", "fr": "Saison {list}", "de": "Saison {list}", "pt": "Temporada {list}", "ru": "Сезон {list}", "th": "ซีซัน {list}", "vi": "Mùa {list}", "id": "Musim {list}",
    },
    "vor.sec.overview": {
        "cn": "玩法概览", "cht": "玩法概覽", "en": "Gameplay Overview", "jp": "玩法概要", "kr": "플레이 개요", "es": "Resumen de juego", "fr": "Aperçu du mode", "de": "Spielübersicht", "pt": "Visão do modo", "ru": "Обзор режима", "th": "ภาพรวมโหมด", "vi": "Tổng quan lối chơi", "id": "Ringkasan mode",
    },
    "vor.sec.scores": {
        "cn": "污染等级与愿力", "cht": "污染等級與願力", "en": "Corruption Level & Will", "jp": "汚染レベルと願力", "kr": "오염 등급과 원력", "es": "Nivel de corrupción y voluntad", "fr": "Niveau de corruption et volonté", "de": "Korruptionsstufe & Wille", "pt": "Nível de corrupção e vontade", "ru": "Уровень заражения и воля", "th": "ระดับกัดกร่อนและพลังจิต", "vi": "Cấp ăn mòn & Ý chí", "id": "Tingkat korupsi & Will",
    },
    "vor.sec.stages": {
        "cn": "波及关卡", "cht": "波及關卡", "en": "Affected Stages", "jp": "影響ステージ", "kr": "영향 스테이지", "es": "Etapas afectadas", "fr": "Étapes touchées", "de": "Betroffene Stufen", "pt": "Estágios afetados", "ru": "Затронутые этапы", "th": "ด่านที่ได้รับผล", "vi": "Màn bị ảnh hưởng", "id": "Stage terdampak",
    },
    "vor.sec.statuses": {
        "cn": "状态词条", "cht": "狀態詞條", "en": "Status Effects", "jp": "状態効果", "kr": "상태 효과", "es": "Estados", "fr": "Effets de statut", "de": "Statuseffekte", "pt": "Efeitos de status", "ru": "Эффекты состояния", "th": "เอฟเฟกต์สถานะ", "vi": "Hiệu ứng trạng thái", "id": "Efek status",
    },
    "vor.sec.tutorials": {
        "cn": "教程图文", "cht": "教程圖文", "en": "Tutorial", "jp": "チュートリアル", "kr": "튜토리얼", "es": "Tutorial", "fr": "Tutoriel", "de": "Tutorial", "pt": "Tutorial", "ru": "Обучение", "th": "บทช่วยสอน", "vi": "Hướng dẫn", "id": "Tutorial",
    },
    "vor.sec.affixes": {
        "cn": "位面词条", "cht": "位面詞條", "en": "Plane Affixes", "jp": "次元アフィックス", "kr": "차원 어픽스", "es": "Afijos de plano", "fr": "Affixes de plan", "de": "Ebenen-Affixe", "pt": "Afixos de plano", "ru": "Аффиксы плана", "th": "คำเสริมระนาบ", "vi": "Chỉ số mặt phẳng", "id": "Afiks bidang",
    },
    "vor.sec.disambig": {
        "cn": "同形词说明", "cht": "同形詞說明", "en": "Homonym Note", "jp": "同形語の注記", "kr": "동형어 설명", "es": "Nota sobre homónimos", "fr": "Note sur les homonymes", "de": "Homonym-Hinweis", "pt": "Nota sobre homônimos", "ru": "Примечание об омонимах", "th": "หมายเหตุคำพ้องรูป", "vi": "Ghi chú từ đồng dạng", "id": "Catatan homonim",
    },
    "vor.loadingAria": {
        "cn": "贪饕污染数据加载中", "cht": "貪食污染資料載入中", "en": "Loading corruption data", "jp": "汚染データを読み込み中", "kr": "오염 데이터 로드 중", "es": "Cargando datos de corrupción", "fr": "Chargement des données", "de": "Korruptionsdaten werden geladen", "pt": "Carregando dados de corrupção", "ru": "Загрузка данных о заражении", "th": "กำลังโหลดข้อมูลการกัดกร่อน", "vi": "Đang tải dữ liệu ăn mòn", "id": "Memuat data korupsi",
    },
    "vor.errorTitle": {
        "cn": "贪饕污染数据加载失败", "cht": "貪食污染資料載入失敗", "en": "Failed to load corruption data", "jp": "汚染データの読み込みに失敗", "kr": "오염 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Korruptionsdaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลการกัดกร่อนไม่สำเร็จ", "vi": "Không tải được dữ liệu ăn mòn", "id": "Gagal memuat data korupsi",
    },
    "vor.field.actId": {
        "cn": "活动编号", "cht": "活動編號", "en": "Event ID", "jp": "イベント番号", "kr": "이벤트 번호", "es": "ID del evento", "fr": "ID de l'événement", "de": "Event-ID", "pt": "ID do evento", "ru": "ID события", "th": "รหัสอีเวนต์", "vi": "Mã sự kiện", "id": "ID event",
    },
    "vor.field.unlockQuest": {
        "cn": "解锁任务", "cht": "解鎖任務", "en": "Unlock Quest", "jp": "解放クエスト", "kr": "해금 퀘스트", "es": "Misión de desbloqueo", "fr": "Quête de déblocage", "de": "Freischaltungsquest", "pt": "Missão de desbloqueio", "ru": "Квест открытия", "th": "เควสปลดล็อก", "vi": "Nhiệm vụ mở khóa", "id": "Misi buka",
    },
    "vor.willTier": {
        "cn": "愿力档位", "cht": "願力檔位", "en": "Will Tier", "jp": "願力ティア", "kr": "원력 단계", "es": "Nivel de voluntad", "fr": "Palier de volonté", "de": "Will-Stufe", "pt": "Nível de vontade", "ru": "Уровень воли", "th": "ระดับพลังจิต", "vi": "Bậc Ý chí", "id": "Tingkat Will",
    },
    "vor.enemyBoost": {
        "cn": "敌方强化", "cht": "敵方強化", "en": "Enemy Buffs", "jp": "敵強化", "kr": "적 강화", "es": "Mejoras enemigas", "fr": "Améliorations ennemies", "de": "Gegnerverstärkung", "pt": "Melhorias inimigas", "ru": "Усиления врагов", "th": "เสริมศัตรู", "vi": "Cường hóa kẻ địch", "id": "Penguatan musuh",
    },
    "vor.playerSupport": {
        "cn": "玩家支援", "cht": "玩家支援", "en": "Player Support", "jp": "プレイヤー支援", "kr": "플레이어 지원", "es": "Apoyo al jugador", "fr": "Soutien au joueur", "de": "Spieler-Unterstützung", "pt": "Apoio ao jogador", "ru": "Поддержка игрока", "th": "สนับสนุนผู้เล่น", "vi": "Hỗ trợ người chơi", "id": "Dukungan pemain",
    },
    "vor.willProgress": {
        "cn": "愿力进度", "cht": "願力進度", "en": "Will Progress", "jp": "願力進捗", "kr": "원력 진행도", "es": "Progreso de voluntad", "fr": "Progression de volonté", "de": "Will-Fortschritt", "pt": "Progresso de vontade", "ru": "Прогресс воли", "th": "ความคืบหน้าพลังจิต", "vi": "Tiến độ Ý chí", "id": "Progres Will",
    },
    "vor.noDispel": {
        "cn": "不可驱散", "cht": "不可驅散", "en": "Not dispellable", "jp": "解除不可", "kr": "해제 불가", "es": "No disipable", "fr": "Non dissipable", "de": "Nicht bannbar", "pt": "Não dispensável", "ru": "Не снимается", "th": "ลบไม่ได้", "vi": "Không thể giải", "id": "Tidak dapat dihapus",
    },
    "egm.stat.floors": {
        "cn": "关卡层级", "cht": "關卡層級", "en": "Stage tiers", "jp": "ステージ階層", "kr": "스테이지 층", "es": "Niveles de etapa", "fr": "Paliers d'étape", "de": "Stufenebenen", "pt": "Níveis de estágio", "ru": "Уровни этапов", "th": "ชั้นด่าน", "vi": "Tầng màn", "id": "Tingkat stage",
    },
    "egm.stat.halfs": {
        "cn": "每层场次", "cht": "每層場次", "en": "Rounds per tier", "jp": "階層ごとの回数", "kr": "층당 판수", "es": "Rondas por nivel", "fr": "Manches par palier", "de": "Runden pro Ebene", "pt": "Rodadas por nível", "ru": "Раундов на уровень", "th": "รอบต่อชั้น", "vi": "Lượt mỗi tầng", "id": "Ronde per tingkat",
    },
    "egm.stat.levels": {
        "cn": "关卡组成", "cht": "關卡組成", "en": "Stage composition", "jp": "ステージ構成", "kr": "스테이지 구성", "es": "Composición de etapas", "fr": "Composition des étapes", "de": "Stufenzusammensetzung", "pt": "Composição de estágios", "ru": "Состав этапов", "th": "องค์ประกอบด่าน", "vi": "Thành phần màn", "id": "Komposisi stage",
    },
    "egm.stat.knights": {
        "cn": "骑士试炼", "cht": "騎士試煉", "en": "Knight Trials", "jp": "騎士試練", "kr": "기사 시련", "es": "Pruebas de caballeros", "fr": "Épreuves de chevaliers", "de": "Ritterprüfungen", "pt": "Provas de cavaleiros", "ru": "Испытания рыцарей", "th": "บททดสอบอัศวิน", "vi": "Thử thách kỵ sĩ", "id": "Ujian ksatria",
    },
    "egm.stat.kings": {
        "cn": "王棋关卡", "cht": "王棋關卡", "en": "King Chess stages", "jp": "王棋ステージ", "kr": "왕기 스테이지", "es": "Etapas de rey", "fr": "Étapes du roi", "de": "Königsschach-Stufen", "pt": "Estágios de rei", "ru": "Этапы короля", "th": "ด่านหมากรุกราชา", "vi": "Màn vua cờ", "id": "Stage raja catur",
    },
    "egm.stat.targets": {
        "cn": "设挑战目标", "cht": "設挑戰目標", "en": "With challenge goals", "jp": "挑戦目標あり", "kr": "도전 목표 있음", "es": "Con objetivos", "fr": "Avec objectifs", "de": "Mit Zielen", "pt": "Com objetivos", "ru": "С целями", "th": "มีเป้าหมาย", "vi": "Có mục tiêu", "id": "Dengan target",
    },
    "egm.stat.countdown": {
        "cn": "回合上限", "cht": "回合上限", "en": "Turn limit", "jp": "ターン上限", "kr": "턴 제한", "es": "Límite de turnos", "fr": "Limite de tours", "de": "Zuglimit", "pt": "Limite de turnos", "ru": "Лимит ходов", "th": "จำกัดเทิร์น", "vi": "Giới hạn lượt", "id": "Batas giliran",
    },
    "egm.stat.scoreCap": {
        "cn": "分数上限", "cht": "分數上限", "en": "Score cap", "jp": "スコア上限", "kr": "점수 상한", "es": "Tope de puntuación", "fr": "Score maximal", "de": "Punkteobergrenze", "pt": "Teto de pontuação", "ru": "Предел очков", "th": "คะแนนสูงสุด", "vi": "Điểm tối đa", "id": "Batas skor",
    },
    "egm.value.tierceOn": {
        "cn": "含", "cht": "含", "en": "Yes", "jp": "あり", "kr": "포함", "es": "Sí", "fr": "Oui", "de": "Ja", "pt": "Sim", "ru": "Есть", "th": "มี", "vi": "Có", "id": "Ya",
    },
    "egm.value.tierceOff": {
        "cn": "不含", "cht": "不含", "en": "No", "jp": "なし", "kr": "미포함", "es": "No", "fr": "Non", "de": "Nein", "pt": "Não", "ru": "Нет", "th": "ไม่มี", "vi": "Không", "id": "Tidak",
    },
    "egm.sec.structure": {
        "cn": "结构口径", "cht": "結構口徑", "en": "Structure", "jp": "構成基準", "kr": "구조 기준", "es": "Estructura", "fr": "Structure", "de": "Struktur", "pt": "Estrutura", "ru": "Структура", "th": "โครงสร้าง", "vi": "Cấu trúc", "id": "Struktur",
    },
    "egm.sec.buffs": {
        "cn": "赛季增益", "cht": "賽季增益", "en": "Season Buffs", "jp": "シーズンバフ", "kr": "시즌 버프", "es": "Mejoras de temporada", "fr": "Bonus de saison", "de": "Saisonboni", "pt": "Bônus de temporada", "ru": "Бонусы сезона", "th": "บัฟซีซัน", "vi": "Buff mùa", "id": "Buff musim",
    },
    "egm.sec.seasons": {
        "cn": "赛季列表", "cht": "賽季列表", "en": "Seasons", "jp": "シーズン一覧", "kr": "시즌 목록", "es": "Temporadas", "fr": "Saisons", "de": "Saisons", "pt": "Temporadas", "ru": "Сезоны", "th": "รายการซีซัน", "vi": "Danh sách mùa", "id": "Daftar musim",
    },
    "egm.note": {
        "cn": "以当期赛季为准（层数与场次历史上变动过，故不取多季统计值）", "cht": "以當期賽季為準（層數與場次歷史上變動過，故不取多季統計值）", "en": "Based on the current season (tier and round counts have changed historically, so multi-season figures are not used)", "jp": "当期シーズンを基準（階層数と回数は過去に変動したため、複数シーズンの統計値は使用しません）", "kr": "현재 시즌 기준(층수와 판수는 과거에 변동되었으므로 다중 시즌 통계값은 사용하지 않습니다)", "es": "Según la temporada actual (los niveles y rondas han cambiado, así que no se usan cifras de varias temporadas)", "fr": "D'après la saison en cours (les paliers et manches ont varié, donc pas de statistiques multi-saisons)", "de": "Nach aktueller Saison (Ebenen- und Rundenzahlen änderten sich, daher keine Mehrsaisonwerte)", "pt": "Com base na temporada atual (níveis e rodadas mudaram, então não se usam dados de várias temporadas)", "ru": "По текущему сезону (число уровней и раундов менялось, поэтому данные за несколько сезонов не используются)", "th": "อ้างอิงซีซันปัจจุบัน (จำนวนชั้นและรอบเคยเปลี่ยน จึงไม่ใช้ค่าสถิติหลายซีซัน)", "vi": "Theo mùa hiện tại (số tầng và lượt từng thay đổi nên không dùng số liệu nhiều mùa)", "id": "Berdasarkan musim saat ini (jumlah tingkat dan ronde pernah berubah, jadi tidak memakai angka lintas musim)",
    },
    "egm.currentSeason": {
        "cn": "当期赛季", "cht": "當期賽季", "en": "Current season", "jp": "当期シーズン", "kr": "현재 시즌", "es": "Temporada actual", "fr": "Saison en cours", "de": "Aktuelle Saison", "pt": "Temporada atual", "ru": "Текущий сезон", "th": "ซีซันปัจจุบัน", "vi": "Mùa hiện tại", "id": "Musim saat ini",
    },
    "egm.latestSeason": {
        "cn": "最新赛季", "cht": "最新賽季", "en": "Latest season", "jp": "最新シーズン", "kr": "최신 시즌", "es": "Última temporada", "fr": "Dernière saison", "de": "Neueste Saison", "pt": "Última temporada", "ru": "Последний сезон", "th": "ซีซันล่าสุด", "vi": "Mùa mới nhất", "id": "Musim terbaru",
    },
    "egm.whichCurrent": {
        "cn": "当期", "cht": "當期", "en": "current", "jp": "当期", "kr": "현재", "es": "actual", "fr": "en cours", "de": "aktuelle", "pt": "atual", "ru": "текущий", "th": "ปัจจุบัน", "vi": "hiện tại", "id": "saat ini",
    },
    "egm.buffCount": {
        "cn": "每期 {n} 条", "cht": "每期 {n} 條", "en": "{n} per season", "jp": "毎期 {n} 件", "kr": "매 시즌 {n}개", "es": "{n} por temporada", "fr": "{n} par saison", "de": "{n} pro Saison", "pt": "{n} por temporada", "ru": "{n} за сезон", "th": "{n} ต่อซีซัน", "vi": "{n} mỗi mùa", "id": "{n} per musim",
    },
    "egm.viewSeasonBuffs": {
        "cn": "查看{which}赛季（{name}）的增益", "cht": "查看{which}賽季（{name}）的增益", "en": "View {which} season ({name}) buffs", "jp": "{which}シーズン（{name}）のバフを見る", "kr": "{which} 시즌({name}) 버프 보기", "es": "Ver mejoras de la temporada {which} ({name})", "fr": "Voir les bonus de la saison {which} ({name})", "de": "Boni der Saison {which} ({name}) ansehen", "pt": "Ver bônus da temporada {which} ({name})", "ru": "Бонусы сезона {which} ({name})", "th": "ดูบัฟซีซัน{which} ({name})", "vi": "Xem buff mùa {which} ({name})", "id": "Lihat buff musim {which} ({name})",
    },
    "egm.crumbsAria": {
        "cn": "面包屑", "cht": "麵包屑", "en": "Breadcrumb", "jp": "パンくず", "kr": "이동 경로", "es": "Ruta de navegación", "fr": "Fil d'Ariane", "de": "Brotkrumen", "pt": "Navegação", "ru": "Хлебные крошки", "th": "เส้นทางนำทาง", "vi": "Đường dẫn", "id": "Remah roti",
    },
    "egm.othersAria": {
        "cn": "其它玩法", "cht": "其它玩法", "en": "Other modes", "jp": "その他のモード", "kr": "기타 모드", "es": "Otros modos", "fr": "Autres modes", "de": "Andere Modi", "pt": "Outros modos", "ru": "Другие режимы", "th": "โหมดอื่น", "vi": "Chế độ khác", "id": "Mode lain",
    },
    "egm.errorTitle": {
        "cn": "玩法说明加载失败", "cht": "玩法說明載入失敗", "en": "Failed to load mode guide", "jp": "モード説明の読み込みに失敗", "kr": "모드 설명 로드 실패", "es": "No se pudo cargar la guía", "fr": "Échec du chargement de la description", "de": "Modusbeschreibung konnte nicht geladen werden", "pt": "Falha ao carregar o guia", "ru": "Не удалось загрузить описание", "th": "โหลดคำอธิบายโหมดไม่สำเร็จ", "vi": "Không tải được mô tả chế độ", "id": "Gagal memuat panduan mode",
    },
    "common.param": {
        "cn": "参数", "cht": "參數", "en": "Params", "jp": "パラメータ", "kr": "파라미터", "es": "Parámetros", "fr": "Paramètres", "de": "Parameter", "pt": "Parâmetros", "ru": "Параметры", "th": "พารามิเตอร์", "vi": "Tham số", "id": "Parameter",
    },
    "vor.invasionLevel": {
        "cn": "污染等级 {n}", "cht": "污染等級 {n}", "en": "Corruption Level {n}", "jp": "汚染レベル {n}", "kr": "오염 등급 {n}", "es": "Nivel de corrupción {n}", "fr": "Niveau de corruption {n}", "de": "Korruptionsstufe {n}", "pt": "Nível de corrupção {n}", "ru": "Уровень заражения {n}", "th": "ระดับกัดกร่อน {n}", "vi": "Cấp ăn mòn {n}", "id": "Tingkat korupsi {n}",
    },
    "vor.stageCount": {
        "cn": "{n} 关", "cht": "{n} 關", "en": "{n} stage | {n} stages", "jp": "{n} ステージ", "kr": "{n}개 스테이지", "es": "{n} etapa | {n} etapas", "fr": "{n} étape | {n} étapes", "de": "{n} Stufe | {n} Stufen", "pt": "{n} estágio | {n} estágios", "ru": "{n} этап | {n} этапов", "th": "{n} ด่าน", "vi": "{n} màn", "id": "{n} stage",
    },
    "egm.value.floors": {
        "cn": "{n} 层", "cht": "{n} 層", "en": "{n} tier | {n} tiers", "jp": "{n} 階層", "kr": "{n}층", "es": "{n} nivel | {n} niveles", "fr": "{n} palier | {n} paliers", "de": "{n} Ebene | {n} Ebenen", "pt": "{n} nível | {n} níveis", "ru": "{n} уровень | {n} уровней", "th": "{n} ชั้น", "vi": "{n} tầng", "id": "{n} tingkat",
    },
    "egm.value.halfs": {
        "cn": "{n} 场", "cht": "{n} 場", "en": "{n} round | {n} rounds", "jp": "{n} 回", "kr": "{n}판", "es": "{n} ronda | {n} rondas", "fr": "{n} manche | {n} manches", "de": "{n} Runde | {n} Runden", "pt": "{n} rodada | {n} rodadas", "ru": "{n} раунд | {n} раундов", "th": "{n} รอบ", "vi": "{n} lượt", "id": "{n} ronde",
    },
    "egm.value.countdown": {
        "cn": "{n} 轮", "cht": "{n} 輪", "en": "{n} turn | {n} turns", "jp": "{n} ターン", "kr": "{n}턴", "es": "{n} turno | {n} turnos", "fr": "{n} tour | {n} tours", "de": "{n} Zug | {n} Züge", "pt": "{n} turno | {n} turnos", "ru": "{n} ход | {n} ходов", "th": "{n} เทิร์น", "vi": "{n} lượt", "id": "{n} giliran",
    },
    "egm.unknownMode": {
        "cn": "未知的终局玩法: {key}", "cht": "未知的終局玩法: {key}", "en": "Unknown endgame mode: {key}", "jp": "不明な終局モード: {key}", "kr": "알 수 없는 종국 모드: {key}", "es": "Modo desconocido: {key}", "fr": "Mode inconnu : {key}", "de": "Unbekannter Modus: {key}", "pt": "Modo desconhecido: {key}", "ru": "Неизвестный режим: {key}", "th": "โหมดไม่รู้จัก: {key}", "vi": "Chế độ không xác định: {key}", "id": "Mode tidak dikenal: {key}",
    },
    "egm.latestSeasonWith": {
        "cn": "最新赛季（{status}）", "cht": "最新賽季（{status}）", "en": "Latest season ({status})", "jp": "最新シーズン（{status}）", "kr": "최신 시즌({status})", "es": "Última temporada ({status})", "fr": "Dernière saison ({status})", "de": "Neueste Saison ({status})", "pt": "Última temporada ({status})", "ru": "Последний сезон ({status})", "th": "ซีซันล่าสุด ({status})", "vi": "Mùa mới nhất ({status})", "id": "Musim terbaru ({status})",
    },
    "vor.sec.stagesFull": {
        "cn": "波及关卡与被污染怪物", "cht": "波及關卡與被污染怪物", "en": "Affected Stages & Corrupted Monsters", "jp": "影響ステージと汚染モンスター", "kr": "영향 스테이지와 오염 몬스터", "es": "Etapas afectadas y monstruos corrompidos", "fr": "Étapes touchées et monstres corrompus", "de": "Betroffene Stufen & korrumpierte Gegner", "pt": "Estágios afetados e monstros corrompidos", "ru": "Затронутые этапы и заражённые монстры", "th": "ด่านที่ได้รับผลและมอนสเตอร์ปนเปื้อน", "vi": "Màn bị ảnh hưởng & quái nhiễm", "id": "Stage terdampak & monster terkontaminasi",
    },
    "vor.sec.affixesFull": {
        "cn": "货币战争位面词条", "cht": "貨幣戰爭位面詞條", "en": "Currency Wars Plane Affixes", "jp": "貨幣戦争次元アフィックス", "kr": "화폐 전쟁 차원 어픽스", "es": "Afijos de plano de Currency Wars", "fr": "Affixes de plan de Currency Wars", "de": "Currency-Wars-Ebenen-Affixe", "pt": "Afixos de plano de Currency Wars", "ru": "Аффиксы плана Currency Wars", "th": "คำเสริมระนาบ Currency Wars", "vi": "Chỉ số mặt phẳng Currency Wars", "id": "Afiks bidang Currency Wars",
    },
    "vor.sec.disambigFull": {
        "cn": "「污染」同形词说明", "cht": "「污染」同形詞說明", "en": "Note on the Homonym “Corruption”", "jp": "「汚染」同形語の注記", "kr": "「오염」동형어 설명", "es": "Nota sobre el homónimo «corrupción»", "fr": "Note sur l'homonyme « corruption »", "de": "Hinweis zum Homonym „Korruption“", "pt": "Nota sobre o homônimo “corrupção”", "ru": "Примечание об омониме «заражение»", "th": "หมายเหตุคำพ้องรูป “การกัดกร่อน”", "vi": "Ghi chú từ đồng dạng “ăn mòn”", "id": "Catatan homonim “korupsi”",
    },
    "lc.loadingAria": {
        "cn": "光锥详情加载中", "cht": "光錐詳情載入中", "en": "Loading Light Cone data", "jp": "光円錐詳細を読み込み中", "kr": "광추 상세 로드 중", "es": "Cargando datos del cono de luz", "fr": "Chargement du cône de lumière", "de": "Lichtkegeldaten werden geladen", "pt": "Carregando dados do Cone de Luz", "ru": "Загрузка светового конуса", "th": "กำลังโหลดข้อมูลกรวยแสง", "vi": "Đang tải dữ liệu Nón Ánh Sáng", "id": "Memuat data Light Cone",
    },
    "lc.errorTitle": {
        "cn": "光锥数据加载失败", "cht": "光錐資料載入失敗", "en": "Failed to load Light Cone data", "jp": "光円錐データの読み込みに失敗", "kr": "광추 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Lichtkegeldaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลกรวยแสงไม่สำเร็จ", "vi": "Không tải được dữ liệu Nón Ánh Sáng", "id": "Gagal memuat data Light Cone",
    },
    "lc.maxStats": {
        "cn": "满级属性", "cht": "滿級屬性", "en": "Max-level stats", "jp": "最大レベルステータス", "kr": "최대 레벨 스탯", "es": "Atributos al máximo", "fr": "Stats au niveau max", "de": "Werte auf Maximalstufe", "pt": "Atributos no nível máximo", "ru": "Характеристики на макс. уровне", "th": "ค่าสถานะเลเวลสูงสุด", "vi": "Chỉ số cấp tối đa", "id": "Stat level maks",
    },
    "lc.sec.story": {
        "cn": "卡面", "cht": "卡面", "en": "Card art", "jp": "カード絵", "kr": "카드 일러스트", "es": "Ilustración de carta", "fr": "Illustration de carte", "de": "Kartenbild", "pt": "Arte da carta", "ru": "Иллюстрация карты", "th": "ภาพการ์ด", "vi": "Hình thẻ", "id": "Gambar kartu",
    },
    "lc.superimposeAria": {
        "cn": "叠影等级", "cht": "疊影等級", "en": "Superimposition level", "jp": "重畳レベル", "kr": "중첩 등급", "es": "Nivel de superposición", "fr": "Niveau de superposition", "de": "Überlagerungsstufe", "pt": "Nível de sobreposição", "ru": "Уровень наложения", "th": "ระดับซ้อนทับ", "vi": "Cấp chồng lớp", "id": "Tingkat tumpang tindih",
    },
    "lc.noAscendMaterial": {
        "cn": "无晋阶材料", "cht": "無晉階材料", "en": "No ascension materials", "jp": "昇格素材なし", "kr": "승급 재료 없음", "es": "Sin materiales de ascensión", "fr": "Aucun matériau d'ascension", "de": "Keine Aufstiegsmaterialien", "pt": "Sem materiais de ascensão", "ru": "Нет материалов возвышения", "th": "ไม่มีวัสดุฝึกฝน", "vi": "Không có nguyên liệu đột phá", "id": "Tanpa material ascension",
    },
    "lc.superimpose": {
        "cn": "叠影 {n}", "cht": "疊影 {n}", "en": "Superimposition {n}", "jp": "重畳 {n}", "kr": "중첩 {n}", "es": "Superposición {n}", "fr": "Superposition {n}", "de": "Überlagerung {n}", "pt": "Sobreposição {n}", "ru": "Наложение {n}", "th": "ซ้อนทับ {n}", "vi": "Chồng lớp {n}", "id": "Tumpang tindih {n}",
    },
    "lc.phase": {
        "cn": "晋阶 {n}", "cht": "晉階 {n}", "en": "Ascension {n}", "jp": "昇格 {n}", "kr": "승급 {n}", "es": "Ascensión {n}", "fr": "Ascension {n}", "de": "Aufstieg {n}", "pt": "Ascensão {n}", "ru": "Возвышение {n}", "th": "ฝึกฝน {n}", "vi": "Đột phá {n}", "id": "Ascension {n}",
    },
    "home.releaseTitle": {
        "cn": "{version} 版本上新", "cht": "{version} 版本上新", "en": "{version} version update", "jp": "{version} バージョン更新", "kr": "{version} 버전 업데이트", "es": "Novedades de la versión {version}", "fr": "Nouveautés de la version {version}", "de": "Neuerungen in Version {version}", "pt": "Novidades da versão {version}", "ru": "Новое в версии {version}", "th": "อัปเดตเวอร์ชัน {version}", "vi": "Cập nhật phiên bản {version}", "id": "Pembaruan versi {version}",
    },
    "home.releaseTitleNoVersion": {
        "cn": "版本上新", "cht": "版本上新", "en": "Version update", "jp": "バージョン更新", "kr": "버전 업데이트", "es": "Novedades de versión", "fr": "Nouveautés de version", "de": "Versionsneuerungen", "pt": "Novidades da versão", "ru": "Новое в версии", "th": "อัปเดตเวอร์ชัน", "vi": "Cập nhật phiên bản", "id": "Pembaruan versi",
    },
    "home.tagline": {
        "cn": "角色 · 光锥 · 遗器，全图鉴数据", "cht": "角色 · 光錐 · 遺器，全圖鑑資料", "en": "Characters · Light Cones · Relics, full data", "jp": "キャラ · 光円錐 · 遺物の全図鑑データ", "kr": "캐릭터 · 광추 · 유물 전체 도감 데이터", "es": "Personajes · Conos de luz · Reliquias, datos completos", "fr": "Personnages · Cônes · Reliques, données complètes", "de": "Charaktere · Lichtkegel · Relikte, alle Daten", "pt": "Personagens · Cones de Luz · Relíquias, dados completos", "ru": "Персонажи · Световые конусы · Реликвии, все данные", "th": "ตัวละคร · กรวยแสง · รีลิก ข้อมูลครบ", "vi": "Nhân vật · Nón Ánh Sáng · Di Vật, đầy đủ dữ liệu", "id": "Karakter · Light Cone · Relic, data lengkap",
    },
    "home.editionAria": {
        "cn": "角色、光锥与遗器", "cht": "角色、光錐與遺器", "en": "Characters, Light Cones and Relics", "jp": "キャラ、光円錐、遺物", "kr": "캐릭터, 광추, 유물", "es": "Personajes, conos de luz y reliquias", "fr": "Personnages, cônes et reliques", "de": "Charaktere, Lichtkegel und Relikte", "pt": "Personagens, Cones e Relíquias", "ru": "Персонажи, световые конусы и реликвии", "th": "ตัวละคร กรวยแสง และรีลิก", "vi": "Nhân vật, Nón Ánh Sáng và Di Vật", "id": "Karakter, Light Cone, dan Relic",
    },
    "home.loadingAria": {
        "cn": "版本上新加载中", "cht": "版本上新載入中", "en": "Loading version update", "jp": "バージョン更新を読み込み中", "kr": "버전 업데이트 로드 중", "es": "Cargando novedades", "fr": "Chargement des nouveautés", "de": "Versionsneuerungen werden geladen", "pt": "Carregando novidades", "ru": "Загрузка новостей версии", "th": "กำลังโหลดอัปเดตเวอร์ชัน", "vi": "Đang tải cập nhật", "id": "Memuat pembaruan versi",
    },
    "home.errorTitle": {
        "cn": "版本索引加载失败", "cht": "版本索引載入失敗", "en": "Failed to load version index", "jp": "バージョン索引の読み込みに失敗", "kr": "버전 색인 로드 실패", "es": "No se pudo cargar el índice", "fr": "Échec du chargement de l'index", "de": "Versionsindex konnte nicht geladen werden", "pt": "Falha ao carregar o índice", "ru": "Не удалось загрузить индекс", "th": "โหลดดัชนีเวอร์ชันไม่สำเร็จ", "vi": "Không tải được chỉ mục", "id": "Gagal memuat indeks versi",
    },
    "home.errorDetail": {
        "cn": "{labels}三类索引都没取到，无法判定本版本新增，重试即可恢复。", "cht": "{labels}三類索引都沒取到，無法判定本版本新增，重試即可恢復。", "en": "None of the {labels} indexes loaded, so this version's additions cannot be determined. Retrying should fix it.", "jp": "{labels}の索引が取得できず、今回の追加内容を判定できません。再試行してください。", "kr": "{labels} 색인을 가져오지 못해 이번 버전 추가 항목을 판단할 수 없습니다. 다시 시도해 주세요.", "es": "No se cargó ningún índice de {labels}, así que no se pueden determinar las novedades. Reintenta.", "fr": "Aucun index {labels} chargé, impossible de déterminer les ajouts. Réessayez.", "de": "Keine {labels}-Indizes geladen, Neuerungen nicht bestimmbar. Bitte erneut versuchen.", "pt": "Nenhum índice de {labels} carregado, não é possível determinar as novidades. Tente novamente.", "ru": "Индексы {labels} не загрузились, новое в версии определить нельзя. Попробуйте снова.", "th": "โหลดดัชนี {labels} ไม่ได้ จึงระบุของใหม่ไม่ได้ ลองอีกครั้ง", "vi": "Không tải được chỉ mục {labels}, không xác định được nội dung mới. Thử lại.", "id": "Indeks {labels} gagal dimuat, isi baru tidak dapat ditentukan. Coba lagi.",
    },
    "home.partialDetail": {
        "cn": "有 {n} 类索引未取到，本次未包含其分区。", "cht": "有 {n} 類索引未取到，本次未包含其分區。", "en": "{n} index type(s) failed to load; their sections are omitted.", "jp": "{n} 種類の索引を取得できず、その区画は含まれていません。", "kr": "{n}개 색인을 가져오지 못해 해당 구역은 제외되었습니다.", "es": "No se cargaron {n} tipos de índice; sus secciones se omiten.", "fr": "{n} types d'index non chargés ; leurs sections sont omises.", "de": "{n} Indextypen nicht geladen; deren Abschnitte fehlen.", "pt": "{n} tipos de índice não carregados; suas seções foram omitidas.", "ru": "{n} типов индексов не загружено; их разделы пропущены.", "th": "โหลดดัชนี {n} ประเภทไม่ได้ จึงไม่แสดงส่วนนั้น", "vi": "Không tải được {n} loại chỉ mục; phần tương ứng bị bỏ.", "id": "{n} jenis indeks gagal dimuat; bagiannya tidak ditampilkan.",
    },
    "home.viewAll": {
        "cn": "全部{label}", "cht": "全部{label}", "en": "All {label}", "jp": "すべての{label}", "kr": "전체 {label}", "es": "Ver todo: {label}", "fr": "Tout : {label}", "de": "Alle {label}", "pt": "Ver tudo: {label}", "ru": "Все {label}", "th": "ทั้งหมด {label}", "vi": "Tất cả {label}", "id": "Semua {label}",
    },
    "home.viewArchive": {
        "cn": "查看档案", "cht": "查看檔案", "en": "View archive", "jp": "アーカイブを見る", "kr": "기록 보기", "es": "Ver archivo", "fr": "Voir l'archive", "de": "Archiv ansehen", "pt": "Ver arquivo", "ru": "Смотреть архив", "th": "ดูคลังข้อมูล", "vi": "Xem hồ sơ", "id": "Lihat arsip",
    },
    "home.empty": {
        "cn": "本版本暂无新增条目", "cht": "本版本暫無新增條目", "en": "No new entries in this version", "jp": "このバージョンの追加項目はありません", "kr": "이번 버전 추가 항목이 없습니다", "es": "Sin entradas nuevas en esta versión", "fr": "Aucune nouvelle entrée dans cette version", "de": "Keine neuen Einträge in dieser Version", "pt": "Sem entradas novas nesta versão", "ru": "В этой версии новых записей нет", "th": "ไม่มีรายการใหม่ในเวอร์ชันนี้", "vi": "Không có mục mới trong phiên bản này", "id": "Tidak ada entri baru di versi ini",
    },
    "char.sec.talents": {
        "cn": "附加", "cht": "附加", "en": "Talents", "jp": "追加", "kr": "부가", "es": "Talentos", "fr": "Talents", "de": "Talente", "pt": "Talentos", "ru": "Таланты", "th": "ความสามารถเสริม", "vi": "Thiên phú", "id": "Bakat",
    },
    "char.sec.bonuses": {
        "cn": "加成", "cht": "加成", "en": "Bonuses", "jp": "強化", "kr": "보너스", "es": "Bonificaciones", "fr": "Bonus", "de": "Boni", "pt": "Bônus", "ru": "Бонусы", "th": "โบนัส", "vi": "Cộng thêm", "id": "Bonus",
    },
    "char.sec.profile": {
        "cn": "配音", "cht": "配音", "en": "Voice", "jp": "ボイス", "kr": "성우", "es": "Voces", "fr": "Voix", "de": "Stimmen", "pt": "Vozes", "ru": "Озвучка", "th": "เสียงพากย์", "vi": "Lồng tiếng", "id": "Suara",
    },
    "char.state.original": {
        "cn": "原始", "cht": "原始", "en": "Base", "jp": "ベース", "kr": "기본", "es": "Base", "fr": "Base", "de": "Basis", "pt": "Base", "ru": "Базовый", "th": "พื้นฐาน", "vi": "Gốc", "id": "Dasar",
    },
    "char.enhForm": {
        "cn": "强化形态", "cht": "強化形態", "en": "Enhanced form", "jp": "強化形態", "kr": "강화 형태", "es": "Forma mejorada", "fr": "Forme améliorée", "de": "Verstärkte Form", "pt": "Forma aprimorada", "ru": "Усиленная форма", "th": "ร่างเสริม", "vi": "Dạng cường hóa", "id": "Bentuk diperkuat",
    },
    "char.enhModeAria": {
        "cn": "强化模式切换", "cht": "強化模式切換", "en": "Enhancement mode switch", "jp": "強化モード切り替え", "kr": "강화 모드 전환", "es": "Cambio de modo de mejora", "fr": "Changement de mode", "de": "Verbesserungsmodus wechseln", "pt": "Troca de modo de melhoria", "ru": "Переключение режима усиления", "th": "สลับโหมดเสริม", "vi": "Chuyển chế độ cường hóa", "id": "Ganti mode penguatan",
    },
    "char.enhNotes": {
        "cn": "强化内容", "cht": "強化內容", "en": "Enhancement details", "jp": "強化内容", "kr": "강화 내용", "es": "Detalles de mejora", "fr": "Détails de l'amélioration", "de": "Verbesserungsdetails", "pt": "Detalhes da melhoria", "ru": "Детали усиления", "th": "รายละเอียดการเสริม", "vi": "Nội dung cường hóa", "id": "Detail penguatan",
    },
    "char.loadingAria": {
        "cn": "角色详情加载中", "cht": "角色詳情載入中", "en": "Loading character data", "jp": "キャラ詳細を読み込み中", "kr": "캐릭터 상세 로드 중", "es": "Cargando datos del personaje", "fr": "Chargement des données", "de": "Charakterdaten werden geladen", "pt": "Carregando dados do personagem", "ru": "Загрузка данных персонажа", "th": "กำลังโหลดข้อมูลตัวละคร", "vi": "Đang tải dữ liệu nhân vật", "id": "Memuat data karakter",
    },
    "char.errorTitle": {
        "cn": "角色数据加载失败", "cht": "角色資料載入失敗", "en": "Failed to load character data", "jp": "キャラデータの読み込みに失敗", "kr": "캐릭터 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Charakterdaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลตัวละครไม่สำเร็จ", "vi": "Không tải được dữ liệu nhân vật", "id": "Gagal memuat data karakter",
    },
    "char.state.enhanced": {
        "cn": "V{n} 强化", "cht": "V{n} 強化", "en": "V{n} Enhanced", "jp": "V{n} 強化", "kr": "V{n} 강화", "es": "V{n} mejorado", "fr": "V{n} amélioré", "de": "V{n} verstärkt", "pt": "V{n} aprimorado", "ru": "V{n} усиление", "th": "V{n} เสริม", "vi": "V{n} cường hóa", "id": "V{n} diperkuat",
    },
    "relic.loadingAria": {
        "cn": "遗器详情加载中", "cht": "遺器詳情載入中", "en": "Loading Relic data", "jp": "遺物詳細を読み込み中", "kr": "유물 상세 로드 중", "es": "Cargando datos de la reliquia", "fr": "Chargement de la relique", "de": "Reliktdaten werden geladen", "pt": "Carregando dados da relíquia", "ru": "Загрузка данных реликвии", "th": "กำลังโหลดข้อมูลรีลิก", "vi": "Đang tải dữ liệu Di Vật", "id": "Memuat data Relic",
    },
    "relic.errorTitle": {
        "cn": "遗器数据加载失败", "cht": "遺器資料載入失敗", "en": "Failed to load Relic data", "jp": "遺物データの読み込みに失敗", "kr": "유물 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Reliktdaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลรีลิกไม่สำเร็จ", "vi": "Không tải được dữ liệu Di Vật", "id": "Gagal memuat data Relic",
    },
    "relic.affixCol": {
        "cn": "词条", "cht": "詞條", "en": "Affix", "jp": "詞条", "kr": "옵션", "es": "Afijo", "fr": "Affixe", "de": "Affix", "pt": "Afixo", "ru": "Аффикс", "th": "คำเสริม", "vi": "Dòng phụ", "id": "Afiks",
    },
    "relic.tier": {
        "cn": "数值档位", "cht": "數值檔位", "en": "Value tier", "jp": "数値段階", "kr": "수치 단계", "es": "Nivel de valor", "fr": "Palier de valeur", "de": "Wertstufe", "pt": "Nível de valor", "ru": "Уровень значения", "th": "ระดับค่า", "vi": "Bậc giá trị", "id": "Tingkat nilai",
    },
    "relic.nextEnhance": {
        "cn": "次强化", "cht": "次強化", "en": "Next enhance", "jp": "次強化", "kr": "다음 강화", "es": "Siguiente mejora", "fr": "Amélioration suivante", "de": "Nächste Verbesserung", "pt": "Próxima melhoria", "ru": "Следующее усиление", "th": "เสริมครั้งถัดไป", "vi": "Cường hóa kế", "id": "Penguatan berikutnya",
    },
    "relic.maxMultiplier": {
        "cn": "满值倍率", "cht": "滿值倍率", "en": "Max value multiplier", "jp": "最大値倍率", "kr": "최대값 배율", "es": "Multiplicador máximo", "fr": "Multiplicateur maximal", "de": "Maximalwert-Multiplikator", "pt": "Multiplicador máximo", "ru": "Множитель макс. значения", "th": "ตัวคูณค่าสูงสุด", "vi": "Hệ số giá trị tối đa", "id": "Pengali nilai maks",
    },
    "relic.noAffixAria": {
        "cn": "该部位无此词条", "cht": "該部位無此詞條", "en": "This piece cannot roll this affix", "jp": "この部位にこの詞条はない", "kr": "이 부위에는 이 옵션이 없습니다", "es": "Esta pieza no tiene este afijo", "fr": "Cette pièce n'a pas cet affixe", "de": "Dieses Teil hat diesen Affix nicht", "pt": "Esta peça não tem este afixo", "ru": "У этой части нет такого аффикса", "th": "ชิ้นนี้ไม่มีคำเสริมนี้", "vi": "Mảnh này không có dòng phụ này", "id": "Bagian ini tidak punya afiks ini",
    },
    "relic.pieceCount": {
        "cn": "{n} 件", "cht": "{n} 件", "en": "{n} pieces", "jp": "{n} 個", "kr": "{n}개", "es": "{n} piezas", "fr": "{n} pièces", "de": "{n} Teile", "pt": "{n} peças", "ru": "{n} шт.", "th": "{n} ชิ้น", "vi": "{n} món", "id": "{n} buah",
    },
    "relic.setPieces": {
        "cn": "{n}件套", "cht": "{n}件套", "en": "{n}-piece", "jp": "{n}セット", "kr": "{n}세트", "es": "{n} piezas", "fr": "{n} pièces", "de": "{n}er-Set", "pt": "{n} peças", "ru": "{n} предмета", "th": "{n} ชิ้น", "vi": "{n} món", "id": "{n} set",
    },
    "relic.affixNote": {
        "cn": "初始 → 满级（+{n}）", "cht": "初始 → 滿級（+{n}）", "en": "Initial → Max (+{n})", "jp": "初期 → 最大（+{n}）", "kr": "초기 → 최대(+{n})", "es": "Inicial → máximo (+{n})", "fr": "Initial → max (+{n})", "de": "Anfang → Max. (+{n})", "pt": "Inicial → máximo (+{n})", "ru": "Начало → макс. (+{n})", "th": "เริ่มต้น → สูงสุด (+{n})", "vi": "Ban đầu → tối đa (+{n})", "id": "Awal → maks (+{n})",
    },
    "relic.maxValue": {
        "cn": "满值 {value}", "cht": "滿值 {value}", "en": "Max {value}", "jp": "最大 {value}", "kr": "최대 {value}", "es": "Máximo {value}", "fr": "Max {value}", "de": "Max. {value}", "pt": "Máximo {value}", "ru": "Макс. {value}", "th": "สูงสุด {value}", "vi": "Tối đa {value}", "id": "Maks {value}",
    },
    "relic.tierTitle": {
        "cn": "第 {n} 档", "cht": "第 {n} 檔", "en": "Tier {n}", "jp": "第 {n} 段階", "kr": "{n}단계", "es": "Nivel {n}", "fr": "Palier {n}", "de": "Stufe {n}", "pt": "Nível {n}", "ru": "Уровень {n}", "th": "ระดับ {n}", "vi": "Bậc {n}", "id": "Tingkat {n}",
    },
    "relic.dropNote": {
        "cn": "掉落随机取 1 档；强化在 +3/+6/+9/+12/+15 随机累加 1 条 1 档，理论满值 = 最高档 × {mult}。", "cht": "掉落隨機取 1 檔；強化在 +3/+6/+9/+12/+15 隨機累加 1 條 1 檔，理論滿值 = 最高檔 × {mult}。", "en": "Drops roll 1 tier at random; each enhance at +3/+6/+9/+12/+15 adds one tier-1 roll, so the theoretical maximum is top tier × {mult}.", "jp": "ドロップは1段階をランダム取得。強化は +3/+6/+9/+12/+15 で1段階分を1条加算し、理論最大値 = 最高段階 × {mult}。", "kr": "드롭은 1단계를 무작위 획득, 강화 시 +3/+6/+9/+12/+15에서 1단계 1줄이 누적되어 이론 최대값 = 최고 단계 × {mult}.", "es": "El botín da 1 nivel al azar; cada mejora en +3/+6/+9/+12/+15 suma un nivel 1, así que el máximo teórico es el nivel más alto × {mult}.", "fr": "Le butin donne 1 palier au hasard ; chaque amélioration à +3/+6/+9/+12/+15 ajoute un palier 1, donc le max théorique = palier max × {mult}.", "de": "Beute vergibt zufällig 1 Stufe; jede Verbesserung bei +3/+6/+9/+12/+15 fügt 1 Stufe-1-Wert hinzu, theoretisches Maximum = höchste Stufe × {mult}.", "pt": "O drop dá 1 nível aleatório; cada melhoria em +3/+6/+9/+12/+15 soma um nível 1, então o máximo teórico = nível mais alto × {mult}.", "ru": "Дроп даёт 1 уровень случайно; каждое усиление на +3/+6/+9/+12/+15 добавляет 1 уровень, теоретический максимум = высший уровень × {mult}.", "th": "ดรอปสุ่มได้ 1 ระดับ; การเสริมที่ +3/+6/+9/+12/+15 เพิ่ม 1 ระดับ ค่าสูงสุดทางทฤษฎี = ระดับสูงสุด × {mult}", "vi": "Drop lấy ngẫu nhiên 1 bậc; mỗi lần cường hóa ở +3/+6/+9/+12/+15 cộng 1 bậc, tối đa lý thuyết = bậc cao nhất × {mult}.", "id": "Drop mengambil 1 tingkat acak; tiap penguatan di +3/+6/+9/+12/+15 menambah 1 tingkat, maksimum teoretis = tingkat tertinggi × {mult}.",
    },
    "skill.energyNeed": {
        "cn": "能量需求", "cht": "能量需求", "en": "Energy cost", "jp": "エネルギー必要量", "kr": "에너지 요구량", "es": "Coste de energía", "fr": "Coût d'énergie", "de": "Energiekosten", "pt": "Custo de energia", "ru": "Требуется энергии", "th": "ต้องใช้พลังงาน", "vi": "Yêu cầu năng lượng", "id": "Kebutuhan energi",
    },
    "skill.enhSources": {
        "cn": "强化来源", "cht": "強化來源", "en": "Enhancement sources", "jp": "強化元", "kr": "강화 출처", "es": "Fuentes de mejora", "fr": "Sources d'amélioration", "de": "Verbesserungsquellen", "pt": "Fontes de melhoria", "ru": "Источники усиления", "th": "แหล่งเสริม", "vi": "Nguồn cường hóa", "id": "Sumber penguatan",
    },
    "skill.enhSourcesOpen": {
        "cn": "收起强化来源", "cht": "收起強化來源", "en": "Hide enhancement sources", "jp": "強化元を閉じる", "kr": "강화 출처 접기", "es": "Ocultar fuentes de mejora", "fr": "Masquer les sources", "de": "Verbesserungsquellen ausblenden", "pt": "Ocultar fontes de melhoria", "ru": "Скрыть источники усиления", "th": "ซ่อนแหล่งเสริม", "vi": "Ẩn nguồn cường hóa", "id": "Sembunyikan sumber penguatan",
    },
    "skill.anim": {
        "cn": "技能预览", "cht": "技能預覽", "en": "Ability preview", "jp": "スキルプレビュー", "kr": "스킬 미리보기", "es": "Vista previa", "fr": "Aperçu de la compétence", "de": "Fähigkeitsvorschau", "pt": "Prévia da habilidade", "ru": "Предпросмотр навыка", "th": "ตัวอย่างสกิล", "vi": "Xem trước kỹ năng", "id": "Pratinjau skill",
    },
    "skill.animOpen": {
        "cn": "收起技能预览", "cht": "收起技能預覽", "en": "Hide ability preview", "jp": "スキルプレビューを閉じる", "kr": "스킬 미리보기 접기", "es": "Ocultar vista previa", "fr": "Masquer l'aperçu", "de": "Fähigkeitsvorschau ausblenden", "pt": "Ocultar prévia", "ru": "Скрыть предпросмотр", "th": "ซ่อนตัวอย่างสกิล", "vi": "Ẩn xem trước kỹ năng", "id": "Sembunyikan pratinjau",
    },
    "skill.table": {
        "cn": "技能数据", "cht": "技能資料", "en": "Ability data", "jp": "スキルデータ", "kr": "스킬 데이터", "es": "Datos de habilidad", "fr": "Données de compétence", "de": "Fähigkeitsdaten", "pt": "Dados da habilidade", "ru": "Данные навыка", "th": "ข้อมูลสกิล", "vi": "Dữ liệu kỹ năng", "id": "Data skill",
    },
    "skill.tableOpen": {
        "cn": "收起技能数据", "cht": "收起技能資料", "en": "Hide ability data", "jp": "スキルデータを閉じる", "kr": "스킬 데이터 접기", "es": "Ocultar datos", "fr": "Masquer les données", "de": "Fähigkeitsdaten ausblenden", "pt": "Ocultar dados", "ru": "Скрыть данные", "th": "ซ่อนข้อมูลสกิล", "vi": "Ẩn dữ liệu kỹ năng", "id": "Sembunyikan data skill",
    },
    "skill.animAlt": {
        "cn": "{name} 技能预览", "cht": "{name} 技能預覽", "en": "{name} ability preview", "jp": "{name} スキルプレビュー", "kr": "{name} 스킬 미리보기", "es": "Vista previa de {name}", "fr": "Aperçu de {name}", "de": "{name} Fähigkeitsvorschau", "pt": "Prévia de {name}", "ru": "Предпросмотр {name}", "th": "ตัวอย่างสกิล {name}", "vi": "Xem trước kỹ năng {name}", "id": "Pratinjau skill {name}",
    },
    "cmp.spNote": {
        "cn": "终结技能量需求：{v}", "cht": "終結技能量需求：{v}", "en": "Ultimate energy cost: {v}", "jp": "必殺技エネルギー必要量：{v}", "kr": "필살기 에너지 요구량: {v}", "es": "Coste de energía del definitivo: {v}", "fr": "Coût d'énergie de l'ultime : {v}", "de": "Ultimativ-Energiekosten: {v}", "pt": "Custo de energia do supremo: {v}", "ru": "Требуется энергии на ульту: {v}", "th": "พลังงานที่ต้องใช้สำหรับท่าไม้ตาย: {v}", "vi": "Yêu cầu năng lượng Tuyệt Kỹ: {v}", "id": "Kebutuhan energi Ultimate: {v}",
    },
    "cmp.noChange": {
        "cn": "本区块无变化", "cht": "本區塊無變化", "en": "No changes in this section", "jp": "この区画に変化なし", "kr": "이 구역 변경 없음", "es": "Sin cambios en esta sección", "fr": "Aucun changement dans cette section", "de": "Keine Änderungen in diesem Abschnitt", "pt": "Sem mudanças nesta seção", "ru": "В этом разделе изменений нет", "th": "ไม่มีการเปลี่ยนแปลงในส่วนนี้", "vi": "Không có thay đổi trong mục này", "id": "Tidak ada perubahan di bagian ini",
    },
    "cmp.changed": {
        "cn": "变化", "cht": "變化", "en": "Changed", "jp": "変更", "kr": "변경", "es": "Cambiado", "fr": "Modifié", "de": "Geändert", "pt": "Alterado", "ru": "Изменено", "th": "เปลี่ยน", "vi": "Thay đổi", "id": "Berubah",
    },
    "cmp.talentsTag": {
        "cn": "附加能力", "cht": "附加能力", "en": "Bonus Ability", "jp": "追加能力", "kr": "부가 능력", "es": "Habilidad adicional", "fr": "Capacité bonus", "de": "Zusatzfähigkeit", "pt": "Habilidade adicional", "ru": "Доп. способность", "th": "ความสามารถเสริม", "vi": "Năng lực bổ sung", "id": "Kemampuan tambahan",
    },
    "stat.stage": {
        "cn": "突破 {n}", "cht": "突破 {n}", "en": "Ascension {n}", "jp": "昇格 {n}", "kr": "돌파 {n}", "es": "Ascensión {n}", "fr": "Ascension {n}", "de": "Aufstieg {n}", "pt": "Ascensão {n}", "ru": "Возвышение {n}", "th": "ฝึกฝน {n}", "vi": "Đột phá {n}", "id": "Ascension {n}",
    },
    "stat.levelValue": {
        "cn": "Lv.{level} 突破 {stage}", "cht": "Lv.{level} 突破 {stage}", "en": "Lv.{level} Ascension {stage}", "jp": "Lv.{level} 昇格 {stage}", "kr": "Lv.{level} 돌파 {stage}", "es": "Lv.{level} ascensión {stage}", "fr": "Niv.{level} ascension {stage}", "de": "Lv.{level} Aufstieg {stage}", "pt": "Nv.{level} ascensão {stage}", "ru": "Ур.{level} возвышение {stage}", "th": "Lv.{level} ฝึกฝน {stage}", "vi": "Lv.{level} đột phá {stage}", "id": "Lv.{level} ascension {stage}",
    },
    "stat.perLevel": {
        "cn": "每级 +{v}", "cht": "每級 +{v}", "en": "+{v} per level", "jp": "每レベル +{v}", "kr": "레벨당 +{v}", "es": "+{v} por nivel", "fr": "+{v} par niveau", "de": "+{v} pro Level", "pt": "+{v} por nível", "ru": "+{v} за уровень", "th": "+{v} ต่อเลเวล", "vi": "+{v} mỗi cấp", "id": "+{v} per level",
    },
    "stat.note": {
        "cn": "口径：基础面板，不含光锥与遗器加成。", "cht": "口徑：基礎面板，不含光錐與遺器加成。", "en": "Basis panel only; no Light Cone or Relic bonuses.", "jp": "基準パネルのみ。光円錐と遺物の加算は含みません。", "kr": "기본 패널 기준이며 광추·유물 보너스는 제외합니다.", "es": "Solo panel base; sin bonos de cono de luz ni reliquia.", "fr": "Panneau de base uniquement, hors cônes et reliques.", "de": "Nur Basispaneel; ohne Lichtkegel- und Reliktboni.", "pt": "Apenas painel base; sem bônus de Cone ou Relíquia.", "ru": "Только базовые значения, без бонусов конуса и реликвии.", "th": "เฉพาะค่าพื้นฐาน ไม่รวมโบนัสกรวยแสงและรีลิก", "vi": "Chỉ bảng gốc, không gồm Nón Ánh Sáng và Di Vật.", "id": "Hanya panel dasar, tanpa bonus Light Cone dan Relic.",
    },
    "ctrait.loadingAria": {
        "cn": "羁绊详情加载中", "cht": "羈絆詳情載入中", "en": "Loading synergy data", "jp": "シナジー詳細を読み込み中", "kr": "시너지 상세 로드 중", "es": "Cargando datos de sinergia", "fr": "Chargement des synergies", "de": "Synergiedaten werden geladen", "pt": "Carregando dados de sinergia", "ru": "Загрузка данных синергии", "th": "กำลังโหลดข้อมูลซินเนอร์จี", "vi": "Đang tải dữ liệu cộng hưởng", "id": "Memuat data sinergi",
    },
    "ctrait.errorTitle": {
        "cn": "羁绊数据加载失败", "cht": "羈絆資料載入失敗", "en": "Failed to load synergy data", "jp": "シナジーデータの読み込みに失敗", "kr": "시너지 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Synergiedaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลซินเนอร์จีไม่สำเร็จ", "vi": "Không tải được dữ liệu cộng hưởng", "id": "Gagal memuat data sinergi",
    },
    "ctrait.notFound": {
        "cn": "未找到该羁绊", "cht": "未找到該羈絆", "en": "Synergy not found", "jp": "シナジーが見つかりません", "kr": "시너지를 찾을 수 없습니다", "es": "Sinergia no encontrada", "fr": "Synergie introuvable", "de": "Synergie nicht gefunden", "pt": "Sinergia não encontrada", "ru": "Синергия не найдена", "th": "ไม่พบซินเนอร์จี", "vi": "Không tìm thấy cộng hưởng", "id": "Sinergi tidak ditemukan",
    },
    "ctrait.sec.members": {
        "cn": "羁绊成员", "cht": "羈絆成員", "en": "Synergy Members", "jp": "シナジーメンバー", "kr": "시너지 멤버", "es": "Miembros de sinergia", "fr": "Membres de synergie", "de": "Synergie-Mitglieder", "pt": "Membros de sinergia", "ru": "Участники синергии", "th": "สมาชิกซินเนอร์จี", "vi": "Thành viên cộng hưởng", "id": "Anggota sinergi",
    },
    "ctrait.sec.layers": {
        "cn": "层级效果", "cht": "層級效果", "en": "Tier Effects", "jp": "段階効果", "kr": "단계 효과", "es": "Efectos por nivel", "fr": "Effets par palier", "de": "Stufeneffekte", "pt": "Efeitos por nível", "ru": "Эффекты уровней", "th": "เอฟเฟกต์ตามระดับ", "vi": "Hiệu ứng theo bậc", "id": "Efek per tingkat",
    },
    "ctrait.memberCount": {
        "cn": "（{n} 人）", "cht": "（{n} 人）", "en": " ({n})", "jp": "（{n}人）", "kr": "({n}명)", "es": " ({n})", "fr": " ({n})", "de": " ({n})", "pt": " ({n})", "ru": " ({n})", "th": " ({n} คน)", "vi": " ({n} người)", "id": " ({n})",
    },
    "skill.levelAria": {
        "cn": "{name} 等级", "cht": "{name} 等級", "en": "{name} level", "jp": "{name} レベル", "kr": "{name} 레벨", "es": "Nivel de {name}", "fr": "Niveau de {name}", "de": "{name}-Stufe", "pt": "Nível de {name}", "ru": "Уровень {name}", "th": "ระดับ {name}", "vi": "Cấp {name}", "id": "Level {name}",
    },
    "cmp.changedCount": {
        "cn": "变化 {n} 项", "cht": "變化 {n} 項", "en": "{n} changed", "jp": "変更 {n} 件", "kr": "변경 {n}개", "es": "{n} cambios", "fr": "{n} changements", "de": "{n} geändert", "pt": "{n} alterações", "ru": "Изменено: {n}", "th": "เปลี่ยน {n} รายการ", "vi": "{n} thay đổi", "id": "{n} berubah",
    },
    "mob.variant.current": {
        "cn": "当前档", "cht": "當前檔", "en": "This entry", "jp": "現在の項目", "kr": "현재 항목", "es": "Esta entrada", "fr": "Cette entrée", "de": "Dieser Eintrag", "pt": "Esta entrada", "ru": "Эта запись", "th": "รายการนี้", "vi": "Mục này", "id": "Entri ini",
    },
    "mob.variant.same": {
        "cn": "与当前档一致", "cht": "與當前檔一致", "en": "Same as this entry", "jp": "現在の項目と同一", "kr": "현재 항목과 동일", "es": "Igual que esta entrada", "fr": "Identique à cette entrée", "de": "Gleich wie dieser Eintrag", "pt": "Igual a esta entrada", "ru": "Совпадает с этой записью", "th": "เหมือนรายการนี้", "vi": "Giống mục này", "id": "Sama dengan entri ini",
    },
    "mob.status.buff": {
        "cn": "增益", "cht": "增益", "en": "Buff", "jp": "強化", "kr": "버프", "es": "Mejora", "fr": "Amélioration", "de": "Buff", "pt": "Melhoria", "ru": "Усиление", "th": "บัฟ", "vi": "Tăng cường", "id": "Buff",
    },
    "mob.status.debuff": {
        "cn": "减益", "cht": "減益", "en": "Debuff", "jp": "弱体", "kr": "디버프", "es": "Perjuicio", "fr": "Affaiblissement", "de": "Debuff", "pt": "Penalidade", "ru": "Ослабление", "th": "ดีบัฟ", "vi": "Suy yếu", "id": "Debuff",
    },
    "mob.status.other": {
        "cn": "其他", "cht": "其他", "en": "Other", "jp": "その他", "kr": "기타", "es": "Otro", "fr": "Autre", "de": "Sonstige", "pt": "Outro", "ru": "Прочее", "th": "อื่น ๆ", "vi": "Khác", "id": "Lainnya",
    },
    "mob.levelBase": {
        "cn": "基准档", "cht": "基準檔", "en": "Base tier", "jp": "基準", "kr": "기준", "es": "Nivel base", "fr": "Palier de base", "de": "Basistufe", "pt": "Nível base", "ru": "Базовый уровень", "th": "ระดับพื้นฐาน", "vi": "Bậc cơ sở", "id": "Tingkat dasar",
    },
    "mob.levelBalance": {
        "cn": "均衡等级 {n}", "cht": "均衡等級 {n}", "en": "Equilibrium Level {n}", "jp": "均衡レベル {n}", "kr": "균형 레벨 {n}", "es": "Nivel de equilibrio {n}", "fr": "Niveau d'équilibre {n}", "de": "Gleichgewichtsstufe {n}", "pt": "Nível de equilíbrio {n}", "ru": "Уровень равновесия {n}", "th": "ระดับสมดุล {n}", "vi": "Cấp cân bằng {n}", "id": "Level keseimbangan {n}",
    },
    "mob.level": {
        "cn": "等级 {n}", "cht": "等級 {n}", "en": "Lv. {n}", "jp": "レベル {n}", "kr": "레벨 {n}", "es": "Nv. {n}", "fr": "Niv. {n}", "de": "Stufe {n}", "pt": "Nv. {n}", "ru": "Ур. {n}", "th": "เลเวล {n}", "vi": "Cấp {n}", "id": "Lv. {n}",
    },
    "mob.levelAria": {
        "cn": "敌人等级", "cht": "敵人等級", "en": "Enemy level", "jp": "敵レベル", "kr": "적 레벨", "es": "Nivel del enemigo", "fr": "Niveau de l'ennemi", "de": "Gegnerstufe", "pt": "Nível do inimigo", "ru": "Уровень врага", "th": "เลเวลศัตรู", "vi": "Cấp kẻ địch", "id": "Level musuh",
    },
    "mob.levelMissing": {
        "cn": "该怪物的等级曲线暂缺组 {n}，仅展示档案基准值。", "cht": "該怪物的等級曲線暫缺組 {n}，僅展示檔案基準值。", "en": "The level curve for group {n} is unavailable; only archive base values are shown.", "jp": "グループ {n} のレベル曲線がないため、図鑑の基準値のみ表示します。", "kr": "그룹 {n}의 레벨 곡선이 없어 도감 기준값만 표시합니다.", "es": "Falta la curva de nivel del grupo {n}; solo se muestran valores base.", "fr": "Courbe de niveau du groupe {n} indisponible ; seules les valeurs de base sont affichées.", "de": "Levelkurve für Gruppe {n} fehlt; nur Basiswerte werden gezeigt.", "pt": "Falta a curva de nível do grupo {n}; apenas valores base são exibidos.", "ru": "Кривая уровня для группы {n} недоступна; показаны базовые значения.", "th": "ไม่มีเส้นระดับของกลุ่ม {n} จึงแสดงเฉพาะค่าพื้นฐาน", "vi": "Thiếu đường cong cấp của nhóm {n}, chỉ hiển thị giá trị gốc.", "id": "Kurva level grup {n} tidak ada; hanya nilai dasar ditampilkan.",
    },
    "mob.fx": {
        "cn": "附带效果", "cht": "附帶效果", "en": "Additional Effects", "jp": "付随効果", "kr": "부가 효과", "es": "Efectos adicionales", "fr": "Effets additionnels", "de": "Zusatzeffekte", "pt": "Efeitos adicionais", "ru": "Доп. эффекты", "th": "เอฟเฟกต์เพิ่มเติม", "vi": "Hiệu ứng kèm theo", "id": "Efek tambahan",
    },
    "mob.statusLead": {
        "cn": "口径：按状态配置名与怪物配置名的命名约定归属；数值或动态名称未公开的词条只列名称与类型。", "cht": "口徑：依狀態配置名與怪物配置名的命名慣例歸屬；數值或動態名稱未公開的詞條只列名稱與類型。", "en": "Assigned by the naming convention between status and monster config names. Entries whose values or dynamic names are not public list only name and type.", "jp": "状態設定名と敵設定名の命名規則で分類。数値や動的 name が非公開の詞条は名称と種類のみ記載します。", "kr": "상태 설정명과 적 설정명의 명명 규칙으로 분류합니다. 수치나 동적 이름이 비공개인 항목은 이름과 유형만 표시합니다.", "es": "Se asignan por la convención entre nombres de estado y de enemigo. Las entradas sin valores ni nombres dinámicos públicos solo muestran nombre y tipo.", "fr": "Attribués selon la convention de nommage des statuts et des ennemis. Les entrées sans valeurs ni noms dynamiques publics n'affichent que nom et type.", "de": "Zuordnung über die Namenskonvention von Status- und Gegnerkonfiguration. Einträge ohne öffentliche Werte oder dynamische Namen zeigen nur Name und Typ.", "pt": "Atribuídos pela convenção entre nomes de status e de inimigo. Entradas sem valores ou nomes dinâmicos públicos mostram apenas nome e tipo.", "ru": "Привязка по соглашению об именах статусов и противников. Записи без публичных значений или динамических имён показывают только имя и тип.", "th": "จัดกลุ่มตามธรรมเนียมการตั้งชื่อสถานะและศัตรู รายการที่ไม่มีค่าหรือชื่อไดนามิกเปิดเผยจะแสดงแค่ชื่อและประเภท", "vi": "Gán theo quy ước đặt tên trạng thái và kẻ địch. Mục không có giá trị hoặc tên động công khai chỉ hiển thị tên và loại.", "id": "Dipetakan menurut konvensi nama status dan musuh. Entri tanpa nilai atau nama dinamis publik hanya menampilkan nama dan tipe.",
    },
    "mob.appearSamples": {
        "cn": "，以下为其中几处：", "cht": "，以下為其中幾處：", "en": ", a few of them below:", "jp": "、以下はその一部：", "kr": ", 그중 몇 곳:", "es": ", algunas de ellas:", "fr": ", quelques-unes ci-dessous :", "de": ", einige davon:", "pt": ", algumas delas:", "ru": ", некоторые из них:", "th": " ตัวอย่างบางส่วน:", "vi": " và một vài nơi:", "id": ", beberapa di antaranya:",
    },
    "mob.appearSourceNote": {
        "cn": "关卡名取自游戏内（活动关卡 / 终局层级 / 侵蚀隧洞 · 凝滞虚影 / 强敌挑战 · 剑试），至多列 3 处。", "cht": "關卡名取自遊戲內（活動關卡 / 終局層級 / 侵蝕隧洞 · 凝滯虛影 / 強敵挑戰 · 劍試），至多列 3 處。", "en": "Stage names come from the game (event stages / endgame tiers / Corrosion Cave · Stagnant Shadow / Elite Challenge · Sword Trial); at most 3 are listed.", "jp": "ステージ名はゲーム内表記（イベント / 終局階層 / 侵蝕の洞窟 · 凝滞する影 / 強敵挑戦 · 剣試）。最大3件まで。", "kr": "스테이지 이름은 게임 내 표기(이벤트 / 종국 계층 / 침식 동굴 · 정체된 그림자 / 강적 도전 · 검시)이며 최대 3곳까지 표시합니다.", "es": "Los nombres provienen del juego (eventos / niveles de endgame / Caverna de corrosión · Sombra estancada / Desafío de élite · Prueba de espada); se listan hasta 3.", "fr": "Noms issus du jeu (événements / paliers endgame / Caverne de corrosion · Ombre stagnante / Défi d'élite · Épreuve d'épée) ; 3 au maximum.", "de": "Stufennamen stammen aus dem Spiel (Events / Endgame-Ebenen / Korrosionshöhle · Stagnierender Schatten / Elite-Herausforderung · Schwertprobe); max. 3.", "pt": "Nomes vêm do jogo (eventos / níveis de endgame / Caverna de corrosão · Sombra estagnada / Desafio de elite · Prova de espada); no máximo 3.", "ru": "Названия этапов из игры (события / уровни эндгейма / Пещера коррозии · Застывшая тень / Испытание элиты · Меч); не более 3.", "th": "ชื่อด่านมาจากในเกม (อีเวนต์ / ชั้นEndgame / ถ้ำกัดกร่อน · เงาหยุดนิ่ง / ท้าทายชั้นสูง · ทดสอบดาบ) แสดงไม่เกิน 3", "vi": "Tên màn lấy từ game (sự kiện / tầng endgame / Động Ăn Mòn · Bóng Tĩnh / Thử thách tinh anh · Kiếm thử), tối đa 3.", "id": "Nama stage dari dalam game (event / tier endgame / Gua Korosi · Bayangan Terhenti / Tantangan Elit · Ujian Pedang), maksimal 3.",
    },
    "mob.appearNoNameNote": {
        "cn": "这些关卡在游戏内没有关卡名，只计入上面的数量。", "cht": "這些關卡在遊戲內沒有關卡名，只計入上面的數量。", "en": "These stages have no in-game name and only count toward the total above.", "jp": "これらのステージはゲーム内名がなく、上の数にのみ計上されます。", "kr": "이 스테이지들은 게임 내 이름이 없어 위 수치에만 포함됩니다.", "es": "Estas etapas no tienen nombre en el juego y solo cuentan para el total.", "fr": "Ces étapes n'ont pas de nom en jeu et comptent seulement dans le total.", "de": "Diese Stufen haben keinen Spielnamen und zählen nur zur Summe oben.", "pt": "Estes estágios não têm nome no jogo e contam apenas no total.", "ru": "У этих этапов нет игрового названия, они учтены только в общем числе.", "th": "ด่านเหล่านี้ไม่มีชื่อในเกม นับเฉพาะยอดรวมด้านบน", "vi": "Các màn này không có tên trong game, chỉ tính vào tổng ở trên.", "id": "Stage ini tidak punya nama dalam game dan hanya dihitung di total.",
    },
    "mob.appearCensus": {
        "cn": "按关卡波次统计，被其他敌人召唤出场的关卡也算；同一个关卡只算一次，一个关卡名可能覆盖多个难度档或上下半场。无限波次玩法里随机抽取的编组不算关卡，不计入。", "cht": "按關卡波次統計，被其他敵人召喚出場的關卡也算；同一個關卡只算一次，一個關卡名可能覆蓋多個難度檔或上下半場。無限波次玩法裡隨機抽取的編組不算關卡，不計入。", "en": "Counted by stage waves; stages where this enemy is summoned by others count too. A stage counts once, and one name may cover several difficulty tiers or halves. Randomly drawn lineups in endless-wave modes are not stages and are excluded.", "jp": "ステージのウェーブ単位で集計。他の敵に召喚されるステージも含む。同じステージは1回だけ数え、1つの名が複数の難易度や前半・後半を指すこともある。無限ウェーブのランダム編成はステージ扱いしない。", "kr": "스테이지 웨이브 기준 집계이며 다른 적이 소환한 스테이지도 포함합니다. 같은 스테이지는 1회만 세고, 한 이름이 여러 난이도나 전·후반을 포함할 수 있습니다. 무한 웨이브의 무작위 편성은 제외합니다.", "es": "Se cuenta por oleadas; también las etapas donde otro enemigo lo invoca. Una etapa cuenta una vez y un nombre puede cubrir varios niveles o mitades. Las formaciones aleatorias de modos infinitos no cuentan.", "fr": "Compté par vagues ; les étapes où il est invoqué comptent aussi. Une étape compte une fois, un nom peut couvrir plusieurs paliers ou mi-temps. Les compositions aléatoires des modes infinis ne comptent pas.", "de": "Nach Stufenwellen gezählt; auch Stufen, in denen er beschworen wird. Eine Stufe zählt einmal, ein Name kann mehrere Stufen oder Hälften abdecken. Zufällige Aufstellungen in Endloswellen zählen nicht.", "pt": "Contado por ondas; também etapas em que é invocado. Uma etapa conta uma vez e um nome pode cobrir vários níveis ou metades. Formações aleatórias de modos infinitos não contam.", "ru": "Считается по волнам этапа; этапы, где его призывают, тоже. Этап считается один раз, одно название может покрывать несколько сложностей или половин. Случайные составы бесконечных волн не учитываются.", "th": "นับตามเวฟของด่าน รวมด่านที่ถูกศัตรูอื่นเรียกออกมา หนึ่งด่านนับครั้งเดียว ชื่อหนึ่งอาจครอบคลุมหลายระดับหรือครึ่งแรก/หลัง การสุ่มจัดทีมในโหมดเวฟไม่จำกัดไม่นับ", "vi": "Tính theo đợt của màn; màn được triệu hồi bởi kẻ địch khác cũng tính. Mỗi màn tính một lần, một tên có thể gồm nhiều độ khó hoặc hai hiệp. Đội hình ngẫu nhiên ở chế độ vô hạn không tính.", "id": "Dihitung per gelombang stage; stage tempat ia dipanggil juga dihitung. Satu stage dihitung sekali, satu nama bisa mencakup beberapa tingkat atau babak. Formasi acak di mode gelombang tak terbatas tidak dihitung.",
    },
    "mob.eventSome": {
        "cn": "其中 {n} 个在「{name}」活动里，", "cht": "其中 {n} 個在「{name}」活動裡，", "en": "{n} of them are in the “{name}” event;", "jp": "うち {n} 件は「{name}」イベント内、", "kr": "그중 {n}개는 「{name}」 이벤트에 있으며,", "es": "{n} de ellas están en el evento «{name}»;", "fr": "{n} d'entre elles dans l'événement « {name} » ;", "de": "{n} davon im Event „{name}“;", "pt": "{n} delas no evento “{name}”;", "ru": "{n} из них в событии «{name}»;", "th": "{n} รายการอยู่ในอีเวนต์ “{name}”", "vi": "{n} trong số đó thuộc sự kiện “{name}”;", "id": "{n} di antaranya di event “{name}”;",
    },
    "mob.eventAll": {
        "cn": "全部关卡都在「{name}」活动里，", "cht": "全部關卡都在「{name}」活動裡，", "en": "All stages are in the “{name}” event;", "jp": "すべてのステージが「{name}」イベント内、", "kr": "모든 스테이지가 「{name}」 이벤트에 있으며,", "es": "Todas las etapas están en el evento «{name}»;", "fr": "Toutes les étapes sont dans l'événement « {name} » ;", "de": "Alle Stufen sind im Event „{name}“;", "pt": "Todos os estágios estão no evento “{name}”;", "ru": "Все этапы в событии «{name}»;", "th": "ทุกด่านอยู่ในอีเวนต์ “{name}”", "vi": "Tất cả màn đều thuộc sự kiện “{name}”;", "id": "Semua stage ada di event “{name}”;",
    },
    "mob.eventTabs": {
        "cn": "；页签：{tabs}。", "cht": "；頁籤：{tabs}。", "en": "; tabs: {tabs}.", "jp": "；タブ：{tabs}。", "kr": "; 탭: {tabs}.", "es": "; pestañas: {tabs}.", "fr": "; onglets : {tabs}.", "de": "; Tabs: {tabs}.", "pt": "; abas: {tabs}.", "ru": "; вкладки: {tabs}.", "th": "; แท็บ: {tabs}.", "vi": "; thẻ: {tabs}.", "id": "; tab: {tabs}.",
    },
    "mob.artSharedFigure": {
        "cn": "本形态没有独立美术：卡面与立绘与「{name}」共用（同卡面共 {n} 个形态）。", "cht": "本形態沒有獨立美術：卡面與立繪與「{name}」共用（同卡面共 {n} 個形態）。", "en": "This form has no separate art: its portrait and artwork are shared with “{name}” ({n} forms share the same portrait).", "jp": "この形態に独立したアートはなく、カード絵と立ち絵は「{name}」と共通です（同カード {n} 形態）。", "kr": "이 형태는 독립 아트가 없으며 카드와 일러스트를 「{name}」와 공유합니다(동일 카드 {n}개 형태).", "es": "Esta forma no tiene arte propio: comparte retrato e ilustración con «{name}» ({n} formas con el mismo retrato).", "fr": "Cette forme n'a pas d'art propre : visuel et illustration partagés avec « {name} » ({n} formes au même visuel).", "de": "Diese Form hat keine eigene Grafik: Kartenbild und Artwork sind mit „{name}“ geteilt ({n} Formen mit gleichem Kartenbild).", "pt": "Esta forma não tem arte própria: carta e ilustração são compartilhadas com “{name}” ({n} formas com a mesma carta).", "ru": "У этой формы нет своей графики: карта и арт общие с «{name}» ({n} форм с той же картой).", "th": "ร่างนี้ไม่มีอาร์ตแยก การ์ดและภาพใช้ร่วมกับ “{name}” (การ์ดเดียวกัน {n} ร่าง)", "vi": "Dạng này không có art riêng: thẻ và hình dùng chung với “{name}” ({n} dạng cùng thẻ).", "id": "Bentuk ini tidak punya art sendiri: kartu dan gambar dipakai bersama “{name}” ({n} bentuk berkartu sama).",
    },
    "mob.artSharedIcon": {
        "cn": "本形态与「{name}」等 {n} 个形态同卡面图标，立绘不同。", "cht": "本形態與「{name}」等 {n} 個形態同卡面圖示，立繪不同。", "en": "This form shares the portrait icon with “{name}” and {n} forms in total, but the artwork differs.", "jp": "この形態は「{name}」など {n} 形態とカードアイコンが同じで、立ち絵が異なります。", "kr": "이 형태는 「{name}」 등 {n}개 형태와 카드 아이콘이 같고 일러스트는 다릅니다.", "es": "Esta forma comparte el icono de carta con «{name}» y {n} formas en total, pero la ilustración difiere.", "fr": "Cette forme partage l'icône avec « {name} » et {n} formes au total, mais l'illustration diffère.", "de": "Diese Form teilt das Kartenbild-Symbol mit „{name}“ und insgesamt {n} Formen, das Artwork unterscheidet sich.", "pt": "Esta forma compartilha o ícone da carta com “{name}” e {n} formas no total, mas a ilustração difere.", "ru": "У этой формы общая иконка карты с «{name}» и всего {n} формами, но арт отличается.", "th": "ร่างนี้ใช้ไอคอนการ์ดร่วมกับ “{name}” และรวม {n} ร่าง แต่ภาพต่างกัน", "vi": "Dạng này dùng chung icon thẻ với “{name}” và tổng {n} dạng, nhưng hình khác.", "id": "Bentuk ini berbagi ikon kartu dengan “{name}” dan total {n} bentuk, tetapi gambarnya berbeda.",
    },
    "mob.dropLead": {
        "cn": "按均衡等级分档；「基准档」为无均衡等级限制的那一档。", "cht": "按均衡等級分檔；「基準檔」為無均衡等級限制的那一檔。", "en": "Tiered by Equilibrium Level; the “base tier” is the one without an Equilibrium Level requirement.", "jp": "均衡レベルで区分。「基準」は均衡レベルの制限がない段階です。", "kr": "균형 레벨로 구분하며, 「기준」은 균형 레벨 제한이 없는 단계입니다.", "es": "Se divide por nivel de equilibrio; el «nivel base» es el que no tiene requisito.", "fr": "Réparti par niveau d'équilibre ; le « palier de base » n'a aucune exigence.", "de": "Nach Gleichgewichtsstufe gestaffelt; die „Basistufe“ hat keine Anforderung.", "pt": "Dividido por nível de equilíbrio; o “nível base” não tem exigência.", "ru": "Разбито по уровню равновесия; «базовый» — без требований.", "th": "แบ่งตามระดับสมดุล “ระดับพื้นฐาน” คือระดับที่ไม่ต้องใช้ระดับสมดุล", "vi": "Chia theo Cấp Cân Bằng; “bậc cơ sở” là bậc không yêu cầu cấp.", "id": "Dibagi per Level Keseimbangan; “tingkat dasar” tanpa syarat level.",
    },
    "mob.variantCount": {
        "cn": "{n} 档", "cht": "{n} 檔", "en": "{n} entry | {n} entries", "jp": "{n} 件", "kr": "{n}개", "es": "{n} entrada | {n} entradas", "fr": "{n} entrée | {n} entrées", "de": "{n} Eintrag | {n} Einträge", "pt": "{n} entrada | {n} entradas", "ru": "{n} запись | {n} записей", "th": "{n} รายการ", "vi": "{n} mục", "id": "{n} entri",
    },
    "mob.variantLead": {
        "cn": "名称与卡面相同的 {n} 个数值档，弱点／韧性／数值／技能各不相同。", "cht": "名稱與卡面相同的 {n} 個數值檔，弱點／韌性／數值／技能各不相同。", "en": "{n} stat variants share the same name and portrait; weakness, toughness, stats and abilities differ.", "jp": "名前とカードが同じ {n} 件の数値違い。弱点／靭性／数値／スキルが異なります。", "kr": "이름과 카드가 같은 {n}개 수치 단계로, 약점/강인도/수치/스킬이 다릅니다.", "es": "{n} variantes con el mismo nombre y carta; debilidad, robustez, valores y habilidades difieren.", "fr": "{n} variantes de même nom et visuel ; faiblesse, robustesse, valeurs et compétences diffèrent.", "de": "{n} Wertevarianten mit gleichem Namen und Kartenbild; Schwäche, Robustheit, Werte und Fähigkeiten unterscheiden sich.", "pt": "{n} variantes com mesmo nome e carta; fraqueza, robustez, valores e habilidades diferem.", "ru": "{n} вариантов с тем же именем и картой; уязвимость, прочность, значения и навыки различаются.", "th": "{n} ระดับที่ชื่อและการ์ดเดียวกัน ต่างกันที่จุดอ่อน/ความแข็งแกร่ง/ค่า/สกิล", "vi": "{n} bậc cùng tên và thẻ; điểm yếu/Độ Bền/chỉ số/kỹ năng khác nhau.", "id": "{n} varian dengan nama dan kartu sama; kelemahan, ketangguhan, stat, skill berbeda.",
    },
    "mob.atlasOthers": {
        "cn": "官方登记的同一条目下另有 {n} 个形态（共 {m} 个，含本页）", "cht": "官方登記的同一個條目下另有 {n} 個形態（共 {m} 個，含本頁）", "en": "The official entry lists {n} other forms ({m} in total, including this page)", "jp": "公式の同一項目には他に {n} 形態（本ページを含め計 {m} 件）", "kr": "공식 동일 항목에 다른 형태가 {n}개 있습니다(이 페이지 포함 총 {m}개)", "es": "La entrada oficial incluye {n} formas más ({m} en total, incluida esta)", "fr": "La fiche officielle liste {n} autres formes ({m} au total, cette page comprise)", "de": "Der offizielle Eintrag führt {n} weitere Formen ({m} insgesamt, diese Seite inbegriffen)", "pt": "A entrada oficial lista {n} outras formas ({m} no total, incluindo esta)", "ru": "В официальной записи ещё {n} форм (всего {m}, включая эту)", "th": "รายการทางการมีอีกร่าง {n} ร่าง (รวมทั้งหมด {m} รวมหน้านี้)", "vi": "Mục chính thức có thêm {n} dạng (tổng {m}, gồm trang này)", "id": "Entri resmi mencantumkan {n} bentuk lain (total {m}, termasuk halaman ini)",
    },
    "mob.statNoteA": {
        "cn": "口径：模板基准 × 维度修饰比 × 精英组倍率（组 {a}）× 等级曲线（难度组 {b}）＋ 实例修正值；", "cht": "口徑：模板基準 × 維度修飾比 × 精英組倍率（組 {a}）× 等級曲線（難度組 {b}）＋ 實例修正值；", "en": "Basis: template base × stat modifier × elite group multiplier (group {a}) × level curve (difficulty group {b}) + instance correction; ", "jp": "基準：テンプレ基準 × 次元補正比 × 精鋭群倍率（群 {a}）× レベル曲線（難易度群 {b}）＋ 実例補正。", "kr": "기준: 템플릿 기준 × 차원 보정비 × 정예 그룹 배율(그룹 {a}) × 레벨 곡선(난이도 그룹 {b}) + 인스턴스 보정. ", "es": "Base: plantilla × modificador × multiplicador de élite (grupo {a}) × curva de nivel (grupo {b}) + corrección de instancia; ", "fr": "Base : modèle × modificateur × multiplicateur d'élite (groupe {a}) × courbe de niveau (groupe {b}) + correction d'instance ; ", "de": "Basis: Vorlage × Modifikator × Elitegruppen-Faktor (Gruppe {a}) × Levelkurve (Gruppe {b}) + Instanzkorrektur; ", "pt": "Base: modelo × modificador × multiplicador de elite (grupo {a}) × curva de nível (grupo {b}) + correção de instância; ", "ru": "Основа: шаблон × модификатор × множитель элитной группы ({a}) × кривая уровня ({b}) + поправка экземпляра; ", "th": "ฐาน: เทมเพลต × ตัวปรับ × ตัวคูณกลุ่มชั้นสูง (กลุ่ม {a}) × เส้นระดับ (กลุ่ม {b}) + ค่าปรับเฉพาะ; ", "vi": "Cơ sở: mẫu × hệ số × hệ số nhóm tinh anh ({a}) × đường cong cấp ({b}) + hiệu chỉnh; ", "id": "Dasar: templat × pengubah × pengali grup elit ({a}) × kurva level ({b}) + koreksi; ",
    },
    "mob.statNoteStance": {
        "cn": "韧性不入该曲线", "cht": "韌性不入該曲線", "en": "toughness is not part of that curve", "jp": "靭性はこの曲線に含まれません", "kr": "강인도는 이 곡선에 포함되지 않습니다", "es": "la robustez no entra en esa curva", "fr": "la robustesse n'y figure pas", "de": "Robustheit ist nicht Teil dieser Kurve", "pt": "robustez não entra nessa curva", "ru": "прочность в кривую не входит", "th": "ความแข็งแกร่งไม่อยู่ในเส้นนี้", "vi": "Độ Bền không thuộc đường cong đó", "id": "ketangguhan tidak termasuk kurva itu",
    },
    "mob.statNoteStanceNote": {
        "cn": "（韧性 = 韧性基准 × 精英组韧性倍率 + 实例修正值，不随等级变化，故在上方单独一行）；", "cht": "（韌性 = 韌性基準 × 精英組韌性倍率 + 實例修正值，不隨等級變化，故在上方單獨一行）；", "en": "(toughness = toughness base × elite toughness multiplier + instance correction, not level-scaled, so it is shown separately above); ", "jp": "（靭性 = 靭性基準 × 精鋭靭性倍率 + 実例補正。レベルで変化しないため上に別行で表示）；", "kr": "(강인도 = 강인도 기준 × 정예 강인도 배율 + 인스턴스 보정, 레벨에 따라 변하지 않아 위에 따로 표시); ", "es": "(robustez = base × multiplicador de élite + corrección, no escala con el nivel, por eso aparece aparte arriba); ", "fr": "(robustesse = base × multiplicateur d'élite + correction, sans variation par niveau, donc affichée à part ci-dessus) ; ", "de": "(Robustheit = Basis × Elite-Faktor + Instanzkorrektur, levelunabhängig, daher oben separat); ", "pt": "(robustez = base × multiplicador de elite + correção, não varia com o nível, por isso aparece separada acima); ", "ru": "(прочность = база × множитель элиты + поправка, не зависит от уровня, поэтому показана отдельно выше); ", "th": "(ความแข็งแกร่ง = ฐาน × ตัวคูณชั้นสูง + ค่าปรับ ไม่เปลี่ยนตามเลเวล จึงแสดงแยกด้านบน) ", "vi": "(Độ Bền = gốc × hệ số tinh anh + hiệu chỉnh, không đổi theo cấp nên hiển thị riêng ở trên); ", "id": "(ketangguhan = dasar × pengali elit + koreksi, tidak naik dengan level, jadi ditampilkan terpisah di atas); ",
    },
    "mob.statNoteBase": {
        "cn": "基准值", "cht": "基準值", "en": "base values", "jp": "基準値", "kr": "기준값", "es": "valores base", "fr": "valeurs de base", "de": "Basiswerte", "pt": "valores base", "ru": "базовые значения", "th": "ค่าพื้นฐาน", "vi": "giá trị gốc", "id": "nilai dasar",
    },
    "mob.statNoteModify": {
        "cn": "，本档修正", "cht": "，本檔修正", "en": ", this entry's modifiers", "jp": "、本件の補正", "kr": ", 이 항목 보정", "es": ", correcciones de esta entrada", "fr": ", corrections de cette entrée", "de": ", Korrekturen dieses Eintrags", "pt": ", correções desta entrada", "ru": ", поправки этой записи", "th": " ค่าปรับของรายการนี้", "vi": ", hiệu chỉnh của mục này", "id": ", koreksi entri ini",
    },
    "mob.statNoteStanceMod": {
        "cn": "韧性 {v}", "cht": "韌性 {v}", "en": "toughness {v}", "jp": "靭性 {v}", "kr": "강인도 {v}", "es": "robustez {v}", "fr": "robustesse {v}", "de": "Robustheit {v}", "pt": "robustez {v}", "ru": "прочность {v}", "th": "ความแข็งแกร่ง {v}", "vi": "Độ Bền {v}", "id": "ketangguhan {v}",
    },
    "mob.statNoteSpeedMod": {
        "cn": "速度 {v}", "cht": "速度 {v}", "en": "SPD {v}", "jp": "速度 {v}", "kr": "속도 {v}", "es": "VEL {v}", "fr": "VIT {v}", "de": "GES {v}", "pt": "VEL {v}", "ru": "скорость {v}", "th": "ความเร็ว {v}", "vi": "tốc độ {v}", "id": "SPD {v}",
    },
    "mob.statNoteTail": {
        "cn": "，未含关卡侧精英组指派（侵蚀隧洞、拟造花萼等副本的额外倍率）与剧情系数。", "cht": "，未含關卡側精英組指派（侵蝕隧洞、擬造花萼等副本的額外倍率）與劇情係數。", "en": ", excluding stage-side elite group assignment (extra multipliers in instances such as Corrosion Cave and Calyx) and story coefficients.", "jp": "。ステージ側の精鋭群指派（侵蝕の洞窟・模造花萼などの追加倍率）とストーリー係数は含みません。", "kr": ", 스테이지 측 정예 그룹 지정(침식 동굴·모조 화악 등 추가 배율)과 스토리 계수는 제외합니다.", "es": ", sin la asignación de élite del lado del nivel (multiplicadores extra en Caverna de corrosión, Cáliz, etc.) ni coeficientes de historia.", "fr": ", hors assignation d'élite côté étape (multiplicateurs de Caverne de corrosion, Calice, etc.) et coefficients scénaristiques.", "de": ", ohne stufenseitige Elitegruppen-Zuweisung (Zusatzfaktoren in Korrosionshöhle, Kelch usw.) und Story-Koeffizienten.", "pt": ", sem atribuição de elite do lado do estágio (multiplicadores extras em Caverna de corrosão, Cálice etc.) nem coeficientes de história.", "ru": ", без назначения элитной группы на этапе (доп. множители в Пещере коррозии, Чаше и т. п.) и сюжетных коэффициентов.", "th": " ไม่รวมการกำหนดกลุ่มชั้นสูงฝั่งด่าน (ตัวคูณเพิ่มในถ้ำกัดกร่อน · จอก เป็นต้น) และค่าสัมประสิทธิ์เนื้อเรื่อง", "vi": ", không gồm chỉ định nhóm tinh anh phía màn (hệ số thêm ở Động Ăn Mòn, Đài Sen…) và hệ số cốt truyện.", "id": ", tanpa penetapan grup elit sisi stage (pengali tambahan di Gua Korosi, Cawan, dll.) dan koefisien cerita.",
    },
    "vor.disambigNote": {
        "cn": "本页「污染」指「贪饕」侵蚀污染；4.5 联动「命运/今晚留下来」的「圣杯战争 · 污染等级 1–7 / 深度污染 / 污染词条」是另一套无关体系，两者不合并叙述、也不互相内链。", "cht": "本頁「污染」指「貪饕」侵蝕污染；4.5 聯動「命运/今晚留下来」的「聖杯戰爭 · 污染等級 1–7 / 深度污染 / 污染詞條」是另一套無關體系，兩者不合併敘述、也不互相內鏈。", "en": "“Corruption” on this page means the Voracity's corrosion. The “Holy Grail War · Corruption Level 1–7 / Deep Corruption / corruption affixes” from the 4.5 crossover is a separate, unrelated system: they are not described together and do not cross-link.", "jp": "本ページの「汚染」は「貪食」の侵蝕汚染を指します。4.5 コラボの「聖杯戦争 · 汚染レベル 1–7 / 深層汚染 / 汚染詞条」は別系統であり、併記も相互リンクもしません。", "kr": "이 페이지의 「오염」은 「탐식」 침식 오염을 뜻합니다. 4.5 콜라보의 「성배전쟁 · 오염 등급 1–7 / 심층 오염 / 오염 옵션」은 별개 체계로, 함께 서술하거나 상호 링크하지 않습니다.", "es": "La «corrupción» de esta página es la corrosión de la Gula. El «Guerra del Santo Grial · Nivel de corrupción 1–7 / Corrupción profunda / afijos» del crossover 4.5 es otro sistema: no se narran juntos ni se enlazan.", "fr": "La « corruption » ici désigne la corrosion de la Voracité. La « Guerre du Saint-Graal · Niveau de corruption 1–7 / Corruption profonde / affixes » du crossover 4.5 est un autre système : pas de récit commun ni de liens croisés.", "de": "„Korruption“ meint hier die Verätzung der Völlerei. Der „Heiliger-Gral-Krieg · Korruptionsstufe 1–7 / Tiefe Korruption / Affixe“ aus dem 4.5-Crossover ist ein separates System: keine gemeinsame Darstellung, keine Querverweise.", "pt": "“Corrupção” aqui é a corrosão da Voracidade. A “Guerra do Santo Graal · Nível de corrupção 1–7 / Corrupção profunda / afixos” do crossover 4.5 é outro sistema: não são narrados juntos nem se interligam.", "ru": "«Заражение» здесь — это коррозия Обжорства. «Война за Святой Грааль · Уровень заражения 1–7 / Глубокое заражение / аффиксы» из кроссовера 4.5 — отдельная система: не описываются вместе и не ссылаются друг на друга.", "th": "“การกัดกร่อน” ในหน้านี้หมายถึงการกัดกร่อนของ “ตะกละ” ส่วน “สงครามจอกศักดิ์สิทธิ์ · ระดับกัดกร่อน 1–7 / กัดกร่อนลึก / คำเสริม” จากครอสโอเวอร์ 4.5 เป็นอีกระบบหนึ่ง ไม่รวมเล่าและไม่ลิงก์กัน", "vi": "“Ăn mòn” ở trang này là ăn mòn của “Tham Lam”. “Chiến tranh Chén Thánh · Cấp ăn mòn 1–7 / Ăn mòn sâu / Dòng ăn mòn” của crossover 4.5 là hệ thống khác, không kể chung và không liên kết.", "id": "“Korupsi” di halaman ini berarti korosi Voracity. “Perang Cawan Suci · Tingkat korupsi 1–7 / Korupsi dalam / afiks korupsi” dari crossover 4.5 adalah sistem lain: tidak dibahas bersama dan tidak saling tertaut.",
    },
    "mob.stage": {
        "cn": "阶段 {n}", "cht": "階段 {n}", "en": "Phase {n}", "jp": "フェーズ {n}", "kr": "페이즈 {n}", "es": "Fase {n}", "fr": "Phase {n}", "de": "Phase {n}", "pt": "Fase {n}", "ru": "Фаза {n}", "th": "เฟส {n}", "vi": "Giai đoạn {n}", "id": "Fase {n}",
    },
    "mob.appearIn": {
        "cn": "出现在", "cht": "出現在", "en": "Appears in", "jp": "出現：", "kr": "출현:", "es": "Aparece en", "fr": "Apparaît dans", "de": "Kommt vor in", "pt": "Aparece em", "ru": "Появляется на", "th": "ปรากฏใน", "vi": "Xuất hiện ở", "id": "Muncul di",
    },
    "mob.appearStages": {
        "cn": "个关卡", "cht": "個關卡", "en": " stages", "jp": " ステージ", "kr": "개 스테이지", "es": " etapas", "fr": " étapes", "de": " Stufen", "pt": " estágios", "ru": " этапах", "th": " ด่าน", "vi": " màn", "id": " stage",
    },
    "card.value.stance": {
        "cn": "韧性 {v}", "cht": "韌性 {v}", "en": "Toughness {v}", "jp": "靭性 {v}", "kr": "강인도 {v}", "es": "Robustez {v}", "fr": "Robustesse {v}", "de": "Robustheit {v}", "pt": "Robustez {v}", "ru": "Прочность {v}", "th": "ความแข็งแกร่ง {v}", "vi": "Độ Bền {v}", "id": "Ketangguhan {v}",
    },
    "card.value.speed": {
        "cn": "速度 {v}", "cht": "速度 {v}", "en": "SPD {v}", "jp": "速度 {v}", "kr": "속도 {v}", "es": "VEL {v}", "fr": "VIT {v}", "de": "GES {v}", "pt": "VEL {v}", "ru": "Скорость {v}", "th": "ความเร็ว {v}", "vi": "Tốc độ {v}", "id": "SPD {v}",
    },
    "card.weak": {
        "cn": "弱点：{list}", "cht": "弱點：{list}", "en": "Weakness: {list}", "jp": "弱点：{list}", "kr": "약점: {list}", "es": "Debilidad: {list}", "fr": "Faiblesse : {list}", "de": "Schwäche: {list}", "pt": "Fraqueza: {list}", "ru": "Уязвимость: {list}", "th": "จุดอ่อน: {list}", "vi": "Điểm yếu: {list}", "id": "Kelemahan: {list}",
    },
    "card.resist": {
        "cn": "抗性：{list}", "cht": "抗性：{list}", "en": "Resist: {list}", "jp": "耐性：{list}", "kr": "저항: {list}", "es": "Resistencia: {list}", "fr": "Résistance : {list}", "de": "Resistenz: {list}", "pt": "Resistência: {list}", "ru": "Сопротивление: {list}", "th": "ต้านทาน: {list}", "vi": "Kháng: {list}", "id": "Resistensi: {list}",
    },
    "card.effectRes": {
        "cn": "效果抵抗 {v}", "cht": "效果抵抗 {v}", "en": "Effect RES {v}", "jp": "効果抵抗 {v}", "kr": "효과 저항 {v}", "es": "RES a efectos {v}", "fr": "RÉS aux effets {v}", "de": "Effekt-RES {v}", "pt": "RES a efeitos {v}", "ru": "Сопр. эффектам {v}", "th": "ต้านทานเอฟเฟกต์ {v}", "vi": "Kháng hiệu ứng {v}", "id": "RES efek {v}",
    },
    "card.viewDetail": {
        "cn": "查看 {name} 详情", "cht": "查看 {name} 詳情", "en": "View {name} details", "jp": "{name} の詳細を見る", "kr": "{name} 상세 보기", "es": "Ver detalles de {name}", "fr": "Voir les détails de {name}", "de": "Details zu {name}", "pt": "Ver detalhes de {name}", "ru": "Подробнее о {name}", "th": "ดูรายละเอียด {name}", "vi": "Xem chi tiết {name}", "id": "Lihat detail {name}",
    },
    "cwHub.tagline": {
        "cn": "赢者通吃的零和博弈。招募、羁绊、站位、策略，构筑你的最强阵容。", "cht": "贏者通吃的零和博弈。招募、羈絆、站位、策略，構築你的最強陣容。", "en": "A winner-takes-all zero-sum game. Recruit, build synergies, position, and strategize to forge your strongest lineup.", "jp": "勝者総取りのゼロサムゲーム。招募・シナジー・配置・戦略で最強の編成を組もう。", "kr": "승자독식 제로섬 게임. 영입, 시너지, 배치, 전략으로 최강의 편성을 구성하세요.", "es": "Un juego de suma cero donde gana uno. Recluta, crea sinergias, posiciona y diseña tu mejor formación.", "fr": "Un jeu à somme nulle où le vainqueur rafle tout. Recrutez, créez des synergies et bâtissez votre meilleure équipe.", "de": "Ein Nullsummenspiel, bei dem der Sieger alles nimmt. Rekrutiere, baue Synergien, positioniere und strategiere.", "pt": "Um jogo de soma zero em que o vencedor leva tudo. Recrute, crie sinergias e monte sua melhor formação.", "ru": "Игра с нулевой суммой, где победитель забирает всё. Набирайте, стройте синергии и создавайте лучший состав.", "th": "เกมรวมศูนย์ที่ผู้ชนะได้ทั้งหมด ชักชวน สร้างซินเนอร์จี จัดตำแหน่ง และวางกลยุทธ์เพื่อจัดทีมที่แข็งแกร่งที่สุด", "vi": "Trò chơi tổng bằng không, kẻ thắng lấy hết. Chiêu mộ, cộng hưởng, xếp vị trí và lập đội hình mạnh nhất.", "id": "Permainan zero-sum pemenang ambil semua. Rekrut, sinergi, posisi, dan strategi untuk formasi terkuat.",
    },
    "cwHub.releaseTitle": {
        "cn": "本赛季新增", "cht": "本賽季新增", "en": "New this season", "jp": "今シーズンの追加", "kr": "이번 시즌 추가", "es": "Novedades de la temporada", "fr": "Nouveautés de la saison", "de": "Neu in dieser Saison", "pt": "Novidades da temporada", "ru": "Новое в сезоне", "th": "ใหม่ในซีซันนี้", "vi": "Mới trong mùa này", "id": "Baru musim ini",
    },
    "cwHub.loadingAria": {
        "cn": "本赛季新增加载中", "cht": "本賽季新增載入中", "en": "Loading season additions", "jp": "今シーズンの追加を読み込み中", "kr": "이번 시즌 추가 로드 중", "es": "Cargando novedades de la temporada", "fr": "Chargement des nouveautés", "de": "Neuerungen der Saison werden geladen", "pt": "Carregando novidades da temporada", "ru": "Загрузка новинок сезона", "th": "กำลังโหลดของใหม่ซีซันนี้", "vi": "Đang tải nội dung mới của mùa", "id": "Memuat tambahan musim ini",
    },
    "cwHub.errorTitle": {
        "cn": "赛季索引加载失败", "cht": "賽季索引載入失敗", "en": "Failed to load season index", "jp": "シーズン索引の読み込みに失敗", "kr": "시즌 색인 로드 실패", "es": "No se pudo cargar el índice", "fr": "Échec du chargement de l'index", "de": "Saisonindex konnte nicht geladen werden", "pt": "Falha ao carregar o índice", "ru": "Не удалось загрузить индекс", "th": "โหลดดัชนีซีซันไม่สำเร็จ", "vi": "Không tải được chỉ mục mùa", "id": "Gagal memuat indeks musim",
    },
    "cwHub.errorDetail": {
        "cn": "{labels}索引都没取到，无法判定本赛季新增，重试即可恢复。", "cht": "{labels}索引都沒取到，無法判定本賽季新增，重試即可恢復。", "en": "None of the {labels} indexes loaded, so this season's additions cannot be determined. Retrying should fix it.", "jp": "{labels}の索引が取得できず、今シーズンの追加を判定できません。再試行してください。", "kr": "{labels} 색인을 가져오지 못해 이번 시즌 추가 항목을 판단할 수 없습니다. 다시 시도해 주세요.", "es": "No se cargó ningún índice de {labels}, así que no se pueden determinar las novedades. Reintenta.", "fr": "Aucun index {labels} chargé, impossible de déterminer les ajouts. Réessayez.", "de": "Keine {labels}-Indizes geladen, Neuerungen nicht bestimmbar. Bitte erneut versuchen.", "pt": "Nenhum índice de {labels} carregado, não é possível determinar as novidades. Tente novamente.", "ru": "Индексы {labels} не загрузились, новое в сезоне определить нельзя. Попробуйте снова.", "th": "โหลดดัชนี {labels} ไม่ได้ จึงระบุของใหม่ซีซันนี้ไม่ได้ ลองอีกครั้ง", "vi": "Không tải được chỉ mục {labels}, không xác định được nội dung mới. Thử lại.", "id": "Indeks {labels} gagal dimuat, tambahan musim tidak dapat ditentukan. Coba lagi.",
    },
    "cwHub.empty": {
        "cn": "本赛季暂无新增条目", "cht": "本賽季暫無新增條目", "en": "No new entries this season", "jp": "今シーズンの追加項目はありません", "kr": "이번 시즌 추가 항목이 없습니다", "es": "Sin entradas nuevas esta temporada", "fr": "Aucune nouvelle entrée cette saison", "de": "Keine neuen Einträge in dieser Saison", "pt": "Sem entradas novas nesta temporada", "ru": "В этом сезоне новых записей нет", "th": "ไม่มีรายการใหม่ในซีซันนี้", "vi": "Không có mục mới trong mùa này", "id": "Tidak ada entri baru musim ini",
    },
    "egd.rule.cycles": {
        "cn": "回合限制 CYCLES", "cht": "回合限制 CYCLES", "en": "Turn limit CYCLES", "jp": "ターン制限 CYCLES", "kr": "턴 제한 CYCLES", "es": "Límite de turnos CYCLES", "fr": "Limite de tours CYCLES", "de": "Zuglimit CYCLES", "pt": "Limite de turnos CYCLES", "ru": "Лимит ходов CYCLES", "th": "จำกัดเทิร์น CYCLES", "vi": "Giới hạn lượt CYCLES", "id": "Batas giliran CYCLES",
    },
    "egd.rule.score": {
        "cn": "通关分数线 SCORE", "cht": "通關分數線 SCORE", "en": "Clear score SCORE", "jp": "クリアスコア SCORE", "kr": "클리어 점수 SCORE", "es": "Puntuación SCORE", "fr": "Score SCORE", "de": "Punkte SCORE", "pt": "Pontuação SCORE", "ru": "Проходной балл SCORE", "th": "คะแนนผ่าน SCORE", "vi": "Điểm đạt SCORE", "id": "Skor SCORE",
    },
    "egd.wavesEnemies": {
        "cn": "{waves} 波 · {mons} 敌", "cht": "{waves} 波 · {mons} 敵", "en": "{waves} waves · {mons} enemies", "jp": "{waves} ウェーブ · {mons} 体", "kr": "{waves} 웨이브 · {mons}적", "es": "{waves} oleadas · {mons} enemigos", "fr": "{waves} vagues · {mons} ennemis", "de": "{waves} Wellen · {mons} Gegner", "pt": "{waves} ondas · {mons} inimigos", "ru": "{waves} волн · {mons} врагов", "th": "{waves} เวฟ · {mons} ศัตรู", "vi": "{waves} đợt · {mons} kẻ địch", "id": "{waves} gelombang · {mons} musuh",
    },
    "egd.score.total": {
        "cn": "分数", "cht": "分數", "en": "Score", "jp": "スコア", "kr": "점수", "es": "Puntuación", "fr": "Score", "de": "Punkte", "pt": "Pontuação", "ru": "Очки", "th": "คะแนน", "vi": "Điểm", "id": "Skor",
    },
    "egd.score.dead": {
        "cn": "减员", "cht": "減員", "en": "Casualties", "jp": "戦闘不能", "kr": "전투불능", "es": "Bajas", "fr": "Pertes", "de": "Ausfälle", "pt": "Baixas", "ru": "Потери", "th": "สูญเสีย", "vi": "Tổn thất", "id": "Korban",
    },
    "egd.unknownMode": {
        "cn": "未知的终局模式: {mode}", "cht": "未知的終局模式: {mode}", "en": "Unknown endgame mode: {mode}", "jp": "不明な終局モード: {mode}", "kr": "알 수 없는 종국 모드: {mode}", "es": "Modo desconocido: {mode}", "fr": "Mode inconnu : {mode}", "de": "Unbekannter Modus: {mode}", "pt": "Modo desconhecido: {mode}", "ru": "Неизвестный режим: {mode}", "th": "โหมดไม่รู้จัก: {mode}", "vi": "Chế độ không xác định: {mode}", "id": "Mode tidak dikenal: {mode}",
    },
    "egd.seasonNotFound": {
        "cn": "未找到赛季 {mode}/{id}", "cht": "未找到賽季 {mode}/{id}", "en": "Season {mode}/{id} not found", "jp": "シーズン {mode}/{id} が見つかりません", "kr": "시즌 {mode}/{id}을(를) 찾을 수 없습니다", "es": "Temporada {mode}/{id} no encontrada", "fr": "Saison {mode}/{id} introuvable", "de": "Saison {mode}/{id} nicht gefunden", "pt": "Temporada {mode}/{id} não encontrada", "ru": "Сезон {mode}/{id} не найден", "th": "ไม่พบซีซัน {mode}/{id}", "vi": "Không tìm thấy mùa {mode}/{id}", "id": "Musim {mode}/{id} tidak ditemukan",
    },
    "egd.loadingAria": {
        "cn": "赛季详情加载中", "cht": "賽季詳情載入中", "en": "Loading season data", "jp": "シーズン詳細を読み込み中", "kr": "시즌 상세 로드 중", "es": "Cargando datos de la temporada", "fr": "Chargement de la saison", "de": "Saisondaten werden geladen", "pt": "Carregando dados da temporada", "ru": "Загрузка данных сезона", "th": "กำลังโหลดข้อมูลซีซัน", "vi": "Đang tải dữ liệu mùa", "id": "Memuat data musim",
    },
    "egd.errorTitle": {
        "cn": "赛季数据加载失败", "cht": "賽季資料載入失敗", "en": "Failed to load season data", "jp": "シーズンデータの読み込みに失敗", "kr": "시즌 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Saisondaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลซีซันไม่สำเร็จ", "vi": "Không tải được dữ liệu mùa", "id": "Gagal memuat data musim",
    },
    "egd.empty.stages": {
        "cn": "本赛季暂无关卡数据", "cht": "本賽季暫無關卡資料", "en": "No stage data this season", "jp": "今シーズンのステージデータはありません", "kr": "이번 시즌 스테이지 데이터가 없습니다", "es": "Sin datos de etapas esta temporada", "fr": "Aucune donnée d'étape cette saison", "de": "Keine Stufendaten in dieser Saison", "pt": "Sem dados de estágios nesta temporada", "ru": "В этом сезоне данных об этапах нет", "th": "ไม่มีข้อมูลด่านในซีซันนี้", "vi": "Không có dữ liệu màn trong mùa này", "id": "Tidak ada data stage musim ini",
    },
    "egd.navAria": {
        "cn": "相邻赛季", "cht": "相鄰賽季", "en": "Adjacent seasons", "jp": "前後のシーズン", "kr": "인접 시즌", "es": "Temporadas adyacentes", "fr": "Saisons adjacentes", "de": "Benachbarte Saisons", "pt": "Temporadas adjacentes", "ru": "Соседние сезоны", "th": "ซีซันข้างเคียง", "vi": "Mùa liền kề", "id": "Musim berdekatan",
    },
    "egd.prevSeason": {
        "cn": "← 上一赛季", "cht": "← 上一賽季", "en": "← Previous season", "jp": "← 前のシーズン", "kr": "← 이전 시즌", "es": "← Temporada anterior", "fr": "← Saison précédente", "de": "← Vorherige Saison", "pt": "← Temporada anterior", "ru": "← Предыдущий сезон", "th": "← ซีซันก่อน", "vi": "← Mùa trước", "id": "← Musim sebelumnya",
    },
    "egd.nextSeason": {
        "cn": "下一赛季 →", "cht": "下一賽季 →", "en": "Next season →", "jp": "次のシーズン →", "kr": "다음 시즌 →", "es": "Temporada siguiente →", "fr": "Saison suivante →", "de": "Nächste Saison →", "pt": "Próxima temporada →", "ru": "Следующий сезон →", "th": "ซีซันถัดไป →", "vi": "Mùa sau →", "id": "Musim berikutnya →",
    },
    "skill.noCost": {
        "cn": "不消耗", "cht": "不消耗", "en": "No cost", "jp": "消費なし", "kr": "소모 없음", "es": "Sin coste", "fr": "Aucun coût", "de": "Keine Kosten", "pt": "Sem custo", "ru": "Без затрат", "th": "ไม่ใช้", "vi": "Không tiêu hao", "id": "Tanpa biaya",
    },
    "egd.pollution.tierceExtra": {
        "cn": "星启附加关", "cht": "星啟附加關", "en": "Tierce bonus stage", "jp": "星啓追加ステージ", "kr": "성기 추가 스테이지", "es": "Etapa extra de Tierce", "fr": "Étape bonus Tierce", "de": "Tierce-Zusatzstufe", "pt": "Estágio extra de Tierce", "ru": "Доп. этап Tierce", "th": "ด่านเสริม Tierce", "vi": "Màn phụ Tierce", "id": "Stage bonus Tierce",
    },
    "egd.pollution.stage": {
        "cn": "关卡", "cht": "關卡", "en": "Stage", "jp": "ステージ", "kr": "스테이지", "es": "Etapa", "fr": "Étape", "de": "Stufe", "pt": "Estágio", "ru": "Этап", "th": "ด่าน", "vi": "Màn", "id": "Stage",
    },
    "egd.pollution.half1": {
        "cn": "上半场", "cht": "上半場", "en": "First half", "jp": "前半", "kr": "전반", "es": "Primera mitad", "fr": "Première mi-temps", "de": "Erste Hälfte", "pt": "Primeira metade", "ru": "Первая половина", "th": "ครึ่งแรก", "vi": "Hiệp đầu", "id": "Babak pertama",
    },
    "egd.pollution.half2": {
        "cn": "下半场", "cht": "下半場", "en": "Second half", "jp": "後半", "kr": "후반", "es": "Segunda mitad", "fr": "Seconde mi-temps", "de": "Zweite Hälfte", "pt": "Segunda metade", "ru": "Вторая половина", "th": "ครึ่งหลัง", "vi": "Hiệp sau", "id": "Babak kedua",
    },
    "egd.pollution.floorHalf": {
        "cn": "第 {n} 层 · {half}", "cht": "第 {n} 層 · {half}", "en": "Tier {n} · {half}", "jp": "第 {n} 階層 · {half}", "kr": "{n}층 · {half}", "es": "Nivel {n} · {half}", "fr": "Palier {n} · {half}", "de": "Ebene {n} · {half}", "pt": "Nível {n} · {half}", "ru": "Уровень {n} · {half}", "th": "ชั้น {n} · {half}", "vi": "Tầng {n} · {half}", "id": "Tingkat {n} · {half}",
    },
    "toast.cdnDown": {
        "cn": "CDN 资源暂不可用，图片与动画已降级展示", "cht": "CDN 資源暫不可用，圖片與動畫已降級展示", "en": "CDN assets are unavailable; images and animations are shown in degraded mode", "jp": "CDN リソースが利用できないため、画像とアニメは簡易表示です", "kr": "CDN 리소스를 사용할 수 없어 이미지와 애니메이션이 간소화 표시됩니다", "es": "Los recursos CDN no están disponibles; imágenes y animaciones se muestran degradadas", "fr": "Ressources CDN indisponibles ; images et animations en mode dégradé", "de": "CDN-Ressourcen nicht verfügbar; Bilder und Animationen eingeschränkt", "pt": "Recursos CDN indisponíveis; imagens e animações em modo degradado", "ru": "Ресурсы CDN недоступны; изображения и анимации показаны в упрощённом виде", "th": "ทรัพยากร CDN ใช้ไม่ได้ รูปและแอนิเมชันแสดงแบบลดทอน", "vi": "Tài nguyên CDN không khả dụng; ảnh và hoạt ảnh hiển thị giản lược", "id": "Aset CDN tidak tersedia; gambar dan animasi ditampilkan sederhana",
    },
    "toast.cdnUp": {
        "cn": "CDN 已恢复，图片自动重载", "cht": "CDN 已恢復，圖片自動重載", "en": "CDN restored; images reloaded automatically", "jp": "CDN が復旧し、画像を自動で再読み込みしました", "kr": "CDN이 복구되어 이미지를 자동으로 다시 불러왔습니다", "es": "CDN restaurado; imágenes recargadas automáticamente", "fr": "CDN rétabli ; images rechargées automatiquement", "de": "CDN wieder verfügbar; Bilder neu geladen", "pt": "CDN restaurado; imagens recarregadas automaticamente", "ru": "CDN восстановлен; изображения перезагружены", "th": "CDN กลับมาแล้ว รูปถูกโหลดใหม่", "vi": "CDN đã phục hồi; ảnh tự động tải lại", "id": "CDN pulih; gambar dimuat ulang",
    },
    "catalog.loadError": {
        "cn": "数据加载失败", "cht": "資料載入失敗", "en": "Failed to load data", "jp": "データの読み込みに失敗", "kr": "데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Daten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลไม่สำเร็จ", "vi": "Không tải được dữ liệu", "id": "Gagal memuat data",
    },
    "catalog.loadingAria": {
        "cn": "{title}加载中", "cht": "{title}載入中", "en": "Loading {title}", "jp": "{title}を読み込み中", "kr": "{title} 로드 중", "es": "Cargando {title}", "fr": "Chargement de {title}", "de": "{title} wird geladen", "pt": "Carregando {title}", "ru": "Загрузка {title}", "th": "กำลังโหลด {title}", "vi": "Đang tải {title}", "id": "Memuat {title}",
    },
    "catalog.emptyFiltered": {
        "cn": "当前搜索或筛选条件下没有匹配条目。", "cht": "目前搜尋或篩選條件下沒有符合的條目。", "en": "No entries match the current search or filters.", "jp": "現在の検索・絞り込み条件に一致する項目はありません。", "kr": "현재 검색·필터 조건에 맞는 항목이 없습니다.", "es": "Ninguna entrada coincide con la búsqueda o los filtros.", "fr": "Aucune entrée ne correspond à la recherche ou aux filtres.", "de": "Keine Einträge passen zu Suche oder Filtern.", "pt": "Nenhuma entrada corresponde à busca ou aos filtros.", "ru": "Нет записей по текущему поиску или фильтрам.", "th": "ไม่มีรายการที่ตรงกับคำค้นหรือตัวกรอง", "vi": "Không có mục nào khớp tìm kiếm hoặc bộ lọc.", "id": "Tidak ada entri yang cocok dengan pencarian atau filter.",
    },
    "catalog.emptyAll": {
        "cn": "该分类暂无可展示的条目。", "cht": "該分類暫無可展示的條目。", "en": "This category has no entries to show yet.", "jp": "この分類に表示できる項目はまだありません。", "kr": "이 분류에 표시할 항목이 아직 없습니다.", "es": "Esta categoría aún no tiene entradas.", "fr": "Cette catégorie n'a pas encore d'entrées.", "de": "Diese Kategorie hat noch keine Einträge.", "pt": "Esta categoria ainda não tem entradas.", "ru": "В этой категории пока нет записей.", "th": "หมวดนี้ยังไม่มีรายการให้แสดง", "vi": "Danh mục này chưa có mục nào.", "id": "Kategori ini belum punya entri.",
    },
    "catalog.clearFilters": {
        "cn": "清除搜索与筛选", "cht": "清除搜尋與篩選", "en": "Clear search and filters", "jp": "検索と絞り込みを解除", "kr": "검색 및 필터 초기화", "es": "Borrar búsqueda y filtros", "fr": "Effacer recherche et filtres", "de": "Suche und Filter löschen", "pt": "Limpar busca e filtros", "ru": "Сбросить поиск и фильтры", "th": "ล้างคำค้นและตัวกรอง", "vi": "Xóa tìm kiếm và bộ lọc", "id": "Hapus pencarian dan filter",
    },
    "common.loadFailed": {
        "cn": "加载失败: {msg}", "cht": "載入失敗: {msg}", "en": "Load failed: {msg}", "jp": "読み込み失敗: {msg}", "kr": "로드 실패: {msg}", "es": "Error de carga: {msg}", "fr": "Échec du chargement : {msg}", "de": "Laden fehlgeschlagen: {msg}", "pt": "Falha ao carregar: {msg}", "ru": "Ошибка загрузки: {msg}", "th": "โหลดไม่สำเร็จ: {msg}", "vi": "Tải thất bại: {msg}", "id": "Gagal memuat: {msg}",
    },
    "cwTrait.layerCount": {
        "cn": "{n}层", "cht": "{n}層", "en": "{n} tiers", "jp": "{n} 段階", "kr": "{n}단계", "es": "{n} niveles", "fr": "{n} paliers", "de": "{n} Stufen", "pt": "{n} níveis", "ru": "{n} уровней", "th": "{n} ชั้น", "vi": "{n} tầng", "id": "{n} tingkat",
    },
    "egd.pollutionTitle": {
        "cn": "本季 {n} 处污染关卡 · 等级 {levels}", "cht": "本季 {n} 處污染關卡 · 等級 {levels}", "en": "{n} corrupted stages this season · Level {levels}", "jp": "今季 {n} 箇所の汚染ステージ · レベル {levels}", "kr": "이번 시즌 오염 스테이지 {n}곳 · 레벨 {levels}", "es": "{n} etapas corrompidas esta temporada · Nivel {levels}", "fr": "{n} étapes corrompues cette saison · Niveau {levels}", "de": "{n} korrumpierte Stufen diese Saison · Stufe {levels}", "pt": "{n} estágios corrompidos nesta temporada · Nível {levels}", "ru": "{n} заражённых этапов в сезоне · Уровень {levels}", "th": "ด่านปนเปื้อน {n} แห่งซีซันนี้ · ระดับ {levels}", "vi": "{n} màn nhiễm mùa này · Cấp {levels}", "id": "{n} stage terkontaminasi musim ini · Level {levels}",
    },
    "mob.badge.variant": {
        "cn": "变体 {i}/{n}", "cht": "變體 {i}/{n}", "en": "Variant {i}/{n}", "jp": "バリエーション {i}/{n}", "kr": "변형 {i}/{n}", "es": "Variante {i}/{n}", "fr": "Variante {i}/{n}", "de": "Variante {i}/{n}", "pt": "Variante {i}/{n}", "ru": "Вариант {i}/{n}", "th": "ร่างแปร {i}/{n}", "vi": "Biến thể {i}/{n}", "id": "Varian {i}/{n}",
    },
    "mob.noWeak": {
        "cn": "无弱点", "cht": "無弱點", "en": "No weakness", "jp": "弱点なし", "kr": "약점 없음", "es": "Sin debilidad", "fr": "Aucune faiblesse", "de": "Keine Schwäche", "pt": "Sem fraqueza", "ru": "Нет уязвимости", "th": "ไม่มีจุดอ่อน", "vi": "Không có điểm yếu", "id": "Tanpa kelemahan",
    },
    "mob.card.weak": {
        "cn": "弱点 {list}", "cht": "弱點 {list}", "en": "Weakness {list}", "jp": "弱点 {list}", "kr": "약점 {list}", "es": "Debilidad {list}", "fr": "Faiblesse {list}", "de": "Schwäche {list}", "pt": "Fraqueza {list}", "ru": "Уязвимость {list}", "th": "จุดอ่อน {list}", "vi": "Điểm yếu {list}", "id": "Kelemahan {list}",
    },
    "char.idFallback": {
        "cn": "角色 {id}", "cht": "角色 {id}", "en": "Character {id}", "jp": "キャラ {id}", "kr": "캐릭터 {id}", "es": "Personaje {id}", "fr": "Personnage {id}", "de": "Charakter {id}", "pt": "Personagem {id}", "ru": "Персонаж {id}", "th": "ตัวละคร {id}", "vi": "Nhân vật {id}", "id": "Karakter {id}",
    },
    "char.noAnimation": {
        "cn": "该角色暂无动画展示", "cht": "該角色暫無動畫展示", "en": "No animation available for this character", "jp": "このキャラのアニメはありません", "kr": "이 캐릭터는 애니메이션이 없습니다", "es": "Sin animación para este personaje", "fr": "Aucune animation pour ce personnage", "de": "Keine Animation für diesen Charakter", "pt": "Sem animação para este personagem", "ru": "Анимации для этого персонажа нет", "th": "ไม่มีแอนิเมชันสำหรับตัวละครนี้", "vi": "Nhân vật này chưa có hoạt ảnh", "id": "Belum ada animasi untuk karakter ini",
    },
    "char.animation": {
        "cn": "动画", "cht": "動畫", "en": "Animation", "jp": "アニメ", "kr": "애니메이션", "es": "Animación", "fr": "Animation", "de": "Animation", "pt": "Animação", "ru": "Анимация", "th": "แอนิเมชัน", "vi": "Hoạt ảnh", "id": "Animasi",
    },
    "char.eidolonIndex": {
        "cn": "星魂索引", "cht": "星魂索引", "en": "Eidolon index", "jp": "星魂索引", "kr": "성혼 색인", "es": "Índice de eidolones", "fr": "Index des eidolons", "de": "Eidolon-Index", "pt": "Índice de eidolons", "ru": "Указатель эйдолонов", "th": "ดัชนีอีดอลอน", "vi": "Mục lục Tinh Hồn", "id": "Indeks eidolon",
    },
    "char.skillIndex": {
        "cn": "技能索引", "cht": "技能索引", "en": "Ability index", "jp": "スキル索引", "kr": "스킬 색인", "es": "Índice de habilidades", "fr": "Index des compétences", "de": "Fähigkeitsindex", "pt": "Índice de habilidades", "ru": "Указатель навыков", "th": "ดัชนีสกิล", "vi": "Mục lục kỹ năng", "id": "Indeks skill",
    },
    "char.bonusAbility": {
        "cn": "附加能力 {n}", "cht": "附加能力 {n}", "en": "Bonus Ability {n}", "jp": "追加能力 {n}", "kr": "부가 능력 {n}", "es": "Habilidad adicional {n}", "fr": "Capacité bonus {n}", "de": "Zusatzfähigkeit {n}", "pt": "Habilidade adicional {n}", "ru": "Доп. способность {n}", "th": "ความสามารถเสริม {n}", "vi": "Năng lực bổ sung {n}", "id": "Kemampuan tambahan {n}",
    },
    "char.storyLabel": {
        "cn": "角色档案 · {idx}", "cht": "角色檔案 · {idx}", "en": "Character files · {idx}", "jp": "キャラ資料 · {idx}", "kr": "캐릭터 기록 · {idx}", "es": "Archivo del personaje · {idx}", "fr": "Dossier · {idx}", "de": "Charakterakte · {idx}", "pt": "Arquivo do personagem · {idx}", "ru": "Досье персонажа · {idx}", "th": "แฟ้มตัวละคร · {idx}", "vi": "Hồ sơ nhân vật · {idx}", "id": "Berkas karakter · {idx}",
    },
    "char.cv.zh": {
        "cn": "CV · 中文", "cht": "CV · 中文", "en": "CV · Chinese", "jp": "CV · 中国語", "kr": "CV · 중국어", "es": "CV · Chino", "fr": "CV · Chinois", "de": "CV · Chinesisch", "pt": "CV · Chinês", "ru": "CV · Китайский", "th": "CV · จีน", "vi": "CV · Trung", "id": "CV · Mandarin",
    },
    "char.cv.ja": {
        "cn": "CV · 日语", "cht": "CV · 日語", "en": "CV · Japanese", "jp": "CV · 日本語", "kr": "CV · 일본어", "es": "CV · Japonés", "fr": "CV · Japonais", "de": "CV · Japanisch", "pt": "CV · Japonês", "ru": "CV · Японский", "th": "CV · ญี่ปุ่น", "vi": "CV · Nhật", "id": "CV · Jepang",
    },
    "char.cv.ko": {
        "cn": "CV · 韩语", "cht": "CV · 韓語", "en": "CV · Korean", "jp": "CV · 韓国語", "kr": "CV · 한국어", "es": "CV · Coreano", "fr": "CV · Coréen", "de": "CV · Koreanisch", "pt": "CV · Coreano", "ru": "CV · Корейский", "th": "CV · เกาหลี", "vi": "CV · Hàn", "id": "CV · Korea",
    },
    "char.cv.en": {
        "cn": "CV · 英语", "cht": "CV · 英語", "en": "CV · English", "jp": "CV · 英語", "kr": "CV · 영어", "es": "CV · Inglés", "fr": "CV · Anglais", "de": "CV · Englisch", "pt": "CV · Inglês", "ru": "CV · Английский", "th": "CV · อังกฤษ", "vi": "CV · Anh", "id": "CV · Inggris",
    },
    "build.team": {
        "cn": "配队", "cht": "配隊", "en": "Team", "jp": "編成", "kr": "편성", "es": "Equipo", "fr": "Équipe", "de": "Team", "pt": "Equipe", "ru": "Команда", "th": "ทีม", "vi": "Đội hình", "id": "Tim",
    },
    "build.currentChar": {
        "cn": "当前角色", "cht": "當前角色", "en": "Current character", "jp": "現在のキャラ", "kr": "현재 캐릭터", "es": "Personaje actual", "fr": "Personnage actuel", "de": "Aktueller Charakter", "pt": "Personagem atual", "ru": "Текущий персонаж", "th": "ตัวละครปัจจุบัน", "vi": "Nhân vật hiện tại", "id": "Karakter saat ini",
    },
    "build.recommendedSub": {
        "cn": "推荐副词条", "cht": "推薦副詞條", "en": "Recommended substats", "jp": "おすすめサブステータス", "kr": "추천 부옵션", "es": "Substats recomendados", "fr": "Substats recommandés", "de": "Empfohlene Substats", "pt": "Substats recomendados", "ru": "Рекомендуемые субстаты", "th": "ค่าธุรกรรมย่อยที่แนะนำ", "vi": "Dòng phụ gợi ý", "id": "Substat rekomendasi",
    },
    "build.empty": {
        "cn": "暂无配装数据", "cht": "暫無配裝資料", "en": "No build data yet", "jp": "ビルドデータはありません", "kr": "빌드 데이터가 없습니다", "es": "Sin datos de build", "fr": "Aucune donnée de build", "de": "Keine Build-Daten", "pt": "Sem dados de build", "ru": "Нет данных о сборке", "th": "ไม่มีข้อมูลบิลด์", "vi": "Chưa có dữ liệu build", "id": "Belum ada data build",
    },
    "relic.sec.main": {
        "cn": "主词条", "cht": "主詞條", "en": "Main stat", "jp": "メインステータス", "kr": "주 옵션", "es": "Stat principal", "fr": "Stat principale", "de": "Hauptwert", "pt": "Stat principal", "ru": "Основной стат", "th": "ค่าธุรกรรมหลัก", "vi": "Dòng chính", "id": "Stat utama",
    },
    "relic.sec.sub": {
        "cn": "副词条", "cht": "副詞條", "en": "Substat", "jp": "サブステータス", "kr": "부 옵션", "es": "Substat", "fr": "Substat", "de": "Substat", "pt": "Substat", "ru": "Субстат", "th": "ค่าธุรกรรมย่อย", "vi": "Dòng phụ", "id": "Substat",
    },
    "notfound.title": {
        "cn": "数据节点未连接", "cht": "資料節點未連接", "en": "Data node not connected", "jp": "データノード未接続", "kr": "데이터 노드 미연결", "es": "Nodo de datos no conectado", "fr": "Nœud de données non connecté", "de": "Datenknoten nicht verbunden", "pt": "Nó de dados não conectado", "ru": "Узел данных не подключён", "th": "โหนดข้อมูลไม่เชื่อมต่อ", "vi": "Nút dữ liệu chưa kết nối", "id": "Node data tidak terhubung",
    },
    "notfound.desc": {
        "cn": "请求的路径不存在或已被移除。", "cht": "請求的路徑不存在或已被移除。", "en": "The requested path does not exist or was removed.", "jp": "要求されたパスは存在しないか削除されました。", "kr": "요청한 경로가 없거나 제거되었습니다.", "es": "La ruta solicitada no existe o fue eliminada.", "fr": "Le chemin demandé n'existe pas ou a été supprimé.", "de": "Der angeforderte Pfad existiert nicht oder wurde entfernt.", "pt": "O caminho solicitado não existe ou foi removido.", "ru": "Запрошенный путь не существует или удалён.", "th": "เส้นทางที่ขอไม่มีอยู่หรือถูกลบไปแล้ว", "vi": "Đường dẫn không tồn tại hoặc đã bị xoá.", "id": "Jalur yang diminta tidak ada atau telah dihapus.",
    },
    "notfound.back": {
        "cn": "返回首页", "cht": "返回首頁", "en": "Back to home", "jp": "ホームへ戻る", "kr": "홈으로", "es": "Volver al inicio", "fr": "Retour à l'accueil", "de": "Zur Startseite", "pt": "Voltar ao início", "ru": "На главную", "th": "กลับหน้าแรก", "vi": "Về trang chủ", "id": "Kembali ke beranda",
    },
    "theme.accent.terracotta": {
        "cn": "赤陶", "cht": "赤陶", "en": "Terracotta", "jp": "テラコッタ", "kr": "테라코타", "es": "Terracota", "fr": "Terracotta", "de": "Terracotta", "pt": "Terracota", "ru": "Терракота", "th": "เทอร์ราคอตตา", "vi": "Đất nung", "id": "Terakota",
    },
    "theme.accent.olive": {
        "cn": "橄榄青", "cht": "橄欖青", "en": "Olive", "jp": "オリーブ", "kr": "올리브", "es": "Oliva", "fr": "Olive", "de": "Oliv", "pt": "Oliva", "ru": "Олива", "th": "มะกอก", "vi": "Ô liu", "id": "Zaitun",
    },
    "theme.accent.slate": {
        "cn": "雾霭蓝灰", "cht": "霧靄藍灰", "en": "Misty slate", "jp": "ミストスレート", "kr": "안개 슬레이트", "es": "Pizarra brumosa", "fr": "Ardoise brumeuse", "de": "Nebelschiefer", "pt": "Ardósia enevoada", "ru": "Туманный сланец", "th": "หมอกหินชนวน", "vi": "Xám sương", "id": "Batu tulis berkabut",
    },
    "theme.accent.sand": {
        "cn": "暖沙棕", "cht": "暖沙棕", "en": "Warm sand", "jp": "ウォームサンド", "kr": "따뜻한 모래", "es": "Arena cálida", "fr": "Sable chaud", "de": "Warmer Sand", "pt": "Areia quente", "ru": "Тёплый песок", "th": "ทรายอุ่น", "vi": "Cát ấm", "id": "Pasir hangat",
    },
    "theme.accent.iris": {
        "cn": "暮山紫", "cht": "暮山紫", "en": "Dusk violet", "jp": "トワイライトバイオレット", "kr": "황혼 보라", "es": "Violeta crepuscular", "fr": "Violet crépusculaire", "de": "Dämmerungsviolett", "pt": "Violeta crepuscular", "ru": "Сумеречный фиолет", "th": "ม่วงสนธยา", "vi": "Tím hoàng hôn", "id": "Ungu senja",
    },
    "egd.buffs.title": {
        "cn": "战意机制 FURY", "cht": "戰意機制 FURY", "en": "Fury mechanics FURY", "jp": "戦意メカニクス FURY", "kr": "전의 메커니즘 FURY", "es": "Mecánica de furia FURY", "fr": "Mécanique de fureur FURY", "de": "Wutz-Mechanik FURY", "pt": "Mecânica de fúria FURY", "ru": "Механика ярости FURY", "th": "กลไกเพลิงโกรธ FURY", "vi": "Cơ chế cuồng nộ FURY", "id": "Mekanisme amarah FURY",
    },
    "egd.rule.enemies": {
        "cn": "击败首领 ENEMIES", "cht": "擊敗首領 ENEMIES", "en": "Bosses defeated ENEMIES", "jp": "撃破ボス ENEMIES", "kr": "격파 보스 ENEMIES", "es": "Jefes derrotados ENEMIES", "fr": "Boss vaincus ENEMIES", "de": "Besiegte Bosse ENEMIES", "pt": "Chefes derrotados ENEMIES", "ru": "Побеждено боссов ENEMIES", "th": "บอสที่ปราบ ENEMIES", "vi": "Hạ boss ENEMIES", "id": "Bos dikalahkan ENEMIES",
    },
    "egd.halfTabs": {
        "cn": "半场", "cht": "半場", "en": "Half", "jp": "半場", "kr": "하프", "es": "Mitad", "fr": "Mi-temps", "de": "Hälfte", "pt": "Metade", "ru": "Половина", "th": "ครึ่ง", "vi": "Hiệp", "id": "Babak",
    },
    "egd.seasonId": {
        "cn": "赛季编号 {id}", "cht": "賽季編號 {id}", "en": "Season ID {id}", "jp": "シーズン番号 {id}", "kr": "시즌 번호 {id}", "es": "ID de temporada {id}", "fr": "ID de saison {id}", "de": "Saison-Nr. {id}", "pt": "ID da temporada {id}", "ru": "Номер сезона {id}", "th": "รหัสซีซัน {id}", "vi": "Mã mùa {id}", "id": "ID musim {id}",
    },
    "egd.peak.king": {
        "cn": "王棋", "cht": "王棋", "en": "King Chess", "jp": "王棋", "kr": "왕기", "es": "Rey del ajedrez", "fr": "Roi des échecs", "de": "Königsschach", "pt": "Rei do xadrez", "ru": "Королевские шахматы", "th": "หมากรุกราชา", "vi": "Vua cờ", "id": "Raja catur",
    },
    "egd.peak.knight": {
        "cn": "骑士", "cht": "騎士", "en": "Knight", "jp": "騎士", "kr": "기사", "es": "Caballero", "fr": "Chevalier", "de": "Ritter", "pt": "Cavaleiro", "ru": "Рыцарь", "th": "อัศวิน", "vi": "Kỵ sĩ", "id": "Ksatria",
    },
    "egd.mechanic": {
        "cn": "机制", "cht": "機制", "en": "Mechanics", "jp": "仕組み", "kr": "메커니즘", "es": "Mecánica", "fr": "Mécanique", "de": "Mechanik", "pt": "Mecânica", "ru": "Механика", "th": "กลไก", "vi": "Cơ chế", "id": "Mekanisme",
    },
    "egd.starRewards": {
        "cn": "星数奖励 STAR REWARDS", "cht": "星數獎勵 STAR REWARDS", "en": "Star Rewards STAR REWARDS", "jp": "星数報酬 STAR REWARDS", "kr": "별 보상 STAR REWARDS", "es": "Recompensas de estrellas STAR REWARDS", "fr": "Récompenses d'étoiles STAR REWARDS", "de": "Sternenbelohnungen STAR REWARDS", "pt": "Recompensas de estrelas STAR REWARDS", "ru": "Награды за звёзды STAR REWARDS", "th": "รางวัลดาว STAR REWARDS", "vi": "Thưởng sao STAR REWARDS", "id": "Hadiah bintang STAR REWARDS",
    },
    "egd.starRewardsNote": {
        "cn": "每达成 1 个挑战目标计 1 星，累计达下列档位可领取", "cht": "每達成 1 個挑戰目標計 1 星，累計達下列檔位可領取", "en": "Each challenge goal met counts as 1 star; claim rewards at the tiers below", "jp": "挑戦目標を1つ達成するごとに1星。下記の段階で受け取り可能", "kr": "도전 목표 1개 달성 시 별 1개, 아래 단계에서 수령 가능", "es": "Cada objetivo cumplido cuenta como 1 estrella; reclama en los niveles siguientes", "fr": "Chaque objectif atteint compte 1 étoile ; réclamez aux paliers ci-dessous", "de": "Jedes erreichte Ziel zählt als 1 Stern; abholbar ab den Stufen unten", "pt": "Cada objetivo cumprido conta 1 estrela; resgate nos níveis abaixo", "ru": "Каждая цель даёт 1 звезду; награды по уровням ниже", "th": "เป้าหมายที่ทำได้นับ 1 ดาว รับรางวัลตามระดับด้านล่าง", "vi": "Mỗi mục tiêu đạt được tính 1 sao; nhận ở các bậc dưới", "id": "Setiap target tercapai dihitung 1 bintang; klaim di tingkat berikut",
    },
    "egd.starTierTitle": {
        "cn": "{name} · 星级奖励", "cht": "{name} · 星級獎勵", "en": "{name} · Star rewards", "jp": "{name} · 星数報酬", "kr": "{name} · 별 보상", "es": "{name} · Recompensas", "fr": "{name} · Récompenses", "de": "{name} · Sternenbelohnungen", "pt": "{name} · Recompensas", "ru": "{name} · Награды", "th": "{name} · รางวัลดาว", "vi": "{name} · Thưởng sao", "id": "{name} · Hadiah bintang",
    },
    "egd.prismStar": {
        "cn": "棱彩星", "cht": "稜彩星", "en": "Prismatic star", "jp": "プリズマ星", "kr": "프리즘 별", "es": "Estrella prismática", "fr": "Étoile prismatique", "de": "Prismastern", "pt": "Estrela prismática", "ru": "Призменная звезда", "th": "ดาวปริซึม", "vi": "Sao lăng kính", "id": "Bintang prismatik",
    },
    "egd.accumStars": {
        "cn": "累计 {n}★", "cht": "累計 {n}★", "en": "Total {n}★", "jp": "累計 {n}★", "kr": "누적 {n}★", "es": "Total {n}★", "fr": "Total {n}★", "de": "Insgesamt {n}★", "pt": "Total {n}★", "ru": "Всего {n}★", "th": "รวม {n}★", "vi": "Tổng {n}★", "id": "Total {n}★",
    },
    "egd.summons": {
        "cn": "召唤物", "cht": "召喚物", "en": "Summons", "jp": "召喚物", "kr": "소환물", "es": "Invocaciones", "fr": "Invocations", "de": "Beschwörungen", "pt": "Invocações", "ru": "Призывы", "th": "สิ่งอัญเชิญ", "vi": "Triệu hồi", "id": "Panggilan",
    },
    "egd.node.n": {
        "cn": "节点{n}", "cht": "節點{n}", "en": "Node {n}", "jp": "ノード{n}", "kr": "노드 {n}", "es": "Nodo {n}", "fr": "Nœud {n}", "de": "Knoten {n}", "pt": "Nó {n}", "ru": "Узел {n}", "th": "โหนด {n}", "vi": "Nút {n}", "id": "Node {n}",
    },
    "egd.rule.nodes": {
        "cn": "通关节点 NODES", "cht": "通關節點 NODES", "en": "Nodes cleared NODES", "jp": "クリアノード NODES", "kr": "클리어 노드 NODES", "es": "Nodos superados NODES", "fr": "Nœuds franchis NODES", "de": "Abgeschlossene Knoten NODES", "pt": "Nós concluídos NODES", "ru": "Пройдено узлов NODES", "th": "โหนดที่ผ่าน NODES", "vi": "Nút đã qua NODES", "id": "Node selesai NODES",
    },
    "egd.tierceNodes": {
        "cn": "星启节点", "cht": "星啟節點", "en": "Tierce nodes", "jp": "星啓ノード", "kr": "성기 노드", "es": "Nodos de Tierce", "fr": "Nœuds Tierce", "de": "Tierce-Knoten", "pt": "Nós de Tierce", "ru": "Узлы Tierce", "th": "โหนด Tierce", "vi": "Nút Tierce", "id": "Node Tierce",
    },
    "egd.choice.fixed": {
        "cn": "随层生效，不可选择", "cht": "隨層生效，不可選擇", "en": "Applies per tier; not selectable", "jp": "階層ごとに適用・選択不可", "kr": "층별 적용, 선택 불가", "es": "Se aplica por nivel; no seleccionable", "fr": "S'applique par palier ; non sélectionnable", "de": "Gilt pro Ebene; nicht wählbar", "pt": "Aplica-se por nível; não selecionável", "ru": "Действует по уровням; не выбирается", "th": "มีผลตามชั้น เลือกไม่ได้", "vi": "Áp dụng theo tầng; không chọn được", "id": "Berlaku per tingkat; tidak dapat dipilih",
    },
    "egd.choice.perTeam": {
        "cn": "挑战关卡前每支队伍选 1 条", "cht": "挑戰關卡前每支隊伍選 1 條", "en": "Choose 1 per team before the stage", "jp": "ステージ前に各パーティ1つ選択", "kr": "스테이지 전 팀당 1개 선택", "es": "Elige 1 por equipo antes de la etapa", "fr": "Choisissez 1 par équipe avant l'étape", "de": "1 pro Team vor der Stufe wählen", "pt": "Escolha 1 por equipe antes do estágio", "ru": "По 1 на команду перед этапом", "th": "เลือก 1 ต่อทีมก่อนเข้าด่าน", "vi": "Chọn 1 mỗi đội trước màn", "id": "Pilih 1 per tim sebelum stage",
    },
    "egd.choice.perStage": {
        "cn": "每场首领挑战前选 1 条（上/下半场各一套）", "cht": "每場首領挑戰前選 1 條（上/下半場各一套）", "en": "Choose 1 before each boss fight (one set per half)", "jp": "ボス挑戦ごとに1つ選択（前後半で各1セット）", "kr": "보스 전투마다 1개 선택(전·후반 각 1세트)", "es": "Elige 1 antes de cada jefe (un set por mitad)", "fr": "Choisissez 1 avant chaque boss (un set par mi-temps)", "de": "1 vor jedem Bosskampf (je ein Set pro Hälfte)", "pt": "Escolha 1 antes de cada chefe (um set por metade)", "ru": "По 1 перед каждым боссом (сет на половину)", "th": "เลือก 1 ก่อนบอสแต่ละครั้ง (ครึ่งละ 1 ชุด)", "vi": "Chọn 1 trước mỗi boss (mỗi hiệp một bộ)", "id": "Pilih 1 sebelum tiap bos (satu set per babak)",
    },
    "egd.choice.perKing": {
        "cn": "挑战王棋前为队伍选 1 条", "cht": "挑戰王棋前為隊伍選 1 條", "en": "Choose 1 per team before King Chess", "jp": "王棋挑戦前にパーティ1つ選択", "kr": "왕기 도전 전 팀당 1개 선택", "es": "Elige 1 por equipo antes del Rey", "fr": "Choisissez 1 par équipe avant le Roi", "de": "1 pro Team vor Königsschach", "pt": "Escolha 1 por equipe antes do Rei", "ru": "По 1 на команду перед Королём", "th": "เลือก 1 ต่อทีมก่อนราชาหมากรุก", "vi": "Chọn 1 mỗi đội trước Vua cờ", "id": "Pilih 1 per tim sebelum Raja catur",
    },
    "egd.levelLabel": {
        "cn": "关卡 {n}", "cht": "關卡 {n}", "en": "Stage {n}", "jp": "ステージ {n}", "kr": "스테이지 {n}", "es": "Etapa {n}", "fr": "Étape {n}", "de": "Stufe {n}", "pt": "Estágio {n}", "ru": "Этап {n}", "th": "ด่าน {n}", "vi": "Màn {n}", "id": "Stage {n}",
    },
    "egd.floorLabel": {
        "cn": "第 {n} 层", "cht": "第 {n} 層", "en": "Tier {n}", "jp": "第 {n} 階層", "kr": "{n}층", "es": "Nivel {n}", "fr": "Palier {n}", "de": "Ebene {n}", "pt": "Nível {n}", "ru": "Уровень {n}", "th": "ชั้น {n}", "vi": "Tầng {n}", "id": "Tingkat {n}",
    },
    "egd.enemySetup": {
        "cn": "敌方配置", "cht": "敵方配置", "en": "Enemy setup", "jp": "敵の編成", "kr": "적 구성", "es": "Configuración enemiga", "fr": "Composition ennemie", "de": "Gegneraufstellung", "pt": "Configuração inimiga", "ru": "Состав врагов", "th": "การจัดศัตรู", "vi": "Bố trí kẻ địch", "id": "Susunan musuh",
    },
    "egd.waveLabel": {
        "cn": "第 {n} 波", "cht": "第 {n} 波", "en": "Wave {n}", "jp": "第 {n} ウェーブ", "kr": "{n} 웨이브", "es": "Oleada {n}", "fr": "Vague {n}", "de": "Welle {n}", "pt": "Onda {n}", "ru": "Волна {n}", "th": "เวฟ {n}", "vi": "Đợt {n}", "id": "Gelombang {n}",
    },
    "egd.label.level": {
        "cn": "等级", "cht": "等級", "en": "Level", "jp": "レベル", "kr": "레벨", "es": "Nivel", "fr": "Niveau", "de": "Stufe", "pt": "Nível", "ru": "Уровень", "th": "เลเวล", "vi": "Cấp", "id": "Level",
    },
    "lc.rankTableCaption": {
        "cn": "光锥技能各叠影等级参数", "cht": "光錐技能各疊影等級參數", "en": "Superimposition-level parameters for the Light Cone ability", "jp": "光円錐スキルの重畳レベル別パラメータ", "kr": "광추 스킬 중첩 등급별 파라미터", "es": "Parámetros por nivel de superposición de la habilidad", "fr": "Paramètres par niveau de superposition de la compétence", "de": "Parameter je Überlagerungsstufe der Lichtkegel-Fähigkeit", "pt": "Parâmetros por nível de sobreposição da habilidade", "ru": "Параметры навыка по уровням наложения", "th": "พารามิเตอร์สกิลกรวยแสงตามระดับซ้อนทับ", "vi": "Thông số kỹ năng theo cấp chồng lớp", "id": "Parameter skill per tingkat tumpang tindih",
    },
    "egd.rule.cyclesCap": {
        "cn": "回合上限 CYCLES", "cht": "回合上限 CYCLES", "en": "Turn cap CYCLES", "jp": "ターン上限 CYCLES", "kr": "턴 상한 CYCLES", "es": "Tope de turnos CYCLES", "fr": "Limite de tours CYCLES", "de": "Zugobergrenze CYCLES", "pt": "Teto de turnos CYCLES", "ru": "Предел ходов CYCLES", "th": "สูงสุดเทิร์น CYCLES", "vi": "Giới hạn lượt CYCLES", "id": "Batas giliran CYCLES",
    },
    "meta.description": {
        "cn": "崩坏：星穹铁道游戏数据 Wiki", "cht": "崩壞：星穹鐵道遊戲資料 Wiki", "en": "Honkai: Star Rail game data wiki", "jp": "崩壊：スターレイル ゲームデータ Wiki", "kr": "붕괴: 스타레일 게임 데이터 위키", "es": "Wiki de datos del juego Honkai: Star Rail", "fr": "Wiki de données du jeu Honkai: Star Rail", "de": "Honkai: Star Rail Spieldaten-Wiki", "pt": "Wiki de dados do jogo Honkai: Star Rail", "ru": "Вики данных игры Honkai: Star Rail", "th": "วิกิข้อมูลเกม Honkai: Star Rail", "vi": "Wiki dữ liệu game Honkai: Star Rail", "id": "Wiki data game Honkai: Star Rail",
    },
    "mob.sec.weakness": {
        "cn": "弱点与抗性", "cht": "弱點與抗性", "en": "Weakness & Resist", "jp": "弱点と耐性", "kr": "약점과 저항", "es": "Debilidad y resistencia", "fr": "Faiblesse et résistance", "de": "Schwäche & Resistenz", "pt": "Fraqueza e resistência", "ru": "Уязвимость и сопротивление", "th": "จุดอ่อนและต้านทาน", "vi": "Điểm yếu & Kháng", "id": "Kelemahan & Resistensi",
    },
    "mob.sec.record": {
        "cn": "图鉴记录", "cht": "圖鑑記錄", "en": "Bestiary", "jp": "図鑑記録", "kr": "도감 기록", "es": "Bestiario", "fr": "Bestiaire", "de": "Bestiarium", "pt": "Bestiário", "ru": "Бестиарий", "th": "สารานุกรม", "vi": "Sách quái", "id": "Bestiari",
    },
    "mob.sec.guide": {
        "cn": "阶段机制", "cht": "階段機制", "en": "Phase Mechanics", "jp": "段階機構", "kr": "단계 메커니즘", "es": "Mecánicas de fase", "fr": "Mécaniques de phase", "de": "Phasenmechanik", "pt": "Mecânicas de fase", "ru": "Механики фаз", "th": "กลไกเฟส", "vi": "Cơ chế giai đoạn", "id": "Mekanisme fase",
    },
    "mob.sec.stats": {
        "cn": "战斗数值", "cht": "戰鬥數值", "en": "Combat Stats", "jp": "戦闘数値", "kr": "전투 수치", "es": "Estadísticas de combate", "fr": "Statistiques de combat", "de": "Kampfwerte", "pt": "Atributos de combate", "ru": "Боевые характеристики", "th": "ค่าสถานะต่อสู้", "vi": "Chỉ số chiến đấu", "id": "Statistik tempur",
    },
    "mob.sec.status": {
        "cn": "状态词条", "cht": "狀態詞條", "en": "Status Effects", "jp": "状態効果", "kr": "상태 효과", "es": "Estados", "fr": "Effets de statut", "de": "Statuseffekte", "pt": "Efeitos de status", "ru": "Эффекты состояния", "th": "เอฟเฟกต์สถานะ", "vi": "Hiệu ứng trạng thái", "id": "Efek status",
    },
    "mob.sec.appear": {
        "cn": "出没关卡", "cht": "出沒關卡", "en": "Stage Appearances", "jp": "出現ステージ", "kr": "출현 스테이지", "es": "Apariciones", "fr": "Apparitions", "de": "Stufen-Auftritte", "pt": "Aparições", "ru": "Появления на этапах", "th": "ด่านที่ปรากฏ", "vi": "Màn xuất hiện", "id": "Kemunculan stage",
    },
    "mob.sec.drop": {
        "cn": "掉落", "cht": "掉落", "en": "Drops", "jp": "ドロップ", "kr": "드롭", "es": "Botín", "fr": "Butin", "de": "Beute", "pt": "Drops", "ru": "Добыча", "th": "ดรอป", "vi": "Rơi", "id": "Drop",
    },
    "mob.sec.variants": {
        "cn": "同族变体", "cht": "同族變體", "en": "Family Variants", "jp": "同族バリエーション", "kr": "동족 변형", "es": "Variantes de familia", "fr": "Variantes de famille", "de": "Familienvarianten", "pt": "Variantes de família", "ru": "Варианты семейства", "th": "ร่างแปรสายพันธุ์", "vi": "Biến thể cùng loài", "id": "Varian keluarga",
    },
    "mob.resist.stance": {
        "cn": "韧性弱点", "cht": "韌性弱點", "en": "Toughness Weakness", "jp": "靭性弱点", "kr": "강인도 약점", "es": "Debilidad de robustez", "fr": "Faiblesse de robustesse", "de": "Robustheitsschwäche", "pt": "Fraqueza de robustez", "ru": "Уязвимость прочности", "th": "จุดอ่อนความแข็งแกร่ง", "vi": "Điểm yếu Độ Bền", "id": "Kelemahan Ketangguhan",
    },
    "mob.empty.weak": {
        "cn": "无弱点信息", "cht": "無弱點資訊", "en": "No weakness data", "jp": "弱点情報なし", "kr": "약점 정보 없음", "es": "Sin datos de debilidad", "fr": "Aucune donnée de faiblesse", "de": "Keine Schwächendaten", "pt": "Sem dados de fraqueza", "ru": "Нет данных об уязвимости", "th": "ไม่มีข้อมูลจุดอ่อน", "vi": "Không có dữ liệu điểm yếu", "id": "Tidak ada data kelemahan",
    },
    "mob.empty.resist": {
        "cn": "无抗性信息", "cht": "無抗性資訊", "en": "No resistance data", "jp": "耐性情報なし", "kr": "저항 정보 없음", "es": "Sin datos de resistencia", "fr": "Aucune donnée de résistance", "de": "Keine Resistenzdaten", "pt": "Sem dados de resistência", "ru": "Нет данных о сопротивлении", "th": "ไม่มีข้อมูลต้านทาน", "vi": "Không có dữ liệu kháng", "id": "Tidak ada data resistensi",
    },
    "mob.empty.intro": {
        "cn": "暂无图鉴介绍", "cht": "暫無圖鑑介紹", "en": "No bestiary entry yet", "jp": "図鑑説明はまだありません", "kr": "도감 설명 없음", "es": "Sin ficha de bestiario", "fr": "Pas encore de fiche", "de": "Noch kein Bestiariumseintrag", "pt": "Ainda sem ficha", "ru": "Описания пока нет", "th": "ยังไม่มีคำอธิบาย", "vi": "Chưa có mô tả", "id": "Belum ada keterangan",
    },
    "mob.empty.appear": {
        "cn": "暂无关卡出场记录。", "cht": "暫無關卡出場記錄。", "en": "No stage appearances recorded.", "jp": "ステージ出現記録はありません。", "kr": "스테이지 출현 기록이 없습니다.", "es": "Sin apariciones registradas.", "fr": "Aucune apparition enregistrée.", "de": "Keine Stufen-Auftritte erfasst.", "pt": "Sem aparições registradas.", "ru": "Появлений на этапах нет.", "th": "ไม่มีบันทึกการปรากฏตัว", "vi": "Chưa có ghi nhận xuất hiện.", "id": "Belum ada kemunculan tercatat.",
    },
    "mob.phase.other": {
        "cn": "其他形态", "cht": "其他形態", "en": "Other form", "jp": "その他の形態", "kr": "기타 형태", "es": "Otra forma", "fr": "Autre forme", "de": "Andere Form", "pt": "Outra forma", "ru": "Другая форма", "th": "ร่างอื่น", "vi": "Dạng khác", "id": "Bentuk lain",
    },
    "mob.stat.hp": {
        "cn": "HP 生命", "cht": "HP 生命", "en": "HP", "jp": "HP 生命", "kr": "HP 생명", "es": "HP Vida", "fr": "HP PV", "de": "HP Leben", "pt": "HP Vida", "ru": "HP Здоровье", "th": "HP ชีวิต", "vi": "HP Sinh mệnh", "id": "HP Nyawa",
    },
    "mob.stat.atk": {
        "cn": "ATK 攻击", "cht": "ATK 攻擊", "en": "ATK", "jp": "ATK 攻撃", "kr": "ATK 공격", "es": "ATK Ataque", "fr": "ATK ATQ", "de": "ATK Angriff", "pt": "ATK Ataque", "ru": "ATK Атака", "th": "ATK โจมตี", "vi": "ATK Tấn công", "id": "ATK Serangan",
    },
    "mob.stat.def": {
        "cn": "DEF 防御", "cht": "DEF 防禦", "en": "DEF", "jp": "DEF 防御", "kr": "DEF 방어", "es": "DEF Defensa", "fr": "DEF DÉF", "de": "DEF Verteidigung", "pt": "DEF Defesa", "ru": "DEF Защита", "th": "DEF ป้องกัน", "vi": "DEF Phòng thủ", "id": "DEF Pertahanan",
    },
    "mob.stat.spd": {
        "cn": "SPD 速度", "cht": "SPD 速度", "en": "SPD", "jp": "SPD 速度", "kr": "SPD 속도", "es": "SPD Velocidad", "fr": "SPD VIT", "de": "SPD Geschw.", "pt": "SPD Velocidade", "ru": "SPD Скорость", "th": "SPD ความเร็ว", "vi": "SPD Tốc độ", "id": "SPD Kecepatan",
    },
    "mob.status.dispel": {
        "cn": "可驱散", "cht": "可驅散", "en": "Dispellable", "jp": "解除可能", "kr": "해제 가능", "es": "Disipable", "fr": "Dissipable", "de": "Bannbar", "pt": "Dispensável", "ru": "Снимается", "th": "ลบได้", "vi": "Có thể giải", "id": "Dapat dihapus",
    },
    "mob.atlas.k": {
        "cn": "图鉴族", "cht": "圖鑑族", "en": "Bestiary Group", "jp": "図鑑グループ", "kr": "도감 그룹", "es": "Grupo de bestiario", "fr": "Groupe de bestiaire", "de": "Bestiariumsgruppe", "pt": "Grupo de bestiário", "ru": "Группа бестиария", "th": "กลุ่มสารานุกรม", "vi": "Nhóm sách quái", "id": "Grup bestiari",
    },
    "mob.event.k": {
        "cn": "活动出处", "cht": "活動出處", "en": "Event Source", "jp": "イベント出典", "kr": "이벤트 출처", "es": "Origen del evento", "fr": "Origine de l'événement", "de": "Event-Herkunft", "pt": "Origem do evento", "ru": "Источник события", "th": "ที่มาของอีเวนต์", "vi": "Nguồn sự kiện", "id": "Sumber event",
    },
    "mob.census.k": {
        "cn": "统计口径", "cht": "統計口徑", "en": "Counting Method", "jp": "集計基準", "kr": "집계 기준", "es": "Criterio de conteo", "fr": "Méthode de comptage", "de": "Zählweise", "pt": "Critério de contagem", "ru": "Методика подсчёта", "th": "เกณฑ์การนับ", "vi": "Cách thống kê", "id": "Metode penghitungan",
    },
    "mob.error.title": {
        "cn": "怪物数据加载失败", "cht": "怪物資料載入失敗", "en": "Failed to load monster data", "jp": "敵データの読み込みに失敗", "kr": "적 데이터 로드 실패", "es": "No se pudieron cargar los datos", "fr": "Échec du chargement des données", "de": "Gegnerdaten konnten nicht geladen werden", "pt": "Falha ao carregar dados", "ru": "Не удалось загрузить данные", "th": "โหลดข้อมูลศัตรูไม่สำเร็จ", "vi": "Không tải được dữ liệu", "id": "Gagal memuat data musuh",
    },
    "cwRole.enhancedSkills": {
        "cn": "强化技能：{names}", "cht": "強化技能：{names}", "en": "Enhanced abilities: {names}",
        "jp": "強化スキル：{names}", "kr": "강화 스킬: {names}", "es": "Habilidades mejoradas: {names}",
        "fr": "Compétences améliorées : {names}", "de": "Verstärkte Fähigkeiten: {names}",
        "pt": "Habilidades aprimoradas: {names}", "ru": "Усиленные навыки: {names}",
        "th": "สกิลเสริม: {names}", "vi": "Kỹ năng cường hóa: {names}", "id": "Skill diperkuat: {names}",
    },
    "cwRole.energyBar": {
        "cn": "能量条 +{n}", "cht": "能量條 +{n}", "en": "Energy bar +{n}", "jp": "エネルギーゲージ +{n}",
        "kr": "에너지 바 +{n}", "es": "Barra de energía +{n}", "fr": "Barre d'énergie +{n}",
        "de": "Energieleiste +{n}", "pt": "Barra de energia +{n}", "ru": "Шкала энергии +{n}",
        "th": "แถบพลังงาน +{n}", "vi": "Thanh năng lượng +{n}", "id": "Bilah energi +{n}",
    },
    "propGroup.power": {
        "cn": "强度", "cht": "強度", "en": "Power", "jp": "強度", "kr": "강도",
        "es": "Potencia", "fr": "Puissance", "de": "Stärke", "pt": "Potência", "ru": "Мощь",
        "th": "ความแข็งแกร่ง", "vi": "Sức mạnh", "id": "Kekuatan",
    },
    "propGroup.mechanic": {
        "cn": "机制", "cht": "機制", "en": "Mechanics", "jp": "仕組み", "kr": "메커니즘",
        "es": "Mecánicas", "fr": "Mécaniques", "de": "Mechanik", "pt": "Mecânicas", "ru": "Механики",
        "th": "กลไก", "vi": "Cơ chế", "id": "Mekanisme",
    },
    "prop.ExtraAllDamageTypeAddedRatio": {
        "cn": "全伤害", "cht": "全傷害", "en": "All-Type DMG", "jp": "全ダメージ", "kr": "모든 피해", "es": "Daño de todos los tipos", "fr": "Dégâts tous types", "de": "Schaden aller Typen", "pt": "Dano de todos os tipos", "ru": "Урон всех типов", "th": "ความเสียหายทุกชนิด", "vi": "Sát thương mọi hệ", "id": "DMG Semua Tipe",
    },
    "prop.ExtraElementDamageAddedRatio": {
        "cn": "属性伤害", "cht": "屬性傷害", "en": "Elemental DMG", "jp": "属性ダメージ", "kr": "속성 피해", "es": "Daño elemental", "fr": "Dégâts élémentaires", "de": "Elementarschaden", "pt": "Dano elemental", "ru": "Урон элемента", "th": "ความเสียหายธาตุ", "vi": "Sát thương nguyên tố", "id": "DMG Elemental",
    },
    "prop.ExtraHealRatio": {
        "cn": "治疗量", "cht": "治療量", "en": "Healing", "jp": "治療量", "kr": "치유량", "es": "Curación", "fr": "Soins", "de": "Heilung", "pt": "Curação", "ru": "Лечение", "th": "การรักษา", "vi": "Hồi máu", "id": "Penyembuhan",
    },
    "prop.ExtraInsertDamageAddedRatio": {
        "cn": "追加攻击伤害", "cht": "追加攻擊傷害", "en": "Follow-Up ATK DMG", "jp": "追加攻撃ダメージ", "kr": "추가 공격 피해", "es": "Daño de ataque adicional", "fr": "Dégâts d'attaque supplémentaire", "de": "Zusatzangriffsschaden", "pt": "Dano de ataque adicional", "ru": "Урон доп. атаки", "th": "ความเสียหายโจมตีเสริม", "vi": "Sát thương đòn đánh thêm", "id": "DMG Serangan Tambahan",
    },
    "prop.ExtraMaxSP": {
        "cn": "战技点上限", "cht": "戰技點上限", "en": "Max Skill Points", "jp": "戦闘スキルポイント上限", "kr": "전투 스킬 포인트 최대치", "es": "Puntos de habilidad máx.", "fr": "Points de compétence max.", "de": "Max. Fertigkeitspunkte", "pt": "Pontos de perícia máx.", "ru": "Макс. очки навыков", "th": "คะแนนสกิลสูงสุด", "vi": "Điểm kỹ năng tối đa", "id": "Poin Skill Maks.",
    },
    "prop.ExtraNormalDamageAddedRatio": {
        "cn": "普攻伤害", "cht": "普攻傷害", "en": "Basic ATK DMG", "jp": "通常攻撃ダメージ", "kr": "일반 공격 피해", "es": "Daño de ataque básico", "fr": "Dégâts d'attaque de base", "de": "Basisangriffsschaden", "pt": "Dano de ataque básico", "ru": "Урон базовой атаки", "th": "ความเสียหายโจมตีธรรมดา", "vi": "Sát thương đánh thường", "id": "DMG Serangan Dasar",
    },
    "prop.ExtraSkillDamageAddedRatio": {
        "cn": "战技伤害", "cht": "戰技傷害", "en": "Skill DMG", "jp": "戦闘スキルダメージ", "kr": "전투 스킬 피해", "es": "Daño de habilidad", "fr": "Dégâts de compétence", "de": "Fertigkeitsschaden", "pt": "Dano de perícia", "ru": "Урон навыка", "th": "ความเสียหายสกิล", "vi": "Sát thương kỹ năng", "id": "DMG Skill",
    },
    "prop.ExtraUltraDamageAddedRatio": {
        "cn": "终结技伤害", "cht": "終結技傷害", "en": "Ultimate DMG", "jp": "必殺技ダメージ", "kr": "필살기 피해", "es": "Daño de ultimate", "fr": "Dégâts d'ultime", "de": "Ultimativer Schaden", "pt": "Dano de ultimate", "ru": "Урон сверхспособности", "th": "ความเสียหายไม้ตาย", "vi": "Sát thương tuyệt kỹ", "id": "DMG Ultimate",
    },
    "snapshot.enemyCount": {
        "cn": "{n} 名敌方", "cht": "{n} 名敵方", "en": "{n} enemy | {n} enemies", "jp": "敵 {n} 体", "kr": "적 {n}명", "es": "{n} enemigos", "fr": "{n} ennemis | {n} ennemis", "de": "{n} Gegner | {n} Gegner", "pt": "{n} inimigos | {n} inimigos", "ru": "{n} противник | {n} противников", "th": "ศัตรู {n} ตัว", "vi": "{n} kẻ địch", "id": "{n} musuh",
    },
    "snapshot.costLabel": {
        "cn": "{n} 费", "cht": "{n} 費", "en": "{n} cost", "jp": "{n} コスト", "kr": "{n} 코스트", "es": "{n} de coste", "fr": "{n} de coût", "de": "{n} Kosten", "pt": "{n} de custo", "ru": "{n} стоимости", "th": "ค่าใช้จ่าย {n}", "vi": "{n} chi phí", "id": "{n} biaya",
    },
    "snapshot.endgameSummary": {
        "cn": "{site}终局内容：{modes}四模式赛季，共 {n} 期。", "cht": "{site}終局內容：{modes}四模式賽季，共 {n} 期。", "en": "{site} endgame: {modes} seasons across four modes, {n} in total.", "jp": "{site} 終局コンテンツ：{modes}の4モードシーズン、全 {n} 期。", "kr": "{site} 종국 콘텐츠: {modes} 4개 모드 시즌, 총 {n}개.", "es": "{site} contenido final: {modes} temporadas de cuatro modos, {n} en total.", "fr": "{site} contenu de fin de partie : {modes} saisons sur quatre modes, {n} au total.", "de": "{site} Endgame-Inhalte: {modes} Saisons in vier Modi, insgesamt {n}.", "pt": "{site} conteúdo de fim de jogo: {modes} temporadas em quatro modos, {n} no total.", "ru": "{site} контент финала: {modes} сезонов в четырёх режимах, всего {n}.", "th": "{site} เนื้อหาช่วงท้าย: {modes} ซีซัน 4 โหมด รวม {n} ซีซัน", "vi": "{site} nội dung cuối: {modes} mùa thuộc bốn chế độ, tổng {n}.", "id": "{site} konten endgame: {modes} musim di empat mode, total {n}.",
    },
    "snapshot.updatedAt": {
        "cn": "数据最后更新：{date}", "cht": "資料最後更新：{date}", "en": "Last updated: {date}", "jp": "最終更新：{date}", "kr": "최종 업데이트: {date}", "es": "Última actualización: {date}", "fr": "Dernière mise à jour : {date}", "de": "Zuletzt aktualisiert: {date}", "pt": "Última atualização: {date}", "ru": "Обновлено: {date}", "th": "อัปเดตล่าสุด: {date}", "vi": "Cập nhật lần cuối: {date}", "id": "Terakhir diperbarui: {date}",
    },
    "snapshot.note": {
        "cn": "本页为{site}构建期预渲染快照，内容与站点数据一致，无 JavaScript 亦可读取。", "cht": "本頁為{site}建置期預先算繪快照，內容與站點資料一致，無 JavaScript 亦可讀取。", "en": "This page is a build-time prerendered snapshot of {site}; its content matches the site data and is readable without JavaScript.", "jp": "このページは{site}のビルド時プリレンダースナップショットです。内容はサイトのデータと一致し、JavaScript なしでも読めます。", "kr": "이 페이지는 {site}의 빌드 시점 사전 렌더링 스냅샷이며, 내용은 사이트 데이터와 같고 JavaScript 없이도 읽을 수 있습니다.", "es": "Esta página es una instantánea pregenerada de {site}; su contenido coincide con los datos del sitio y puede leerse sin JavaScript.", "fr": "Cette page est un instantané prégénéré de {site} ; son contenu correspond aux données du site et reste lisible sans JavaScript.", "de": "Diese Seite ist ein zur Build-Zeit vorgerenderter Schnappschuss von {site}; der Inhalt entspricht den Site-Daten und ist auch ohne JavaScript lesbar.", "pt": "Esta página é um instantâneo pré-renderizado de {site}; o conteúdo corresponde aos dados do site e é legível sem JavaScript.", "ru": "Эта страница — предрендеренный снимок {site} на момент сборки; содержимое совпадает с данными сайта и читается без JavaScript.", "th": "หน้านี้เป็นสแนปช็อตที่เรนเดอร์ล่วงหน้าของ {site} เนื้อหาตรงกับข้อมูลเว็บไซต์และอ่านได้โดยไม่ต้องใช้ JavaScript", "vi": "Trang này là ảnh chụp kết xuất trước của {site}; nội dung khớp với dữ liệu trang và vẫn đọc được khi không có JavaScript.", "id": "Halaman ini adalah snapshot pra-render dari {site}; isinya sesuai data situs dan tetap terbaca tanpa JavaScript.",
    },
    "snapshot.cwTraitSummary": {
        "cn": "{site}货币战争羁绊图鉴：共 {n} 个羁绊，含激活人数层级与成员加成。", "cht": "{site}貨幣戰爭羈絆圖鑑：共 {n} 個羈絆，含啟用人數層級與成員加成。", "en": "{site} Currency Wars synergies: {n} synergies with activation tiers and member bonuses.", "jp": "{site} 貨幣戦争の絆図鑑：絆 {n} 件、発動人数の段階とメンバー強化つき。", "kr": "{site} 통화 전쟁 인연 도감: 인연 {n}개, 발동 인원 단계와 멤버 보너스 포함.", "es": "{site} sinergias de Guerras Monetarias: {n} sinergias con niveles de activación y bonificaciones de miembros.", "fr": "{site} synergies de Guerre Monétaire : {n} synergies avec paliers d'activation et bonus de membres.", "de": "{site} Währungskrieg-Synergien: {n} Synergien mit Aktivierungsstufen und Mitgliederboni.", "pt": "{site} sinergias de Guerra Monetária: {n} sinergias com níveis de ativação e bônus de membros.", "ru": "{site} синергии Валютной войны: {n} синергий с уровнями активации и бонусами участников.", "th": "{site} สายสัมพันธ์สงครามcurrency: {n} สายสัมพันธ์ พร้อมระดับการเปิดใช้และโบนัสสมาชิก", "vi": "{site} cộng hưởng Chiến tranh Tiền tệ: {n} cộng hưởng kèm bậc kích hoạt và thưởng thành viên.", "id": "{site} sinergi Currency Wars: {n} sinergi dengan tingkat aktivasi dan bonus anggota.",
    },
    "snapshot.sum.monster": {
        "cn": "{site}敌对物种图鉴：共 {n} 个条目，含分类、弱点、抗性与技能。", "cht": "{site}敵對物種圖鑑：共 {n} 個條目，含分類、弱點、抗性與技能。", "en": "{site} bestiary: {n} entries with types, weaknesses, resistances and abilities.", "jp": "{site} 敵対種図鑑：{n} 件、分類・弱点・耐性・スキルつき。", "kr": "{site} 적대 종족 도감: {n}개 항목, 분류·약점·내성·스킬 포함.", "es": "{site} bestiario: {n} entradas con tipos, debilidades, resistencias y habilidades.", "fr": "{site} bestiaire : {n} entrées avec types, faiblesses, résistances et compétences.", "de": "{site} Bestiarium: {n} Einträge mit Typen, Schwächen, Resistenzen und Fähigkeiten.", "pt": "{site} bestiário: {n} entradas com tipos, fraquezas, resistências e habilidades.", "ru": "{site} бестиарий: {n} записей с типами, уязвимостями, сопротивлениями и навыками.", "th": "{site} สัตว์ประหลาด: {n} รายการ พร้อมประเภท จุดอ่อน ค่าต้านทาน และสกิล", "vi": "{site} sổ sinh vật: {n} mục với phân loại, điểm yếu, kháng tính và kỹ năng.", "id": "{site} bestiary: {n} entri dengan tipe, kelemahan, resistensi, dan skill.",
    },
    "snapshot.sum.voracity": {
        "cn": "{site}贪饕污染专题：{extra}含关卡组成、侵蚀等级与状态词条。", "cht": "{site}貪饕污染專題：{extra}含關卡組成、侵蝕等級與狀態詞條。", "en": "{site} Voracity corruption feature: {extra}stage layout, corruption levels and status effects.", "jp": "{site} 貪食汚染特集：{extra}ステージ構成・侵蝕レベル・状態効果つき。", "kr": "{site} 탐식 오염 특집: {extra}스테이지 구성, 침식 등급, 상태 효과 포함.", "es": "{site} especial de corrupción de la Voracidad: {extra}composición de niveles, niveles de corrupción y estados.", "fr": "{site} dossier corruption de la Voracité : {extra}composition des niveaux, niveaux de corruption et états.", "de": "{site} Verschlingung-Korruption: {extra}Levelaufbau, Korruptionsstufen und Statuseffekte.", "pt": "{site} especial de corrupção da Voracidade: {extra}composição de estágios, níveis de corrupção e estados.", "ru": "{site} тема порчи Прожорливости: {extra}состав этапов, уровни порчи и статусы.", "th": "{site} ธีมการกัดกร่อนของ Voracity: {extra}โครงสร้างด่าน ระดับการกัดกร่อน และสถานะ", "vi": "{site} chuyên đề ăn mòn Voracity: {extra}cấu trúc ải, cấp ăn mòn và hiệu ứng trạng thái.", "id": "{site} fitur korupsi Voracity: {extra}susunan stage, tingkat korupsi, dan efek status.",
    },
    "snapshot.sum.character": {
        "cn": "{site}角色图鉴：共 {n} 名角色，含稀有度、命途、属性与技能档案。", "cht": "{site}角色圖鑑：共 {n} 名角色，含稀有度、命途、屬性與技能檔案。", "en": "{site} character index: {n} characters with rarity, path, element and skill data.", "jp": "{site} キャラ図鑑：{n} 名、レアリティ・運命・属性・スキル付き。", "kr": "{site} 캐릭터 도감: {n}명, 희귀도·운명·속성·스킬 포함.", "es": "{site} índice de personajes: {n} personajes con rareza, Vía, elemento y habilidades.", "fr": "{site} index des personnages : {n} personnages avec rareté, Voie, élément et compétences.", "de": "{site} Charakter-Index: {n} Charaktere mit Seltenheit, Pfad, Element und Fähigkeiten.", "pt": "{site} índice de personagens: {n} personagens com raridade, Via, elemento e habilidades.", "ru": "{site} индекс персонажей: {n} персонажей с редкостью, Пути, элементом и навыками.", "th": "{site} ดัชนีตัวละคร: {n} ตัว พร้อมระดับดาว วิถี ธาตุ และสกิล", "vi": "{site} chỉ mục nhân vật: {n} nhân vật với độ hiếm, Vận mệnh, hệ và kỹ năng.", "id": "{site} indeks karakter: {n} karakter dengan kelangkaan, Path, elemen, dan skill.",
    },
    "snapshot.sum.lightcone": {
        "cn": "{site}光锥图鉴：共 {n} 把光锥，含稀有度、命途、技能效果与晋阶属性。", "cht": "{site}光錐圖鑑：共 {n} 把光錐，含稀有度、命途、技能效果與晉階屬性。", "en": "{site} light cone index: {n} light cones with rarity, path, skill effects and ascension stats.", "jp": "{site} 光円錐図鑑：{n} 本、レアリティ・運命・スキル効果・昇格ステータス付き。", "kr": "{site} 광추 도감: {n}개, 희귀도·운명·스킬 효과·승급 능력치 포함.", "es": "{site} índice de conos de luz: {n} conos con rareza, Vía, efectos y estadísticas de ascensión.", "fr": "{site} index des cônes de lumière : {n} cônes avec rareté, Voie, effets et statistiques d'ascension.", "de": "{site} Lichtkegel-Index: {n} Lichtkegel mit Seltenheit, Pfad, Effekten und Aufstiegswerten.", "pt": "{site} índice de cones de luz: {n} cones com raridade, Via, efeitos e atributos de ascensão.", "ru": "{site} индекс световых конусов: {n} конусов с редкостью, Путём, эффектами и характеристиками.", "th": "{site} ดัชนีกรวยแสง: {n} อัน พร้อมระดับดาว วิถี เอฟเฟกต์ และค่าอัปเกรด", "vi": "{site} chỉ mục nón ánh sáng: {n} nón với độ hiếm, Vận mệnh, hiệu ứng và chỉ số đột phá.", "id": "{site} indeks light cone: {n} light cone dengan kelangkaan, Path, efek, dan stat ascend.",
    },
    "snapshot.invasionLevel": {
        "cn": "侵蚀等级 {n}", "cht": "侵蝕等級 {n}", "en": "Corruption Level {n}", "jp": "侵蝕レベル {n}", "kr": "침식 등급 {n}", "es": "Nivel de corrupción {n}", "fr": "Niveau de corruption {n}", "de": "Korruptionsstufe {n}", "pt": "Nível de corrupção {n}", "ru": "Уровень порчи {n}", "th": "ระดับการกัดกร่อน {n}", "vi": "Cấp ăn mòn {n}", "id": "Tingkat korupsi {n}",
    },
    "vor.field.stages": {
        "cn": "波及关卡数", "cht": "波及關卡數", "en": "Affected Stages", "jp": "影響ステージ数", "kr": "영향 스테이지 수", "es": "Etapas afectadas", "fr": "Niveaux concernés", "de": "Betroffene Ebenen", "pt": "Estágios afetados", "ru": "Затронуто этапов", "th": "จำนวนด่านที่ได้รับผล", "vi": "Số ải bị ảnh hưởng", "id": "Stage Terdampak",
    },
    "vor.field.monsters": {
        "cn": "怪物名单条目数", "cht": "怪物名單條目數", "en": "Bestiary Entries", "jp": "モンスター登録数", "kr": "몬스터 목록 항목 수", "es": "Entradas del bestiario", "fr": "Entrées du bestiaire", "de": "Bestiariums-Einträge", "pt": "Entradas do bestiário", "ru": "Записей в бестиарии", "th": "จำนวนรายการมอนสเตอร์", "vi": "Số mục sinh vật", "id": "Entri Bestiary",
    },
    "vor.field.statuses": {
        "cn": "状态词条数", "cht": "狀態詞條數", "en": "Status Effects", "jp": "状態効果数", "kr": "상태 효과 수", "es": "Estados", "fr": "Effets de statut", "de": "Statuseffekte", "pt": "Efeitos de status", "ru": "Статусных эффектов", "th": "จำนวนสถานะ", "vi": "Số hiệu ứng trạng thái", "id": "Efek Status",
    },
    "snapshot.sum.achievement": {
        "cn": "{site}成就图鉴：共 {n} 个成就，含系列、稀有度与达成要求。", "cht": "{site}成就圖鑑：共 {n} 個成就，含系列、稀有度與達成要求。", "en": "{site} achievements: {n} entries with series, rarity and requirements.", "jp": "{site} 実績図鑑：{n} 件、シリーズ・レアリティ・達成条件つき。", "kr": "{site} 업적 도감: {n}개, 시리즈·희귀도·달성 조건 포함.", "es": "{site} logros: {n} entradas con serie, rareza y requisitos.", "fr": "{site} succès : {n} entrées avec série, rareté et conditions.", "de": "{site} Erfolge: {n} Einträge mit Serie, Seltenheit und Bedingungen.", "pt": "{site} conquistas: {n} entradas com série, raridade e requisitos.", "ru": "{site} достижения: {n} записей с серией, редкостью и условиями.", "th": "{site} ความสำเร็จ: {n} รายการ พร้อมซีรีส์ ระดับหายาก และเงื่อนไข", "vi": "{site} thành tựu: {n} mục với bộ, độ hiếm và điều kiện.", "id": "{site} achievement: {n} entri dengan seri, kelangkaan, dan syarat.",
    },
    "snapshot.sum.item": {
        "cn": "{site}物品图鉴：共 {n} 件物品，含类型、稀有度与物品描述。", "cht": "{site}物品圖鑑：共 {n} 件物品，含類型、稀有度與物品描述。", "en": "{site} item index: {n} items with type, rarity and description.", "jp": "{site} アイテム図鑑：{n} 件、種類・レアリティ・説明つき。", "kr": "{site} 아이템 도감: {n}개, 종류·희귀도·설명 포함.", "es": "{site} objetos: {n} objetos con tipo, rareza y descripción.", "fr": "{site} objets : {n} objets avec type, rareté et description.", "de": "{site} Gegenstände: {n} Objekte mit Typ, Seltenheit und Beschreibung.", "pt": "{site} itens: {n} itens com tipo, raridade e descrição.", "ru": "{site} предметы: {n} предметов с типом, редкостью и описанием.", "th": "{site} ไอเทม: {n} ชิ้น พร้อมประเภท ระดับหายาก และคำอธิบาย", "vi": "{site} vật phẩm: {n} mục với loại, độ hiếm và mô tả.", "id": "{site} item: {n} item dengan tipe, kelangkaan, dan deskripsi.",
    },
    "snapshot.sum.relic": {
        "cn": "{site}遗器图鉴：共 {n} 套遗器，含套装效果与部位信息。", "cht": "{site}遺器圖鑑：共 {n} 套遺器，含套裝效果與部位資訊。", "en": "{site} relic index: {n} sets with set effects and piece slots.", "jp": "{site} 遺物図鑑：{n} セット、セット効果と部位情報つき。", "kr": "{site} 유물 도감: {n}세트, 세트 효과와 부위 정보 포함.", "es": "{site} reliquias: {n} conjuntos con efectos y piezas.", "fr": "{site} reliques : {n} ensembles avec effets et pièces.", "de": "{site} Relikte: {n} Sets mit Set-Effekten und Teilen.", "pt": "{site} relíquias: {n} conjuntos com efeitos e peças.", "ru": "{site} реликвии: {n} комплектов с эффектами и частями.", "th": "{site} รีลิก: {n} ชุด พร้อมเอฟเฟกต์ชุดและชิ้นส่วน", "vi": "{site} di vật: {n} bộ với hiệu ứng bộ và bộ phận.", "id": "{site} relic: {n} set dengan efek set dan bagian.",
    },
    "snapshot.sum.cwHub": {
        "cn": "{site}货币战争模式枢纽：本赛季新增角色图鉴与羁绊图鉴条目。", "cht": "{site}貨幣戰爭模式樞紐：本賽季新增角色圖鑑與羈絆圖鑑條目。", "en": "{site} Currency Wars hub: this season's new characters and synergies.", "jp": "{site} 貨幣戦争ハブ：今シーズンの新キャラと絆図鑑。", "kr": "{site} 통화 전쟁 허브: 이번 시즌 신규 캐릭터와 인연 도감.", "es": "{site} centro de Guerras Monetarias: personajes y sinergias nuevos de la temporada.", "fr": "{site} hub Guerre Monétaire : nouveaux personnages et synergies de la saison.", "de": "{site} Währungskrieg-Hub: neue Charaktere und Synergien der Saison.", "pt": "{site} hub de Guerra Monetária: novos personagens e sinergias da temporada.", "ru": "{site} хаб Валютной войны: новые персонажи и синергии сезона.", "th": "{site} ฮับสงครามcurrency: ตัวละครและสายสัมพันธ์ใหม่ประจำซีซัน", "vi": "{site} hub Chiến tranh Tiền tệ: nhân vật và cộng hưởng mới của mùa.", "id": "{site} hub Currency Wars: karakter dan sinergi baru musim ini.",
    },
    "snapshot.sum.cwRole": {
        "cn": "{site}货币战争角色图鉴：共 {n} 名可招募角色，含费用、前后台定位与羁绊。", "cht": "{site}貨幣戰爭角色圖鑑：共 {n} 名可招募角色，含費用、前後台定位與羈絆。", "en": "{site} Currency Wars characters: {n} recruitable units with cost, position and synergies.", "jp": "{site} 貨幣戦争キャラ図鑑：{n} 名、コスト・前後衛・絆つき。", "kr": "{site} 통화 전쟁 캐릭터 도감: {n}명, 코스트·전후방·인연 포함.", "es": "{site} personajes de Guerras Monetarias: {n} reclutables con coste, posición y sinergias.", "fr": "{site} personnages de Guerre Monétaire : {n} recrutables avec coût, position et synergies.", "de": "{site} Währungskrieg-Charaktere: {n} rekrutierbare Einheiten mit Kosten, Position und Synergien.", "pt": "{site} personagens de Guerra Monetária: {n} recrutáveis com custo, posição e sinergias.", "ru": "{site} персонажи Валютной войны: {n} с ценой, позицией и синергиями.", "th": "{site} ตัวละครสงครามcurrency: {n} ตัว พร้อมค่าใช้จ่าย ตำแหน่ง และสายสัมพันธ์", "vi": "{site} nhân vật Chiến tranh Tiền tệ: {n} mục với chi phí, vị trí và cộng hưởng.", "id": "{site} karakter Currency Wars: {n} dengan biaya, posisi, dan sinergi.",
    },
    "snapshot.sum.cwAugment": {
        "cn": "{site}货币战争投资策略图鉴：共 {n} 条投资策略。", "cht": "{site}貨幣戰爭投資策略圖鑑：共 {n} 條投資策略。", "en": "{site} Currency Wars augments: {n} entries.", "jp": "{site} 貨幣戦争の投資戦略図鑑：{n} 件。", "kr": "{site} 통화 전쟁 투자 전략 도감: {n}개.", "es": "{site} mejoras de Guerras Monetarias: {n} entradas.", "fr": "{site} augmentations de Guerre Monétaire : {n} entrées.", "de": "{site} Währungskrieg-Verstärkungen: {n} Einträge.", "pt": "{site} melhorias de Guerra Monetária: {n} entradas.", "ru": "{site} усиления Валютной войны: {n} записей.", "th": "{site} การเสริมแกร่งสงครามcurrency: {n} รายการ", "vi": "{site} cường hóa Chiến tranh Tiền tệ: {n} mục.", "id": "{site} augment Currency Wars: {n} entri.",
    },
    "vor.field.progress": {
        "cn": "进度 {n}", "cht": "進度 {n}", "en": "Progress {n}", "jp": "進行度 {n}", "kr": "진행도 {n}", "es": "Progreso {n}", "fr": "Progression {n}", "de": "Fortschritt {n}", "pt": "Progresso {n}", "ru": "Прогресс {n}", "th": "ความคืบหน้า {n}", "vi": "Tiến độ {n}", "id": "Progres {n}",
    },
    "egm.fact.mode": {
        "cn": "所属玩法", "cht": "所屬玩法", "en": "Mode", "jp": "所属モード", "kr": "소속 모드", "es": "Modo", "fr": "Mode", "de": "Modus", "pt": "Modo", "ru": "Режим", "th": "โหมด", "vi": "Chế độ", "id": "Mode",
    },
    "egm.fact.buffSystem": {
        "cn": "增益体系", "cht": "增益體系", "en": "Buff System", "jp": "バフ体系", "kr": "버프 체계", "es": "Sistema de mejoras", "fr": "Système de bonus", "de": "Buff-System", "pt": "Sistema de bônus", "ru": "Система усилений", "th": "ระบบบัฟ", "vi": "Hệ thống buff", "id": "Sistem Buff",
    },
    "egm.seasonCount": {
        "cn": "{n} 期赛季", "cht": "{n} 期賽季", "en": "{n} seasons", "jp": "{n} 期", "kr": "{n}개 시즌", "es": "{n} temporadas", "fr": "{n} saisons", "de": "{n} Saisons", "pt": "{n} temporadas", "ru": "{n} сезонов", "th": "{n} ซีซัน", "vi": "{n} mùa", "id": "{n} musim",
    },
    "egm.fact.perSeason": {
        "cn": "每期条数", "cht": "每期條數", "en": "Entries per Season", "jp": "1期あたり件数", "kr": "시즌당 항목 수", "es": "Entradas por temporada", "fr": "Entrées par saison", "de": "Einträge pro Saison", "pt": "Entradas por temporada", "ru": "Записей за сезон", "th": "จำนวนต่อซีซัน", "vi": "Số mục mỗi mùa", "id": "Entri per Musim",
    },
    "egm.fact.choiceMode": {
        "cn": "选择方式", "cht": "選擇方式", "en": "Selection", "jp": "選択方式", "kr": "선택 방식", "es": "Selección", "fr": "Sélection", "de": "Auswahl", "pt": "Seleção", "ru": "Выбор", "th": "วิธีเลือก", "vi": "Cách chọn", "id": "Cara Memilih",
    },
    "mob.dropsTiers": {
        "cn": "（共 {n} 档均衡等级）", "cht": "（共 {n} 檔均衡等級）", "en": " ({n} Equilibrium Levels)", "jp": "（均衡レベル {n} 段階）", "kr": " (균형 레벨 {n}단계)", "es": " ({n} niveles de equilibrio)", "fr": " ({n} niveaux d'équilibre)", "de": " ({n} Gleichgewichtsstufen)", "pt": " ({n} níveis de equilíbrio)", "ru": " ({n} уровней равновесия)", "th": " (ระดับสมดุล {n} ระดับ)", "vi": " ({n} bậc cân bằng)", "id": " ({n} tingkat keseimbangan)",
    },
    "mob.atlasForms": {
        "cn": "同图鉴其他形态（本族共 {n} 个形态）", "cht": "同圖鑑其他形態（本族共 {n} 個形態）", "en": "Other forms in this entry ({n} in this family)", "jp": "同図鑑の他の形態（本族 {n} 形態）", "kr": "같은 도감의 다른 형태 (본계열 {n}개)", "es": "Otras formas de esta entrada ({n} en la familia)", "fr": "Autres formes de cette entrée ({n} dans la famille)", "de": "Weitere Formen dieses Eintrags ({n} in der Familie)", "pt": "Outras formas desta entrada ({n} na família)", "ru": "Другие формы в записи ({n} в семействе)", "th": "รูปแบบอื่นในสารบบนี้ (สายนี้ {n} รูปแบบ)", "vi": "Dạng khác trong mục này ({n} trong họ)", "id": "Bentuk lain di entri ini ({n} dalam keluarga)",
    },
    "snapshot.sum.cwPortal": {
        "cn": "{site}货币战争投资环境图鉴：共 {n} 个投资环境。", "cht": "{site}貨幣戰爭投資環境圖鑑：共 {n} 個投資環境。", "en": "{site} Currency Wars portals: {n} entries.", "jp": "{site} 貨幣戦争の投資環境図鑑：{n} 件。", "kr": "{site} 통화 전쟁 투자 환경 도감: {n}개.", "es": "{site} portales de Guerras Monetarias: {n} entradas.", "fr": "{site} portails de Guerre Monétaire : {n} entrées.", "de": "{site} Währungskrieg-Portale: {n} Einträge.", "pt": "{site} portais de Guerra Monetária: {n} entradas.", "ru": "{site} порталы Валютной войны: {n} записей.", "th": "{site} พอร์ทัลสงครามcurrency: {n} รายการ", "vi": "{site} cổng Chiến tranh Tiền tệ: {n} mục.", "id": "{site} portal Currency Wars: {n} entri.",
    },
    "snapshot.sum.cwItem": {
        "cn": "{site}货币战争装备图鉴：共 {n} 件装备，含分类、效果与属性加成。", "cht": "{site}貨幣戰爭裝備圖鑑：共 {n} 件裝備，含分類、效果與屬性加成。", "en": "{site} Currency Wars equipment: {n} items with category, effect and stat bonuses.", "jp": "{site} 貨幣戦争の装備図鑑：{n} 件、分類・効果・ステータスつき。", "kr": "{site} 통화 전쟁 장비 도감: {n}개, 분류·효과·능력치 포함.", "es": "{site} equipamiento de Guerras Monetarias: {n} objetos con categoría, efecto y bonificaciones.", "fr": "{site} équipement de Guerre Monétaire : {n} objets avec catégorie, effet et bonus.", "de": "{site} Währungskrieg-Ausrüstung: {n} Objekte mit Kategorie, Effekt und Boni.", "pt": "{site} equipamentos de Guerra Monetária: {n} itens com categoria, efeito e bônus.", "ru": "{site} снаряжение Валютной войны: {n} предметов с категорией, эффектом и бонусами.", "th": "{site} อุปกรณ์สงครามcurrency: {n} ชิ้น พร้อมหมวดหมู่ เอฟเฟกต์ และโบนัส", "vi": "{site} trang bị Chiến tranh Tiền tệ: {n} mục với phân loại, hiệu ứng và chỉ số.", "id": "{site} perlengkapan Currency Wars: {n} item dengan kategori, efek, dan bonus.",
    },
    "snapshot.viewAll": {
        "cn": "查看全部{label}", "cht": "查看全部{label}", "en": "View all {label}", "jp": "すべての{label}を見る", "kr": "{label} 전체 보기", "es": "Ver todo {label}", "fr": "Voir tout {label}", "de": "Alle {label} ansehen", "pt": "Ver todos {label}", "ru": "Все {label}", "th": "ดู{label}ทั้งหมด", "vi": "Xem tất cả {label}", "id": "Lihat semua {label}",
    },
    "snapshot.sum.home": {
        "cn": "{site}首页：{extra}，收录本版本新增的角色、光锥与遗器条目。", "cht": "{site}首頁：{extra}，收錄本版本新增的角色、光錐與遺器條目。", "en": "{site} home: {extra} new characters, light cones and relics from this version.", "jp": "{site} ホーム：{extra}、今回のバージョンで追加されたキャラ・光円錐・遺物を収録。", "kr": "{site} 홈: {extra}, 이번 버전에 추가된 캐릭터·광추·유물 수록.", "es": "{site} inicio: {extra}, personajes, conos de luz y reliquias de esta versión.", "fr": "{site} accueil : {extra}, personnages, cônes de lumière et reliques de cette version.", "de": "{site} Startseite: {extra}, neue Charaktere, Lichtkegel und Relikte dieser Version.", "pt": "{site} início: {extra}, personagens, cones de luz e relíquias desta versão.", "ru": "{site} главная: {extra}, новые персонажи, световые конусы и реликвии версии.", "th": "{site} หน้าแรก: {extra} รวมตัวละคร กรวยแสง และรีลิกใหม่ของเวอร์ชันนี้", "vi": "{site} trang chủ: {extra}, nhân vật, nón ánh sáng và di vật mới của phiên bản này.", "id": "{site} beranda: {extra}, karakter, light cone, dan relic baru versi ini.",
    },
    "mob.levelTag": {
        "cn": "等级 {n}", "cht": "等級 {n}", "en": "Level {n}", "jp": "レベル {n}", "kr": "레벨 {n}", "es": "Nivel {n}", "fr": "Niveau {n}", "de": "Stufe {n}", "pt": "Nível {n}", "ru": "Уровень {n}", "th": "ระดับ {n}", "vi": "Cấp {n}", "id": "Level {n}",
    },
    "vor.field.affixes": {
        "cn": "位面词条数", "cht": "位面詞條數", "en": "Plane Affixes", "jp": "位面詞条数", "kr": "차원 어픽스 수", "es": "Afijos de plano", "fr": "Affixes de plan", "de": "Ebenen-Affixe", "pt": "Afixos de plano", "ru": "Аффиксов плана", "th": "จำนวนคำเสริมระนาบ", "vi": "Số từ tố mặt phẳng", "id": "Affix Plane",
    },
    "vor.field.wishPower": {
        "cn": "愿力进度 {n}", "cht": "願力進度 {n}", "en": "Wishpower {n}", "jp": "願力進捗 {n}", "kr": "원력 진행도 {n}", "es": "Progreso de deseo {n}", "fr": "Progression de vœu {n}", "de": "Wunschkraft {n}", "pt": "Progresso de desejo {n}", "ru": "Прогресс силы желания {n}", "th": "ความคืบหน้าพลังปรารถนา {n}", "vi": "Tiến độ nguyện lực {n}", "id": "Progres kekuatan harapan {n}",
    },
    "egm.choice.fixed": {
        "cn": "固定生效，不可选择", "cht": "固定生效，不可選擇", "en": "Fixed, no choice", "jp": "固定発動・選択不可", "kr": "고정 적용, 선택 불가", "es": "Fijo, sin elección", "fr": "Fixe, sans choix", "de": "Fest, keine Wahl", "pt": "Fixo, sem escolha", "ru": "Фиксировано, без выбора", "th": "คงที่ เลือกไม่ได้", "vi": "Cố định, không chọn", "id": "Tetap, tanpa pilihan",
    },
    "egm.choice.perTeam": {
        "cn": "每支队伍选 1 条", "cht": "每支隊伍選 1 條", "en": "One per team", "jp": "チームごとに1つ", "kr": "팀당 1개", "es": "Una por equipo", "fr": "Un par équipe", "de": "Eines pro Team", "pt": "Uma por equipe", "ru": "По одному на команду", "th": "หนึ่งต่อทีม", "vi": "Mỗi đội 1", "id": "Satu per tim",
    },
    "egm.choice.perStage": {
        "cn": "每场战斗选 1 条", "cht": "每場戰鬥選 1 條", "en": "One per battle", "jp": "戦闘ごとに1つ", "kr": "전투당 1개", "es": "Una por combate", "fr": "Un par combat", "de": "Eines pro Kampf", "pt": "Uma por batalha", "ru": "По одному за бой", "th": "หนึ่งต่อการต่อสู้", "vi": "Mỗi trận 1", "id": "Satu per pertempuran",
    },
    "egm.choice.perKing": {
        "cn": "王棋挑战前选 1 条", "cht": "王棋挑戰前選 1 條", "en": "One before the King challenge", "jp": "王将戦の前に1つ", "kr": "왕기 도전 전 1개", "es": "Una antes del desafío del Rey", "fr": "Un avant le défi du Roi", "de": "Eines vor der König-Herausforderung", "pt": "Uma antes do desafio do Rei", "ru": "Одно перед испытанием Короля", "th": "หนึ่งก่อนดวลราชา", "vi": "Một trước thử thách Vua", "id": "Satu sebelum tantangan Raja",
    },
    "vor.field.activity": {
        "cn": "活动", "cht": "活動", "en": "Event", "jp": "イベント", "kr": "이벤트", "es": "Evento", "fr": "Événement", "de": "Event", "pt": "Evento", "ru": "Событие", "th": "กิจกรรม", "vi": "Sự kiện", "id": "Event",
    },
    "vor.field.wishTiers": {
        "cn": "愿力档位：{list}", "cht": "願力檔位：{list}", "en": "Wishpower tiers: {list}", "jp": "願力ティア：{list}", "kr": "원력 단계: {list}", "es": "Niveles de deseo: {list}", "fr": "Paliers de vœu : {list}", "de": "Wunschkraft-Stufen: {list}", "pt": "Níveis de desejo: {list}", "ru": "Уровни силы желания: {list}", "th": "ระดับพลังปรารถนา: {list}", "vi": "Bậc nguyện lực: {list}", "id": "Tingkat kekuatan harapan: {list}",
    },
    "vor.sec.invasionFull": {
        "cn": "「贪饕」侵蚀（敌方与玩家支援）", "cht": "「貪饕」侵蝕（敵方與玩家支援）", "en": "'Voracity' Corruption (enemy and player support)", "jp": "「貪食」侵蝕（敵と味方の支援）", "kr": "'탐식' 침식 (적 및 아군 지원)", "es": "Corrupción de la 'Voracidad' (apoyo enemigo y aliado)", "fr": "Corruption de la « Voracité » (soutien ennemi et allié)", "de": "„Verschlingung“-Korruption (Gegner- und Spieler-Support)", "pt": "Corrupção da 'Voracidade' (apoio inimigo e aliado)", "ru": "Порча «Прожорливости» (усиление врагов и поддержка игрока)", "th": "การกัดกร่อน 'Voracity' (ศัตรูและฝ่ายสนับสนุนผู้เล่น)", "vi": "Ăn mòn 'Voracity' (kẻ địch và hỗ trợ người chơi)", "id": "Korupsi 'Voracity' (dukungan musuh dan pemain)",
    },
    "vor.sec.enemyBuffs": {
        "cn": "敌方强化（关卡侵蚀）", "cht": "敵方強化（關卡侵蝕）", "en": "Enemy buffs (stage corruption)", "jp": "敵強化（ステージ侵蝕）", "kr": "적 강화 (스테이지 침식)", "es": "Mejoras enemigas (corrupción de nivel)", "fr": "Bonus ennemis (corruption de niveau)", "de": "Gegner-Buffs (Ebenen-Korruption)", "pt": "Melhorias inimigas (corrupção de estágio)", "ru": "Усиления врагов (порча этапа)", "th": "บัฟศัตรู (การกัดกร่อนด่าน)", "vi": "Tăng cường kẻ địch (ăn mòn ải)", "id": "Buff musuh (korupsi stage)",
    },
    "vor.sec.playerSupport": {
        "cn": "玩家支援（愿力分档）", "cht": "玩家支援（願力分檔）", "en": "Player support (wishpower tiers)", "jp": "味方支援（願力ティア）", "kr": "아군 지원 (원력 단계)", "es": "Apoyo aliado (niveles de deseo)", "fr": "Soutien allié (paliers de vœu)", "de": "Spieler-Support (Wunschkraft-Stufen)", "pt": "Apoio aliado (níveis de desejo)", "ru": "Поддержка игрока (уровни силы желания)", "th": "ฝ่ายสนับสนุนผู้เล่น (ระดับพลังปรารถนา)", "vi": "Hỗ trợ người chơi (bậc nguyện lực)", "id": "Dukungan pemain (tingkat kekuatan harapan)",
    },
    "prop.HealRatioBase": {
        "cn": "治疗量", "cht": "治療量", "en": "Healing", "jp": "治療量", "kr": "치유량",
        "es": "Sanación", "fr": "Soins", "de": "Heilung", "pt": "Cura", "ru": "Лечение",
        "th": "การรักษา", "vi": "Trị liệu", "id": "Penyembuhan",
    },
    "prop.AllDamageTypeAddedRatio": {
        "cn": "全属性伤害", "cht": "全屬性傷害", "en": "All-Type DMG", "jp": "全属性ダメージ", "kr": "모든 속성 피해",
        "es": "Daño de todos los tipos", "fr": "DGT tous types", "de": "Alltyp-SCH", "pt": "Dano de todos os tipos",
        "ru": "Урон всех типов", "th": "ดาเมจทุกธาตุ", "vi": "Sát thương mọi hệ", "id": "DMG semua tipe",
    },
    "prop.AllDamageTypePenetrate": {
        "cn": "全属性抗性穿透", "cht": "全屬性抗性穿透", "en": "All-Type RES PEN", "jp": "全属性耐性貫通",
        "kr": "모든 속성 저항 관통", "es": "Pen. RES de todos los tipos", "fr": "Pén. RÉS tous types",
        "de": "Alltyp-RES-Durchdr.", "pt": "PEN. RES de todos os tipos", "ru": "Пробой сопротивления всех типов",
        "th": "ทะลุต้านทานทุกธาตุ", "vi": "Xuyên kháng mọi hệ", "id": "RES PEN semua tipe",
    },
    "prop.ExtraAttackAddedRatio": {
        "cn": "攻击增幅", "cht": "攻擊增幅", "en": "ATK Boost", "jp": "攻撃強化", "kr": "공격 증가",
        "es": "Aumento de ATQ", "fr": "Augm. ATQ", "de": "ANG-Boost", "pt": "Aumento de ATQ",
        "ru": "Прирост атаки", "th": "เพิ่มพลังโจมตี", "vi": "Tăng tấn công", "id": "Peningkatan ATK",
    },
    "prop.ExtraDefenceAddedRatio": {
        "cn": "防御增幅", "cht": "防禦增幅", "en": "DEF Boost", "jp": "防御強化", "kr": "방어 증가",
        "es": "Aumento de DEF", "fr": "Augm. DÉF", "de": "VER-Boost", "pt": "Aumento de DEF",
        "ru": "Прирост защиты", "th": "เพิ่มพลังป้องกัน", "vi": "Tăng phòng thủ", "id": "Peningkatan DEF",
    },
    "prop.ExtraCriticalChanceBase": {
        "cn": "暴击率增幅", "cht": "暴擊率增幅", "en": "CRIT Rate Boost", "jp": "会心率強化", "kr": "치명타 확률 증가",
        "es": "Aumento de prob. de CRÍT", "fr": "Augm. taux CRIT", "de": "KRT-Rate-Boost",
        "pt": "Aumento de taxa CRÍT", "ru": "Прирост крит. шанса", "th": "เพิ่มอัตราคริ", "vi": "Tăng tỉ lệ bạo kích",
        "id": "Peningkatan CRIT Rate",
    },
    "prop.ExtraCriticalDamageBase": {
        "cn": "暴击伤害增幅", "cht": "暴擊傷害增幅", "en": "CRIT DMG Boost", "jp": "会心ダメージ強化",
        "kr": "치명타 피해 증가", "es": "Aumento de daño CRÍT", "fr": "Augm. DGT CRIT", "de": "KRT-SCH-Boost",
        "pt": "Aumento de dano CRÍT", "ru": "Прирост крит. урона", "th": "เพิ่มดาเมจคริ", "vi": "Tăng sát thương bạo kích",
        "id": "Peningkatan CRIT DMG",
    },
    "prop.AttackAddedRatio": {
        "cn": "攻击增幅", "cht": "攻擊增幅", "en": "ATK Boost", "jp": "攻撃強化", "kr": "공격 증가",
        "es": "Aumento de ATQ", "fr": "Augm. ATQ", "de": "ANG-Boost", "pt": "Aumento de ATQ",
        "ru": "Прирост атаки", "th": "เพิ่มพลังโจมตี", "vi": "Tăng tấn công", "id": "Peningkatan ATK",
    },
    "prop.DefenceAddedRatio": {
        "cn": "防御增幅", "cht": "防禦增幅", "en": "DEF Boost", "jp": "防御強化", "kr": "방어 증가",
        "es": "Aumento de DEF", "fr": "Augm. DÉF", "de": "VER-Boost", "pt": "Aumento de DEF",
        "ru": "Прирост защиты", "th": "เพิ่มพลังป้องกัน", "vi": "Tăng phòng thủ", "id": "Peningkatan DEF",
    },
    "itemMainType.Usable": {
        "cn": "可用", "cht": "可用", "en": "Usable", "jp": "使用可能", "kr": "사용 가능",
        "es": "Usable", "fr": "Utilisable", "de": "Verwendbar", "pt": "Utilizável", "ru": "Используемое",
        "th": "ใช้ได้", "vi": "Có thể dùng", "id": "Dapat dipakai",
    },
    "catalog.sig.intro": {
        "cn": "图鉴介绍", "cht": "圖鑑介紹", "en": "Bestiary entry", "jp": "図鑑説明", "kr": "도감 설명",
        "es": "Ficha de bestiario", "fr": "Fiche du bestiaire", "de": "Bestiarium-Eintrag",
        "pt": "Ficha do bestiário", "ru": "Описание в бестиарии", "th": "คำอธิบายสารานุกรม",
        "vi": "Mô tả sách quái", "id": "Keterangan bestiari",
    },
    "catalog.qualityLabel": {
        "cn": "{name}品质", "cht": "{name}品質", "en": "{name} quality", "jp": "{name}品質",
        "kr": "{name} 품질", "es": "Calidad {name}", "fr": "Qualité {name}", "de": "Qualität {name}",
        "pt": "Qualidade {name}", "ru": "Качество: {name}", "th": "คุณภาพ {name}",
        "vi": "Phẩm chất {name}", "id": "Kualitas {name}",
    },
    "catalog.activation": {
        "cn": "{n} 人激活", "cht": "{n} 人啟動", "en": "Activates with {n}", "jp": "{n}人で発動",
        "kr": "{n}명 활성화", "es": "Activa con {n}", "fr": "Activation à {n}", "de": "Aktiv ab {n}",
        "pt": "Ativa com {n}", "ru": "Активация при {n}", "th": "เปิดใช้ที่ {n}",
        "vi": "Kích hoạt với {n}", "id": "Aktif pada {n}",
    },
    "catalog.activationType.ge": {
        "cn": "≥N 人激活", "cht": "≥N 人啟動", "en": "≥N activates", "jp": "≥N人で発動",
        "kr": "≥N명 활성화", "es": "≥N activa", "fr": "≥N active", "de": "≥N aktiviert",
        "pt": "≥N ativa", "ru": "Активация при ≥N", "th": "≥N เปิดใช้",
        "vi": "≥N kích hoạt", "id": "≥N aktif",
    },
    "catalog.variantDiff": {
        "cn": "差分 {list}", "cht": "差分 {list}", "en": "Differs: {list}", "jp": "差分 {list}",
        "kr": "차이 {list}", "es": "Diferencias: {list}", "fr": "Écarts : {list}", "de": "Abweichung: {list}",
        "pt": "Diferenças: {list}", "ru": "Отличия: {list}", "th": "ต่างจาก: {list}",
        "vi": "Khác biệt: {list}", "id": "Beda: {list}",
    },
    "monster.rank.minion": {
        "cn": "普通", "cht": "普通", "en": "Normal", "jp": "通常", "kr": "일반",
        "es": "Normal", "fr": "Normal", "de": "Normal", "pt": "Normal", "ru": "Обычный",
        "th": "ปกติ", "vi": "Thường", "id": "Normal",
    },
    "monster.rank.littleBoss": {
        "cn": "准首领", "cht": "準首領", "en": "Little Boss", "jp": "準ボス", "kr": "준보스",
        "es": "Subjefe", "fr": "Sous-boss", "de": "Unterboss", "pt": "Subchefe", "ru": "Мини-босс",
        "th": "หัวหน้ารอง", "vi": "Tiểu thủ lĩnh", "id": "Bos kecil",
    },
    "catalog.achievement.search": {
        "cn": "搜索成就标题或描述…", "cht": "搜尋成就標題或描述…", "en": "Search achievement titles or descriptions…",
        "jp": "実績のタイトル・説明を検索…", "kr": "업적 제목 또는 설명 검색…",
        "es": "Buscar títulos o descripciones de logros…", "fr": "Rechercher un titre ou une description de succès…",
        "de": "Erfolgstitel oder -beschreibung suchen…", "pt": "Buscar títulos ou descrições de conquistas…",
        "ru": "Поиск по названию или описанию достижения…", "th": "ค้นหาชื่อหรือคำอธิบายความสำเร็จ…",
        "vi": "Tìm tên hoặc mô tả thành tựu…", "id": "Cari judul atau deskripsi pencapaian…",
    },
    "catalog.character.search": {
        "cn": "搜索角色...", "cht": "搜尋角色...", "en": "Search characters...", "jp": "キャラクターを検索...",
        "kr": "캐릭터 검색...", "es": "Buscar personajes...", "fr": "Rechercher des personnages...",
        "de": "Charaktere suchen...", "pt": "Buscar personagens...", "ru": "Поиск персонажей...",
        "th": "ค้นหาตัวละคร...", "vi": "Tìm nhân vật...", "id": "Cari karakter...",
    },
    "catalog.lightcone.search": {
        "cn": "搜索光锥...", "cht": "搜尋光錐...", "en": "Search Light Cones...", "jp": "光円錐を検索...",
        "kr": "광추 검색...", "es": "Buscar conos de luz...", "fr": "Rechercher des cônes de lumière...",
        "de": "Lichtkegel suchen...", "pt": "Buscar Cones de Luz...", "ru": "Поиск световых конусов...",
        "th": "ค้นหากรายแสง...", "vi": "Tìm Nón Ánh Sáng...", "id": "Cari Light Cone...",
    },
    "catalog.relic.search": {
        "cn": "搜索遗器...", "cht": "搜尋遺器...", "en": "Search relics...", "jp": "遺物を検索...",
        "kr": "유물 검색...", "es": "Buscar reliquias...", "fr": "Rechercher des reliques...",
        "de": "Relikte suchen...", "pt": "Buscar relíquias...", "ru": "Поиск реликвий...",
        "th": "ค้นหารีลิก...", "vi": "Tìm di vật...", "id": "Cari relic...",
    },
    "catalog.item.search": {
        "cn": "搜索物品...", "cht": "搜尋物品...", "en": "Search items...", "jp": "アイテムを検索...",
        "kr": "아이템 검색...", "es": "Buscar objetos...", "fr": "Rechercher des objets...",
        "de": "Gegenstände suchen...", "pt": "Buscar itens...", "ru": "Поиск предметов...",
        "th": "ค้นหาไอเทม...", "vi": "Tìm vật phẩm...", "id": "Cari item...",
    },
    "catalog.monster.search": {
        "cn": "搜索敌对物种、弱点或阵营...", "cht": "搜尋敵對物種、弱點或陣營...",
        "en": "Search species, weaknesses or factions...", "jp": "敵対種族・弱点・所属を検索...",
        "kr": "적대 종족, 약점 또는 소속 검색...", "es": "Buscar especies, debilidades o facciones...",
        "fr": "Rechercher espèces, faiblesses ou factions...", "de": "Spezies, Schwächen oder Fraktionen suchen...",
        "pt": "Buscar espécies, fraquezas ou facções...", "ru": "Поиск видов, уязвимостей или фракций...",
        "th": "ค้นหาสปีชีส์ จุดอ่อน หรือฝ่าย...", "vi": "Tìm chủng loài, điểm yếu hoặc phe...",
        "id": "Cari spesies, kelemahan, atau faksi...",
    },
    "catalog.endgame.search": {
        "cn": "搜索赛季...", "cht": "搜尋賽季...", "en": "Search seasons...", "jp": "シーズンを検索...",
        "kr": "시즌 검색...", "es": "Buscar temporadas...", "fr": "Rechercher des saisons...",
        "de": "Saisons suchen...", "pt": "Buscar temporadas...", "ru": "Поиск сезонов...",
        "th": "ค้นหาซีซัน...", "vi": "Tìm mùa...", "id": "Cari musim...",
    },
    "catalog.cwRole.search": {
        "cn": "搜索角色…", "cht": "搜尋角色…", "en": "Search characters…", "jp": "キャラクターを検索…",
        "kr": "캐릭터 검색…", "es": "Buscar personajes…", "fr": "Rechercher des personnages…",
        "de": "Charaktere suchen…", "pt": "Buscar personagens…", "ru": "Поиск персонажей…",
        "th": "ค้นหาตัวละคร…", "vi": "Tìm nhân vật…", "id": "Cari karakter…",
    },
    "catalog.cwEquipment.search": {
        "cn": "搜索装备…", "cht": "搜尋裝備…", "en": "Search equipment…", "jp": "装備を検索…",
        "kr": "장비 검색…", "es": "Buscar equipamiento…", "fr": "Rechercher de l'équipement…",
        "de": "Ausrüstung suchen…", "pt": "Buscar equipamento…", "ru": "Поиск снаряжения…",
        "th": "ค้นหาอุปกรณ์…", "vi": "Tìm trang bị…", "id": "Cari peralatan…",
    },
    "catalog.cwPortal.search": {
        "cn": "搜索投资环境…", "cht": "搜尋投資環境…", "en": "Search portals…", "jp": "ポータルを検索…",
        "kr": "포털 검색…", "es": "Buscar portales…", "fr": "Rechercher des portails…",
        "de": "Portale suchen…", "pt": "Buscar portais…", "ru": "Поиск порталов…",
        "th": "ค้นหาพอร์ทัล…", "vi": "Tìm cổng…", "id": "Cari portal…",
    },
    "catalog.cwAugment.search": {
        "cn": "搜索投资策略…", "cht": "搜尋投資策略…", "en": "Search augments…", "jp": "オーグメントを検索…",
        "kr": "증강 검색…", "es": "Buscar aumentos…", "fr": "Rechercher des améliorations…",
        "de": "Verbesserungen suchen…", "pt": "Buscar aprimoramentos…", "ru": "Поиск усилений…",
        "th": "ค้นหาออคเมนต์…", "vi": "Tìm nâng cấp…", "id": "Cari augment…",
    },
    "catalog.cwTrait.search": {
        "cn": "搜索羁绊…", "cht": "搜尋羈絆…", "en": "Search traits…", "jp": "絆を検索…",
        "kr": "인연 검색…", "es": "Buscar vínculos…", "fr": "Rechercher des liens…",
        "de": "Bindungen suchen…", "pt": "Buscar vínculos…", "ru": "Поиск связей…",
        "th": "ค้นหาสายสัมพันธ์…", "vi": "Tìm liên kết…", "id": "Cari ikatan…",
    },
    "catalog.unknownSeries": {        "cn": "未知系列", "cht": "未知系列", "en": "Unknown series", "jp": "不明なシリーズ",
        "kr": "알 수 없는 시리즈", "es": "Serie desconocida", "fr": "Série inconnue",
        "de": "Unbekannte Serie", "pt": "Série desconhecida", "ru": "Неизвестная серия",
        "th": "ซีรีส์ไม่ทราบชื่อ", "vi": "Chuỗi không rõ", "id": "Seri tidak dikenal",
    },
    "catalog.rarityGem": {        "cn": "{rarity}稀有度", "cht": "{rarity}稀有度", "en": "{rarity} rarity", "jp": "{rarity}レア度",
        "kr": "{rarity} 희귀도", "es": "Rareza {rarity}", "fr": "Rareté {rarity}",
        "de": "Seltenheit {rarity}", "pt": "Raridade {rarity}", "ru": "Редкость: {rarity}",
        "th": "ระดับความหายาก {rarity}", "vi": "Độ hiếm {rarity}", "id": "Kelangkaan {rarity}",
    },
    "catalog.option.rarityLow": {
        "cn": "铜", "cht": "銅", "en": "Bronze", "jp": "ブロンズ", "kr": "브론즈",
        "es": "Bronce", "fr": "Bronze", "de": "Bronze", "pt": "Bronze", "ru": "Бронза",
        "th": "บรอนซ์", "vi": "Đồng", "id": "Perunggu",
    },
    "catalog.option.rarityMid": {
        "cn": "银", "cht": "銀", "en": "Silver", "jp": "シルバー", "kr": "실버",
        "es": "Plata", "fr": "Argent", "de": "Silber", "pt": "Prata", "ru": "Серебро",
        "th": "ซิลเวอร์", "vi": "Bạc", "id": "Perak",
    },
    "catalog.option.rarityHigh": {
        "cn": "金", "cht": "金", "en": "Gold", "jp": "ゴールド", "kr": "골드",
        "es": "Oro", "fr": "Or", "de": "Gold", "pt": "Ouro", "ru": "Золото",
        "th": "โกลด์", "vi": "Vàng", "id": "Emas",
    },
    "catalog.option.showNone": {
        "cn": "常显", "cht": "常顯", "en": "Always shown", "jp": "常時表示", "kr": "항상 표시",
        "es": "Siempre visible", "fr": "Toujours affiché", "de": "Immer sichtbar",
        "pt": "Sempre visível", "ru": "Всегда видно", "th": "แสดงตลอด", "vi": "Luôn hiển thị",
        "id": "Selalu tampil",
    },
    "catalog.option.showAfterFinish": {
        "cn": "完成后显示", "cht": "完成後顯示", "en": "Shown after completion", "jp": "達成後に表示",
        "kr": "완료 후 표시", "es": "Visible al completar", "fr": "Affiché après achèvement",
        "de": "Nach Abschluss sichtbar", "pt": "Visível após concluir", "ru": "Видно после завершения",
        "th": "แสดงหลังสำเร็จ", "vi": "Hiện sau khi hoàn thành", "id": "Tampil setelah selesai",
    },
    "catalog.option.showHidden": {
        "cn": "隐藏描述", "cht": "隱藏描述", "en": "Hidden description", "jp": "説明を隠す",
        "kr": "설명 숨김", "es": "Descripción oculta", "fr": "Description masquée",
        "de": "Beschreibung verborgen", "pt": "Descrição oculta", "ru": "Описание скрыто",
        "th": "ซ่อนคำอธิบาย", "vi": "Ẩn mô tả", "id": "Deskripsi disembunyikan",
    },
}


_GENDER_RE = re.compile(r"\{([MF])#([^}]*)\}")
_RUBY_RE = re.compile(r"\{RUBY_[EB]#[^}]*\}")

def sanitize_message(text: str) -> str:
    """把官方文本里的**非 vue-i18n 标记**清掉。

    词典值由 `t()` 编译，任何 `{…}` 都会被 vue-i18n 当占位符：德语「开拓者」官方写法是
    `{M#Trailblazer}{F#Trailblazerin}`（性别变体），直接进词典会抛
    `SyntaxError: Invalid token in placeholder` 并让整页渲染异常；日文混排的
    `{RUBY_B#…}` 同理。口径与转换器 `textmap._neutralize_gender` 一致：
    **独占整段的性别变体取第一支**，句内变体展开，ruby 标记直接去除。
    """
    if not text:
        return text
    stripped = _GENDER_RE.sub("", text)
    if not stripped.strip():
        m = _GENDER_RE.search(text)
        if m:
            text = m.group(2)
    else:
        text = _GENDER_RE.sub(lambda mm: mm.group(2), text)
    return _RUBY_RE.sub("", text)

def load_shard(name: str) -> dict[str, str]:
    with open(TM / name, encoding="utf-8") as f:
        return json.load(f)


def language_textmaps() -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for lang in LANGUAGES:
        merged: dict[str, str] = {}
        for shard in lang.textmap:
            merged.update(load_shard(shard))
        out[lang.code] = merged
    return out


def resolve_hashes() -> tuple[dict[str, str], dict[str, str]]:
    """→ (可溯源的键→hash, 不可溯源的键→中文标签)。"""
    chs = load_shard("TextMapCHS.json")
    rev: dict[str, str] = {}
    for k, v in chs.items():
        if len(v) <= 18 and v not in rev:
            rev[v] = k
    ok: dict[str, str] = {}
    missing: dict[str, str] = {}
    for key, label in LABELS.items():
        h = OVERRIDE_HASH.get(key) or rev.get(label)
        (ok if h else missing)[key] = h or label  # type: ignore[assignment]
    return ok, missing


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只报告，不写文件")
    args = ap.parse_args()

    ok, missing = resolve_hashes()
    tables = language_textmaps()
    print(f"可溯源 {len(ok)} 项 / 不可溯源 {len(missing)} 项（后者须进 AUTHORED）")
    unlisted = [k for k in missing if k not in AUTHORED]
    if unlisted:
        print(f"[FAIL] {len(unlisted)} 项既不可溯源、也不在 AUTHORED 表里：")
        for key in unlisted:
            print(f"   {key} = {missing[key]}")
        return 1

    drift: list[str] = []
    written = 0
    for lang in LANGUAGES:
        code = lang.code
        path = MSG_DIR / f"{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        # 注意：本工具**不是**词典键集的唯一所有者——实测有 50 个键只存在于 JSON 里
        # （`nav.*` / `settings.*` 等，代码在用），删它们会直接打崩界面。故这里只写不删；
        # 「哪些键没人引用」由 `tools/check-i18n-messages.mjs` 的**报告**呈现，不自动清理。
        before = dict(data)
        for stale in REMOVED_KEYS:
            data.pop(stale, None)
        for key, h in ok.items():
            got = tables[code].get(h, "")
            if not got.strip():
                drift.append(f"{code}: 官方缺 {key}（hash {h}）")
                continue
            data[key] = sanitize_message(got)
        for key, values in AUTHORED.items():
            data[key] = sanitize_message(values[code])
        if data != before and not args.check:
            path.write_text(
                json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            written += 1
        if args.check:
            for key in list(ok) + list(AUTHORED):
                if before.get(key) != data[key]:
                    drift.append(f"{code}: {key} 现值 {before.get(key)!r} ≠ 官方/撰写值 {data[key]!r}")

    if drift:
        print(f"[FAIL] 漂移 {len(drift)} 处：")
        for row in drift[:20]:
            print("   ", row)
        return 1
    print(f"[PASS] 无漂移；写法 {written} 份" if not args.check else "[PASS] 词典与官方译文一致")
    return 0


if __name__ == "__main__":
    sys.exit(main())
