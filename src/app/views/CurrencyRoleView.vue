<script setup lang="ts">
/**
 * 货币战争 · 角色详情页（v5 重构：典藏名册风格）
 * 结构：名册扉页 Hero（编号行 + 超大角色名 + 钢印肖像章）→ 吸顶区块导航（成长总览 / 技能详情 / 后台星魂 / 专属光锥 / 推荐装备）
 *   + 阅读进度 + 返回顶部 → 内容平铺滚动（对齐常规模式详情页体系）
 * 星级切换为「成长总览 / 技能详情」两区块共享的局部状态：联动成长矩阵列高亮 + 技能描述参数
 *   （fmtDescStar 单星级渲染——技能卡展示当前选中星级数值，星级徽章组指示存在范围）
 * 样式纪律（反 AI 味，见 currency-role.css 顶部）：禁霓虹 glow / 禁 135° 对角渐变 / 禁 pill 泛滥 / 直角系（0 = 版面容器，4px = 内容元素）；
 *   阴影仅物理黑投影，强调色仅以纯色/淡底/发丝线承载。新样式必须延续该纪律。
 * 数据：本地转换数据（public/data/cn/currency/role/<id>.json，由 converter 落地）
 */
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  fmtDescWithFormat, fmtDescStar, avatarShopIconUrl, avatarDrawCardUrl,
  gridFightEquipIconWithFallback, gridFightTraitIconById, gridFightSkillIconSrc,
  gridFightPropIconUrl, lightconeIconUrl,
} from '../../lib/format';
import { resolveCdnUri } from '../../services/cdn';
import { SITE_NAME, PATH } from '../../lib/constants';
import {
  CHARGE_LABEL, propLabel, propValue,
  mergeSkillGroups, buildGrowthMatrix, matrixUp,
  resolveRecommend, buildRecommendRows, groupTraits,
  buildServantAttrs, buildSkillNameMap, rankMech, rankDesc, stanceLine,
} from '../../lib/currency-role';
import type { MergedSkill } from '../../lib/currency-role';
import { usePageData } from '../composables/use-page-data';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { loadLocalCurrencyRole, loadLocalCharacter, loadLocalCurrencyPropIcons, loadLocalLightCones } from '../../services/api';
import { getSavedTrailblazerGender, shouldUseFemaleAvatar } from '../../lib/trailblazer';
import { getSavedCwSkillDescMode, setCwSkillDescMode } from '../../lib/cw-skill-desc';
import type { CwSkillDescMode } from '../../lib/cw-skill-desc';
import type {
  CurrencyRoleDetail, CurrencyRoleStar,
  CurrencyRoleRank, CharacterData, CurrencyPropIconMap, LocalLightConeEntry,
} from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-role.css';

const route = useRoute();
const roleId = computed(() => String(route.params.id));

/** 技能描述模式：详细 desc / 简略 simple_desc 二选一展示（持久化于 localStorage，跨角色页面保持） */
const descMode = ref<CwSkillDescMode>(getSavedCwSkillDescMode());
function setDescMode(mode: CwSkillDescMode): void {
  descMode.value = mode;
  setCwSkillDescMode(mode);
}

/** 页面级加载编排：loading/error + 加载代竞态（角色间快速导航防旧数据覆盖） */
const { data, error, loading, run: load } = usePageData<CurrencyRoleDetail>(() =>
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
  if (s.front_one_word_desc) lines.push({ pos: '前台', text: s.front_one_word_desc });
  if (s.back_one_word_desc) lines.push({ pos: '后台', text: s.back_one_word_desc });
  return lines;
});

/** 前后台定位双槽（Front/Back/Both 驱动槽位亮灭）
 *   v5.1：双槽已移除——定位状态由摘要行行首章承担（有描述才渲染该行），本计算属性不再被引用。 */
/* （原 fbSlots 随双槽移除删除，2026-08-15；如需恢复双槽指示参照此注释重建） */

