<script setup lang="ts">
/**
 * 货币战争 · 角色详情页（v2 重构）
 * 数据：本地转换数据（public/data/cn/currency/role/<id>.json，由 converter 落地）
 * 展示：沉浸式头图（羁绊图标跳转）→ Tab 导航 → 成长（矩阵 + 技能）→ 后台星魂/光锥 → 装备
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fmtDesc, fmtDescMerged, avatarShopIconUrl, avatarDrawCardUrl, iconUrl, gridFightEquipIconWithFallback, gridFightTraitIconById } from '../../lib/format';
import {
  FB_LABEL, CHARGE_LABEL, propLabel, propValue,
  mergeSkillGroups, buildGrowthMatrix, matrixUp,
  resolveRecommend, buildRecommendRows, groupTraits,
  buildServantAttrs, buildSkillNameMap, rankMech, rankDesc, stanceText,
} from '../../lib/currency-role';
import { useLoadGeneration } from '../composables/use-load-generation';
import { loadLocalCurrencyRole, loadLocalCharacter } from '../../services/api';
import type {
  CurrencyRoleDetail, CurrencyRoleStar,
  CurrencyRoleRank, CharacterData,
} from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-role.css';

const route = useRoute();
const roleId = computed(() => String(route.params.id));
const data = ref<CurrencyRoleDetail | null>(null);
const loading = ref(true);
const error = ref('');

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

/** 跨星级合并技能：同名技能在各星级的参数集合并（构建逻辑见 lib/currency-role.ts） */
const mergedSkillGroups = computed(() => mergeSkillGroups(data.value?.stars));

/** 推荐装备：各星级数据一致，取当前选中星级，回退首个非空星级 */
const recommend = computed(() => resolveRecommend(data.value?.stars, star.value));
/** 推荐装备按行分组：前台一行、后台一行，每行内含首选/次选 */
const recommendRows = computed(() => buildRecommendRows(recommend.value));

/** 成长矩阵：跨星级全属性聚合（构建逻辑见 lib/currency-role.ts） */
const growthMatrix = computed(() => buildGrowthMatrix(data.value?.stars));

/* ─── 随从属性 #N 参数解析（#N → 常规模式角色技能 param_list） ─── */
/** 常规模式角色数据（随从 #N 引用解析用，懒加载） */
const charData = ref<CharacterData | null>(null);
const charDataFailed = ref(false);

/** 加载代：角色间快速导航时防止旧数据覆盖新数据（统一 useLoadGeneration 模式） */
const loadGen = useLoadGeneration();

async function load() {
  const gen = loadGen.begin();
  loading.value = true;
  error.value = '';
  charData.value = null;
  charDataFailed.value = false;
  try {
    data.value = await loadLocalCurrencyRole(roleId.value);
  } catch (e) {
    if (!loadGen.isCurrent(gen)) return;
    error.value = (e as Error).message || '加载失败';
  } finally {
    if (loadGen.isCurrent(gen)) loading.value = false;
  }
}
watch(roleId, load, { immediate: true });

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
  (d) => { if (d) document.title = `${d.name} - 咸鱼百科`; },
  { immediate: true },
);

/** 星魂机制效果：强化技能名映射表 + 文案（见 lib/currency-role.ts） */
const skillNameMap = computed(() => buildSkillNameMap(data.value?.stars));
function rankMechText(rk: CurrencyRoleRank): string {
  return rankMech(rk, skillNameMap.value);
}
function rankIconUrl(rk: CurrencyRoleRank): string {
  return rk.icon ? iconUrl(rk.icon) : '';
}

/* ─── Tab 面板切换（与角色/遗器详情页一致） ─── */
const TABS = [
  { key: 'stars', label: '成长' },
  { key: 'ranks', label: '后台星魂/光锥' },
  { key: 'equips', label: '装备' },
] as const;
type TabKey = typeof TABS[number]['key'];
const activeTab = ref<TabKey>('stars');
function setTab(key: TabKey) { activeTab.value = key; }
/** 切换角色时重置 Tab */
watch(roleId, () => { activeTab.value = 'stars'; });
/** 纯前台角色无后台星魂/光锥数据 */
const noRankData = computed(() =>
  !!data.value && !data.value.rank.length && !data.value.equipment.length,
);
function hideOnError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden';
}

/** 特质分类（头图羁绊图标分组，分类逻辑见 lib/currency-role.ts） */
const traitGroups = computed(() => groupTraits(data.value?.traits));
</script>

