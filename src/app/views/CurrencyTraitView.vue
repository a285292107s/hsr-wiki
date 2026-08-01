<script setup lang="ts">
/**
 * 货币战争 · 羁绊详情页
 * 数据：从 traits.json 按 ID 查找（共享单例缓存）
 * 展示：沉浸式头部 → 完整描述 → 备注机制 → 层级进度（含属性表）
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fmtDesc, gridFightTraitIconUrl } from '../../lib/format';
import { loadLocalCurrencyTraits } from '../../services/api';
import type { CurrencyTraitEntry } from '../../services/types';

const route = useRoute();
const traitId = computed(() => String(route.params.id));
const data = ref<CurrencyTraitEntry | null>(null);
const loading = ref(true);
const error = ref('');

const CAT_LABEL: Record<string, string> = {
  faction: '阵营', combat: '流派', special: '特殊',
};
const ACTIVATION_LABEL: Record<string, string> = {
  GreaterEqualThan: '≥ 人数激活', Equal: '= 人数激活', LessThan: '< 人数激活',
};
const QUALITY_LABEL: Record<string, string> = {
  Silver: '银', Gold: '金', Multicolor: '彩', Unique: '独特',
};
const QUALITY_CSS: Record<string, string> = {
  Silver: 'silver', Gold: 'gold', Multicolor: 'multicolor', Unique: 'unique',
};

/* 属性名映射 */
const PROP_LABEL: Record<string, string> = {
  ExtraAllDamageTypeAddedRatio1: '全伤害', ExtraAllDamageTypeAddedRatio4: '全伤害', ExtraAllDamageTypeAddedRatio5: '全伤害',
  ExtraInitSP: '初始战技点',
  ExtraHPAddedRatio1: '生命增幅', ExtraHPAddedRatio2: '生命增幅',
  ExtraSpeedAddedRatio1: '速度增幅', ExtraSpeedAddedRatio2: '速度增幅',
  ExtraAttackAddedRatio: '攻击增幅', ExtraDefenceAddedRatio: '防御增幅',
  ExtraCriticalChanceBase: '暴击率', ExtraCriticalDamageBase: '暴击伤害',
  ExtraBreakDamageAddedRatio: '击破特攻',
  ExtraHealRatioBase: '治疗量', ExtraHealAddedRatio: '治疗量',
  ExtraShieldRatioBase: '护盾量', ExtraShieldAddedRatio: '护盾量',
  ExtraLuckChance: '幸运触发率', ExtraLuckDamage: '幸运伤害',
  ExtraFrontPowerAddedRatio1: '前台强度', ExtraBackPowerAddedRatio1: '后台强度',
  ExtraDOTDamageAddedRatio1: '持续伤害', ExtraElementDamageAddedRatio1: '属性伤害',
  ExtraInsertDamageAddedRatio1: '追加攻击伤害', ExtraNormalDamageAddedRatio1: '普攻伤害',
  ExtraSkillDamageAddedRatio1: '战技伤害', ExtraUltraDamageAddedRatio1: '终结技伤害',
  SpeedAddedRatio: '速度增幅', AttackAddedRatio: '攻击增幅',
  DefenceAddedRatio: '防御增幅', HPAddedRatio: '生命增幅',
};
function propLabel(m: Record<string, unknown>): string {
  const key = String(m.property_type || m.name || '');
  return PROP_LABEL[key] || key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
}
function propValue(v: number): string {
  // 羁绊层级属性均为比率值（0.2=20%, 1.5=150%, 3.2=320%）
  return `${(v * 100).toFixed(0)}%`;
}

function traitIconUrl(icon: string): string {
  return gridFightTraitIconUrl(icon);
}

