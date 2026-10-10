<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { pathLabel } from '../../lib/enum-labels';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fmtDescWithFormat, fmtDescStar, avatarShopIconUrl, avatarDrawCardUrl, gridFightEquipIconWithFallback, gridFightTraitIconById, gridFightSkillIconSrc, gridFightPropIconUrl, lightconeIconUrl } from '../../lib/format';
import { resolveCdnUri } from '../../services/cdn';
import { SITE_NAME } from '../../lib/constants';
import { cwChargeKey, cwCostKey } from '../../lib/enum-labels';
import { propLabel, propValue, mergeSkillGroups, buildGrowthMatrix, matrixUp, resolveRecommend, buildRecommendRows, groupTraits, buildServantAttrs, buildSkillNameMap, rankMech, rankDesc, stanceLine } from '../../lib/currency-role';
import type { MergedSkill } from '../../lib/currency-role';
import { usePageData } from '../composables/use-page-data';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { loadLocalCurrencyRole, loadLocalCharacter, loadLocalCurrencyPropIcons, loadLocalLightCones } from '../../services/api';
import { recommendPriorityKey } from '../../lib/currency-role';
import { getSavedTrailblazerGender, shouldUseFemaleAvatar } from '../../lib/trailblazer';
import { getSavedCwSkillDescMode, setCwSkillDescMode } from '../../lib/cw-skill-desc';
import type { CwSkillDescMode } from '../../lib/cw-skill-desc';
import type {
  CurrencyRoleDetail, CurrencyRoleStar,
  CurrencyRoleRank, CharacterData, CurrencyPropIconMap, LocalLightConeEntry,
} from '../../services/types';
/* 拆分块按级联顺序导入，不得乱序 */
import '../../styles/currency-role-hero.css';
import '../../styles/currency-role-sections.css';
import '../../styles/currency-role-gear.css';
import '../../styles/currency-role-skills.css';

const route = useRoute();
const { t } = useI18n();
const roleId = computed(() => String(route.params.id));

const descMode = ref<CwSkillDescMode>(getSavedCwSkillDescMode());
function setDescMode(mode: CwSkillDescMode): void {
  descMode.value = mode;
  setCwSkillDescMode(mode);
}

const { data, error, loading, showSkeleton, run: load } = usePageData<CurrencyRoleDetail>(() =>
  loadLocalCurrencyRole(roleId.value),
);

const starKeys = computed(() =>
  data.value ? Object.keys(data.value.stars).sort((a, b) => Number(a) - Number(b)) : [],
);
const selectedStar = ref('1');
watch(
  starKeys,
  (ks) => { if (ks.length) selectedStar.value = ks[ks.length - 1]; },
  { immediate: true },
);
const star = computed<CurrencyRoleStar | null>(() =>
  data.value ? (data.value.stars[selectedStar.value] || null) : null,
);

/** 展示用 AvatarID：选女性开拓者时切 female_avatar_id（仅立绘；随从 #N 解析仍走数据 avatar_id） */
const displayAvatarId = computed(() => {
  const d = data.value;
  if (!d) return 0;
  const gender = getSavedTrailblazerGender();
  return shouldUseFemaleAvatar(gender, d.female_avatar_id) ? d.female_avatar_id! : (d.avatar_id || d.id);
});

/** Hero 定位描述：front/back_one_word_desc 跨星级一致（75 角色全量验证，2026-08-15），
 *  取首星级即可，不绑定 selectedStar（避免星级切换触发无关重渲染）。 */
const roleLines = computed(() => {
  const stars = data.value?.stars;
  if (!stars) return [];
  const firstKey = Object.keys(stars).sort((a, b) => Number(a) - Number(b))[0];
  const s = firstKey ? stars[firstKey] : null;
  if (!s) return [];
  const lines: Array<{ pos: string; text: string }> = [];
  if (s.front_one_word_desc) lines.push({ pos: t('catalog.position.front'), text: s.front_one_word_desc });
  if (s.back_one_word_desc) lines.push({ pos: t('catalog.position.back'), text: s.back_one_word_desc });
  return lines;
});

const mergedSkillGroups = computed(() => mergeSkillGroups(data.value?.stars));

const recommend = computed(() => resolveRecommend(data.value?.stars, star.value));
const recommendRows = computed(() => buildRecommendRows(recommend.value));