<template>
  <div class="nk-crole">

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="nk-crole__skeleton">
      <div class="nk-crole__skeleton-hero">
        <div class="nk-crole__skeleton-portrait nk-sk nk-sk--shimmer"></div>
        <div class="nk-crole__skeleton-info">
          <div class="nk-sk nk-sk--shimmer nk-sk--title" style="width: 50%"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width: 30%"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width: 70%"></div>
        </div>
      </div>
      <div class="nk-crole__skeleton-tabs">
        <div class="nk-sk nk-sk--shimmer nk-sk--chip" v-for="n in 3" :key="n" style="width: 56px"></div>
      </div>
      <div class="nk-crole__skeleton-grid">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md" v-for="n in 4" :key="n"></div>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="nk-crole__state nk-crole__state--err">
      <span class="nk-crole__state-icon">⚠</span>
      <p>{{ error }}</p>
      <button class="nk-crole__retry" @click="load">重试</button>
    </div>

    <template v-else-if="data">
      <!-- ═══ 沉浸式 Hero ═══ -->
      <header class="nk-crole-hero" :data-rarity="data.rarity">
        <div class="nk-crole-hero__bg" :style="{ backgroundImage: `url(${avatarDrawCardUrl(data.avatar_id || data.id)})` }"></div>
        <div class="nk-crole-hero__scrim"></div>
        <div class="nk-crole-hero__content">
          <div class="nk-crole-hero__portrait" :data-rarity="data.rarity">
            <img :src="avatarShopIconUrl(data.avatar_id || data.id)" :alt="data.name" loading="eager" @error="hideOnError" />
          </div>
          <div class="nk-crole-hero__info">
            <span class="nk-crole-hero__hud">GRID FIGHT · 货币战争</span>
            <h1 class="nk-crole-hero__name">{{ data.name }}</h1>
            <div class="nk-crole-hero__meta">
              <span class="nk-crole-hero__id">#{{ data.id }}</span>
              <span v-if="data.rarity >= 1" class="nk-crole-hero__stars">{{ data.rarity }}费</span>
            </div>
            <div class="nk-crole-hero__tags">
              <span v-if="data.front_back_type" class="nk-crole-chip nk-crole-chip--fb">{{ FB_LABEL[data.front_back_type] || data.front_back_type }}</span>
              <span v-for="c in data.charge_type" :key="c" class="nk-crole-chip nk-crole-chip--charge">{{ CHARGE_LABEL[c] || c }}</span>
              <span v-if="data.is_expert" class="nk-crole-chip nk-crole-chip--exp">专家</span>
              <span v-if="data.season_ids && data.season_ids.length" class="nk-crole-chip nk-crole-chip--season">赛季 {{ data.season_ids.join(' / ') }}</span>
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
        </div>
      </header>

      <!-- ═══ Tab 导航 ═══ -->
      <div class="nk-tabs">
        <div class="nk-tabs__bar">
          <div class="nk-tabs__left">
            <button
              v-for="t in TABS"
              :key="t.key"
              type="button"
              :class="['nk-tab', { 'nk-tab--active': activeTab === t.key }]"
              @click="setTab(t.key)"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>

      <div class="nk-panels">
      <!-- ═══ 后台星魂/光锥（时间线 + 专属装备） ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'ranks' }]" data-panel="ranks">
        <!-- 纯前台角色空状态提示 -->
        <div v-if="noRankData" class="nk-crole-empty">
          <span class="nk-crole-empty__icon">🎯</span>
          <p class="nk-crole-empty__text">该角色为<strong>纯前台</strong>定位，不参与后台作战，因此没有后台星魂与专属光锥。</p>
        </div>
        <template v-else>
        <h2 class="nk-crole-section__title">后台星魂</h2>
        <div class="nk-crole-timeline">
          <div v-for="rk in data.rank" :key="rk.rank_id" class="nk-crole-timeline__item">
            <div class="nk-crole-timeline__rail">
              <div class="nk-crole-timeline__icon">
                <img v-if="rankIconUrl(rk)" :src="rankIconUrl(rk)" :alt="rk.name" loading="lazy" @error="hideOnError" />
                <span v-else class="nk-crole-timeline__num">{{ rk.rank }}</span>
              </div>
              <div class="nk-crole-timeline__line"></div>
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
                  <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                  <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                </li>
                <li v-for="(p, pi) in rk.all_props" :key="'a' + pi">
                  <span class="nk-crole-layer__scope nk-crole-layer__scope--all">全员</span>
                  <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                  <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 专属光锥（后台专属装备） -->
        <template v-if="data.equipment.length">
          <h2 class="nk-crole-section__title">专属光锥</h2>
          <p class="nk-crole-section__hint">角色放置在后台时，拥有对应光锥可获得特殊加成。</p>
          <div class="nk-crole-equips">
            <div v-for="eq in data.equipment" :key="eq.level" class="nk-crole-equip">
              <div class="nk-crole-equip__lv">
                <span class="nk-crole-equip__lv-num">{{ eq.level }}</span>
                <span class="nk-crole-equip__lv-label">Lv</span>
              </div>
              <div class="nk-crole-equip__body">
                <p class="nk-crole-equip__desc" v-html="fmtDesc(eq.desc, eq.param_list)"></p>
                <ul v-if="eq.owner_props.length || eq.all_props.length" class="nk-crole-layer__props">
                  <li v-for="(p, pi) in eq.owner_props" :key="'o' + pi">
                    <span class="nk-crole-layer__scope">自身</span>
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                  <li v-for="(p, pi) in eq.all_props" :key="'a' + pi">
                    <span class="nk-crole-layer__scope nk-crole-layer__scope--all">全员</span>
                    <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                    <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
        </template>
      </div>

      <!-- ═══ 装备（推荐装备） ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'equips' }]" data-panel="equips">
        <!-- 推荐装备：前台一行、后台一行 -->
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
        <div v-if="!recommendRows.length" class="nk-crole-empty">暂无装备数据</div>
      </div>

      <!-- ═══ 星级详情（成长矩阵：原「成长总览」+「星级属性」合并） ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'stars' }]" data-panel="stars">
        <template v-if="growthMatrix.length">
          <div class="nk-crole-gm-head">
            <h2 class="nk-crole-section__title">成长总览</h2>
            <div class="nk-crole-gm-pills">
              <button
                v-for="k in starKeys"
                :key="k"
                type="button"
                class="nk-crole-gm-pill"
                :class="{ 'is-active': k === selectedStar }"
                @click="selectedStar = k"
              >{{ k }}★</button>
            </div>
          </div>

          <!-- 选中星级定位描述 -->
          <div v-if="star && (star.front_one_word_desc || star.back_one_word_desc)" :key="'ol' + selectedStar" class="nk-crole-oneliner nk-crole-star--in">
            <p v-if="star.front_one_word_desc"><b>前台</b>{{ star.front_one_word_desc }}</p>
            <p v-if="star.back_one_word_desc"><b>后台</b>{{ star.back_one_word_desc }}</p>
          </div>

          <!-- 属性矩阵：行=语义分组属性（含强度），列=星级，选中列高亮 + 增量标记 -->
          <div class="nk-crole-gm">
            <table class="nk-crole-gm__table">
              <thead>
                <tr>
                  <th class="nk-crole-gm__corner">属性</th>
                  <th
                    v-for="c in starKeys"
                    :key="c"
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
                    <th class="nk-crole-gm__label">{{ row.label }}</th>
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
          <p class="nk-crole-gm__hint">点击列头或顶部星级切换视角 · ▲ 表示较上一星级有变化</p>
        </template>

        <!-- 技能详情（跨星级合并，斜杠分隔多星级值） -->
        <template v-if="mergedSkillGroups.length">
          <h2 class="nk-crole-section__title">技能详情</h2>
          <!-- 随从属性（独立区块，不依赖随从技能组存在性） -->
          <div v-if="servantAttrs.length" class="nk-crole-servantattrs">
            <span v-for="a in servantAttrs" :key="a.label" class="nk-crole-servantattrs__item"><b>{{ a.label }}</b>{{ a.value }}</span>
          </div>
          <div v-for="grp in mergedSkillGroups" :key="grp.key" class="nk-crole-skillgroup">
            <h3 class="nk-crole-skillgroup__title">{{ grp.label }}</h3>
            <div class="nk-crole-skills">
              <div v-for="sk in grp.skills" :key="sk.key" class="nk-crole-skill">
                <div class="nk-crole-skill__head">
                  <span class="nk-crole-skill__name">{{ sk.name }}</span>
                  <span v-if="sk.tag" class="nk-crole-skill__tag">{{ sk.tag }}</span>
                  <span v-if="sk.type" class="nk-crole-skill__type">{{ sk.type }}</span>
                </div>
                <div class="nk-crole-skill__cost" v-if="sk.sp_base != null || sk.sp_need != null || (sk.bp_need != null && sk.bp_need > 0)">
                  <span v-if="sk.sp_base != null">SP {{ sk.sp_base }}</span>
                  <span v-if="sk.sp_need != null">能量 {{ sk.sp_need }}</span>
                  <span v-if="sk.bp_need != null && sk.bp_need > 0">BP {{ sk.bp_need }}<template v-if="sk.bp_add != null"> (+{{ sk.bp_add }})</template></span>
                </div>
                <p class="nk-crole-skill__simple">{{ sk.simple_desc }}</p>
                <div class="nk-crole-skill__desc" v-html="fmtDescMerged(sk.desc, sk.paramSets)"></div>
                <div v-if="stanceText(sk.show_stance_list)" class="nk-crole-skill__stance">韧性 {{ stanceText(sk.show_stance_list) }}</div>
                <ul v-if="sk.extraSets.length" class="nk-crole-skill__extra">
                  <li v-for="(ex, ek) in sk.extraSets" :key="ek">
                    <b>{{ ex.name }}：</b><span v-html="fmtDescMerged(ex.desc, ex.paramSets)"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </div>
      </div><!-- /.nk-panels -->
    </template>
  </div>
</template>
