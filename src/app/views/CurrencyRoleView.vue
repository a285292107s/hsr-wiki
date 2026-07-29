<script setup lang="ts">
/**
 * 货币战争 · 角色详情页（v2 重构）
 * 数据：本地转换数据（public/data/cn/currency/role/<id>.json，由 converter 落地）
 * 展示：沉浸式头图 → 锚点导航 → 羁绊（层级进度）→ 命座（时间线）→ 装备（等级递进）→ 星级详情
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CDN } from '../../lib/constants';
import { fmtDesc, avatarShopIconUrl, avatarDrawCardUrl, iconUrl } from '../../lib/format';
import { loadLocalCurrencyRole } from '../../services/api';
import type {
  CurrencyRoleDetail, CurrencyRoleStar, CurrencyRoleSkill,
  CurrencyRoleTrait, CurrencyRoleTraitLayer, CurrencyRoleRank,
} from '../../services/types';

const route = useRoute();
const roleId = computed(() => String(route.params.id));
const data = ref<CurrencyRoleDetail | null>(null);
const loading = ref(true);
const error = ref('');

const FB_LABEL: Record<string, string> = { Front: '前排', Back: '后排', Both: '前后台' };
const HEAL_LABEL: Record<string, string> = {
  Healer: '治疗', Shield: '护盾', Heal: '治疗', Damage: '输出',
};
const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '能量条', MaxSP: 'SP上限', MaxHP: '生命上限', SP: '战技点',
};
const SKILL_GROUP_LABEL: Record<string, string> = {
  front_show_skill: '前排技能',
  back_show_skill: '后排技能',
  servant_show_skill: '随从技能',
};

/* 属性修正 raw key → 友好中文名（货币战争专属 Extra* 字段） */
const PROP_LABEL: Record<string, string> = {
  ExtraAllDamageTypeAddedRatio4: '全伤害提高',
  ExtraAllDamageTypeAddedRatio1: '全伤害提高',
  ExtraAllDamageTypeAddedRatio5: '全伤害提高',
  ExtraInitSP: '初始战技点',
  ExtraHPAddedRatio1: '生命值提高',
  ExtraHPAddedRatio2: '生命值提高',
  ExtraSpeedAddedRatio1: '速度提高',
  ExtraSpeedAddedRatio2: '速度提高',
  ExtraAttackAddedRatio: '攻击力提高',
  ExtraDefenceAddedRatio: '防御力提高',
  ExtraCriticalChanceBase: '暴击率提高',
  ExtraCriticalDamageBase: '暴击伤害提高',
  ExtraBreakDamageAddedRatio: '击破特攻提高',
  ExtraHealRatioBase: '治疗量提高',
  ExtraHealAddedRatio: '治疗量提高',
  ExtraShieldRatioBase: '护盾量提高',
  ExtraShieldAddedRatio: '护盾量提高',
  ExtraLuckChance: '幸运触发率提高',
  ExtraLuckDamage: '幸运伤害提高',
  ExtraFrontPowerAddedRatio1: '前排战力提高',
  ExtraBackPowerAddedRatio1: '后排战力提高',
  ExtraDOTDamageAddedRatio1: '持续伤害提高',
  ExtraElementDamageAddedRatio1: '属性伤害提高',
  ExtraInsertDamageAddedRatio1: '追加攻击伤害提高',
  ExtraNormalDamageAddedRatio1: '普攻伤害提高',
  ExtraSkillDamageAddedRatio1: '战技伤害提高',
  ExtraUltraDamageAddedRatio1: '终结技伤害提高',
  SpeedAddedRatio: '速度提高',
  AttackAddedRatio: '攻击力提高',
  DefenceAddedRatio: '防御力提高',
  HPAddedRatio: '生命值提高',
};
function propLabel(m: Record<string, unknown>): string {
  const key = String(m.property_type || m.name || '');
  return PROP_LABEL[key] || key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
}
/** 属性值格式化：绝对值 < 1 视为比率转百分比 */
function propValue(v: number): string {
  return Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v);
}

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

