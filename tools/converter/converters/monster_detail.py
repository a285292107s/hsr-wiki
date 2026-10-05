"""敌对物种详情转换器：从共享聚合表拼装每个怪物的完整详情数据。

输出：public/data/cn/monsters/{id}.json（按模板 ID 每怪物一文件，与目录页 href 一致）
数据源（经 monster_common.load_monsters 聚合）：
- MonsterTemplateConfig.json  名称 / 头像 / 全身立绘 / 分类 Rank / 阵营 / 韧性值 / 基础属性
- MonsterConfig.json          韧性弱点 / 伤害抗性 / 图鉴介绍 / 技能列表 / 维度修饰比 / HardLevelGroup
- MonsterCamp.json            阵营名称
- MonsterSkillConfig.json     技能全量（名称 / 标签 / 类型 / 伤害与攻击类型 / 描述 / 参数）
- HardLevelGroup.json         等级曲线（单例落 monster-level-curve.json，与详情页共用）

输出在传统字段基础上追加 `stat_ratio`（维度修饰比）与 `level_group`（难度组号），
战斗数值在**前端**合成：stat = stats × stat_ratio × curve[level_group][level]（ADR 0040）。

技能描述保留原始富文本（#N[i] 参数占位 + color/unbreak 标签），前端 fmtDesc 渲染；
param_list 为 ParamList 的 Value 数组（占位符替换参数）。
侵入名单内的怪物附可选块 invaded（污染归属，解析与专题页共用 voracity 侧实现；模板页与实例
别名页同值）。
"""
import logging

from config import OUTPUT_DIR
from utils import save_json
from converters.monster_common import load_level_curve, load_monsters
from converters.voracity import load_invasion_map

logger = logging.getLogger("converter")


def convert() -> None:
    """转换敌对物种详情数据 → monsters/{id}.json + 共享等级曲线 monster-level-curve.json。"""
    monsters = load_monsters()
    curve = load_level_curve()
    # 等级曲线单独落盘：745 行共享一份，详情页按需取（shared single），避免 632 份 payload 各带一份
    save_json(curve, OUTPUT_DIR / "monster-level-curve.json")
    invaded = load_invasion_map(monsters)
    output_dir = OUTPUT_DIR / "monsters"
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for mid in sorted(monsters):
        info = monsters[mid]
        detail = {
            "id": mid,
            "name": info["name"],
            "icon": info["icon"],
            "figure": info["figure"],
            "rank": info["rank"],
            "camp": info["camp"],
            "stance": info["stance"],
            "weak": info["weak"],
            "resist": info["resist"],
            "intro": info["intro"],
            "stats": info["stats"],
            "skills": info["skills"],
            # 战斗数值合成链第二/三段（ADR 0040）：基准 stats × 维度修饰比 × level_group 曲线
            "stat_ratio": info["stat_ratio"],
            "level_group": info["level_group"],
        }
        # 实例别名页与模板页同源（_tpl 指向模板 ID），标记按模板归属写入，避免同怪两页不一致
        tpl = info.get("_tpl") or mid
        if tpl in invaded:
            detail["invaded"] = invaded[tpl]
        save_json(detail, output_dir / f"{mid}.json")
        count += 1

    logger.info("已保存 %d 个敌对物种详情到 %s", count, output_dir)
