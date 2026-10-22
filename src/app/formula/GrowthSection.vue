<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { MAX_CHAR_LEVEL } from '../../lib/constants';
import { statAtLevel, traceBonuses } from '../../lib/formula/growth';
import type { GrowthProp, PhaseStatMap } from '../../lib/formula/growth';
import type { MonsterEliteGroups, MonsterLevelCurve } from '../../lib/monster-stats';
import { monsterMaxLevel, monsterStanceValue, monsterStatBreakdown } from '../../lib/monster-stats';
import { propLabel } from '../../lib/enum-labels';
import { charStageForLevel, fmtNumber } from '../../lib/format';
import type { CharacterData, LocalCharList, LocalMonsterList, MonsterDetail } from '../../services/types';
import { translate as t } from '../i18n';
import SliderField from './SliderField.vue';

const props = defineProps<{
  idx: string;
  chars: LocalCharList;
  monsters: LocalMonsterList;
  curve: MonsterLevelCurve;
  elite: MonsterEliteGroups;
  char: CharacterData | null;
  monster: MonsterDetail | null;
  charId: string;
  monsterId: string;
  charLoading: boolean;
  monsterLoading: boolean;
  enemyLevel: number;
}>();

const emit = defineEmits<{
  'update:charId': [value: string];
  'update:monsterId': [value: string];
  'update:enemyLevel': [value: number];
}>();

const PROP_DEFS: { key: GrowthProp; i18n: 'hp' | 'atk' | 'def' }[] = [
  { key: 'hp', i18n: 'hp' },
  { key: 'attack', i18n: 'atk' },
  { key: 'defence', i18n: 'def' },
];

const SKILL_KINDS: Record<string, 'normal' | 'skill' | 'ultra'> = {
  Normal: 'normal',
  BPSkill: 'skill',
  Ultra: 'ultra',
};

const tab = ref<'char' | 'enemy'>('char');
const charLevel = ref(MAX_CHAR_LEVEL);
const skillId = ref('');
const skillLevel = ref(1);
const eliteKey = ref('');

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

const phaseMap = computed<PhaseStatMap | null>(() => {
  const stats = props.char?.stats;
  if (!stats) return null;
  const out: PhaseStatMap = {};
  for (const [key, row] of Object.entries(stats)) {
    out[key] = {
      hp_base: row.hp_base,
      hp_add: row.hp_add,
      attack_base: row.attack_base,
      attack_add: row.attack_add,
      defence_base: row.defence_base,
      defence_add: row.defence_add,
    };
  }
  return out;
});

const levelRange = computed(() => ({ min: 1, max: MAX_CHAR_LEVEL }));

function phaseRowAt(level: number): { hp_add: number; attack_add: number; defence_add: number } | null {
  const map = phaseMap.value;
  if (!map) return null;
  const rows = Object.entries(map)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, row]) => row);
  if (!rows.length) return null;
  return rows[Math.min(charStageForLevel(level, rows.length), rows.length - 1)] ?? null;
}

const readouts = computed(() =>
  PROP_DEFS.map((def) => {
    const map = phaseMap.value;
    const value = map ? statAtLevel(map, def.key, charLevel.value) : null;
    const row = phaseRowAt(charLevel.value);
    const add = row ? row[`${def.key}_add` as 'hp_add' | 'attack_add' | 'defence_add'] : null;
    return {
      dataProp: def.i18n,
      label: t(`formula.prop.${def.i18n}`),
      value: value == null || !Number.isFinite(value) ? '-' : fmtNumber(Math.round(value)),
      delta: add == null || !Number.isFinite(add) ? '' : t('stat.perLevel', { v: fmtNumber(round(add, 2)) }),
    };
  }),
);

const traceRows = computed(() => {
  const rows = traceBonuses(props.char?.skill_trees ?? null);
  const top = rows.slice(0, 3);
  const scale = top.length ? Math.abs(top[0].value) : 0;
  return top.map((row) => ({
    tier: row.id,
    label: propLabel(row.id),
    value: `${fmtNumber(round(row.value * 100, 1))}%`,
    pct: scale > 0 ? Math.max(0, Math.min(100, (Math.abs(row.value) / scale) * 100)) : 0,
  }));
});