const propIcons = ref<CurrencyPropIconMap | null>(null);
void loadLocalCurrencyPropIcons()
  .then((m) => { propIcons.value = m; })
  .catch(() => {});

/** 常规模式光锥表（共享单例；专属光锥本体查名，全量验证 33/33 命中） */
const lightCones = ref<LocalLightConeEntry[] | null>(null);
void loadLocalLightCones()
  .then((l) => { lightCones.value = l; })
  .catch(() => {});

/** 专属光锥本体（EquipmentID → 常规模式光锥表；取首个等级条目 ID，各等级同 ID） */
const coneInfo = computed(() => {
  const id = data.value?.equipment?.[0]?.equipment_id;
  if (!id || !lightCones.value) return null;
  return lightCones.value.find((l) => String(l.id) === String(id)) || null;
});

const growthMatrix = computed(() => buildGrowthMatrix(data.value?.stars, propIcons.value));

const charData = ref<CharacterData | null>(null);
const charDataFailed = ref(false);

watch(
  roleId,
  () => {
    charData.value = null;
    charDataFailed.value = false;
    void load();
  },
  { immediate: true },
);

watch(
  star,
  async (s) => {
    if (!s?.servant || charData.value || charDataFailed.value) return;
    const detail = data.value;
    if (!detail) return;
    const refs = [s.servant.hp_base, s.servant.hp_inherit, s.servant.speed_base, s.servant.speed_inherit]
      .filter((v) => typeof v === 'string' && /^#\d+$/.test(v));
    if (!refs.length) return;
    try {
      charData.value = await loadLocalCharacter(String(detail.avatar_id || detail.id));
    } catch {
      charDataFailed.value = true;
    }
  },
  { immediate: true },
);
const servantAttrs = computed(() => buildServantAttrs(star.value?.servant, charData.value));

watch(
  data,
  (d) => { if (d) document.title = `${d.name} - ${SITE_NAME}`; },
  { immediate: true },
);

const skillNameMap = computed(() => buildSkillNameMap(data.value?.stars));
function rankMechText(rk: CurrencyRoleRank): string {
  return rankMech(rk, skillNameMap.value);
}

function rankIconAttrs(rk: CurrencyRoleRank): Record<string, string | undefined> {
  const id = displayAvatarId.value ? String(displayAvatarId.value) : '';
  if (!id) return {};
  const file = `${id}/${id}_Rank_${rk.rank}.webp`;
  const { primary, fallback } = resolveCdnUri('rank', file);
  if (!primary) return {};
  return { src: primary, 'data-cdn-fallback': fallback || undefined, alt: rk.name || '', loading: 'lazy' };
}

/** 技能在当前选中星级下的参数下标（技能可能仅在部分星级出现；-1 = 选中星级未解锁） */
function skillStarIdx(sk: MergedSkill): number {
  return sk.stars.indexOf(Number(selectedStar.value));
}

/** 技能卡图标属性（jsDelivr 优先 + nanoka 兜底）：不绑 hideOnError，
 *  回退与最终隐藏由全局 CDN 委托（installCdnImgFallback）完成——绑了会抢在回退前隐藏。 */
function skillIconAttrs(sk: MergedSkill): Record<string, string | undefined> {
  const { src, fb } = gridFightSkillIconSrc(sk.icon);
  if (!src) return {};
  return { src, 'data-cdn-fallback': fb || undefined, alt: sk.name || '', loading: 'lazy' };
}

const SECTIONS = [
  { id: 'stars', label: t('cwRole.sec.growth') },
  { id: 'skills', label: t('cwRole.sec.skills') },
  { id: 'ranks', label: t('cwRole.sec.ranks') },
  { id: 'cones', label: t('cwRole.sec.cones') },
  { id: 'equips', label: t('cwRole.sec.equips') },
] as const;

const pageRef = ref<HTMLElement | null>(null);
const barRef = ref<HTMLElement | null>(null);
let panels: HTMLElement[] = [];

const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => SECTIONS.map((s) => s.id),
  (id) => panels.find((p) => p.dataset.panel === id) || null,
  { offset: () => (barRef.value?.offsetHeight || 0) + 12 },
);

watch(data, async () => {
  await nextTick();
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
  refresh();
});