const skillGroups = computed(() => {
  const s = star.value;
  if (!s) return [];
  return (['front_show_skill', 'back_show_skill', 'servant_show_skill'] as const)
    .filter((g) => (s[g] || []).length > 0)
    .map((g) => ({ key: g, label: SKILL_GROUP_LABEL[g], skills: s[g] }));
});

const propertyMods = computed(() => {
  const list = star.value?.general_property_modify_list;
  if (!Array.isArray(list)) return [];
  return list.filter((x) => x && typeof x === 'object') as Array<Record<string, unknown>>;
});

const backStats = computed(() => {
  const s = star.value;
  if (!s) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, v: number | null) => { if (v != null) rows.push({ label, value: String(v) }); };
  push('后排速度改写', s.back_speed_rewrite);
  push('后排速度加成', s.back_speed_added_ratio);
  push('后排能量条', s.back_energy_bar);
  push('后排能量上限', s.back_max_sp);
  push('后排初始能量', s.back_initial_sp);
  push('后排初始能量条', s.back_initial_energy_bar);
  return rows;
});

const miscStats = computed(() => {
  const s = star.value;
  if (!s) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const pct = (v: number) => (Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v));
  if (s.luck_chance != null) rows.push({ label: '幸运触发率', value: pct(s.luck_chance) });
  if (s.luck_damage != null) rows.push({ label: '幸运伤害倍率', value: `${s.luck_damage}×` });
  if (s.extra_heal_base != null) rows.push({ label: '额外治疗基础', value: String(s.extra_heal_base) });
  if (s.extra_shield_base != null) rows.push({ label: '额外护盾基础', value: String(s.extra_shield_base) });
  return rows;
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    data.value = await loadLocalCurrencyRole(roleId.value);
  } catch (e) {
    error.value = (e as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}
watch(roleId, load, { immediate: true });

watch(
  data,
  (d) => { if (d) document.title = `${d.name} · 货币战争角色图鉴`; },
  { immediate: true },
);

function maxParams(skill: CurrencyRoleSkill): number[] | undefined {
  if (!skill.level) return undefined;
  const ks = Object.keys(skill.level).map(Number).sort((a, b) => a - b);
  const top = ks[ks.length - 1];
  return top != null ? skill.level[String(top)].param_list : undefined;
}
function skillDesc(skill: CurrencyRoleSkill): string {
  return fmtDesc(skill.desc, maxParams(skill));
}
/** 羁绊描述：用 desc_params 渲染占位符（无参数时回退剥离占位符） */
function traitDesc(t: CurrencyRoleTrait): string {
  if (t.desc_params && t.desc_params.length) return fmtDesc(t.desc, t.desc_params);
  return fmtDesc(t.desc).replace(/#\d+\[i\]/g, '');
}
/** 羁绊层级效果描述：用层级 params 渲染 */
function layerDesc(ly: CurrencyRoleTraitLayer): string {
  if (ly.params && ly.params.length) return fmtDesc(ly.desc, ly.params);
  return fmtDesc(ly.desc).replace(/#\d+\[i\]/g, '');
}
/** 命座描述：用 param_list 渲染 */
function rankDesc(rk: CurrencyRoleRank): string {
  if (rk.param_list && rk.param_list.length) return fmtDesc(rk.desc, rk.param_list);
  return fmtDesc(rk.desc).replace(/#\d+\[i\]/g, '');
}
function rankIconUrl(rk: CurrencyRoleRank): string {
  return rk.icon ? iconUrl(rk.icon) : '';
}
const QUALITY_LABEL: Record<string, string> = { Silver: '银', Gold: '金', Multicolor: '彩' };

/* ─── Tab 面板切换（与角色/遗器详情页一致） ─── */
const TABS = [
  { key: 'traits', label: '羁绊' },
  { key: 'ranks', label: '命座' },
  { key: 'equips', label: '装备' },
  { key: 'stars', label: '星级' },
] as const;
type TabKey = typeof TABS[number]['key'];
const activeTab = ref<TabKey>('traits');
function setTab(key: TabKey) { activeTab.value = key; }
function traitIconUrl(t: CurrencyRoleTrait): string {
  return `${CDN}/assets/hsr/gridfight/icon/${t.id}.webp`;
}
function hideOnError(e: Event) {
  (e.target as HTMLImageElement).style.visibility = 'hidden';
}
function stanceText(list: number[] | null): string {
  if (!list || list.every((v) => !v)) return '';
  return list.join(' / ');
}

/* ─── 特质分类 ─── */
const ACTIVATION_LABEL: Record<string, string> = {
  GreaterEqualThan: '数量达标',
  Equal: '数量相等',
  LessThan: '数量少于',
};
const TRAIT_CATEGORY = {
  faction: { label: '阵营', css: '--faction', range: [1000, 2000] as [number, number] },
  combat:  { label: '战斗', css: '--combat',  range: [2000, 3000] as [number, number] },
  special: { label: '特殊', css: '--special', range: [3000, 4000] as [number, number] },
} as const;
type TraitCat = keyof typeof TRAIT_CATEGORY;
function catOfTrait(id: number): TraitCat {
  for (const [key, cfg] of Object.entries(TRAIT_CATEGORY)) {
    if (id >= cfg.range[0] && id < cfg.range[1]) return key as TraitCat;
  }
  return 'special';
}
const traitGroups = computed(() => {
  const t = data.value?.traits;
  if (!t || t.length === 0) return [];
  const groups: Array<{ cat: TraitCat; items: typeof t }> = [];
  for (const cat of Object.keys(TRAIT_CATEGORY) as TraitCat[]) {
    const items = t.filter((tr) => catOfTrait(tr.id) === cat);
    if (items.length) groups.push({ cat, items });
  }
  return groups;
});
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
        <div class="nk-sk nk-sk--shimmer nk-sk--chip" v-for="n in 4" :key="n" style="width: 56px"></div>
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
        <div class="nk-crole-hero__bg" :style="{ backgroundImage: `url(${avatarDrawCardUrl(data.id)})` }"></div>
        <div class="nk-crole-hero__scrim"></div>
        <div class="nk-crole-hero__content">
          <div class="nk-crole-hero__portrait" :data-rarity="data.rarity">
            <img :src="avatarShopIconUrl(data.id)" :alt="data.name" loading="eager" @error="hideOnError" />
          </div>
          <div class="nk-crole-hero__info">
            <span class="nk-crole-hero__hud">GRID FIGHT · 货币战争</span>
            <h1 class="nk-crole-hero__name">{{ data.name }}</h1>
            <div class="nk-crole-hero__meta">
              <span class="nk-crole-hero__id">#{{ data.id }}</span>
              <span v-if="data.rarity >= 1 && data.rarity <= 6" class="nk-crole-hero__stars">{{ '★'.repeat(data.rarity) }}</span>
            </div>
            <div class="nk-crole-hero__tags">
              <span v-if="data.front_back_type" class="nk-crole-chip nk-crole-chip--fb">{{ FB_LABEL[data.front_back_type] || data.front_back_type }}</span>
              <span v-if="data.heal_or_shield_display" class="nk-crole-chip nk-crole-chip--heal">{{ HEAL_LABEL[data.heal_or_shield_display] || data.heal_or_shield_display }}</span>
              <span v-for="c in data.charge_type" :key="c" class="nk-crole-chip nk-crole-chip--charge">{{ CHARGE_LABEL[c] || c }}</span>
              <span v-if="data.is_expert" class="nk-crole-chip nk-crole-chip--exp">专家</span>
            </div>
            <div v-if="traitGroups.length" class="nk-crole-hero__traits">
              <div v-for="grp in traitGroups" :key="grp.cat" class="nk-crole-traitgrp">
                <span class="nk-crole-traitgrp__dot" :class="`nk-crole-traitgrp__dot--${grp.cat}`"></span>
                <span v-for="tr in grp.items" :key="tr.id" class="nk-crole-traitchip" :class="`nk-crole-traitchip--${grp.cat}`">{{ tr.name || '?' }}</span>
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
      <!-- ═══ 羁绊 ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'traits' }]" data-panel="traits">
        <h2 class="nk-crole-section__title">羁绊</h2>
        <div class="nk-crole-traits">
          <article v-for="t in data.traits" :key="t.id" class="nk-crole-trait" :data-cat="catOfTrait(t.id)">
            <div class="nk-crole-trait__header">
              <div class="nk-crole-trait__icon">
                <img :src="traitIconUrl(t)" :alt="t.name || ''" loading="lazy" @error="hideOnError" />
              </div>
              <div class="nk-crole-trait__heading">
                <h3 class="nk-crole-trait__name">{{ t.name }}</h3>
                <span class="nk-crole-trait__cat" :class="`nk-crole-trait__cat--${catOfTrait(t.id)}`">{{ TRAIT_CATEGORY[catOfTrait(t.id)].label }}</span>
              </div>
              <span v-if="t.activation_type" class="nk-crole-trait__act">{{ ACTIVATION_LABEL[t.activation_type] || t.activation_type }}</span>
            </div>
            <p class="nk-crole-trait__desc" v-html="traitDesc(t)"></p>
            <!-- 层级进度 -->
            <div v-if="t.layers && t.layers.length" class="nk-crole-layers">
              <div class="nk-crole-layers__track">
                <div
                  v-for="ly in t.layers"
                  :key="ly.layer"
                  class="nk-crole-layers__node"
                  :class="ly.quality ? `nk-crole-layers__node--${ly.quality.toLowerCase()}` : ''"
                >
                  <span class="nk-crole-layers__dot"></span>
                  <span class="nk-crole-layers__label">{{ ly.layer }}人</span>
                  <span v-if="ly.quality" class="nk-crole-layers__quality">{{ QUALITY_LABEL[ly.quality] || ly.quality }}</span>
                </div>
              </div>
              <div class="nk-crole-layers__details">
                <div
                  v-for="ly in t.layers"
                  :key="ly.layer"
                  class="nk-crole-layer"
                  :class="ly.quality ? `nk-crole-layer--${ly.quality.toLowerCase()}` : ''"
                >
                  <div class="nk-crole-layer__head">
                    <span class="nk-crole-layer__threshold">{{ ly.layer }}人</span>
                    <span v-if="ly.quality" class="nk-crole-layer__quality">{{ QUALITY_LABEL[ly.quality] || ly.quality }}</span>
                  </div>
                  <div v-if="ly.desc" class="nk-crole-layer__desc" v-html="layerDesc(ly)"></div>
                  <ul v-if="ly.member_props.length || ly.all_props.length" class="nk-crole-layer__props">
                    <li v-for="(p, pi) in ly.member_props" :key="'m' + pi">
                      <span class="nk-crole-layer__scope">成员</span>
                      <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                      <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                    </li>
                    <li v-for="(p, pi) in ly.all_props" :key="'a' + pi">
                      <span class="nk-crole-layer__scope nk-crole-layer__scope--all">全员</span>
                      <span class="nk-crole-layer__pname">{{ propLabel(p) }}</span>
                      <b class="nk-crole-layer__pval">+{{ propValue(p.value) }}</b>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- ═══ 命座（时间线） ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'ranks' }]" data-panel="ranks">
        <h2 class="nk-crole-section__title">命座</h2>
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
      </div>

      <!-- ═══ 专属装备（等级递进） ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'equips' }]" data-panel="equips">
        <h2 class="nk-crole-section__title">专属装备</h2>
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
      </div>

      <!-- ═══ 星级详情 ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'stars' }]" data-panel="stars">
        <h2 class="nk-crole-section__title">星级详情</h2>
        <div class="nk-crole-stars-tabs">
          <button
            v-for="k in starKeys"
            :key="k"
            class="nk-crole-star-tab"
            :class="{ 'is-active': k === selectedStar }"
            @click="selectedStar = k"
          >{{ k }}★</button>
        </div>

        <div v-if="star" :key="selectedStar" class="nk-crole-star nk-crole-star--in">
          <!-- 一句话描述 -->
          <div v-if="star.front_one_word_desc || star.back_one_word_desc" class="nk-crole-oneliner">
            <p v-if="star.front_one_word_desc"><b>前排</b>{{ star.front_one_word_desc }}</p>
            <p v-if="star.back_one_word_desc"><b>后排</b>{{ star.back_one_word_desc }}</p>
          </div>

          <!-- 战力 -->
          <div class="nk-crole-powrow">
            <div v-if="star.front_power_base != null" class="nk-crole-pow">
              <span class="nk-crole-pow__k">前排战力</span><span class="nk-crole-pow__v">{{ star.front_power_base }}</span>
            </div>
            <div v-if="star.back_power_base != null" class="nk-crole-pow">
              <span class="nk-crole-pow__k">后排战力</span><span class="nk-crole-pow__v">{{ star.back_power_base }}</span>
            </div>
          </div>

          <!-- 技能 -->
          <div v-for="grp in skillGroups" :key="grp.key" class="nk-crole-skillgroup">
            <h3 class="nk-crole-skillgroup__title">{{ grp.label }}</h3>
            <div class="nk-crole-skills">
              <div v-for="sk in grp.skills" :key="sk.id" class="nk-crole-skill">
                <div class="nk-crole-skill__head">
                  <span class="nk-crole-skill__name">{{ sk.name }}</span>
                  <span v-if="sk.tag" class="nk-crole-skill__tag">{{ sk.tag }}</span>
                  <span v-if="sk.type" class="nk-crole-skill__type">{{ sk.type }}</span>
                </div>
                <div class="nk-crole-skill__cost" v-if="sk.sp_base != null || sk.bp_need != null">
                  <span v-if="sk.sp_base != null">SP {{ sk.sp_base }}</span>
                  <span v-if="sk.bp_need != null">BP {{ sk.bp_need }}<template v-if="sk.bp_add != null"> (+{{ sk.bp_add }})</template></span>
                </div>
                <p class="nk-crole-skill__simple">{{ sk.simple_desc }}</p>
                <div class="nk-crole-skill__desc" v-html="skillDesc(sk)"></div>
                <div v-if="stanceText(sk.show_stance_list)" class="nk-crole-skill__stance">韧性 {{ stanceText(sk.show_stance_list) }}</div>
                <ul v-if="sk.extra" class="nk-crole-skill__extra">
                  <li v-for="(ex, ek) in sk.extra" :key="ek">
                    <b>{{ ex.name }}：</b><span v-html="fmtDesc(ex.desc, ex.param)"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 属性修正 -->
          <div v-if="propertyMods.length" class="nk-crole-block">
            <h3 class="nk-crole-block__title">属性修正</h3>
            <ul class="nk-crole-props">
              <li v-for="(m, i) in propertyMods" :key="i">
                <span class="nk-crole-props__name">{{ propLabel(m) }}</span>
                <span class="nk-crole-props__val">{{ (m.value as number) < 1 ? `${((m.value as number) * 100).toFixed(1)}%` : m.value }}</span>
              </li>
            </ul>
          </div>

          <!-- 后排属性 -->
          <div v-if="backStats.length" class="nk-crole-block">
            <h3 class="nk-crole-block__title">后排属性</h3>
            <ul class="nk-crole-kv">
              <li v-for="row in backStats" :key="row.label"><span>{{ row.label }}</span><b>{{ row.value }}</b></li>
            </ul>
          </div>

          <!-- 幸运 / 治疗 / 护盾 -->
          <div v-if="miscStats.length" class="nk-crole-block">
            <h3 class="nk-crole-block__title">其它</h3>
            <ul class="nk-crole-kv">
              <li v-for="row in miscStats" :key="row.label"><span>{{ row.label }}</span><b>{{ row.value }}</b></li>
            </ul>
          </div>
        </div>
      </div>
      </div><!-- /.nk-panels -->
    </template>
  </div>
</template>
