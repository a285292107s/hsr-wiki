<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { elemLabel } from '../../lib/enum-labels';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { translate } from '../i18n';
import { pageTitle } from '../seo';
import { monsterRankKey } from '../../lib/enum-labels';
import { elementIconUrl, escHtml, fmtDesc, monsterFigureUrl, monsterIconUrl } from '../../lib/format';
import type { MonsterEliteGroups, MonsterLevelCurve } from '../../lib/monster-stats';
import {
  monsterMaxLevel,
  monsterStanceBreakdown,
  monsterStatBreakdown,
} from '../../lib/monster-stats';
import { fmtStatValue } from '../../lib/format';
import { atlasFormsOf } from '../../lib/monster-family';
import { loadLocalMonsterDetail, loadLocalMonsterEliteGroups, loadLocalMonsterLevelCurve, loadLocalMonsterList } from '../../services/api';
import type { LocalMonsterEntry, MazeBossPhase, MonsterDetail, MonsterExtraEffect, MonsterPhase, MonsterSkillDetail } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import '../../styles/monster-detail.css';

const route = useRoute();
const { t } = useI18n();

const { data, error, showSkeleton, run: load, retry } = usePageData<MonsterDetail>(() =>
  loadLocalMonsterDetail(String(route.params.id)),
);
onMounted(() => {
  void load();
  void loadAtlas();
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== String(data.value?.id)) {
      void load();
      void loadAtlas();
    }
  },
);

const d = computed(() => data.value);
watch(d, (data) => {
  if (data) document.title = pageTitle(data.name);
});
const curveRef = ref<MonsterLevelCurve | null>(null);
const eliteRef = ref<MonsterEliteGroups | null>(null);
const levelOverride = ref<number | null>(null);
onMounted(() => {
  void loadLocalMonsterLevelCurve().then((c) => { curveRef.value = c; });
  void loadLocalMonsterEliteGroups().then((t) => { eliteRef.value = t; });
});
const maxLevel = computed(() => (d.value ? monsterMaxLevel(curveRef.value, String(d.value.level_group ?? 1)) : 0));
const combatLevel = computed(() => {
  const max = maxLevel.value;
  if (max <= 1) return max;
  const want = levelOverride.value ?? max;
  return Math.min(Math.max(1, want), max);
});
type CombatStatProp = 'hp' | 'atk' | 'def' | 'speed';

interface DerivationRow {
  key: string;
  labelKey: string;
  base: number | null;
  statRatio: number | null;
  eliteRatio: number;
  curve: number | null;
  modify: number | null;
  value: number | null;
  blank: boolean;
}

const STAT_LABEL_KEY: Record<CombatStatProp, string> = {
  hp: 'mob.stat.hp', atk: 'mob.stat.atk', def: 'mob.stat.def', speed: 'mob.stat.spd',
};

const enemyMeta = computed(() => {
  const v = d.value;
  if (!v) return null;
  return {
    statRatio: v.stat_ratio ?? null,
    levelGroup: v.level_group ?? 1,
    eliteRatios: eliteRef.value?.[String(v.elite_group ?? 1)] ?? null,
    stats: v.stats,
    curve: curveRef.value,
    modify: v.speed_modify == null ? null : { speed: v.speed_modify },
  };
});

const derivationRows = computed<DerivationRow[]>(() => {
  const v = d.value;
  const meta = enemyMeta.value;
  if (!v || !meta) return [];
  const rows: DerivationRow[] = (['hp', 'atk', 'def', 'speed'] as const).map((prop) => {
    const b = monsterStatBreakdown(prop, combatLevel.value, meta);
    return {
      key: prop,
      labelKey: STAT_LABEL_KEY[prop],
      base: b.base,
      statRatio: b.statRatio,
      eliteRatio: b.eliteRatio,
      curve: b.curve,
      modify: b.modify,
      value: b.value,
      blank: b.base == null,
    };
  });
  if (v.stance != null) {
    const s = monsterStanceBreakdown(
      v.stance,
      v.stance_modify,
      eliteRef.value?.[String(v.elite_group ?? 1)]?.stance ?? null,
    );
    rows.push({
      key: 'stance',
      labelKey: 'mob.stat.stance',
      base: s.base,
      statRatio: null,
      eliteRatio: s.eliteRatio,
      curve: null,
      modify: s.modify,
      value: s.value,
      blank: s.base == null,
    });
  }
  return rows;
});

