<script setup lang="ts">
/**
 * 货币战争 · 角色详情页（v2 重构）
 * 数据：本地转换数据（public/data/cn/currency/role/<id>.json，由 converter 落地）
 * 展示：沉浸式头图 → 锚点导航 → 羁绊（层级进度）→ 后台星魂/光锥（时间线 + 专属光锥）→ 装备（推荐）→ 星级详情
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CDN } from '../../lib/constants';
import { fmtDesc, fmtDescMerged, avatarShopIconUrl, avatarDrawCardUrl, iconUrl } from '../../lib/format';
import { loadLocalCurrencyRole } from '../../services/api';
import type {
  CurrencyRoleDetail, CurrencyRoleStar, CurrencyRoleSkill,
  CurrencyRoleTrait, CurrencyRoleTraitLayer, CurrencyRoleRank,
  CurrencyRoleRecommend, CurrencyRoleRecommendItem,
} from '../../services/types';

const route = useRoute();
const roleId = computed(() => String(route.params.id));
const data = ref<CurrencyRoleDetail | null>(null);
const loading = ref(true);
const error = ref('');

const FB_LABEL: Record<string, string> = { Front: '前台', Back: '后台', Both: '前后台' };
const HEAL_LABEL: Record<string, string> = {
  Healer: '治疗', Shield: '护盾', Heal: '治疗', Damage: '输出',
};
const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '能量条', MaxSP: 'SP上限', MaxHP: '生命上限', SP: '战技点',
};
const SKILL_GROUP_LABEL: Record<string, string> = {
  front_show_skill: '前台技能',
  back_show_skill: '后台技能',
  servant_show_skill: '随从技能',
};

/* 属性修正 raw key → 友好中文名（货币战争专属 Extra* 字段） */
const PROP_LABEL: Record<string, string> = {
  ExtraAllDamageTypeAddedRatio4: '全伤害提高',
  ExtraAllDamageTypeAddedRatio1: '全伤害提高',
  ExtraAllDamageTypeAddedRatio5: '全伤害提高',
  ExtraInitSP: '初始战技点',
  ExtraHPAddedRatio1: '生命增幅',
  ExtraHPAddedRatio2: '生命增幅',
  ExtraSpeedAddedRatio1: '速度增幅',
  ExtraSpeedAddedRatio2: '速度增幅',
  ExtraAttackAddedRatio: '攻击增幅',
  ExtraDefenceAddedRatio: '防御增幅',
  ExtraCriticalChanceBase: '暴击率提高',
  ExtraCriticalDamageBase: '暴击伤害提高',
  ExtraBreakDamageAddedRatio: '击破特攻提高',
  ExtraHealRatioBase: '治疗量提高',
  ExtraHealAddedRatio: '治疗量提高',
  ExtraShieldRatioBase: '护盾量提高',
  ExtraShieldAddedRatio: '护盾量提高',
  ExtraLuckChance: '幸运触发率提高',
  ExtraLuckDamage: '幸运伤害提高',
  ExtraFrontPowerAddedRatio1: '前台强度提高',
  ExtraBackPowerAddedRatio1: '后台强度提高',
  ExtraDOTDamageAddedRatio1: '持续伤害提高',
  ExtraElementDamageAddedRatio1: '属性伤害提高',
  ExtraInsertDamageAddedRatio1: '追加攻击伤害提高',
  ExtraNormalDamageAddedRatio1: '普攻伤害提高',
  ExtraSkillDamageAddedRatio1: '战技伤害提高',
  ExtraUltraDamageAddedRatio1: '终结技伤害提高',
  SpeedAddedRatio: '速度增幅',
  AttackAddedRatio: '攻击增幅',
  DefenceAddedRatio: '防御增幅',
  HPAddedRatio: '生命增幅',
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

/** 跨星级合并技能：同名技能在各星级的参数集合并，描述以斜杠分隔多星级值 */
interface MergedSkill {
  key: string;
  name: string;
  type: string | null;
  tag: string | null;
  desc: string;
  simple_desc: string;
  sp_base: number | null;
  bp_need: number | null;
  bp_add: number | null;
  show_stance_list: number[] | null;
  paramSets: number[][];
  extraSets: Array<{ name: string; desc: string; paramSets: number[][] }>;
}
const mergedSkillGroups = computed(() => {
  const stars = data.value?.stars;
  if (!stars) return [];
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  const GROUPS = ['front_show_skill', 'back_show_skill', 'servant_show_skill'] as const;
  const out: Array<{ key: string; label: string; skills: MergedSkill[] }> = [];
  for (const g of GROUPS) {
    // 以名称为键收集各星级的同名技能（按星级顺序）
    const byName = new Map<string, CurrencyRoleSkill[]>();
    for (const c of cols) {
      for (const sk of (stars[c]?.[g] || [])) {
        const k = sk.name || `#${sk.id}`;
        if (!byName.has(k)) byName.set(k, []);
        byName.get(k)!.push(sk);
      }
    }
    if (!byName.size) continue;
    const skills: MergedSkill[] = [];
    for (const [name, list] of byName) {
      const first = list[0];
      const paramSets = list.map((sk) => {
        const lv = sk.level && sk.level['1'];
        return lv ? lv.param_list : [];
      });
      // 附加条件（触发条件）同样跨星级合并
      const extraSets: MergedSkill['extraSets'] = [];
      const exKeys = new Set<string>();
      list.forEach((sk) => Object.keys(sk.extra || {}).forEach((ek) => exKeys.add(ek)));
      for (const ek of exKeys) {
        const exList = list.map((sk) => (sk.extra || {})[ek]).filter(Boolean);
        if (!exList.length) continue;
        extraSets.push({
          name: exList[0].name,
          desc: exList[0].desc,
          paramSets: exList.map((ex) => ex.param || []),
        });
      }
      skills.push({
        key: `${g}-${name}`,
        name,
        type: first.type,
        tag: first.tag,
        desc: first.desc,
        simple_desc: first.simple_desc,
        sp_base: first.sp_base,
        bp_need: first.bp_need,
        bp_add: first.bp_add,
        show_stance_list: first.show_stance_list,
        paramSets,
        extraSets,
      });
    }
    out.push({ key: g, label: SKILL_GROUP_LABEL[g], skills });
  }
  return out;
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
  push('后台速度改写', s.back_speed_rewrite);
  push('后台速度加成', s.back_speed_added_ratio);
  push('后台能量条', s.back_energy_bar);
  push('后台能量上限', s.back_max_sp);
  push('后台初始能量', s.back_initial_sp);
  push('后台初始能量条', s.back_initial_energy_bar);
  return rows;
});

const miscStats = computed(() => {
  const s = star.value;
  if (!s) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const pct = (v: number) => (Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v));
  if (s.luck_chance != null) rows.push({ label: '幸运触发率', value: pct(s.luck_chance) });
  if (s.luck_damage != null) rows.push({ label: '幸运伤害倍率', value: `${s.luck_damage}×` });
  if (s.extra_heal_base != null) rows.push({ label: '基础治疗强度', value: String(s.extra_heal_base) });
  if (s.extra_shield_base != null) rows.push({ label: '基础护盾强度', value: String(s.extra_shield_base) });
  return rows;
});

