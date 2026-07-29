<script setup lang="ts">
/**
 * 货币战争 · 角色详情页
 * 数据：本地转换数据（public/data/cn/currency/role/<id>.json，由 converter 落地）
 * 展示：基础定位、羁绊（特质）、各星级技能 / 属性 / 战力等。
 */
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CDN } from '../../lib/constants';
import { fmtDesc, avatarShopIconUrl, avatarDrawCardUrl } from '../../lib/format';
import {
  loadLocalCurrencyRole,
  type CurrencyRoleDetail, type CurrencyRoleStar, type CurrencyRoleSkill, type CurrencyRoleTrait,
} from '../../services/api';

const route = useRoute();
const router = useRouter();
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
function traitDesc(desc: string): string {
  return fmtDesc(desc).replace(/#\d+\[i\]/g, '');
}
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
    <div class="nk-crole__topbar">
      <button class="nk-crole__back" @click="router.push('/currency/role')">← 角色图鉴</button>
    </div>

    <div v-if="loading" class="nk-crole__state">加载中…</div>
    <div v-else-if="error" class="nk-crole__state nk-crole__state--err">{{ error }}</div>

    <template v-else-if="data">
      <!-- 头部 -->
      <header class="nk-crole-hero" :style="{ '--draw': `url(${avatarDrawCardUrl(data.id)})` }">
        <div class="nk-crole-hero__portrait">
          <img :src="avatarShopIconUrl(data.id)" :alt="data.name" loading="lazy" @error="hideOnError" />
        </div>
        <div class="nk-crole-hero__info">
          <h1 class="nk-crole-hero__name">{{ data.name }}</h1>
          <div class="nk-crole-hero__sub">
            <span class="nk-crole-id">ID {{ data.id }}</span>
            <span v-if="data.rarity >= 1 && data.rarity <= 6" class="nk-crole-stars">★{{ '★'.repeat(data.rarity - 1) }}</span>
            <span v-else class="nk-crole-stars">{{ data.rarity }}</span>
          </div>
          <!-- 基础标签 -->
          <div class="nk-crole-hero__tags">
            <span v-if="data.front_back_type" class="nk-crole-chip nk-crole-chip--fb">{{ FB_LABEL[data.front_back_type] || data.front_back_type }}</span>
            <span v-if="data.heal_or_shield_display" class="nk-crole-chip nk-crole-chip--heal">{{ HEAL_LABEL[data.heal_or_shield_display] || data.heal_or_shield_display }}</span>
            <span v-for="c in data.charge_type" :key="c" class="nk-crole-chip nk-crole-chip--charge">{{ CHARGE_LABEL[c] || c }}</span>
            <span v-if="data.is_expert" class="nk-crole-chip nk-crole-chip--exp">专家</span>
          </div>
          <!-- 特质标签（按分类分组） -->
          <div v-if="traitGroups.length" class="nk-crole-hero__traits">
            <div v-for="grp in traitGroups" :key="grp.cat" class="nk-crole-traitgrp">
              <span class="nk-crole-traitgrp__dot" :class="`nk-crole-traitgrp__dot--${grp.cat}`"></span>
              <span
                v-for="tr in grp.items"
                :key="tr.id"
                class="nk-crole-traitchip"
                :class="`nk-crole-traitchip--${grp.cat}`"
              >{{ tr.name || '?' }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 羁绊 -->
      <section v-if="data.traits.length" class="nk-crole-section">
        <h2 class="nk-crole-section__title">羁绊</h2>
        <div class="nk-crole-traits">
          <div v-for="t in data.traits" :key="t.id" class="nk-crole-trait">
            <div class="nk-crole-trait__icon">
              <img v-if="traitIconUrl(t)" :src="traitIconUrl(t)" :alt="t.name || ''" loading="lazy" @error="hideOnError" />
            </div>
            <div class="nk-crole-trait__body">
              <div class="nk-crole-trait__name">{{ t.name }}</div>
              <div v-if="t.activation_type" class="nk-crole-trait__act">触发：{{ t.activation_type }}</div>
              <div class="nk-crole-trait__desc" v-html="traitDesc(t.desc)"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 星级切换 -->
      <section class="nk-crole-section">
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

        <div v-if="star" class="nk-crole-star">
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
                    <b>{{ ex.name }}：</b>{{ ex.desc }}
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
                <span class="nk-crole-props__name">{{ (m.name as string) || (m.property_type as string) || '属性' }}</span>
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
      </section>
    </template>
  </div>
</template>
