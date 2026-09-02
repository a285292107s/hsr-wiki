<script setup lang="ts">
/**
 * 00 属性面板：角色满级基础属性规格表 + 等级条。
 * 原 CharHero 属性区段迁出（Hero 以立绘展示为主），区块编号 00（见 sections.ts）。
 * 术语与图标均出自子仓库 AvatarPropertyConfig：PropertyName → TextMap 官方名称；
 * IconPath → SpriteOutput/UI/Avatar/Icon/Icon*.png，经 cdnUri trace 分类解析为 jsDelivr 路径。
 */
import { computed } from 'vue';
import { cdnUri } from '../../services/cdn';
import { maxLevelStat, maxLevelValue } from '../../lib/format';
import { MAX_CHAR_LEVEL } from '../../lib/constants';
import { SECTION_IDX } from './sections';
import type { CharacterData } from '../../services/types';

const props = defineProps<{ d: CharacterData }>();

interface Stat { v: number | string; l: string; icon: string }

/**
 * 嘲讽无官方图标资产（已核实：AvatarPropertyConfig 无 Aggro 条目、IconPath 全量扫描无引用；
 * StarRailTextures 仓库 ui/avatar/icon/IconAggro.png 404），以白色线性风格 SVG 顶替。
 */
const TRACE_TAUNT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2.5 19.5 6v5.5c0 4.6-3.2 7.8-7.5 9.5-4.3-1.7-7.5-4.9-7.5-9.5V6z' fill='none' stroke='#fff' stroke-width='1.8' stroke-linejoin='round'/><path d='M12 8.5v6.5M9.5 10.5 12 8l2.5 2.5' fill='none' stroke='#fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");

/** 全部 8 项展示属性 */
const stats = computed<Stat[]>(() => {
  const dd = props.d;
  const s = maxLevelStat(dd.stats);
  if (!s) return [];
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const mk = (v: number | string, l: string, icon: string): Stat => ({
    v, l, icon,
  });
  return [
    mk(Math.round(maxLevelValue(s.hp_base, s.hp_add)), '生命值', cdnUri('trace', 'IconMaxHP.webp')),
    mk(Math.round(maxLevelValue(s.attack_base, s.attack_add)), '攻击力', cdnUri('trace', 'IconAttack.webp')),
    mk(Math.round(maxLevelValue(s.defence_base, s.defence_add)), '防御力', cdnUri('trace', 'IconDefence.webp')),
    mk(s.speed_base, '速度', cdnUri('trace', 'IconSpeed.webp')),
    mk(fmtPct(s.critical_chance), '暴击率', cdnUri('trace', 'IconCriticalChance.webp')),
    mk(fmtPct(s.critical_damage), '暴击伤害', cdnUri('trace', 'IconCriticalDamage.webp')),
    mk(s.base_aggro ?? 0, '嘲讽', TRACE_TAUNT_SVG),
    mk(dd.sp_need ?? 0, '能量上限', cdnUri('trace', 'IconEnergyLimit.webp')),
  ];
});
</script>

<template>
  <section class="nk-stats">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.stats }}</span>BASE STATS</h2>
    <div class="nk-stats__grid">
      <div v-for="st in stats" :key="st.l" class="nk-stats__stat">
        <img class="nk-stats__icon" :src="st.icon" alt="" aria-hidden="true">
        <span class="nk-stats__label">{{ st.l }}</span>
        <span class="nk-stats__val">{{ st.v }}</span>
      </div>
    </div>
    <div class="nk-stats__level">
      <span class="nk-stats__level-label">Lv. {{ MAX_CHAR_LEVEL }}/{{ MAX_CHAR_LEVEL }}</span>
      <div class="nk-stats__level-track">
        <div class="nk-stats__level-fill" style="width: 100%"></div>
      </div>
    </div>
  </section>
</template>