const DERIVE_TERMS = [
  { key: 'mob.derive.col.base', desc: 'mob.derive.baseDesc' },
  { key: 'mob.derive.col.ratio', desc: 'mob.derive.ratioDesc' },
  { key: 'mob.derive.col.elite', desc: 'mob.derive.eliteDesc' },
  { key: 'mob.derive.col.curve', desc: 'mob.derive.curveDesc' },
  { key: 'mob.derive.col.modify', desc: 'mob.derive.modifyDesc' },
] as const;

function fmtFactor(v: number | null): string {
  return v == null ? '—' : String(v);
}

function fmtCurveCell(v: number | null): string {
  return v == null ? '—' : `×${v}`;
}

function factorText(row: DerivationRow, value: string): string {
  return row.blank ? '—' : value;
}

function fmtRatioCell(v: number | null): string {
  if (v == null) return '—';
  return v === 1 ? '×1.00' : `×${v}`;
}

function fmtModifyCell(v: number | null): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : v === 0 ? '+0' : String(v);
}
const figureUrl = computed(() => {
  if (!d.value) return '';
  return monsterFigureUrl(d.value.figure) || monsterIconUrl(d.value.icon);
});
const rankLabel = computed(() => (d.value?.rank ? t(monsterRankKey(d.value.rank)) : ''));

const atlasRows = ref<LocalMonsterEntry[]>([]);
const atlasCanonical = ref<MonsterDetail | null>(null);
const atlasReady = ref(false);

async function loadAtlas(): Promise<void> {
  const id = String(route.params.id);
  atlasReady.value = false;
  atlasRows.value = [];
  atlasCanonical.value = null;
  try {
    const list = await loadLocalMonsterList();
    const self = list.find((m) => String(m.id) === id);
    if (!self) return;
    atlasRows.value = atlasFormsOf(list, self);
    const group = self.atlas_group;
    if (group != null && String(group) !== id) {
      const canon = await loadLocalMonsterDetail(String(group)).catch(() => null);
      if (String(route.params.id) !== id) return;
      atlasCanonical.value = canon;
    }
  } finally {
    if (String(route.params.id) === id) atlasReady.value = true;
  }
}