const traitGroups = computed(() => groupTraits(data.value?.traits));

function hideOnError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden';
}
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-crole" :aria-busy="loading">

    <div v-if="showSkeleton" class="nk-crole__skeleton" role="status" aria-live="polite" :aria-label="t('cwRole.loadingAria')">
      <div class="nk-crole__skeleton-hero">
        <div class="nk-crole__skeleton-portrait nk-sk nk-sk--shimmer"></div>
        <div class="nk-crole__skeleton-info">
          <div class="nk-sk nk-sk--shimmer" style="width: 104px; height: 12px; border-radius: 2px"></div>
          <div class="nk-sk nk-sk--shimmer" style="width: 56%; height: 36px; border-radius: 6px"></div>
          <div class="nk-sk nk-sk--shimmer" style="width: 42%; height: 14px; border-radius: 2px"></div>
          <div class="nk-sk nk-sk--shimmer" style="width: 30%; height: 14px; border-radius: 2px"></div>
        </div>
      </div>
      <div class="nk-crole__skeleton-tabs">
        <div class="nk-sk nk-sk--shimmer" v-for="n in 3" :key="n" style="width: 56px; height: 30px; border-radius: 6px"></div>
      </div>
      <div class="nk-crole__skeleton-grid">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md" v-for="n in 4" :key="n"></div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('cwRole.errorTitle') }}</div>
      <div class="nk-error-state__detail">{{ t('common.loadErrorDetail') }}</div>
      <div class="nk-error-state__tech">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="load">RETRY</button>
    </div>

    <template v-else-if="data">
      <header class="nk-crole-hero" :data-rarity="data.rarity">
        <div class="nk-crole-hero__bg" aria-hidden="true" :style="{ backgroundImage: `url(${avatarDrawCardUrl(displayAvatarId)})` }"></div>
        <div class="nk-crole-hero__scrim" aria-hidden="true"></div>
        <div class="nk-crole-hero__content">
          <div class="nk-crole-hero__info">
            <div class="nk-crole-hero__line">
              <span class="nk-crole-hero__id">NO.{{ data.id }}</span>
              <span v-if="data.season_ids && data.season_ids.length" class="nk-crole-hero__season">{{ t('cwRole.season', { list: data.season_ids.join(' / ') }) }}</span>
              <span v-if="data.rarity >= 1" class="nk-crole-hero__fee">{{ cwCostKey(String(data.rarity)) ? t(cwCostKey(String(data.rarity))!) : data.rarity }}</span>
            </div>
            <h1 class="nk-crole-hero__name">{{ data.name }}</h1>
            <div v-if="roleLines.length" class="nk-crole-hero__role">
              <p v-for="ln in roleLines" :key="ln.pos">
                <span class="nk-crole-slot nk-crole-slot--role is-on" aria-hidden="true">{{ ln.pos }}</span>
                {{ ln.text }}
              </p>
            </div>
            <div class="nk-crole-hero__tags">
              <span v-for="c in data.charge_type" :key="c" class="nk-crole-chip nk-crole-chip--charge">{{ t('catalog.chargeChip', { name: cwChargeKey(c) ? t(cwChargeKey(c)!) : c }) }}</span>
              <span v-if="data.is_expert" class="nk-crole-chip nk-crole-chip--exp">{{ t('catalog.filter.expert') }}</span>
            </div>
            <div v-if="traitGroups.length" class="nk-crole-hero__traits">
              <div v-for="grp in traitGroups" :key="grp.cat" class="nk-crole-traitgrp">
                <router-link
                  v-for="tr in grp.items"
                  :key="tr.id"
                  :to="`/currency/trait/${tr.id}`"
                  class="nk-crole-herotrait"
                  :class="`nk-crole-herotrait--${grp.cat}`"
                >
                  <span class="nk-crole-herotrait__icon">
                    <img :src="gridFightTraitIconById(tr.id)" :alt="tr.name || ''" loading="eager" @error="hideOnError" />
                  </span>
                  <span class="nk-crole-herotrait__name">{{ tr.name || '?' }}</span>
                </router-link>
              </div>
            </div>
          </div>
          <div class="nk-crole-hero__portrait" :data-rarity="data.rarity">
            <img :src="avatarShopIconUrl(displayAvatarId)" :alt="data.name" loading="eager" @error="hideOnError" />
          </div>
        </div>
      </header>

      <div ref="barRef" class="nk-crole-bar">
        <div class="nk-crole-bar__inner">
          <nav class="nk-secnav" :aria-label="t('cwRole.navAria')">
            <button
              v-for="s in SECTIONS"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeId === s.id }"
              :aria-current="activeId === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-crole-bar__progress" aria-hidden="true" :style="{ width: `${progress}%` }"></div>
      </div>

      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        :aria-label="t('cwRole.topAria')"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <div class="nk-panels">

        <div class="nk-panel" data-panel="stars">
          <template v-if="growthMatrix.length">
            <div class="nk-crole-gm-head">
              <h2 class="nk-crole-section__title">{{ t('cwRole.sec.growth') }}</h2>
              <div class="nk-crole-gm-pills" role="group" :aria-label="t('cwRole.starSwitchAria')">
                <button
                  v-for="k in starKeys"
                  :key="k"
                  type="button"
                  class="nk-crole-gm-pill"
                  :class="{ 'is-active': k === selectedStar }"
                  :aria-pressed="k === selectedStar"
                  @click="selectedStar = k"
                >{{ k }}★</button>
              </div>
            </div>

            <div class="nk-crole-gm">
              <table class="nk-crole-gm__table">
                <thead>
                  <tr>
                    <th class="nk-crole-gm__corner" scope="col">{{ t('catalog.filter.element') }}</th>
                    <th
                      v-for="c in starKeys"
                      :key="c"
                      scope="col"
                      :class="['nk-crole-gm__star', { 'is-active': c === selectedStar }]"
                      @click="selectedStar = c"
                    >{{ c }}★</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="grp in growthMatrix" :key="grp.group">
                    <tr class="nk-crole-gm__grp">
                      <td :colspan="starKeys.length + 1">{{ grp.group }}</td>
                    </tr>
                    <tr v-for="row in grp.rows" :key="row.key">
                      <th class="nk-crole-gm__label" scope="row">
                        <img v-if="row.icon" :src="gridFightPropIconUrl(row.icon)" alt="" class="nk-crole-gm__icon" loading="lazy" @error="hideOnError" />
                        {{ row.label }}
                      </th>
                      <td
                        v-for="(cell, ci) in row.values"
                        :key="ci"
                        :class="['nk-crole-gm__val', { 'is-active': starKeys[ci] === selectedStar }]"
                      >{{ cell.text }}<span v-if="starKeys[ci] === selectedStar && matrixUp(row, ci)" class="nk-crole-gm__up">▲</span></td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="nk-slot-empty">{{ t('cwRole.empty.growth') }}</div>
        </div>

        <div class="nk-panel" data-panel="skills">
          <template v-if="mergedSkillGroups.length">
            <div class="nk-crole-skills-head">
              <h2 class="nk-crole-section__title">{{ t('cwRole.sec.skills') }}</h2>
              <div class="nk-crole-desc-toggle" role="group" :aria-label="t('cwRole.descModeAria')">
                <button
                  type="button"
                  class="nk-crole-desc-seg"
                  :class="{ 'is-active': descMode === 'simple' }"
                  :aria-pressed="descMode === 'simple'"
                  @click="setDescMode('simple')"
                >{{ t('cwRole.simple') }}</button>
                <button
                  type="button"
                  class="nk-crole-desc-seg"
                  :class="{ 'is-active': descMode === 'full' }"
                  :aria-pressed="descMode === 'full'"
                  @click="setDescMode('full')"
                >{{ t('cwRole.full') }}</button>
              </div>
            </div>
            <div v-if="servantAttrs.length" class="nk-crole-servantattrs">
              <span v-for="a in servantAttrs" :key="a.label" class="nk-crole-servantattrs__item"><b>{{ a.label }}</b>{{ a.value }}</span>
            </div>
            <div v-for="grp in mergedSkillGroups" :key="grp.key" class="nk-crole-skillgroup">
              <h3 class="nk-crole-skillgroup__title">{{ grp.label }}</h3>
              <div class="nk-crole-skills">
                <div v-for="sk in grp.skills" :key="sk.key" class="nk-crole-skill" :class="{ 'is-locked': skillStarIdx(sk) < 0 }">
                  <div class="nk-crole-skill__head">
                    <img v-if="skillIconAttrs(sk).src" v-bind="skillIconAttrs(sk)" class="nk-crole-skill__icon" />
                    <span class="nk-crole-skill__name">{{ sk.name }}</span>
                    <span v-if="sk.tag" class="nk-crole-skill__tag">{{ sk.tag }}</span>
                    <span v-if="sk.type" class="nk-crole-skill__type">{{ sk.type }}</span>
                    <span class="nk-crole-skill__stars">
                      <button
                        v-for="n in sk.stars"
                        :key="n"
                        type="button"
                        class="nk-crole-skill__star"
                        :class="{ 'is-on': n === Number(selectedStar) }"
                        :aria-pressed="n === Number(selectedStar)"
                        @click="selectedStar = String(n)"
                      >{{ n }}★</button>
                    </span>
                  </div>
                  <div class="nk-crole-skill__cost" v-if="sk.sp_base != null || sk.sp_need != null || (sk.bp_need != null && sk.bp_need > 0) || (sk.bp_add != null && sk.bp_add > 0) || stanceLine(sk)">
                    <span v-if="sk.sp_base != null">{{ t('cwRole.gainEnergy') }} <b>{{ sk.sp_base }}</b></span>
                    <span v-if="sk.sp_need != null">{{ t('cwRole.costEnergy') }} <b>{{ sk.sp_need }}</b></span>
                    <span v-if="sk.bp_need != null && sk.bp_need > 0">{{ t('catalog.charge.sp') }} <b>-{{ sk.bp_need }}</b></span>
                    <span v-if="sk.bp_add != null && sk.bp_add > 0">{{ t('catalog.charge.sp') }} <b>+{{ sk.bp_add }}</b></span>
                    <span v-if="stanceLine(sk)">{{ t('cwRole.stance') }} <b>{{ stanceLine(sk) }}</b></span>
                  </div>
                  <div v-if="skillStarIdx(sk) >= 0">
                    <p v-if="descMode === 'simple'" class="nk-crole-skill__simple" v-html="fmtDescStar(sk.simple_desc, sk.paramSets, skillStarIdx(sk))"></p>
                    <template v-else>
                      <div class="nk-crole-skill__desc" v-html="fmtDescStar(sk.desc, sk.paramSets, skillStarIdx(sk))"></div>
                      <ul v-if="sk.extraSets.length" class="nk-crole-skill__extra">
                        <li v-for="(ex, ek) in sk.extraSets" :key="ek">
                          <b>{{ ex.name }}：</b><span v-html="fmtDescStar(ex.desc, ex.paramSets, skillStarIdx(sk))"></span>
                        </li>
                      </ul>
                    </template>
                  </div>
                  <div v-else class="nk-crole-skill__unlock">{{ t('cwRole.unlockAt', { stars: sk.stars.join(' / ') }) }}</div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="nk-slot-empty">{{ t('cwRole.empty.skills') }}</div>
        </div>

        <div class="nk-panel" data-panel="ranks">
          <h2 class="nk-crole-section__title">{{ t('cwRole.sec.ranks') }}</h2>
          <template v-if="data.rank.length">
            <div class="nk-crole-timeline">
            <div v-for="rk in data.rank" :key="rk.rank_id" class="nk-crole-timeline__item">
              <div class="nk-crole-timeline__rail">
                <div class="nk-crole-timeline__icon">
                  <img v-if="rankIconAttrs(rk).src" v-bind="rankIconAttrs(rk)" />
                  <span v-else class="nk-crole-timeline__num">{{ rk.rank }}</span>
                </div>
                <div class="nk-crole-timeline__line" aria-hidden="true"></div>
              </div>
              <div class="nk-crole-timeline__card">
                <div class="nk-crole-timeline__head">
                  <span class="nk-crole-timeline__step">R{{ rk.rank }}</span>
                  <span class="nk-crole-timeline__name">{{ rk.name }}</span>
                </div>
                <p class="nk-crole-timeline__desc" v-html="rankDesc(rk)"></p>
                <p v-if="rankMechText(rk)" class="nk-crole-timeline__mech">{{ rankMechText(rk) }}</p>
                <ul v-if="rk.owner_props.length || rk.all_props.length" class="nk-crole-layer__props">
                  <li v-for="(p, pi) in rk.owner_props" :key="'o' + pi">
                    <span class="nk-crole-layer__scope">{{ t('cwRole.scopeSelf') }}</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                  <li v-for="(p, pi) in rk.all_props" :key="'a' + pi">
                    <span class="nk-crole-layer__scope nk-crole-layer__scope--all">{{ t('cwRole.scopeAll') }}</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                </ul>
              </div>
            </div>
            </div>
          </template>
          <div v-else class="nk-slot-empty">{{ t('cwRole.empty.ranks') }}</div>
        </div>

        <div class="nk-panel" data-panel="cones">
          <h2 class="nk-crole-section__title">{{ t('cwRole.sec.cones') }}</h2>
          <p class="nk-crole-section__hint">{{ t('cwRole.coneHint') }}</p>
          <template v-if="data.equipment.length">
            <div v-if="coneInfo" class="nk-crole-cone">
              <img :src="lightconeIconUrl(coneInfo.id)" :alt="coneInfo.name" class="nk-crole-cone__icon" loading="lazy" @error="hideOnError" />
              <div class="nk-crole-cone__body">
                <div class="nk-crole-cone__name">{{ coneInfo.name }}</div>
                <div class="nk-crole-cone__meta">
                  <span v-if="coneInfo.rarity >= 1" class="nk-crole-cone__rarity">{{ '★'.repeat(coneInfo.rarity) }}</span>
                  <span v-if="coneInfo.path" class="nk-crole-cone__path">{{ pathLabel(coneInfo.path) }}</span>
                  <span class="nk-crole-cone__id">NO.{{ coneInfo.id }}</span>
                </div>
              </div>
            </div>
            <div class="nk-crole-equips">
            <div v-for="eq in data.equipment" :key="eq.level" class="nk-crole-equip">
              <div class="nk-crole-equip__lv">
                <span class="nk-crole-equip__lv-num">{{ eq.level }}</span>
                <span class="nk-crole-equip__lv-label">Lv</span>
              </div>
              <div class="nk-crole-equip__body">
                <p class="nk-crole-equip__desc" v-html="fmtDescWithFormat(eq.desc, eq.param_list, eq.param_format)"></p>
                <ul v-if="eq.owner_props.length || eq.all_props.length" class="nk-crole-layer__props">
                  <li v-for="(p, pi) in eq.owner_props" :key="'o' + pi">
                    <span class="nk-crole-layer__scope">{{ t('cwRole.scopeSelf') }}</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                  <li v-for="(p, pi) in eq.all_props" :key="'a' + pi">
                    <span class="nk-crole-layer__scope nk-crole-layer__scope--all">{{ t('cwRole.scopeAll') }}</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </template>
          <div v-else class="nk-slot-empty">{{ t('cwRole.empty.cones') }}</div>
        </div>

        <div class="nk-panel" data-panel="equips">
          <template v-if="recommendRows.length">
            <h2 class="nk-crole-section__title">{{ t('cwRole.sec.equips') }}</h2>
            <div class="nk-crole-recs">
              <div v-for="row in recommendRows" :key="row.pos" class="nk-crole-rec">
                <div class="nk-crole-rec__head">
                  <span class="nk-crole-rec__pos">{{ t('cwRole.recFor', { pos: row.pos }) }}</span>
                </div>
                <div class="nk-crole-rec__row">
                  <div v-for="grp in row.groups" :key="grp.priority" class="nk-crole-rec__grp">
                    <span class="nk-crole-rec__prio" :class="grp.priority === 'first' ? 'is-first' : 'is-second'">{{ t(recommendPriorityKey(grp.priority)) }}</span>
                    <div class="nk-crole-rec__items">
                      <div v-for="eq in grp.items" :key="eq.id" class="nk-crole-recitem">
                        <div class="nk-crole-recitem__icon">
                          <img :src="gridFightEquipIconWithFallback(eq.icon, eq.id)" :alt="eq.name || ''" loading="lazy" @error="hideOnError" />
                        </div>
                        <span class="nk-crole-recitem__name">{{ eq.name || `#${eq.id}` }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-if="!recommendRows.length" class="nk-slot-empty">{{ t('cwRole.empty.equips') }}</div>
        </div>

      </div>
    </template>
  </div>
</template>