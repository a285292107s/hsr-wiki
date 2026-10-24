<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRelicStore } from '../stores/relic';
import { fmtDesc, itemIconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { SLOT_ICONS, SLOT_INDEX } from '../../lib/constants';
import { propLabel, relicSlotLabel } from '../../lib/enum-labels';
import type { LocalRelicPiece, RelicMainAffix, RelicSubAffix } from '../../services/types';
import { useDetailView } from '../composables/use-detail-view';
import '../../styles/relic.css';
import '../../styles/detail-skeleton.css';
import { translate } from '../i18n';

const t = translate;

const relic = useRelicStore();

const { phase, showSkeleton, retry } = useDetailView({
  hasData: () => !!relic.data,
  error: () => relic.error,
  currentId: () => relic.relicId,
  load: (id) => relic.load(id),
});
const d = computed(() => relic.data);

const figureUrl = computed(() => (d.value ? itemIconUrl(d.value.icon) : ''));
const isCavern = computed(() => (d.value?.require_num || []).includes(4));
const setTypeLabel = computed(() => t(isCavern.value ? 'relic.setType.cavern' : 'relic.setType.planar'));

const setEffects = computed<{ num: number; html: string }[]>(() => {
  if (!d.value) return [];
  return (d.value.require_num || [])
    .slice()
    .sort((a, b) => a - b)
    .map((num) => ({
      num,
      html: fmtDesc(
        d.value!.descriptions[String(num)],
        (d.value!.param_list && d.value!.param_list[String(num)]) || [],
      ),
    }));
});

const pieces = computed<LocalRelicPiece[]>(() => d.value?.pieces || []);

const pieceNames = computed<Record<string, string>>(() => {
  if (!d.value) return {};
  const set = relic.stories[String(d.value.id)] || {};
  const out: Record<string, string> = {};
  for (const [type, story] of Object.entries(set)) out[type] = story.name;
  return out;
});

const activePieceId = ref<number | null>(null);
function focusPiece(id: number | null): void {
  activePieceId.value = id;
}

function pieceIconUrl(p: LocalRelicPiece): string {
  return cdnUri('relicfigures', `IconRelic_${d.value!.id}_${SLOT_INDEX[p.type] ?? 1}.webp`);
}
function slotIconUrl(p: LocalRelicPiece): string {
  return cdnUri('relicfigures', `${SLOT_ICONS[p.type] || 'IconRelicBody'}.webp`);
}
function onPieceImgError(e: Event, p: LocalRelicPiece): void {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = slotIconUrl(p);
}

function fmtAffix(value: number, property: string, baseValue: number): string {
  if (baseValue > 0 && baseValue < 1) return `${(value * 100).toFixed(1)}%`;
  if (property === 'SpeedDelta') return value.toFixed(1);
  return String(Math.round(value));
}

interface PieceAffixGroup {
  piece: LocalRelicPiece;
  affixes: RelicMainAffix[];
}

const pieceAffixGroups = computed<PieceAffixGroup[]>(() =>
  pieces.value.map((piece) => ({
    piece,
    affixes: relic.mainAffixes.filter((a) => a.group_id === piece.main_affix_group),
  })),
);

function mainAffixMax(a: RelicMainAffix, maxLevel: number): number {
  return a.base_value + a.level_add * maxLevel;
}

interface MainAffixCell { piece: LocalRelicPiece; affix: RelicMainAffix | null }
interface MainAffixRow {
  property: string;
  name: string;
  cells: MainAffixCell[];
}

const mainAffixColumns = computed<LocalRelicPiece[]>(() => pieces.value);

const mainAffixRows = computed<MainAffixRow[]>(() => {
  const props: string[] = [];
  const seen = new Set<string>();
  const cellsByProp = new Map<string, Map<string, RelicMainAffix>>();
  for (const g of pieceAffixGroups.value) {
    for (const a of g.affixes) {
      if (!seen.has(a.property)) {
        seen.add(a.property);
        props.push(a.property);
        cellsByProp.set(a.property, new Map());
      }
      cellsByProp.get(a.property)!.set(String(g.piece.id), a);
    }
  }
  return props.map((prop) => ({
    property: prop,
    name: propLabel(prop),
    cells: mainAffixColumns.value.map((piece) => ({
      piece,
      affix: cellsByProp.get(prop)?.get(String(piece.id)) || null,
    })),
  }));
});

const subAffixList = computed<RelicSubAffix[]>(() => {
  const group = pieces.value[0]?.sub_affix_group;
  if (group == null) return [];
  return relic.subAffixes.filter((a) => a.group_id === group);
});

function subAffixTierCount(a: RelicSubAffix): number {
  return (a.step_num ?? 0) + 1;
}

function subAffixTiers(a: RelicSubAffix): number[] {
  const count = subAffixTierCount(a);
  return Array.from({ length: count }, (_, i) => a.base_value - a.step_value * (a.step_num - i));
}

const enhanceInfo = computed(() => {
  const maxLevel = pieces.value[0]?.max_level ?? 15;
  const rolls = Math.floor(maxLevel / 3);
  return { maxLevel, rolls, multiplier: 1 + rolls };
});

function subAffixMax(a: RelicSubAffix): number {
  return a.base_value * enhanceInfo.value.multiplier;
}

const enhanceStats = computed(() => {
  const first = subAffixList.value[0];
  if (!first) return [];
  return [
    { key: 'tier', value: String(subAffixTierCount(first)), label: t('relic.tier') },
    { key: 'level', value: `+${enhanceInfo.value.maxLevel}`, label: t('relic.maxLevel') },
    { key: 'rolls', value: String(enhanceInfo.value.rolls), label: t('relic.nextEnhance') },
    { key: 'mult', value: `×${enhanceInfo.value.multiplier}`, label: t('relic.maxMultiplier') },
  ];
});

const subAffixTierColumns = computed<number[]>(() => {
  const first = subAffixList.value[0];
  return first ? Array.from({ length: subAffixTierCount(first) }, (_, i) => i + 1) : [];
});

const setRarity = computed(() => pieces.value[0]?.rarity ?? 0);

interface PieceStoryItem {
  piece: LocalRelicPiece;
  name: string;
  descHtml: string;
  storyHtml: string;
}

function toStoryHtml(text: string): string {
  return text.replace(/\\n/g, '<br>');
}

const pieceStories = computed<PieceStoryItem[]>(() => {
  if (!d.value) return [];
  const setStories = relic.stories[String(d.value.id)] || {};
  const items: PieceStoryItem[] = [];
  for (const piece of pieces.value) {
    const s = setStories[piece.type];
    if (s && s.story) {
      items.push({
        piece,
        name: s.name,
        descHtml: s.desc ? toStoryHtml(s.desc) : '',
        storyHtml: toStoryHtml(s.story),
      });
    }
  }
  return items;
});

const maxLevelNote = computed(() => t('relic.affixNote', { n: pieces.value[0]?.max_level || 15 }));

onBeforeUnmount(() => {
  relic.reset();
});
</script>

<template>
  <div class="nk-page--detail" tabindex="0" :aria-busy="phase === 'loading'">
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--relic"
      role="status"
      aria-live="polite"
      :aria-label="t('relic.loadingAria')"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer nk-sk--fill"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-skeleton__hero-head">
            <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-lg"></div>
            <div class="nk-skeleton__hero-meta">
              <div class="nk-sk nk-sk--shimmer nk-sk--chip nk-sk--bar-sm"></div>
              <div class="nk-sk nk-sk--shimmer nk-sk--chip nk-sk--bar-xs"></div>
            </div>
          </div>
          <div class="nk-relic-sk-pieces">
            <div class="nk-sk nk-sk--shimmer nk-relic-sk-pieces__title"></div>
            <div class="nk-relic-sk-pieces__list">
              <div v-for="i in 4" :key="i" class="nk-sk nk-sk--shimmer nk-relic-sk-piece"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('relic.errorTitle') }}</div>
      <div v-if="relic.error" class="nk-error-state__detail">{{ relic.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="d">
      <div class="nk-hero nk-hero--relic">
        <div class="nk-hero__visual">
          <div
            class="nk-hero__bg nk-hero__bg--relic"
            :style="{ backgroundImage: `url(${figureUrl})` }"
          ></div>
          <div class="nk-hero__scrim"></div>
        </div>
        <div class="nk-hero__panel">
          <header class="nk-hero__head">
            <h1 class="nk-hero__name">{{ d.name }}</h1>
            <div class="nk-hero__meta">
              <span v-if="setRarity" class="nk-hero__stars">{{ '★'.repeat(setRarity) }}</span>
              <span class="nk-hero__tag nk-relic-type" :class="isCavern ? 'is-cavern' : 'is-planar'">
                {{ setTypeLabel }}
              </span>
              <span class="nk-relic-count">{{ t('relic.pieceCount', { n: pieces.length }) }}</span>
              <span v-if="d.release_version" class="nk-relic-ver">v{{ d.release_version }}</span>
            </div>
          </header>

          <section v-if="pieces.length" class="nk-relic-pieces">
            <h2 class="nk-relic-pieces__title">{{ t('relic.parts') }}</h2>
            <ul class="nk-relic-pieces__list">
              <li
                v-for="p in pieces"
                :key="p.id"
                class="nk-relic-piece"
                :class="{ 'is-active': activePieceId === p.id }"
                @mouseenter="focusPiece(p.id)"
                @mouseleave="focusPiece(null)"
              >
                <span class="nk-relic-piece__fig">
                  <img :src="pieceIconUrl(p)" alt="" @error="onPieceImgError($event, p)">
                </span>
                <span class="nk-relic-piece__text">
                  <span class="nk-relic-hero-piece__slot">{{ relicSlotLabel(p) }}</span>
                  <span v-if="pieceNames[p.type]" class="nk-relic-piece__name" :title="pieceNames[p.type]">
                    {{ pieceNames[p.type] }}
                  </span>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--relic nk-panel--active">
          <section v-if="setEffects.length" class="nk-relic-section">
            <h2 class="nk-title"><span class="nk-title__idx">01</span>{{ t('relic.sec.effect') }}</h2>
            <ul class="nk-relic-effects">
              <li v-for="eff in setEffects" :key="eff.num" class="nk-relic-effect">
                <span class="nk-relic-effect__req">{{ t('relic.setPieces', { n: eff.num }) }}</span>
                <p class="nk-relic-effect__desc" v-html="eff.html"></p>
              </li>
            </ul>
          </section>

          <section v-if="mainAffixRows.length" class="nk-relic-section">
            <h2 class="nk-title"><span class="nk-title__idx">02</span>{{ t('relic.sec.main') }}</h2>
            <p class="nk-relic-legend">{{ maxLevelNote }}</p>
            <div class="nk-relic-table-wrap">
              <table class="nk-relic-affix-table">
                <caption class="nk-relic-caption">{{ t('relic.sec.main') }}</caption>
                <thead>
                  <tr>
                    <th class="nk-relic-affix-table__prop-h" scope="col">{{ t('relic.affixCol') }}</th>
                    <th
                      v-for="p in mainAffixColumns"
                      :key="p.id"
                      class="nk-relic-affix-table__slot-h"
                      :class="{ 'is-linked': activePieceId === p.id }"
                      scope="col"
                      @mouseenter="focusPiece(p.id)"
                      @mouseleave="focusPiece(null)"
                    >
                      <img class="nk-relic-affix-table__icon" :src="pieceIconUrl(p)" alt="" @error="onPieceImgError($event, p)">
                      <span class="nk-relic-affix-table__slot-name">{{ relicSlotLabel(p) }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in mainAffixRows" :key="row.property">
                    <th class="nk-relic-affix-table__prop" scope="row">{{ row.name }}</th>
                    <td
                      v-for="cell in row.cells"
                      :key="cell.piece.id"
                      class="nk-relic-affix-table__cell"
                      :class="{ 'is-linked': activePieceId === cell.piece.id }"
                    >
                      <template v-if="cell.affix">
                        <span class="nk-relic-affix-table__init">{{ fmtAffix(cell.affix.base_value, row.property, cell.affix.base_value) }}</span>
                        <span class="nk-relic-affix-table__arrow" aria-hidden="true">→</span>
                        <span class="nk-relic-affix-table__max">{{ fmtAffix(mainAffixMax(cell.affix, cell.piece.max_level), row.property, cell.affix.base_value) }}</span>
                      </template>
                      <span v-else class="nk-relic-affix-table__empty" :aria-label="t('relic.noAffixAria')">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="subAffixList.length" class="nk-relic-section">
            <h2 class="nk-title"><span class="nk-title__idx">03</span>{{ t('relic.sec.sub') }}</h2>
            <dl class="nk-relic-enhance">
              <div v-for="stat in enhanceStats" :key="stat.key" class="nk-relic-enhance__item">
                <dt class="nk-relic-enhance__label">{{ stat.label }}</dt>
                <dd class="nk-relic-enhance__val">{{ stat.value }}</dd>
              </div>
            </dl>
            <p class="nk-relic-legend">{{ t('relic.dropNote', { mult: enhanceInfo.multiplier }) }}</p>
            <div class="nk-relic-table-wrap">
              <table class="nk-relic-sub-table">
                <caption class="nk-relic-caption">{{ t('relic.sec.sub') }}</caption>
                <thead>
                  <tr>
                    <th class="nk-relic-sub-table__stat-h" scope="col">{{ t('relic.affixCol') }}</th>
                    <th
                      v-for="n in subAffixTierColumns"
                      :key="n"
                      class="nk-relic-sub-table__tier-h"
                      scope="col"
                    >{{ t('relic.tierTitle', { n }) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in subAffixList" :key="a.affix_id">
                    <th class="nk-relic-sub-table__stat" scope="row">
                      <span class="nk-relic-sub-table__stat-inner">
                        <span class="nk-relic-subcell__name">{{ propLabel(a.property) }}</span>
                        <span class="nk-relic-subcell__max">{{ t('relic.maxValue', { value: fmtAffix(subAffixMax(a), a.property, a.base_value) }) }}</span>
                      </span>
                    </th>
                    <td v-for="(v, n) in subAffixTiers(a)" :key="n" class="nk-relic-sub-table__tier">
                      {{ fmtAffix(v, a.property, a.base_value) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="pieceStories.length" class="nk-relic-section">
            <h2 class="nk-title"><span class="nk-title__idx">04</span>{{ t('relic.sec.story') }}</h2>
            <div class="nk-relic-stories">
              <article
                v-for="s in pieceStories"
                :key="s.piece.id"
                class="nk-relic-story"
              >
                <div class="nk-relic-story__head">
                  <span class="nk-relic-story__fig">
                    <img :src="pieceIconUrl(s.piece)" alt="" loading="lazy" @error="onPieceImgError($event, s.piece)">
                  </span>
                  <div class="nk-relic-story__heading">
                    <div class="nk-relic-story__name">{{ s.name }}</div>
                    <div class="nk-relic-story__slot">{{ relicSlotLabel(s.piece) }}</div>
                  </div>
                </div>
                <div class="nk-relic-story__prose">
                  <p v-if="s.descHtml" class="nk-relic-story__desc" v-html="s.descHtml"></p>
                  <div class="nk-relic-story__body" v-html="s.storyHtml"></div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