/** 跨星级合并技能：同名技能在各星级的参数集合并（构建逻辑见 lib/currency-role.ts） */
const mergedSkillGroups = computed(() => mergeSkillGroups(data.value?.stars));

/** 推荐装备：各星级数据一致，取当前选中星级，回退首个非空星级 */
const recommend = computed(() => resolveRecommend(data.value?.stars, star.value));
/** 推荐装备按行分组：前台一行、后台一行，每行内含首选/次选 */
const recommendRows = computed(() => buildRecommendRows(recommend.value));

/** 属性图标映射（共享单例；矩阵独立字段行/星魂属性图标查表，失败静默降级无图） */
const propIcons = ref<CurrencyPropIconMap | null>(null);
void loadLocalCurrencyPropIcons()
  .then((m) => { propIcons.value = m; })
  .catch(() => { /* 图标映射缺失仅影响图标展示，不影响数据渲染 */ });

/** 常规模式光锥表（共享单例；专属光锥本体查名，全量验证 33/33 命中） */
const lightCones = ref<LocalLightConeEntry[] | null>(null);
void loadLocalLightCones()
  .then((l) => { lightCones.value = l; })
  .catch(() => { /* 光锥表缺失仅影响本体卡展示 */ });

/** 专属光锥本体（EquipmentID → 常规模式光锥表；取首个等级条目 ID，各等级同 ID） */
const coneInfo = computed(() => {
  const id = data.value?.equipment?.[0]?.equipment_id;
  if (!id || !lightCones.value) return null;
  return lightCones.value.find((l) => String(l.id) === String(id)) || null;
});

/** 成长矩阵：跨星级全属性聚合（图标经 propIcons 查表补齐，构建逻辑见 lib/currency-role.ts） */
const growthMatrix = computed(() => buildGrowthMatrix(data.value?.stars, propIcons.value));

/* ─── 随从属性 #N 参数解析（#N → 常规模式角色技能 param_list） ─── */
/** 常规模式角色数据（随从 #N 引用解析用，懒加载） */
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

/** 选中星级存在随从且含 #N 引用时，懒加载常规模式角色技能数据 */
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
      charDataFailed.value = true; // 常规模式角色不存在（如未收录），优雅降级
    }
  },
  { immediate: true },
);
/** 随从属性展示项（#N 引用解析见 lib/currency-role.ts） */
const servantAttrs = computed(() => buildServantAttrs(star.value?.servant, charData.value));

watch(
  data,
  (d) => { if (d) document.title = `${d.name} - ${SITE_NAME}`; },
  { immediate: true },
);

/** 星魂机制效果：强化技能名映射表 + 文案（见 lib/currency-role.ts） */
const skillNameMap = computed(() => buildSkillNameMap(data.value?.stars));
function rankMechText(rk: CurrencyRoleRank): string {
  return rankMech(rk, skillNameMap.value);
}

/** 星魂展示图双源属性（常规模式同源：ui/ui3d/rank 官方全量 + nanoka 兜底，eidolonIconUrl 规则）。
 *  不绑 hideOnError——回退与最终隐藏由全局 CDN 委托完成（与技能图标同模式）。 */
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

/* ─── 吸顶区块导航（对齐常规模式详情页体系：useScrollSpy + 平铺面板） ─── */
/** 区块定义：id 对应面板 data-panel。五区块固定常驻（无内容时面板内显示空态提示，不隐藏区块）；
   导航标签与面板标题一一对应（v5 名册重构去除 01-05 编号前缀——编号为 AI 套路装饰，区块语义由位置承担）。 */
const SECTIONS = [
  { id: 'stars', label: '成长总览' },
  { id: 'skills', label: '技能详情' },
  { id: 'ranks', label: '后台星魂' },
  { id: 'cones', label: '专属光锥' },
  { id: 'equips', label: '推荐装备' },
] as const;

const pageRef = ref<HTMLElement | null>(null);
const barRef = ref<HTMLElement | null>(null);
let panels: HTMLElement[] = [];

