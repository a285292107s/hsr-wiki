<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ELEM, MON_RANK, SITE_NAME } from '../../lib/constants';
import {
  elementIconUrl, escHtml, fmtDesc, monsterFigureUrl, monsterIconUrl,
} from '../../lib/format';
import type { MonsterLevelCurve } from '../../lib/monster-stats';
import { monsterMaxLevel, monsterStatAt } from '../../lib/monster-stats';
import { fmtStatValue } from '../../lib/format';
import { loadLocalMonsterDetail, loadLocalMonsterLevelCurve } from '../../services/api';
import type { MonsterDetail, MonsterSkillDetail } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import '../../styles/monster-detail.css';

const route = useRoute();

const { data, error, showSkeleton, run: load, retry } = usePageData<MonsterDetail>(() =>
  loadLocalMonsterDetail(String(route.params.id)),
);
onMounted(() => {
  void load();
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== String(data.value?.id)) void load();
  },
);

const d = computed(() => data.value);
watch(d, (data) => {
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});
/* 战斗数值合成（ADR 0040）：曲线作为共享单例随详情页拉取；等级档缺省 100（曲线表有值的最小档）。 */
const curveRef = ref<MonsterLevelCurve | null>(null);
const combatLevel = ref(100);
onMounted(() => {
  void loadLocalMonsterLevelCurve().then((c) => { curveRef.value = c; });
});
/** 曲线在该怪难度组下的最高等级（滑条上限；曲线缺组 → 0 = 静态展示基准值）。 */
const maxLevel = computed(() => (d.value ? monsterMaxLevel(curveRef.value, String(d.value.level_group ?? 1)) : 0));
const combatStats = computed(() => {
  const v = d.value;
  if (!v) return null;
  const meta = { statRatio: v.stat_ratio ?? null, levelGroup: v.level_group ?? 1, stats: v.stats, curve: curveRef.value };
  return {
    hp: monsterStatAt('hp', combatLevel.value, meta),
    atk: monsterStatAt('atk', combatLevel.value, meta),
    def: monsterStatAt('def', combatLevel.value, meta),
    speed: monsterStatAt('speed', combatLevel.value, meta),
  };
});
const figureUrl = computed(() => {
  if (!d.value) return '';
  return monsterFigureUrl(d.value.figure) || monsterIconUrl(d.value.icon);
});
const rankLabel = computed(() => (d.value ? MON_RANK[d.value.rank] || '' : ''));
const invaded = computed(() => d.value?.invaded ?? null);
/** 侵蚀等级序号（同一怪物可被多个等级点名） */
const invadedLevels = computed(() => {
  const ids = invaded.value?.invasion_ids ?? [];
  return [...new Set(ids)].sort((a, b) => a - b).join(' / ');
});