/** 推荐装备：各星级数据一致，取当前选中星级，回退首个非空星级 */
const recommend = computed<CurrencyRoleRecommend | null>(() => {
  const stars = data.value?.stars;
  if (!stars) return null;
  if (star.value?.recommend) return star.value.recommend;
  for (const k of Object.keys(stars)) {
    const r = stars[k]?.recommend;
    if (r) return r;
  }
  return null;
});
/** 推荐装备按行分组：前台一行、后台一行，每行内含首选/次选 */
const recommendRows = computed(() => {
  const rec = recommend.value;
  if (!rec) return [];
  const rows: Array<{ pos: string; groups: Array<{ priority: string; items: CurrencyRoleRecommendItem[] }> }> = [];
  const POS: Array<[keyof CurrencyRoleRecommend, string]> = [['front', '前台'], ['back', '后台']];
  for (const [key, posLabel] of POS) {
    const node = rec[key];
    if (!node) continue;
    const groups: Array<{ priority: string; items: CurrencyRoleRecommendItem[] }> = [];
    if (node.first?.length) groups.push({ priority: '首选', items: node.first });
    if (node.second?.length) groups.push({ priority: '次选', items: node.second });
    if (groups.length) rows.push({ pos: posLabel, groups });
  }
  return rows;
});