const cat = computed(() => data.value?.cat || 'special');
const catLabel = computed(() => CAT_LABEL[cat.value] || cat.value);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { traits } = await loadLocalCurrencyTraits();
    const found = traits.find((t) => String(t.id) === traitId.value);
    if (!found) { error.value = '未找到该羁绊'; return; }
    data.value = found;
  } catch (e) {
    error.value = (e as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}
watch(traitId, load, { immediate: true });
watch(data, (d) => { if (d) document.title = `${d.name} - HSR Wiki`; }, { immediate: true });
</script>

<template>
  <div class="nk-ctrait">
    <!-- 加载骨架 -->
    <div v-if="loading" class="nk-ctrait__skeleton">
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-icon"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-title" style="width:40%"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:80%"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:60%"></div>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="nk-ctrait__state nk-ctrait__state--err">
      <span class="nk-ctrait__state-icon">⚠</span>
      <p>{{ error }}</p>
      <button class="nk-ctrait__retry" @click="load">重试</button>
    </div>

    <template v-else-if="data">
      <!-- ═══ Hero 头部 ═══ -->
      <header class="nk-ctrait-hero" :data-cat="cat">
        <div class="nk-ctrait-hero__glow"></div>
        <div class="nk-ctrait-hero__content">
          <div class="nk-ctrait-hero__icon">
            <img :src="traitIconUrl(data.icon)" :alt="data.name" loading="eager" />
          </div>
          <div class="nk-ctrait-hero__info">
            <div class="nk-ctrait-hero__badges">
              <span class="nk-ctrait-hero__cat" :class="`nk-ctrait-hero__cat--${cat}`">{{ catLabel }}</span>
              <span v-if="data.activation_type" class="nk-ctrait-hero__act">{{ ACTIVATION_LABEL[data.activation_type] || data.activation_type }}</span>
            </div>
            <h1 class="nk-ctrait-hero__name">{{ data.name }}</h1>
            <span class="nk-ctrait-hero__hud">TRAIT · 羁绊</span>
          </div>
        </div>
      </header>

      <!-- ═══ 完整描述 ═══ -->
      <section class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">效果说明</h2>
        <div class="nk-ctrait-desc" v-html="fmtDesc(data.desc, data.base_params)"></div>
      </section>

      <!-- ═══ 备注机制 ═══ -->
      <section v-if="data.remarks && data.remarks.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">机制详情</h2>
        <div class="nk-ctrait-remarks">
          <div v-for="(r, ri) in data.remarks" :key="ri" class="nk-ctrait-remark">
            <div class="nk-ctrait-remark__text" v-html="fmtDesc(r.desc, r.params)"></div>
          </div>
        </div>
      </section>

      <!-- ═══ 层级效果 ═══ -->
      <section v-if="data.layers && data.layers.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">层级效果</h2>
        <div class="nk-ctrait-layers">
          <article
            v-for="ly in data.layers"
            :key="ly.layer"
            class="nk-ctrait-layer"
            :class="ly.quality ? `nk-ctrait-layer--${QUALITY_CSS[ly.quality] || ''}` : ''"
          >
            <div class="nk-ctrait-layer__head">
              <span class="nk-ctrait-layer__badge">{{ ly.layer }}</span>
              <span class="nk-ctrait-layer__head-label">人激活</span>
              <span v-if="ly.quality" class="nk-ctrait-layer__quality" :class="`nk-ctrait-layer__quality--${QUALITY_CSS[ly.quality] || ''}`">{{ QUALITY_LABEL[ly.quality] || ly.quality }}</span>
            </div>
            <div v-if="ly.desc" class="nk-ctrait-layer__desc" v-html="fmtDesc(ly.desc, ly.params)"></div>
            <!-- 属性芯片仅在没有描述文本时展示 -->
            <div v-if="!ly.desc && (ly.member_props.length || ly.all_props.length)" class="nk-ctrait-layer__props">
              <div v-for="(p, pi) in ly.member_props" :key="'m'+pi" class="nk-ctrait-prop">
                <span class="nk-ctrait-prop__scope">成员</span>
                <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
              </div>
              <div v-for="(p, pi) in ly.all_props" :key="'a'+pi" class="nk-ctrait-prop">
                <span class="nk-ctrait-prop__scope nk-ctrait-prop__scope--all">全员</span>
                <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
