<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { elemLabel, skillTypeLabel } from '../../lib/enum-labels';
import type { CharacterData, Skill, SkillAnimEntry } from '../../services/types';
import {
  fmtDesc, fmtToughness, skillIconUrl, iconUrl, iconImgAttrs,
} from '../../lib/format';

import { extraTerms } from './utils';

import { translate } from '../i18n';

const t = translate;


const props = defineProps<{
  sk: Skill;
  charId: string;
  charData: CharacterData | null;
  isChild?: boolean;
  childSkills?: Skill[];
  anchor?: string;
  parentLv?: number;
  animEntries?: SkillAnimEntry[] | null;
}>();

const maxLv = computed(() => (props.sk.level ? Object.keys(props.sk.level).length : 1));
const defaultLv = computed(() =>
  props.sk.type === 'Normal' ? Math.min(6, maxLv.value) : Math.min(10, maxLv.value),
);
const lv = ref(defaultLv.value);

function onSlider(e: Event): void {
  lv.value = Number((e.target as HTMLInputElement).value);
}
const fillPct = computed(() =>
  maxLv.value <= 1 ? 100 : ((lv.value - 1) / (maxLv.value - 1)) * 100,
);
const effLv = computed(() =>
  props.isChild ? Math.min(props.parentLv ?? 1, maxLv.value) : lv.value,
);

const MQ_MOBILE = '(max-width: 767px)';
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia(MQ_MOBILE).matches);
let mq: MediaQueryList | null = null;
const onMq = (e: MediaQueryListEvent): void => { isMobile.value = e.matches; };
onMounted(() => {
  mq = window.matchMedia(MQ_MOBILE);
  isMobile.value = mq.matches;
  mq.addEventListener('change', onMq);
});
onBeforeUnmount(() => mq?.removeEventListener('change', onMq));

const descHtml = computed(() => {
  if (!props.sk.desc) return '-';
  const lvData = props.sk.level ? props.sk.level[String(effLv.value)] : null;
  const params = lvData ? lvData.param_list : [];
  return fmtDesc(props.sk.desc, params);
});

interface Metric {
  label: string;
  html: string;
}
const metrics = computed<Metric[]>(() => {
  const met: Metric[] = [];
  if (props.sk.sp_base != null) {
    met.push({ label: t('skill.energy'), html: String(props.sk.sp_base) });
  }
  if (props.sk.sp_need != null) {
    met.push({ label: t('skill.energyNeed'), html: String(props.sk.sp_need) });
  }
  const stType = props.sk.stance_damage_type;
  const stDisp = props.sk.stance_damage_display;
  if (stType && stDisp != null) {
    met.push({
      label: t('cwRole.stance'),
      html: `${elemLabel(stType)} ${stDisp ?? ''}`.trim(),
    });
  } else {
    const tough = fmtToughness(props.sk);
    if (tough) {
      met.push({ label: t('cwRole.stance'), html: tough });
    }
  }
  if (props.sk.bp_need != null && props.sk.bp_need > 0) {
    met.push({ label: t('catalog.charge.sp'), html: '-' + String(props.sk.bp_need) });
  }
  if (props.sk.bp_add != null && props.sk.bp_add > 0) {
    met.push({ label: t('catalog.charge.sp'), html: '+' + String(props.sk.bp_add) });
  }
  return met;
});

const needHtml = computed(() => {
  const raw = props.sk.skill_need;
  if (!raw) return '';
  const lvData = props.sk.level ? props.sk.level[String(effLv.value)] : null;
  return fmtDesc(raw, (lvData && lvData.param_list) || []);
});

interface RatedLink {
  kind: 'rank' | 'tree';
  num: string;
  name: string;
  icon: string;
  descHtml: string;
}
const ratedLinks = computed<RatedLink[]>(() => {
  const links: RatedLink[] = [];
  const data = props.charData;
  if (!data) return links;
  const rankIds = props.sk.rated_rank_id || [];
  if (rankIds.length && data.ranks) {
    for (const [num, rk] of Object.entries(data.ranks)) {
      if (rankIds.includes(rk.id)) {
        links.push({
          kind: 'rank', num: 'E' + num, name: rk.name,
          icon: rk.icon,
          descHtml: fmtDesc(rk.desc, rk.param_list),
        });
      }
    }
  }
  const treeIds = props.sk.rated_skill_tree_id || [];
  if (treeIds.length && data.skill_trees) {
    const byId = new Map<number, { name: string; desc: string; params: number[]; icon: string }>();
    for (const tree of Object.values(data.skill_trees)) {
      for (const node of Object.values(tree)) {
        if (node.point_id && node.point_name) {
          byId.set(node.point_id, {
            name: node.point_name,
            desc: node.point_desc || '',
            params: node.param_list || [],
            icon: node.icon || '',
          });
        }
      }
    }
    for (const pid of treeIds) {
      const hit = byId.get(pid) ?? byId.get(Number('1' + String(pid)));
      if (hit) {
        links.push({
          kind: 'tree', num: String(pid), name: hit.name,
          icon: hit.icon,
          descHtml: fmtDesc(hit.desc, hit.params),
        });
      }
    }
  }
  return links;
});

