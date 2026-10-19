<script setup lang="ts">
import { computed, ref } from 'vue';
import { cdnUri } from '../../services/cdn';
import { charStageForLevel, fmtStatValue, levelStatValue, maxLevelStat } from '../../lib/format';
import { CHAR_STAGE_LEVEL_CAPS, MAX_CHAR_LEVEL } from '../../lib/constants';
import { SECTION_IDX } from './sections';
import type { CharacterData } from '../../services/types';

import { translate } from '../i18n';

const t = translate;


const props = defineProps<{ d: CharacterData }>();

interface Stat {
  v: number | string;
  l: string;
  icon: string;
  k: string;
  add?: number;
}
interface StatTier { id: 'panel' | 'param'; items: Stat[] }

const TRACE_TAUNT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#fff' fill-rule='evenodd' d='M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8zm0 3.4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z'/><path fill='#fff' d='M11.1 0.4h1.8v3.4h-1.8zM11.1 20.2h1.8v3.4h-1.8zM0.4 11.1h3.4v1.8H0.4zM20.2 11.1h3.4v1.8h-3.4z'/></svg>");

const level = ref(MAX_CHAR_LEVEL);
const stageCount = computed(() => Object.keys(props.d.stats ?? {}).length);
const sliderEnabled = computed(() => stageCount.value === CHAR_STAGE_LEVEL_CAPS.length + 1);
const stage = computed(() => charStageForLevel(level.value, stageCount.value));
const fillPct = computed(() => ((level.value - 1) / Math.max(MAX_CHAR_LEVEL - 1, 1)) * 100);

function onSlider(e: Event): void {
  level.value = Number((e.target as HTMLInputElement).value);
}

const tiers = computed<StatTier[]>(() => {
  const stats = props.d.stats;
  const maxStat = maxLevelStat(stats);
  if (!stats || !maxStat) return [];
  const cur = (sliderEnabled.value && stats[String(stage.value)]) || maxStat;
  const lv = sliderEnabled.value ? level.value : MAX_CHAR_LEVEL;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const mk = (v: number | string, l: string, k: string, icon: string, add?: number): Stat => ({ v, l, k, icon, add });
  const grow = (base: number, add: number) => Math.round(levelStatValue(base, add, lv));
  return [
    {
      id: 'panel',
      items: [
        mk(grow(cur.hp_base, cur.hp_add), t('common.stat.hp'), 'hp', cdnUri('trace', 'IconMaxHP.webp'), cur.hp_add),
        mk(grow(cur.attack_base, cur.attack_add), t('common.stat.atk'), 'atk', cdnUri('trace', 'IconAttack.webp'), cur.attack_add),
        mk(grow(cur.defence_base, cur.defence_add), t('common.stat.def'), 'def', cdnUri('trace', 'IconDefence.webp'), cur.defence_add),
      ],
    },
    {
      id: 'param',
      items: [
        mk(maxStat.speed_base, t('catalog.charge.speed'), 'spd', cdnUri('trace', 'IconSpeed.webp')),
        mk(fmtPct(maxStat.critical_chance), t('prop.CriticalChanceBase'), 'crit-rate', cdnUri('trace', 'IconCriticalChance.webp')),
        mk(fmtPct(maxStat.critical_damage), t('prop.CriticalDamageBase'), 'crit-dmg', cdnUri('trace', 'IconCriticalDamage.webp')),
        mk(maxStat.base_aggro ?? 0, t('stat.taunt'), 'taunt', TRACE_TAUNT_SVG),
        mk(props.d.sp_need ?? '—', t('stat.energyCap'), 'energy', cdnUri('trace', 'IconEnergyLimit.webp')),
      ],
    },
  ];
});

function fmtAdd(n: number): string {
  return String(Number(n.toFixed(3)));
}
</script>

<template>
  <section class="nk-stats">
    <h2 class="nk-title">
      <span class="nk-title__idx">{{ SECTION_IDX.stats }}</span>BASE STATS
    </h2>
    <div v-if="sliderEnabled" class="nk-stats__level">
      <div class="nk-skill__slider">
        <span class="nk-slider__val nk-stats__level-val">Lv.{{ level }}/{{ MAX_CHAR_LEVEL }}</span>
        <span class="nk-stats__level-stage">{{ t('stat.stage', { n: stage }) }}</span>
        <input
          type="range"
          min="1"
          :max="MAX_CHAR_LEVEL"
          :value="level"
          :aria-label="t('stat.levelAria')"
          :aria-valuetext="t('stat.levelValue', { level, stage })"
          :style="{ '--fill': fillPct + '%' }"
          @input="onSlider"
        >
      </div>
    </div>
    <dl
      v-for="tier in tiers"
      :key="tier.id"
      class="nk-stats__tier"
      :class="`nk-stats__tier--${tier.id}`"
    >
      <div v-for="st in tier.items" :key="st.l" class="nk-stats__stat" :data-prop="st.k">
        <dt class="nk-stats__term">
          <span class="nk-stats__mark" aria-hidden="true"></span>
          <img class="nk-stats__icon" :src="st.icon" alt="" aria-hidden="true">
          <span class="nk-stats__label">{{ st.l }}</span>
        </dt>
        <dd class="nk-stats__readout">
          <span class="nk-stats__val">{{ fmtStatValue(st.v) }}</span>
          <span v-if="st.add" class="nk-stats__add">{{ t('stat.perLevel', { v: fmtAdd(st.add) }) }}</span>
        </dd>
      </div>
    </dl>
    <p class="nk-stats__note">{{ t('stat.note') }}</p>
  </section>
</template>