function elemTag(elem: string): string {
  const name = elemLabel(elem);
  return `<span class="nk-mob-tag"><img data-cdn-src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)}</span>`;
}
const weakHtml = computed(() => (d.value?.weak ?? []).map(elemTag).join(''));
const resistHtml = computed(() =>
  Object.entries(d.value?.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img data-cdn-src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(elemLabel(k))} ${Math.round(v * 100)}%</span>`)
    .join(''));
const introHtml = computed(() => {
  if (!d.value) return '';
  const t = fmtDesc(d.value.intro, []);
  return t || `<span class="nk-mob-empty">${translate('mob.empty.intro')}</span>`;
});
function skillHtml(s: MonsterSkillDetail): string {
  return fmtDesc(s.desc, s.param_list);
}
function skillMeta(s: MonsterSkillDetail): string {
  const parts: string[] = [];
  if (s.damage_type) {
    const name = elemLabel(s.damage_type);
    parts.push(
      `<span class="nk-mob-skill__elem"><img data-cdn-src="${escHtml(elementIconUrl(s.damage_type))}" alt="${escHtml(name)}" title="${escHtml(name)}" loading="lazy">${escHtml(name)}</span>`,
    );
  }
  if (s.type_desc) {
    parts.push(`<span class="nk-mob-skill__type">${escHtml(s.type_desc)}</span>`);
  }
  return parts.join('<span class="nk-mob-skill__sep">/</span>');
}

function fxHtml(fx: MonsterExtraEffect): string {
  return fmtDesc(fx.desc, fx.param_list);
}

const STATUS_TYPE_KEY: Record<string, string> = {
  Buff: 'mob.status.buff', Debuff: 'mob.status.debuff', Other: 'mob.status.other',
};

function statusTypeLabel(type: string): string {
  const key = STATUS_TYPE_KEY[type];
  return key ? t(key) : (type || t('mob.status.other'));
}

const CN_ORDINAL = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function guidePhaseName(p: MazeBossPhase, i: number): string {
  const m = p.name.match(/^阶段\s*([一二三四五六七八九十\d]+)\s*[：:]\s*/);
  if (m) return m[1] === CN_ORDINAL[i] ? p.name.slice(m[0].length) : p.name;
  const any = p.name.match(/^\s*[^\s:：]{1,12}\s*(\d{1,2})\s*[：:]\s*/);
  return any ? p.name.slice(any[0].length) : p.name;
}

function statusDesc(desc?: string): string {
  return fmtDesc(desc, []);
}

function fmtStatCell(v: number | string | null | undefined): string {
  return v == null ? '—' : fmtStatValue(v);
}

function phaseSig(weak: string[] | undefined, resist: Record<string, number> | undefined): string {
  return JSON.stringify([
    [...(weak ?? [])].sort(),
    Object.entries(resist ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
const phases = computed(() => {
  const cur = d.value;
  if (!cur) return [];
  const base = phaseSig(cur.weak, cur.resist);
  const canon = atlasCanonical.value;
  const canonSig = canon ? phaseSig(canon.weak, canon.resist) : base;
  const siblingNames = new Set(atlasRows.value.map((r) => r.name));
  const rows: Array<MonsterPhase & { phase_ids: number[] }> = [];
  const seen = new Map<string, number>();
  for (const p of cur.phases ?? []) {
    const s = phaseSig(p.weak, p.resist);
    if (s === base) continue;
    if (p.name && siblingNames.has(p.name)) continue;
    if (s === canonSig && !p.name && !p.intro) continue;
    const key = `${s}\u0000${p.name ?? ''}`;
    const hit = seen.get(key);
    if (hit !== undefined) {
      rows[hit].phase_ids.push(p.phase_id);
      continue;
    }
    seen.set(key, rows.length);
    rows.push({ ...p, phase_ids: [p.phase_id] });
  }
  return rows;
});

function phaseTags(phase: MonsterPhase, kind: 'weak' | 'resist'): string {
  if (kind === 'weak') return (phase.weak ?? []).map(elemTag).join('');
  return Object.entries(phase.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img data-cdn-src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(elemLabel(k))} ${Math.round(v * 100)}%</span>`)
    .join('');
}
</script>