const linksOpen = ref(false);
const linksEverOpened = ref(false);
function toggleLinks(): void {
  linksOpen.value = !linksOpen.value;
  if (linksOpen.value) linksEverOpened.value = true;
}

const officialMaxLv = computed(() => props.sk.max_level ?? maxLv.value);

const typeName = computed(() => props.sk.type_name || skillTypeLabel(props.sk.type ?? '', ''));
const tagLabel = computed(() => props.sk.tag || '');
const icon = computed(() => skillIconUrl(props.sk, props.charId, props.charData));
const iconAttrs = computed(() => iconImgAttrs(icon.value));
const typeKey = computed(() => props.sk.type || '');

const terms = computed(() => extraTerms(props.sk));

interface TableRow {
  lv: number;
  cells: (number | string)[];
}
const table = computed<{ cols: string[]; rows: TableRow[] } | null>(() => {
  const lvl = props.sk.level;
  if (!lvl) return null;
  const levels = Object.keys(lvl).map(Number).sort((a, b) => a - b);
  if (levels.length <= 1) return null;
  const maxParams = Math.max(...levels.map((l) => (lvl[l].param_list || []).length));
  if (maxParams === 0) return null;
  const cols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, maxParams).split('');
  const rows = levels.map((l) => {
    const pl = lvl[l].param_list || [];
    return { lv: l, cells: cols.map((_, i) => (pl[i] != null ? pl[i] : '')) };
  });
  return { cols, rows };
});
const tableOpen = ref(false);
const tableEverOpened = ref(false);
function toggleTable(): void {
  tableOpen.value = !tableOpen.value;
  if (tableOpen.value) tableEverOpened.value = true;
}

const animOpen = ref(false);
const everOpened = ref(false);
const animIdx = ref(0);
const imgDone = ref(false);

function animSrc(entry: SkillAnimEntry): string {
  return entry.url.endsWith('.gif')
    ? `${entry.url}?x-oss-process=image%2Fformat%2Cwebp`
    : entry.url;
}

const myAnims = computed<SkillAnimEntry[]>(() => {
  const entries = props.animEntries;
  if (!entries || !entries.length) return [];
  const hasChildren = (props.childSkills?.length ?? 0) > 0;
  return hasChildren ? entries.slice(0, 1) : entries;
});

const childAnimMap = computed<Record<number, SkillAnimEntry[] | null>>(() => {
  const entries = props.animEntries;
  const children = props.childSkills;
  if (!entries || !children?.length) return {};
  const map: Record<number, SkillAnimEntry[] | null> = {};
  children.forEach((_, ci) => {
    const a = entries[ci + 1];
    if (a) map[ci] = [a];
  });
  return map;
});

const curAnim = computed(() =>
  myAnims.value[animIdx.value] ? animSrc(myAnims.value[animIdx.value]) : '',
);
function toggleAnim(): void {
  animOpen.value = !animOpen.value;
  if (animOpen.value) everOpened.value = true;
}
function selectAnim(i: number): void {
  if (i === animIdx.value) return;
  animIdx.value = i;
  imgDone.value = false;
}
function onImgLoad(): void { imgDone.value = true; }
</script>