const skillOptions = computed(() =>
  Object.entries(props.char?.skills ?? {})
    .filter(([, skill]) => !!SKILL_KINDS[String(skill.type)])
    .map(([id, skill]) => ({ id, name: skill.name })),
);

watch(skillOptions, (list) => {
  if (list.length && !list.some((item) => item.id === skillId.value)) skillId.value = list[0].id;
}, { immediate: true });

const skillLevels = computed(() => {
  const id = skillId.value;
  if (!id) return [];
  return Object.values(props.char?.skills?.[id]?.level ?? {})
    .slice()
    .sort((a, b) => a.level - b.level);
});

const skillMaxLevel = computed(() => {
  const levels = skillLevels.value;
  return Math.max(1, levels[levels.length - 1]?.level ?? 1);
});

watch(skillMaxLevel, (max) => {
  if (skillLevel.value > max) skillLevel.value = max;
  if (skillLevel.value < 1) skillLevel.value = 1;
}, { immediate: true });

const skillMultiplier = computed(() => {
  const levels = skillLevels.value;
  const hit = levels.find((row) => row.level === skillLevel.value) ?? levels[levels.length - 1];
  const raw = hit?.param_list?.[0];
  return raw == null || !Number.isFinite(raw) ? '-' : `${fmtNumber(round(raw * 100, 1))}%`;
});

const ELITE_LADDER_MAX = 12;

const eliteList = computed(() => {
  const groups = Object.keys(props.elite)
    .map(Number)
    .filter((key) => Number.isFinite(key))
    .sort((a, b) => a - b);
  const ladder = groups.filter((key) => key <= ELITE_LADDER_MAX);
  const list = (ladder.length ? ladder : groups.slice(0, ELITE_LADDER_MAX)).map(String);
  const current = String(props.monster?.elite_group ?? '');
  if (current && !list.includes(current)) list.push(current);
  return list;
});

watch(() => props.monster, (monster) => {
  const list = eliteList.value;
  const want = String(monster?.elite_group ?? '');
  eliteKey.value = list.includes(want) ? want : (list[0] ?? '');
}, { immediate: true });

const groupKey = computed(() => String(props.monster?.level_group ?? 1));

const enemyMax = computed(() => {
  const max = monsterMaxLevel(props.curve, groupKey.value);
  return Math.max(1, Number.isFinite(max) && max > 0 ? max : MAX_CHAR_LEVEL);
});

watch(enemyMax, (max) => {
  if (props.enemyLevel > max) emit('update:enemyLevel', max);
  if (props.enemyLevel < 1) emit('update:enemyLevel', 1);
}, { immediate: true });

const eliteRatios = computed(() => props.elite[eliteKey.value] ?? null);

function breakdownOf(prop: 'hp' | 'atk' | 'def' | 'speed', level: number) {
  const monster = props.monster;
  if (!monster) return null;
  return monsterStatBreakdown(prop, level, {
    stats: monster.stats,
    statRatio: monster.stat_ratio ?? null,
    eliteRatios: eliteRatios.value,
    curve: props.curve,
    modify: prop === 'speed' ? { speed: monster.speed_modify ?? 0 } : null,
  });
}

const ENEMY_PROPS: { key: 'hp' | 'atk' | 'def' | 'speed'; i18n: string }[] = [
  { key: 'hp', i18n: 'hp' },
  { key: 'atk', i18n: 'atk' },
  { key: 'def', i18n: 'def' },
  { key: 'speed', i18n: 'speed' },
];

const monsterReadouts = computed(() =>
  ENEMY_PROPS.map((def) => {
    const row = breakdownOf(def.key, props.enemyLevel);
    return {
      key: def.key,
      label: t(`formula.prop.${def.i18n}`),
      value: row?.value == null ? '-' : fmtNumber(round(row.value, 1)),
    };
  }),
);

const monsterFactors = computed(() => {
  const monster = props.monster;
  const row = breakdownOf('hp', props.enemyLevel);
  if (!monster || !row) return [];
  return [
    { key: 'base', label: t('formula.growth.baseValue'), value: row.base == null ? '-' : fmtNumber(round(row.base, 2)) },
    { key: 'curve', label: t('formula.term.enemyLevelGroup'), value: row.curve == null ? '-' : fmtNumber(round(row.curve, 3)) },
    { key: 'ratio', label: t('formula.term.statRatio'), value: fmtNumber(round(row.statRatio, 3)) },
    { key: 'elite', label: t('formula.term.eliteRatio'), value: fmtNumber(round(row.eliteRatio, 3)) },
    { key: 'modify', label: t('formula.term.modifyValue'), value: row.modify == null ? '-' : fmtNumber(round(row.modify, 2)) },
  ];
});