/** 角色信息详情汇总表：跨星级聚合 6 项核心指标（对齐官方 Wiki 表格） */
const statSummary = computed(() => {
  const stars = data.value?.stars;
  if (!stars) return null;
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  if (!cols.length) return null;
  const pct = (v: number | null | undefined) =>
    v == null ? '—' : (Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v));
  const num = (v: number | null | undefined) => (v == null ? '—' : String(v));
  const propOf = (s: CurrencyRoleStar | undefined, key: string): number | null => {
    const list = s?.general_property_modify_list;
    if (!Array.isArray(list)) return null;
    const hit = list.find((m) => m && (m as Record<string, unknown>).property_type === key);
    return hit ? Number((hit as Record<string, unknown>).value) : null;
  };
  const rows: Array<{ label: string; values: string[] }> = [
    { label: '生命增幅', values: cols.map((c) => pct(propOf(stars[c], 'ExtraHPAddedRatio2'))) },
    { label: '基础前台强度', values: cols.map((c) => num(stars[c]?.front_power_base)) },
    { label: '基础后台强度', values: cols.map((c) => num(stars[c]?.back_power_base)) },
    { label: '速度增幅', values: cols.map((c) => pct(propOf(stars[c], 'ExtraSpeedAddedRatio2'))) },
    { label: '基础治疗强度', values: cols.map((c) => num(stars[c]?.extra_heal_base)) },
    { label: '基础护盾强度', values: cols.map((c) => num(stars[c]?.extra_shield_base)) },
  ];
  return { cols, rows };
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
  (d) => { if (d) document.title = `${d.name} - HSR Wiki`; },
  { immediate: true },
);

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
/** 后台星魂描述：用 param_list 渲染 */
function rankDesc(rk: CurrencyRoleRank): string {
  if (rk.param_list && rk.param_list.length) return fmtDesc(rk.desc, rk.param_list);
  return fmtDesc(rk.desc).replace(/#\d+\[i\]/g, '');
}
function rankIconUrl(rk: CurrencyRoleRank): string {
  return rk.icon ? iconUrl(rk.icon) : '';
}
/** 推荐装备图标：从 icon 路径提取 ID，拼接 gridfight CDN 路径 */
function equipIconUrl(icon: string, id: number): string {
  if (icon) {
    const name = icon.includes('/') ? icon.split('/').pop()! : icon;
    return `${CDN}/assets/hsr/gridfight/equipment/${name.replace('.png', '.webp')}`;
  }
  return `${CDN}/assets/hsr/gridfight/equipment/${id}.webp`;
}
const QUALITY_LABEL: Record<string, string> = { Silver: '银', Gold: '金', Multicolor: '彩' };

/* ─── Tab 面板切换（与角色/遗器详情页一致） ─── */
const TABS = [
  { key: 'traits', label: '羁绊' },
  { key: 'ranks', label: '后台星魂/光锥' },
  { key: 'equips', label: '装备' },
  { key: 'stars', label: '星级' },
] as const;
type TabKey = typeof TABS[number]['key'];
const activeTab = ref<TabKey>('traits');
function setTab(key: TabKey) { activeTab.value = key; }
/** 切换角色时重置 Tab */
watch(roleId, () => { activeTab.value = 'traits'; });
/** 纯前台角色无后台星魂/光锥数据 */
const noRankData = computed(() =>
  !!data.value && !data.value.rank.length && !data.value.equipment.length,
);
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
              <span v-if="data.rarity >= 1" class="nk-crole-hero__stars">{{ data.rarity }}费</span>
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
                        <img :src="equipIconUrl(eq.icon, eq.id)" :alt="eq.name || ''" loading="lazy" @error="hideOnError" />
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

      <!-- ═══ 星级详情 ═══ -->
      <div :class="['nk-panel', { 'nk-panel--active': activeTab === 'stars' }]" data-panel="stars">
        <!-- 角色信息详情汇总表（跨星级） -->
        <template v-if="statSummary">
          <h2 class="nk-crole-section__title">角色信息详情</h2>
          <div class="nk-crole-summary">
            <table class="nk-crole-summary__table">
              <thead>
                <tr>
                  <th class="nk-crole-summary__corner"></th>
                  <th v-for="c in statSummary.cols" :key="c" class="nk-crole-summary__star">{{ c }}★</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statSummary.rows" :key="row.label">
                  <th class="nk-crole-summary__label">{{ row.label }}</th>
                  <td v-for="(v, vi) in row.values" :key="vi" class="nk-crole-summary__val">{{ v }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- 技能详情（跨星级合并，斜杠分隔多星级值） -->
        <template v-if="mergedSkillGroups.length">
          <h2 class="nk-crole-section__title">技能详情</h2>
          <div v-for="grp in mergedSkillGroups" :key="grp.key" class="nk-crole-skillgroup">
            <h3 class="nk-crole-skillgroup__title">{{ grp.label }}</h3>
            <div class="nk-crole-skills">
              <div v-for="sk in grp.skills" :key="sk.key" class="nk-crole-skill">
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
            <p v-if="star.front_one_word_desc"><b>前台</b>{{ star.front_one_word_desc }}</p>
            <p v-if="star.back_one_word_desc"><b>后台</b>{{ star.back_one_word_desc }}</p>
          </div>

          <!-- 基础强度 -->
          <div class="nk-crole-powrow">
            <div v-if="star.front_power_base != null" class="nk-crole-pow">
              <span class="nk-crole-pow__k">基础前台强度</span><span class="nk-crole-pow__v">{{ star.front_power_base }}</span>
            </div>
            <div v-if="star.back_power_base != null" class="nk-crole-pow">
              <span class="nk-crole-pow__k">基础后台强度</span><span class="nk-crole-pow__v">{{ star.back_power_base }}</span>
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

          <!-- 后台属性 -->
          <div v-if="backStats.length" class="nk-crole-block">
            <h3 class="nk-crole-block__title">后台属性</h3>
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