<template>
  <div class="nk-mob-page">
    <div v-if="showSkeleton" class="nk-mob-skeleton" aria-hidden="true">
      <div class="nk-mob-skeleton__hero">
        <div class="nk-mob-skeleton__figure">
          <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__art"></span>
        </div>
        <div class="nk-mob-skeleton__info">
          <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__meta"></span>
          <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__title"></span>
          <div class="nk-mob-skeleton__sec">
            <div class="nk-mob-skeleton__head">
              <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__sechead"></span>
              <span class="nk-mob-skeleton__rule"></span>
            </div>
            <div class="nk-mob-skeleton__row">
              <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__label"></span>
              <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__tags"></span>
            </div>
            <div class="nk-mob-skeleton__row nk-mob-skeleton__row--wrap">
              <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__label"></span>
              <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__tags"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="nk-mob-skeleton__body">
        <div class="nk-mob-skeleton__sec">
          <div class="nk-mob-skeleton__head">
            <span class="nk-sk nk-sk--shimmer nk-mob-skeleton__sechead"></span>
            <span class="nk-mob-skeleton__rule"></span>
          </div>
          <div class="nk-mob-skeleton__para">
            <span class="nk-sk nk-sk--shimmer"></span>
            <span class="nk-sk nk-sk--shimmer"></span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('mob.error.title') }}</div>
      <div class="nk-error-state__detail">{{ t('common.loadErrorDetail') }}</div>
      <div class="nk-error-state__tech">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="d">
      <div class="nk-mob-hero">
        <div class="nk-mob-hero__figure">
          <img :src="figureUrl" :alt="d.name" loading="eager">
        </div>
        <div class="nk-mob-hero__info">
          <div class="nk-mob-hero__meta">
            <span class="nk-mob-hero__no">ARCHIVE · № {{ d.id }}</span>
            <span v-if="rankLabel">{{ rankLabel }}</span>
            <span v-if="d.camp">{{ d.camp }}</span>
            <span v-if="d.stance != null">{{ t('mob.stat.stance') }} {{ d.stance }}</span>
          </div>
          <h1 class="nk-mob-hero__name">{{ d.name }}</h1>
          <section class="nk-mob-hero__sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.weakness') }}</h2>
              <span class="nk-mob-sec__en">VULNERABILITY</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-resist">
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">{{ t('mob.resist.stance') }}</span>
                <span v-if="weakHtml" class="nk-mob-resist__tags" v-html="weakHtml"></span>
                <span v-else class="nk-mob-empty">{{ t('mob.empty.weak') }}</span>
              </div>
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">{{ t('mob.resist.damage') }}</span>
                <span v-if="resistHtml" class="nk-mob-resist__tags" v-html="resistHtml"></span>
                <span v-else class="nk-mob-empty">{{ t('mob.empty.resist') }}</span>
              </div>
            </div>
            <div v-if="atlasReady && phases.length" class="nk-mob-phases">
              <div v-for="p in phases" :key="p.phase_ids[0]" class="nk-mob-phase">
                <div class="nk-mob-phase__head">
                  <span v-if="p.name" class="nk-mob-phase__name">{{ p.name }}</span>
                  <span v-else class="nk-mob-phase__label">{{ t('mob.phase.other') }}</span>
                </div>
                <div class="nk-mob-resist__row">
                  <span class="nk-mob-resist__label">{{ t('mob.resist.stance') }}</span>
                  <span v-if="(p.weak || []).length" class="nk-mob-resist__tags" v-html="phaseTags(p, 'weak')"></span>
                  <span v-else class="nk-mob-empty">{{ t('mob.empty.weak') }}</span>
                </div>
                <div class="nk-mob-resist__row">
                  <span class="nk-mob-resist__label">{{ t('mob.resist.damage') }}</span>
                  <span v-if="Object.keys(p.resist || {}).length" class="nk-mob-resist__tags" v-html="phaseTags(p, 'resist')"></span>
                  <span v-else class="nk-mob-empty">{{ t('mob.empty.resist') }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.record') }}</h2>
              <span class="nk-mob-sec__en">DOSSIER</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-sec__body nk-mob-intro" v-html="introHtml"></p>
          </section>

          <section v-if="d.guide_phases?.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.guide') }}</h2>
              <span class="nk-mob-sec__en">BOSS GUIDE</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-guides">
              <article v-for="(g, i) in d.guide_phases" :key="g.id" class="nk-mob-guide">
                <header class="nk-mob-guide__head">
                  <span class="nk-mob-guide__no">{{ t('mob.stage', { n: i + 1 }) }}</span>
                  <h3 class="nk-mob-guide__name">{{ guidePhaseName(g, i) }}</h3>
                </header>
                <p v-if="g.desc" class="nk-mob-guide__desc" v-html="fmtDesc(g.desc, [])"></p>
                <p v-if="g.answer" class="nk-mob-guide__answer" v-html="fmtDesc(g.answer, [])"></p>
                <ul v-if="g.skills?.length" class="nk-mob-guide__qas">
                  <li v-for="s in g.skills" :key="s.name" class="nk-mob-guide__qa">
                    <span class="nk-mob-guide__q">{{ s.name }}</span>
                    <span v-if="s.desc" class="nk-mob-guide__a" v-html="fmtDesc(s.desc, [])"></span>
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.stats') }}</h2>
              <span class="nk-mob-sec__en">COMBAT STATS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <template v-if="maxLevel > 1">
              <div class="nk-mob-level">
                <span class="nk-mob-level__label">{{ t('mob.level', { n: combatLevel }) }}</span>
                <input
                  type="range"
                  :aria-label="t('mob.levelAria')"
                  :min="1"
                  :max="maxLevel"
                  :value="combatLevel"
                  :style="{ '--fill': `${((combatLevel - 1) / (maxLevel - 1)) * 100}%` }"
                  @input="levelOverride = Number(($event.target as HTMLInputElement).value)"
                >
                <span class="nk-mob-level__groups">
                  <span class="nk-mob-level__chip">{{ t('mob.derive.levelGroup', { n: d.level_group ?? 1 }) }}</span>
                  <span class="nk-mob-level__chip">{{ t('mob.derive.eliteGroup', { n: d.elite_group ?? 1 }) }}</span>
                </span>
              </div>
              <div class="nk-mob-calc">
                <p class="nk-mob-calc__lead">{{ t('mob.derive.lead') }}</p>
                <p class="nk-mob-calc__formula">{{ t('mob.derive.formula') }}</p>
                <div class="nk-mob-calc__wrap">
                  <table class="nk-mob-calc__table" :aria-label="t('mob.sec.stats')">
                    <thead>
                      <tr>
                        <th scope="col" class="nk-mob-calc__h">{{ t('mob.derive.col.stat') }}</th>
                        <th scope="col" class="nk-mob-calc__h">{{ t('mob.derive.col.base') }}</th>
                        <th scope="col" class="nk-mob-calc__h">{{ t('mob.derive.col.ratio') }}</th>
                        <th scope="col" class="nk-mob-calc__h">{{ t('mob.derive.col.elite') }}</th>
                        <th scope="col" class="nk-mob-calc__h">
                          {{ t('mob.derive.col.curve') }}
                          <span class="nk-mob-calc__h-lv">{{ t('mob.level', { n: combatLevel }) }}</span>
                        </th>
                        <th scope="col" class="nk-mob-calc__h">{{ t('mob.derive.col.modify') }}</th>
                        <th scope="col" class="nk-mob-calc__h nk-mob-calc__h--final">{{ t('mob.derive.col.final') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in derivationRows"
                        :key="row.key"
                        class="nk-mob-calc__row"
                        :class="{ 'nk-mob-calc__row--stance': row.key === 'stance', 'nk-mob-calc__row--blank': row.blank }"
                        :data-prop="row.key"
                      >
                        <th scope="row" class="nk-mob-calc__name">{{ t(row.labelKey) }}</th>
                        <td class="nk-mob-calc__cell nk-mob-calc__cell--base" :data-label="t('mob.derive.col.base')">{{ factorText(row, fmtFactor(row.base)) }}</td>
                        <td
                          class="nk-mob-calc__cell nk-mob-calc__cell--ratio"
                          :class="{ 'is-neutral': row.base == null || row.statRatio === 1 }"
                          :data-label="t('mob.derive.col.ratio')"
                        >{{ factorText(row, fmtRatioCell(row.statRatio)) }}</td>
                        <td
                          class="nk-mob-calc__cell nk-mob-calc__cell--elite"
                          :class="{ 'is-neutral': row.base == null || row.eliteRatio === 1 }"
                          :data-label="t('mob.derive.col.elite')"
                        >{{ factorText(row, fmtRatioCell(row.eliteRatio)) }}</td>
                        <td
                          class="nk-mob-calc__cell nk-mob-calc__cell--curve"
                          :data-label="t('mob.derive.col.curve')"
                        >{{ factorText(row, fmtCurveCell(row.curve)) }}</td>
                        <td
                          class="nk-mob-calc__cell nk-mob-calc__cell--modify"
                          :class="{ 'is-neutral': row.base == null || row.modify == null || row.modify === 0 }"
                          :data-label="t('mob.derive.col.modify')"
                        >{{ factorText(row, fmtModifyCell(row.modify)) }}</td>
                        <td class="nk-mob-calc__val" :data-prop="row.key">{{ fmtStatCell(row.value) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-if="d.stance != null" class="nk-mob-calc__stance">{{ t('mob.derive.stanceFormula') }}</p>
                <dl class="nk-mob-calc__terms">
                  <div v-for="term in DERIVE_TERMS" :key="term.key" class="nk-mob-calc__term">
                    <dt class="nk-mob-calc__term-k">{{ t(term.key) }}</dt>
                    <dd class="nk-mob-calc__term-d">{{ t(term.desc) }}</dd>
                  </div>
                </dl>
                <p class="nk-mob-calc__caveat">{{ t('mob.derive.caveat') }}</p>
              </div>
            </template>
            <template v-else>
              <p class="nk-mob-empty">{{ t('mob.levelMissing', { n: d.level_group ?? 1 }) }}</p>
              <dl class="nk-mob-stats">
                <div class="nk-mob-stat">
                  <dt class="nk-mob-stat__label">{{ t('mob.stat.hp') }}</dt>
                  <dd class="nk-mob-stat__val" data-prop="hp">{{ fmtStatCell(d.stats.hp) }}</dd>
                </div>
                <div class="nk-mob-stat">
                  <dt class="nk-mob-stat__label">{{ t('mob.stat.atk') }}</dt>
                  <dd class="nk-mob-stat__val" data-prop="atk">{{ fmtStatCell(d.stats.atk) }}</dd>
                </div>
                <div class="nk-mob-stat">
                  <dt class="nk-mob-stat__label">{{ t('mob.stat.def') }}</dt>
                  <dd class="nk-mob-stat__val" data-prop="def">{{ fmtStatCell(d.stats.def) }}</dd>
                </div>
                <div class="nk-mob-stat">
                  <dt class="nk-mob-stat__label">{{ t('mob.stat.spd') }}</dt>
                  <dd class="nk-mob-stat__val" data-prop="spd">{{ fmtStatCell(d.stats.speed) }}</dd>
                </div>
                <div v-if="d.stance != null" class="nk-mob-stat nk-mob-stat--stance">
                  <dt class="nk-mob-stat__label">{{ t('mob.stat.stance') }}</dt>
                  <dd class="nk-mob-stat__val" data-prop="stance">{{ fmtStatCell(d.stance) }}</dd>
                </div>
              </dl>
            </template>
          </section>

          <section v-if="d.skills.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.skills') }}</h2>
              <span class="nk-mob-sec__en">SKILLS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-skills">
              <article v-for="s in d.skills" :key="s.id" class="nk-mob-skill">
                <header class="nk-mob-skill__head">
                  <span class="nk-mob-skill__name">{{ s.name }}</span>
                  <span v-if="s.tag" class="nk-mob-skill__tag">{{ s.tag }}</span>
                </header>
                <div v-if="skillMeta(s)" class="nk-mob-skill__meta" v-html="skillMeta(s)"></div>
                <div v-if="skillHtml(s)" class="nk-mob-skill__desc" v-html="skillHtml(s)"></div>
                <div v-if="s.param_list?.length" class="nk-mob-skill__params">
                  <span class="nk-mob-skill__paramsk">{{ t('common.param') }}</span>
                  <span class="nk-mob-skill__paramsvals">{{ s.param_list.map((p) => fmtStatValue(p)).join(' / ') }}</span>
                </div>
                <div v-if="s.extra_effects?.length" class="nk-mob-skill__fx">
                  <span class="nk-mob-skill__fxk">{{ t('mob.fx') }}</span>
                  <span v-for="fx in s.extra_effects" :key="fx.id" class="nk-mob-skill__fxitem">
                    <span class="nk-mob-skill__fxname">{{ fx.name }}</span>
                    <span v-if="fxHtml(fx)" class="nk-mob-skill__fxdesc" v-html="fxHtml(fx)"></span>
                  </span>
                </div>
              </article>
            </div>
          </section>

          <section v-if="d.statuses?.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">{{ t('mob.sec.status') }}</h2>
              <span class="nk-mob-sec__en">STATUSES</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-status__lead">{{ t('mob.statusLead') }}</p>
            <div class="nk-mob-statuses">
              <article v-for="s in d.statuses" :key="s.id" class="nk-mob-status" :data-type="s.type">
                <header class="nk-mob-status__head">
                  <span class="nk-mob-status__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                      <path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z" />
                      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <span class="nk-mob-status__name">{{ s.name }}</span>
                  <span class="nk-mob-status__type">{{ statusTypeLabel(s.type) }}</span>
                  <span v-if="s.dispel" class="nk-mob-status__dispel">{{ t('mob.status.dispel') }}</span>
                </header>
                <p v-if="s.desc" class="nk-mob-status__desc" v-html="statusDesc(s.desc)"></p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