const monsterStance = computed(() => {
  const monster = props.monster;
  if (!monster) return '-';
  const value = monsterStanceValue(monster.stance ?? null, monster.stance_modify ?? null, eliteRatios.value?.stance ?? null);
  return value == null ? '-' : fmtNumber(round(value, 1));
});

function eliteTitle(group: string): string {
  const row = props.elite[group];
  if (!row) return `#${group}`;
  const parts = (['hp', 'atk', 'def'] as const).map(
    (key) => `${t(`formula.prop.${key}`)} ×${fmtNumber(round(row[key] ?? 1, 2))}`,
  );
  return `#${group} · ${parts.join(' · ')}`;
}

function selectChar(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value) emit('update:charId', value);
}

function selectMonster(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value) emit('update:monsterId', value);
}

function selectSkill(event: Event): void {
  skillId.value = (event.target as HTMLSelectElement).value;
}
</script>

<template>
  <section id="formula-growth" class="nk-formula-sec" data-sec="growth">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.growth') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.growth.lead') }}</p>

    <div class="nk-formula-tabs">
      <button
        type="button"
        class="nk-formula-tab"
        :class="{ 'nk-formula-tab--on': tab === 'char' }"
        data-tab="char"
        :aria-pressed="tab === 'char'"
        @click="tab = 'char'"
      >{{ t('formula.growth.tab.char') }}</button>
      <button
        type="button"
        class="nk-formula-tab"
        :class="{ 'nk-formula-tab--on': tab === 'enemy' }"
        data-tab="enemy"
        :aria-pressed="tab === 'enemy'"
        @click="tab = 'enemy'"
      >{{ t('formula.growth.tab.enemy') }}</button>
    </div>

    <div v-if="tab === 'char'" class="nk-formula-panel nk-formula-growth" :aria-busy="charLoading">
      <div class="nk-formula-growth__aside">
      <p class="nk-formula-eq">{{ t('formula.growth.charFormula') }}</p>
      <div class="nk-formula-toolbar">
        <label class="nk-formula-picker">
          <span class="nk-formula-picker__label">{{ t('formula.growth.pickChar') }}</span>
          <select class="nk-formula-select" data-role="char" :value="charId" @change="selectChar">
            <option v-for="entry in chars" :key="entry.id" :value="String(entry.id)">{{ entry.name }}</option>
          </select>
        </label>
        <SliderField
          :label="t('formula.term.level')"
          :model-value="charLevel"
          :min="levelRange.min"
          :max="levelRange.max"
          :step="1"
          :ariaLabel="t('stat.levelAria')"
          data-role="char-level"
          @update:model-value="charLevel = $event"
        />
      </div>

      <div class="nk-formula-readouts nk-formula-readouts--wide">
        <div
          v-for="row in readouts"
          :key="row.dataProp"
          class="nk-formula-readout"
          :data-prop="row.dataProp"
        >
          <span class="nk-formula-readout__label">{{ row.label }}</span>
          <span class="nk-formula-readout__value">{{ row.value }}</span>
          <span v-if="row.delta" class="nk-formula-readout__delta">{{ row.delta }}</span>
        </div>
        <p class="nk-formula-note">{{ t('formula.growth.charNote') }}</p>
        <p class="nk-formula-note">{{ t('formula.growth.phaseNote') }}</p>
      </div>
      </div>

      <div class="nk-formula-growth__main">
      <div class="nk-formula-block">
        <h3 class="nk-formula-sub">{{ t('formula.growth.trace') }}</h3>
        <div class="nk-formula-trace">
          <div v-for="row in traceRows" :key="row.tier" class="nk-formula-trace__row" :data-tier="row.tier">
            <span class="nk-formula-trace__label">{{ row.label }}</span>
            <span class="nk-formula-trace__value">{{ row.value }}</span>
            <span class="nk-formula-trace__track">
              <span class="nk-formula-trace__fill" :style="{ width: `${row.pct}%` }"></span>
            </span>
          </div>
        </div>
        <p class="nk-formula-note">{{ t('formula.growth.traceNote') }}</p>
      </div>

      <div class="nk-formula-block">
        <div class="nk-formula-toolbar nk-formula-toolbar--row">
          <h3 class="nk-formula-sub">{{ t('formula.growth.skill') }}</h3>
          <label class="nk-formula-picker nk-formula-picker--inline">
            <span class="nk-formula-picker__label">{{ t('formula.ui.skill') }}</span>
            <select class="nk-formula-select nk-formula-select--compact" data-role="skill" :value="skillId" @change="selectSkill">
              <option v-for="item in skillOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
        </div>
        <div class="nk-formula-skill">
          <SliderField
            :label="t('formula.term.level')"
            :model-value="skillLevel"
            :min="1"
            :max="skillMaxLevel"
            :step="1"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.level') })"
            data-role="skill-level"
            @update:model-value="skillLevel = $event"
          />
          <div class="nk-formula-zone-result">
            <span class="nk-formula-zone-result__label">{{ t('formula.term.multiplier') }}</span>
            <span class="nk-formula-zone-result__value" data-role="skill-multiplier">{{ skillMultiplier }}</span>
          </div>
        </div>
        <p class="nk-formula-note">{{ t('formula.growth.skillNote') }}</p>
      </div>
      </div>
    </div>

    <div v-else class="nk-formula-panel nk-formula-growth" :aria-busy="monsterLoading">
      <div class="nk-formula-growth__aside">
      <p class="nk-formula-eq">{{ t('formula.growth.enemyFormula') }}</p>
      <div class="nk-formula-toolbar">
        <label class="nk-formula-picker">
          <span class="nk-formula-picker__label">{{ t('formula.growth.pickMonster') }}</span>
          <select class="nk-formula-select" data-role="monster" :value="monsterId" @change="selectMonster">
            <option v-for="entry in monsters" :key="entry.id" :value="String(entry.id)">{{ entry.name }}</option>
          </select>
        </label>
        <SliderField
          :label="t('formula.term.level')"
          :model-value="enemyLevel"
          :min="1"
          :max="enemyMax"
          :step="1"
          :ariaLabel="t('mob.levelAria')"
          data-role="enemy-level"
          @update:model-value="emit('update:enemyLevel', $event)"
        />
      </div>

      <div class="nk-formula-readouts nk-formula-readouts--wide">
        <div v-for="row in monsterReadouts" :key="row.key" class="nk-formula-readout" :data-prop="row.key">
          <span class="nk-formula-readout__label">{{ row.label }}</span>
          <span class="nk-formula-readout__value">{{ row.value }}</span>
        </div>
        <div class="nk-formula-readout" data-prop="stance">
          <span class="nk-formula-readout__label">{{ t('formula.prop.stance') }}</span>
          <span class="nk-formula-readout__value">{{ monsterStance }}</span>
          <span class="nk-formula-readout__delta">{{ t('formula.growth.enemyStanceNote') }}</span>
        </div>
        <p class="nk-formula-eq">{{ t('formula.growth.enemyFormula') }}</p>
      </div>
      </div>

      <div class="nk-formula-growth__main">
      <div class="nk-formula-block">
        <div class="nk-formula-chips">
          <span class="nk-formula-chips__label">{{ t('formula.term.eliteRatio') }}</span>
          <button
            v-for="group in eliteList"
            :key="group"
            type="button"
            class="nk-formula-chip"
            :class="{ 'nk-formula-chip--on': eliteKey === group }"
            data-role="elite-group"
            :data-group="group"
            :aria-pressed="eliteKey === group"
            :aria-label="`${t('formula.term.eliteRatio')} #${group}`"
            :title="eliteTitle(group)"
            @click="eliteKey = group"
          >#{{ group }}</button>
        </div>

        <div class="nk-formula-factors">
          <span v-for="factor in monsterFactors" :key="factor.key" class="nk-formula-factor">
            <i class="nk-formula-factor__label">{{ factor.label }}</i>
            <b class="nk-formula-factor__value">{{ factor.value }}</b>
          </span>
        </div>
        <p class="nk-formula-note">{{ t('formula.growth.enemyNote') }}</p>
        <p class="nk-formula-note">{{ t('mob.derive.caveat') }}</p>
      </div>
      </div>
    </div>
  </section>
</template>