/** 滚动追踪：区块导航激活态 + 阅读进度 + 返回顶部（与角色/终局详情页同一实现；面板常驻无门控） */
const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => SECTIONS.map((s) => s.id),
  (id) => panels.find((p) => p.dataset.panel === id) || null,
  { offset: () => (barRef.value?.offsetHeight || 0) + 12 },
);

/** 数据就绪后收集面板引用并刷新追踪（模板条件渲染，需等下一帧 DOM 稳定） */
watch(data, async () => {
  await nextTick();
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
  refresh();
});

/** 特质分类（头图羁绊图标分组，分类逻辑见 lib/currency-role.ts） */
const traitGroups = computed(() => groupTraits(data.value?.traits));

function hideOnError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden';
}
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-crole" :aria-busy="loading">

    <!-- 加载骨架屏（镜像档案 Hero 形态：方形肖像块 + 结算行） -->
    <div v-if="loading" class="nk-crole__skeleton" role="status" aria-live="polite" aria-label="角色详情加载中">
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

    <!-- 错误态 -->
    <div v-else-if="error" class="nk-crole__state nk-crole__state--err" role="alert">
      <svg class="nk-crole__state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
      <p>{{ error }}</p>
      <button class="nk-crole__retry" @click="load">重试</button>
    </div>

    <template v-else-if="data">
      <!-- ═══ 名册扉页 Hero（编号行 + 超大角色名 + 钢印肖像章；立绘衬底右侧透出主体） ═══ -->
      <header class="nk-crole-hero" :data-rarity="data.rarity">
        <div class="nk-crole-hero__bg" aria-hidden="true" :style="{ backgroundImage: `url(${avatarDrawCardUrl(displayAvatarId)})` }"></div>
        <div class="nk-crole-hero__scrim" aria-hidden="true"></div>
        <div class="nk-crole-hero__content">
          <div class="nk-crole-hero__info">
            <!-- 扉页编号行：NO. + 赛季 + 费用（HUD 小字，发丝分隔） -->
            <div class="nk-crole-hero__line">
              <span class="nk-crole-hero__id">NO.{{ data.id }}</span>
              <span v-if="data.season_ids && data.season_ids.length" class="nk-crole-hero__season">赛季 {{ data.season_ids.join(' / ') }}</span>
              <span v-if="data.rarity >= 1" class="nk-crole-hero__fee">{{ data.rarity }}费</span>
            </div>
            <h1 class="nk-crole-hero__name">{{ data.name }}</h1>
            <!-- 定位摘要（扉页副题：定位章 + 一句话描述，各展示非空项；跨星级一致，不随星级切换）。
                 定位章替代原编号行双槽——「前台/后台」状态与描述行一一对应，消除双槽与「前台/后台」前缀的重复表达 -->
            <div v-if="roleLines.length" class="nk-crole-hero__role">
              <p v-for="ln in roleLines" :key="ln.pos">
                <span class="nk-crole-slot nk-crole-slot--role is-on" aria-hidden="true">{{ ln.pos }}</span>
                {{ ln.text }}
              </p>
            </div>
            <div class="nk-crole-hero__tags">
              <span v-for="c in data.charge_type" :key="c" class="nk-crole-chip nk-crole-chip--charge">充能·{{ CHARGE_LABEL[c] || c }}</span>
              <span v-if="data.is_expert" class="nk-crole-chip nk-crole-chip--exp">专家</span>
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
          <!-- 钢印肖像章：直角 + 双层细金线（档案基因，v5 起直角化） -->
          <div class="nk-crole-hero__portrait" :data-rarity="data.rarity">
            <img :src="avatarShopIconUrl(displayAvatarId)" :alt="data.name" loading="eager" @error="hideOnError" />
          </div>
        </div>
      </header>

      <!-- ═══ 吸顶区块导航 + 阅读进度线 ═══ -->
      <div ref="barRef" class="nk-crole-bar">
        <div class="nk-crole-bar__inner">
          <nav class="nk-secnav" aria-label="内容区块导航">
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

      <!-- 返回顶部（滚动超过阈值出现） -->
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <!-- ═══ 内容平铺：成长总览 → 技能详情 → 星魂与光锥 → 推荐装备（滚动浏览） ═══ -->
      <div class="nk-panels">

        <!-- 01 成长总览：星级切换 → 成长矩阵（含后台机制值） -->
        <div class="nk-panel" data-panel="stars">
          <template v-if="growthMatrix.length">
            <div class="nk-crole-gm-head">
              <h2 class="nk-crole-section__title">成长总览</h2>
              <div class="nk-crole-gm-pills" role="group" aria-label="星级切换">
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

            <!-- 属性矩阵：行=语义分组属性（含强度/后台机制），列=星级，选中列高亮 + 增量标记 -->
            <div class="nk-crole-gm">
              <table class="nk-crole-gm__table">
                <thead>
                  <tr>
                    <th class="nk-crole-gm__corner" scope="col">属性</th>
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
          <div v-else class="nk-crole-empty">该角色没有成长数据</div>
        </div>

        <!-- 02 技能详情：跨星级合并技能（描述数值跟随当前选中星级，星级徽章组可快速切换；与成长总览共享 selectedStar） -->
        <div class="nk-panel" data-panel="skills">
          <template v-if="mergedSkillGroups.length">
            <!-- 标题行：描述模式切换（简略 simple_desc / 详细 desc 二选一，状态持久化） -->
            <div class="nk-crole-skills-head">
              <h2 class="nk-crole-section__title">技能详情</h2>
              <div class="nk-crole-desc-toggle" role="group" aria-label="技能描述模式">
                <button
                  type="button"
                  class="nk-crole-desc-seg"
                  :class="{ 'is-active': descMode === 'simple' }"
                  :aria-pressed="descMode === 'simple'"
                  @click="setDescMode('simple')"
                >简略</button>
                <button
                  type="button"
                  class="nk-crole-desc-seg"
                  :class="{ 'is-active': descMode === 'full' }"
                  :aria-pressed="descMode === 'full'"
                  @click="setDescMode('full')"
                >详细</button>
              </div>
            </div>
            <!-- 随从属性（独立区块，不依赖随从技能组存在性） -->
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
                    <!-- 星级徽章组：存在范围指示 + 快速切换（与矩阵列高亮同源 selectedStar） -->
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
                    <span v-if="sk.sp_base != null">获得能量 <b>{{ sk.sp_base }}</b></span>
                    <span v-if="sk.sp_need != null">消耗能量 <b>{{ sk.sp_need }}</b></span>
                    <span v-if="sk.bp_need != null && sk.bp_need > 0">战技点 <b>-{{ sk.bp_need }}</b></span>
                    <span v-if="sk.bp_add != null && sk.bp_add > 0">战技点 <b>+{{ sk.bp_add }}</b></span>
                    <span v-if="stanceLine(sk)">削韧 <b>{{ stanceLine(sk) }}</b></span>
                  </div>
                  <div v-if="skillStarIdx(sk) >= 0">
                    <!-- 简略模式：仅官方简略描述（simple_desc 为空的占位技能渲染为空，与详细模式行为一致） -->
                    <p v-if="descMode === 'simple'" class="nk-crole-skill__simple" v-html="fmtDescStar(sk.simple_desc, sk.paramSets, skillStarIdx(sk))"></p>
                    <!-- 详细模式：完整描述 + 附加条件（触发条件等机制信息属详细语境，简略模式不展示） -->
                    <template v-else>
                      <div class="nk-crole-skill__desc" v-html="fmtDescStar(sk.desc, sk.paramSets, skillStarIdx(sk))"></div>
                      <ul v-if="sk.extraSets.length" class="nk-crole-skill__extra">
                        <li v-for="(ex, ek) in sk.extraSets" :key="ek">
                          <b>{{ ex.name }}：</b><span v-html="fmtDescStar(ex.desc, ex.paramSets, skillStarIdx(sk))"></span>
                        </li>
                      </ul>
                    </template>
                  </div>
                  <!-- 选中星级未解锁该技能时的占位提示 -->
                  <div v-else class="nk-crole-skill__unlock">该技能于 <b>{{ sk.stars.join(' / ') }}★</b> 解锁</div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="nk-crole-empty">该角色没有技能数据</div>
        </div>

        <!-- ═══ 03 后台星魂（时间线；星魂展示图 = 常规模式同源 ui/ui3d/rank 双源） ═══ -->
        <div class="nk-panel" data-panel="ranks">
          <h2 class="nk-crole-section__title">后台星魂</h2>
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
                    <span class="nk-crole-layer__scope">自身</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                  <li v-for="(p, pi) in rk.all_props" :key="'a' + pi">
                    <span class="nk-crole-layer__scope nk-crole-layer__scope--all">全员</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                </ul>
              </div>
            </div>
            </div>
          </template>
          <div v-else class="nk-crole-empty">该角色没有后台星魂数据</div>
        </div>

        <!-- ═══ 04 专属光锥（后台专属装备） ═══ -->
        <div class="nk-panel" data-panel="cones">
          <h2 class="nk-crole-section__title">专属光锥</h2>
          <p class="nk-crole-section__hint">角色放置在后台时，拥有对应光锥可获得特殊加成。</p>
          <template v-if="data.equipment.length">
            <!-- 光锥本体（EquipmentID → 常规模式光锥表；名字/图标/稀有度/命途，方便用户理解指哪个光锥） -->
            <div v-if="coneInfo" class="nk-crole-cone">
              <img :src="lightconeIconUrl(coneInfo.id)" :alt="coneInfo.name" class="nk-crole-cone__icon" loading="lazy" @error="hideOnError" />
              <div class="nk-crole-cone__body">
                <div class="nk-crole-cone__name">{{ coneInfo.name }}</div>
                <div class="nk-crole-cone__meta">
                  <span v-if="coneInfo.rarity >= 1" class="nk-crole-cone__rarity">{{ '★'.repeat(coneInfo.rarity) }}</span>
                  <span v-if="coneInfo.path" class="nk-crole-cone__path">{{ PATH[coneInfo.path] || coneInfo.path }}</span>
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
                    <span class="nk-crole-layer__scope">自身</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                  <li v-for="(p, pi) in eq.all_props" :key="'a' + pi">
                    <span class="nk-crole-layer__scope nk-crole-layer__scope--all">全员</span>
                    <img v-if="p.icon" :src="gridFightPropIconUrl(p.icon)" alt="" class="nk-crole-layer__icon" loading="lazy" @error="hideOnError" />
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </template>
          <div v-else class="nk-crole-empty">该角色没有专属光锥数据</div>
        </div>

        <!-- ═══ 05 推荐装备（前台一行、后台一行 × 首选/次选） ═══ -->
        <div class="nk-panel" data-panel="equips">
          <!-- 推荐装备 -->
          <template v-if="recommendRows.length">
            <h2 class="nk-crole-section__title">推荐装备</h2>
            <div class="nk-crole-recs">
              <div v-for="row in recommendRows" :key="row.pos" class="nk-crole-rec">
                <div class="nk-crole-rec__head">
                  <span class="nk-crole-rec__pos">{{ row.pos }}推荐</span>
                </div>
                <div class="nk-crole-rec__row">
                  <div v-for="grp in row.groups" :key="grp.priority" class="nk-crole-rec__grp">
                    <span class="nk-crole-rec__prio" :class="grp.priority === '首选' ? 'is-first' : 'is-second'">{{ grp.priority }}</span>
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

          <!-- 无推荐装备时的空态 -->
          <div v-if="!recommendRows.length" class="nk-crole-empty">该角色没有推荐装备数据</div>
        </div>

      </div><!-- /.nk-panels -->
    </template>
  </div>
</template>