<template>
  <div
    :class="isChild ? 'nk-skill nk-skill--child' : 'nk-skill'"
    :data-type="typeKey"
    :id="!isChild && anchor ? anchor : undefined"
  >
    <div v-if="!isChild" class="nk-skill__head">
      <span class="nk-skill__type-dot" :title="typeName"></span>
      <div class="nk-skill__slider">
        <span class="nk-slider__val">Lv.{{ lv }}<template v-if="officialMaxLv > 1">/{{ officialMaxLv }}</template></span>
        <input type="range" :min="maxLv <= 1 ? 0 : 1" :max="maxLv" :value="lv" :disabled="maxLv <= 1" :aria-label="t('skill.levelAria', { name: sk.name })" :style="{ '--fill': fillPct + '%' }" @input="onSlider">
      </div>
    </div>
    <div class="nk-skill__body">
      <div v-if="!isMobile" class="nk-skill__rail">
        <img v-if="icon" class="nk-skill__icon" v-bind="iconAttrs" alt="">
      </div>
      <div class="nk-skill__content">
        <div class="nk-skill__title-row">
          <img v-if="isMobile && icon" class="nk-skill__icon" v-bind="iconAttrs" alt="">
          <div class="nk-skill__title">
            <span class="nk-skill__name">{{ sk.name }}</span>
            <span class="nk-skill__meta">
              <span class="nk-skill__type">{{ typeName }}</span>
              <span v-if="tagLabel" class="nk-skill__tag">{{ tagLabel }}</span>
            </span>
          </div>
        </div>
        <div class="nk-skill__desc" v-html="descHtml"></div>
        <div v-if="needHtml" class="nk-skill__need">
          <span class="nk-skill__need-label">{{ t('skill.consume') }}</span>
          <span class="nk-skill__need-val" v-html="needHtml"></span>
        </div>
        <div v-if="metrics.length" class="nk-skill__metrics">
          <dl v-for="m in metrics" :key="m.label" class="nk-skill__metric">
            <dt>{{ m.label }}</dt><dd v-html="m.html"></dd>
          </dl>
        </div>
        <div v-if="ratedLinks.length" class="nk-skill__links">
          <button
            class="nk-skill__toggle"
            :class="{ open: linksOpen }"
            :aria-expanded="linksOpen"
            type="button"
            @click="toggleLinks"
          >
            <span class="arrow">▶</span> {{ t(linksOpen ? 'skill.enhSourcesOpen' : 'skill.enhSources') }}
          </button>
          <div class="nk-links-clip" :class="{ open: linksOpen }">
            <div v-if="linksEverOpened" class="nk-links-inner">
              <div
                v-for="l in ratedLinks"
                :key="l.kind + l.num"
                class="nk-skill__link-item"
                :class="`nk-skill__link-item--${l.kind}`"
              >
                <div class="nk-skill__link-item-head">
                  <img
                    class="nk-skill__link-item-icon"
                    v-bind="iconImgAttrs(iconUrl(l.icon))"
                    :alt="l.name"
                  >
                  <span class="nk-skill__link-item-name">{{ l.name }}</span>
                </div>
                <div class="nk-skill__link-item-desc" v-html="l.descHtml"></div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="terms.length" class="nk-skill__terms">
          <div v-for="t in terms" :key="t.name" class="nk-term">
            <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
          </div>
        </div>
        <div v-if="myAnims.length" class="nk-skill__anim">
          <button
            class="nk-skill__toggle"
            :class="{ open: animOpen }"
            :aria-expanded="animOpen"
            type="button"
            @click="toggleAnim"
          >
            <span class="arrow">▶</span> {{ t(animOpen ? 'skill.animOpen' : 'skill.anim') }}
          </button>
          <div class="nk-skill__anim-clip" :class="{ open: animOpen }">
            <div v-if="everOpened" class="nk-skill__anim-inner">
              <div v-if="myAnims.length > 1" class="nk-skill__anim-tabs">
                <button
                  v-for="(a, i) in myAnims"
                  :key="i"
                  type="button"
                  class="nk-skill__anim-tab"
                  :class="{ active: i === animIdx }"
                  @click="selectAnim(i)"
                >{{ a.title || `${i + 1}` }}</button>
              </div>
              <div class="nk-skill__anim-stage" :class="{ loaded: imgDone }">
                <img
                  v-if="curAnim"
                  class="nk-skill__anim-img"
                  :src="curAnim"
                  :alt="t('skill.animAlt', { name: sk.name })"
                  loading="lazy"
                  @load="onImgLoad"
                >
                <div v-if="animOpen && !imgDone" class="nk-skill__anim-ph"><span></span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="table" class="nk-skill__table-wrap">
        <button
          class="nk-skill__toggle"
          :class="{ open: tableOpen }"
          :aria-expanded="tableOpen"
          type="button"
          @click="toggleTable"
        >
          <span class="arrow">▶</span> {{ t(tableOpen ? 'skill.tableOpen' : 'skill.table') }}
        </button>
        <div class="nk-table-clip" :class="{ open: tableOpen }">
          <div v-if="tableEverOpened" class="nk-table-inner">
            <table class="nk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th v-for="c in table.cols" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in table.rows"
                  :key="row.lv"
                  :class="{ 'nk-table--active': row.lv === effLv }"
                  :data-lv="row.lv"
                >
                  <td>Lv.{{ row.lv }}</td>
                  <td v-for="(cell, i) in row.cells" :key="i">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <SkillCard
      v-for="(c, ci) in childSkills || []"
      :key="c.id"
      :class="{ 'nk-skill--child-last': ci === (childSkills?.length ?? 0) - 1 }"
      :sk="c"
      :is-child="true"
      :parent-lv="lv"
      :char-id="charId"
      :char-data="charData"
      :anim-entries="childAnimMap[ci] || null"
    />
  </div>
</template>
