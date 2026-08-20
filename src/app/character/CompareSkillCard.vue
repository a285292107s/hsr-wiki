<script setup lang="ts">
/**
 * 对比技能卡：单条技能的前后变化视图（原始灰 → 强化金，双段）。
 * 等级滑条范围取 base/enh 最大值；层级参数各自代入渲染；
 * 头部结构沿用 nk-skill 全局原语（与技能卡视觉一致），对比样式为本组件 scoped。
 */
import { computed, ref } from 'vue';
import { fmtDesc, skillIconUrl, fmtToughness } from '../../lib/format';
import { ELEM, TYPE } from '../../lib/constants';
import type { CharacterData, Skill } from '../../services/types';
import type { SkillDiff } from '../../lib/compare';

const props = defineProps<{
  diff: SkillDiff;
  charId: string;
  charData: CharacterData | null;
}>();

/* ─── 等级滑条（范围 = 双侧 max；单侧缺级时该侧渲染「—」） ─── */

function lvCount(sk: Skill | undefined): number {
  return sk && sk.level ? Object.keys(sk.level).length : 0;
}
const maxLv = computed(() => Math.max(1, lvCount(props.diff.base), lvCount(props.diff.enh)));
const defaultLv = computed(() =>
  props.diff.enh.type === 'Normal' ? Math.min(6, maxLv.value) : Math.min(10, maxLv.value),
);
const lv = ref(defaultLv.value);
function onSlider(e: Event): void {
  lv.value = Number((e.target as HTMLInputElement).value);
}
const fillPct = computed(() =>
  maxLv.value <= 1 ? 100 : ((lv.value - 1) / (maxLv.value - 1)) * 100,
);

/** 双侧描述（各自等级参数；单侧缺级 → '—'） */
function sideHtml(sk: Skill | undefined): string {
  if (!sk || !sk.desc) return '—';
  const lvData = sk.level ? sk.level[String(lv.value)] : null;
  if (!lvData) return '—';
  return fmtDesc(sk.desc, lvData.param_list);
}
const baseHtml = computed(() => sideHtml(props.diff.base));
const enhHtml = computed(() => sideHtml(props.diff.enh));

/* ─── 头部（图标用 base 确保可用；名称/标签用强化侧新形态） ─── */

const typeName = computed(() => props.diff.enh.type_name || TYPE[props.diff.enh.type ?? ''] || '');
const tagLabel = computed(() => props.diff.enh.tag || '');
const icon = computed(() => skillIconUrl(props.diff.base, props.charId, props.charData));
const typeKey = computed(() => props.diff.enh.type || '');

/* ─── 数值类变化（能量/削韧/韧性/战技点：kinds 命中时双段展示） ─── */

interface MetricDiff { label: string; base: string; enh: string }
const metricDiffs = computed<MetricDiff[]>(() => {
  const { base: b, enh: e, kinds } = props.diff;
  const out: MetricDiff[] = [];
  const has = (k: string): boolean => kinds.includes(k as never);
  const fmt = (v: number | null | undefined): string => (v == null ? '—' : String(v));
  const fmtTough = (sk: Skill): string => {
    const stType = sk.stance_damage_type;
    const stDisp = sk.stance_damage_display;
    if (stType && stDisp != null) return `${ELEM[stType] || stType} ${stDisp}`.trim();
    return fmtToughness(sk) || '—';
  };
  if (has('sp_base')) out.push({ label: '能量', base: fmt(b.sp_base), enh: fmt(e.sp_base) });
  if (has('stance_damage_display') || has('show_stance_list')) {
    out.push({ label: '削韧', base: fmtTough(b), enh: fmtTough(e) });
  }
  // 战技点对比：正值 = 消耗 N（-N），-1 = 不消耗哨兵（非产出，2026-08-15 勘正）
  const fmtBP = (v: number | null | undefined): string => {
    if (v == null) return '—';
    return v === -1 ? '不消耗' : '-' + String(v);
  };
  if (has('bp_need')) out.push({ label: '战技点', base: fmtBP(b.bp_need), enh: fmtBP(e.bp_need) });
  return out;
});
</script>

<template>
  <div class="nk-skill nk-cmp-skill" :data-type="typeKey">
    <span class="nk-cmp-badge">变化</span>
    <div class="nk-skill__head">
      <span class="nk-skill__type-dot" :title="typeName"></span>
      <div class="nk-skill__slider">
        <span class="nk-slider__val">Lv.{{ lv }}<template v-if="maxLv > 1">/{{ maxLv }}</template></span>
        <input type="range" :min="maxLv <= 1 ? 0 : 1" :max="maxLv" :value="lv" :disabled="maxLv <= 1" :style="{ '--fill': fillPct + '%' }" @input="onSlider">
      </div>
    </div>
    <div class="nk-skill__body">
      <div class="nk-skill__title-row">
        <img v-if="icon" class="nk-skill__icon" :src="icon">
        <div class="nk-skill__title">
          <span class="nk-skill__name">{{ diff.enh.name }}</span>
          <span class="nk-skill__meta">
            <span class="nk-skill__type">{{ typeName }}</span>
            <span v-if="tagLabel" class="nk-skill__tag">{{ tagLabel }}</span>
          </span>
        </div>
      </div>
      <div class="nk-cmp-row">
        <span class="nk-cmp-tag">原始</span>
        <div class="nk-skill__desc nk-cmp__orig" v-html="baseHtml"></div>
      </div>
      <div class="nk-cmp-row">
        <span class="nk-cmp-tag">强化</span>
        <div class="nk-skill__desc nk-cmp__enh" v-html="enhHtml"></div>
      </div>
      <div v-if="metricDiffs.length" class="nk-cmp-metrics">
        <dl v-for="m in metricDiffs" :key="m.label" class="nk-cmp-metric">
          <dt>{{ m.label }}</dt>
          <dd>
            <span class="nk-cmp__orig-text">{{ m.base }}</span>
            <span class="nk-cmp__arrow">→</span>
            <span class="nk-cmp__enh-text">{{ m.enh }}</span>
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>