function elemTag(elem: string): string {
  const name = ELEM[elem] || elem;
  return `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)}</span>`;
}
const weakHtml = computed(() => (d.value?.weak ?? []).map(elemTag).join(''));
const resistHtml = computed(() =>
  Object.entries(d.value?.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(ELEM[k] || k)} ${Math.round(v * 100)}%</span>`)
    .join(''));
const introHtml = computed(() => {
  if (!d.value) return '';
  const t = fmtDesc(d.value.intro, []);
  return t || '<span class="nk-mob-empty">暂无图鉴介绍</span>';
});
function skillHtml(s: MonsterSkillDetail): string {
  return fmtDesc(s.desc, s.param_list);
}
function skillMeta(s: MonsterSkillDetail): string {
  const parts: string[] = [];
  if (s.damage_type) {
    const name = ELEM[s.damage_type] || s.damage_type;
    parts.push(
      `<span class="nk-mob-skill__elem"><img src="${escHtml(elementIconUrl(s.damage_type))}" alt="${escHtml(name)}" title="${escHtml(name)}" loading="lazy">${escHtml(name)}</span>`,
    );
  }
  if (s.type_desc) {
    parts.push(`<span class="nk-mob-skill__type">${escHtml(s.type_desc)}</span>`);
  }
  return parts.join('<span class="nk-mob-skill__sep">/</span>');
}
</script>

<template>
  <div class="nk-mob-page">
    <div v-if="showSkeleton" class="nk-mob-skeleton" aria-hidden="true">
      <div class="nk-mob-skeleton__hero"></div>
      <div class="nk-mob-skeleton__body">
        <div class="nk-mob-skeleton__line"></div>
        <div class="nk-mob-skeleton__line"></div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">怪物数据加载失败</div>
      <div class="nk-error-state__detail">可能是网络波动或该条目暂时不可用，重试即可恢复。</div>
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
            <span v-if="d.stance">韧性 {{ d.stance }}</span>
          </div>
          <h1 class="nk-mob-hero__name">{{ d.name }}</h1>
          <RouterLink v-if="invaded" class="nk-mob-invaded" to="/voracity">
            <span class="nk-mob-invaded__text">受『贪饕』侵蚀</span>
            <span v-if="invadedLevels" class="nk-mob-invaded__lv">· 等级 {{ invadedLevels }}</span>
          </RouterLink>
        </div>
      </div>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">图鉴记录</h2>
              <span class="nk-mob-sec__en">DOSSIER</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-sec__body nk-mob-intro" v-html="introHtml"></p>
          </section>

          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">弱点与抗性</h2>
              <span class="nk-mob-sec__en">VULNERABILITY</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-resist">
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">韧性弱点</span>
                <span v-if="weakHtml" class="nk-mob-resist__tags" v-html="weakHtml"></span>
                <span v-else class="nk-mob-empty">无弱点信息</span>
              </div>
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">伤害抗性</span>
                <span v-if="resistHtml" class="nk-mob-resist__tags" v-html="resistHtml"></span>
                <span v-else class="nk-mob-empty">无抗性信息</span>
              </div>
            </div>
          </section>

          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">战斗数值</h2>
              <span class="nk-mob-sec__en">COMBAT STATS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <!-- 等级档滑条：复用光锥页「叠影」range 原语（.nk-skill__slider），页级字号口径 -->
            <div v-if="maxLevel > 1" class="nk-mob-level">
              <span class="nk-mob-level__label">等级 {{ combatLevel }}</span>
              <input
                type="range"
                aria-label="敌人等级"
                :min="1"
                :max="maxLevel"
                :value="combatLevel"
                :style="{ '--fill': `${((combatLevel - 1) / (maxLevel - 1)) * 100}%` }"
                @input="combatLevel = Number(($event.target as HTMLInputElement).value)"
              >
            </div>
            <p v-else class="nk-mob-empty">该怪物的等级曲线暂缺组 {{ d?.level_group ?? 1 }}，仅展示档案基准值。</p>
            <dl class="nk-mob-stats">
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">HP 生命</dt>
                <dd class="nk-mob-stat__val" data-prop="hp">{{ fmtStatValue(combatStats?.hp ?? d.stats.hp) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">ATK 攻击</dt>
                <dd class="nk-mob-stat__val" data-prop="atk">{{ fmtStatValue(combatStats?.atk ?? d.stats.atk) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">DEF 防御</dt>
                <dd class="nk-mob-stat__val" data-prop="def">{{ fmtStatValue(combatStats?.def ?? d.stats.def) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">SPD 速度</dt>
                <dd class="nk-mob-stat__val" data-prop="spd">{{ fmtStatValue(combatStats?.speed ?? d.stats.speed) }}</dd>
              </div>
              <div v-if="d.stance" class="nk-mob-stat nk-mob-stat--stance">
                <dt class="nk-mob-stat__label">韧性</dt>
                <dd class="nk-mob-stat__val">{{ fmtStatValue(d.stance) }}</dd>
              </div>
            </dl>
            <p class="nk-mob-stat-note">口径：模板基准 × 维度修饰比 × 等级曲线（难度组 {{ d.level_group ?? 1 }}）；基准值 {{ d.stats.hp }} / {{ d.stats.atk }} / {{ d.stats.def }} / {{ d.stats.speed }}，未含剧情与场景系数。</p>
          </section>

          <section v-if="d.skills.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">技能</h2>
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
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>