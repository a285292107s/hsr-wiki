<script setup lang="ts">
/**
 * 角色详情 Hero 区：视差立绘 + Spine 双通道 + 属性 diff 面板。
 * 仅在数据就绪后由父组件挂载（加载期模板整体卸载），故 Spine 生命周期跟随组件挂载/卸载。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useParallax } from '../composables/use-parallax';
import { initSpineViewer } from './spine';
import { avatarDrawCardUrl, escHtml, maxLevelStat, maxLevelValue } from '../../lib/format';
import { CDN, ELEM, MAX_CHAR_LEVEL, PATH } from '../../lib/constants';
import { cdnUri } from '../../services/cdn';
import type { CharacterData } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  charId: string;
}>();

/* ─── 基础展示 ─── */

const heroBg = computed(() => avatarDrawCardUrl(props.charId));
const stars = computed(() =>
  '★'.repeat(parseInt(props.d.rarity.replace(/\D/g, ''), 10) || 5),
);

interface HeroStat { v: number | string; l: string; icon: string }

/**
 * 嘲讽 / 能量消耗暂无 CDN trace 图标（IconAggro / IconEnergy 缺失），
 * 以白色线性风格 SVG 顶替（与官方 trace 图标观感一致）；待 CDN 收录后可直接替换为图片 URL。
 */
const TRACE_TAUNT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2.5 19.5 6v5.5c0 4.6-3.2 7.8-7.5 9.5-4.3-1.7-7.5-4.9-7.5-9.5V6z' fill='none' stroke='#fff' stroke-width='1.8' stroke-linejoin='round'/><path d='M12 8.5v6.5M9.5 10.5 12 8l2.5 2.5' fill='none' stroke='#fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>");
const TRACE_ENERGY_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='3.5' y='8' width='13' height='8' rx='1.8' fill='none' stroke='#fff' stroke-width='1.8'/><path d='M18.2 10.8v2.4' stroke='#fff' stroke-width='1.8' stroke-linecap='round'/><path d='M6.5 10.9v2.2M9.2 10.9v2.2M11.9 10.9v2.2' stroke='#fff' stroke-width='1.8' stroke-linecap='round'/></svg>");

/** 全部 8 项展示属性：HP/ATK/DEF/SPD + 暴击率/暴击伤害/嘲讽/能量消耗（参考官方 Wiki 头部） */
const heroStats = computed<HeroStat[]>(() => {
  const dd = props.d;
  const s = maxLevelStat(dd.stats);
  if (!s) return [];
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const mk = (v: number | string, l: string, icon: string): HeroStat => ({
    v, l, icon,
  });
  return [
    mk(Math.round(maxLevelValue(s.hp_base, s.hp_add)), 'HP', cdnUri('trace', 'IconMaxHP.webp')),
    mk(Math.round(maxLevelValue(s.attack_base, s.attack_add)), 'ATK', cdnUri('trace', 'IconAttack.webp')),
    mk(Math.round(maxLevelValue(s.defence_base, s.defence_add)), 'DEF', cdnUri('trace', 'IconDefence.webp')),
    mk(s.speed_base, 'SPD', cdnUri('trace', 'IconSpeed.webp')),
    mk(fmtPct(s.critical_chance), '暴击率', cdnUri('trace', 'IconCriticalChance.webp')),
    mk(fmtPct(s.critical_damage), '暴击伤害', cdnUri('trace', 'IconCriticalDamage.webp')),
    mk(s.base_aggro ?? 0, '嘲讽值', TRACE_TAUNT_SVG),
    mk(dd.sp_need ?? 0, '能量消耗', TRACE_ENERGY_SVG),
  ];
});

/** 当前等级上限（本地数据源无等级上限字段，固定为最大等级） */
const levelLimit = computed<number>(() => MAX_CHAR_LEVEL);

/** 一句话介绍（跟随当前视图 desc；位于属性模块上方） */
const heroDesc = computed(() => escHtml(props.d.desc || '').replace(/\\n/g, '<br>'));

/* ─── 视差（lerp 方案；动画开启时冻结） ─── */

const heroRef = ref<HTMLElement | null>(null);
const heroBgRef = ref<HTMLElement | null>(null);
const spineVisible = ref(false);
const { onMove: onHeroMove, onLeave: onHeroLeave, reset: resetParallax } = useParallax(
  heroRef, heroBgRef, { enabled: () => !spineVisible.value },
);

/* ─── Spine 查看器（charId 变化时重建；加强切换不重建） ─── */

const spineRef = ref<HTMLElement | null>(null);
const spineReady = ref(false);
let spineCleanup: (() => void) | null = null;

function startSpine(id: string): void {
  if (spineCleanup) {
    spineCleanup();
    spineCleanup = null;
  }
  spineReady.value = false;
  spineVisible.value = false;
  if (!id || !spineRef.value) return;
  // 容器复用（组件复用时残留）：清空后再挂新实例，避免重复 canvas
  spineRef.value.innerHTML = '';
  spineCleanup = initSpineViewer(spineRef.value, id, () => {
    spineReady.value = true;
    spineVisible.value = true;
  });
}

onMounted(async () => {
  await nextTick();
  startSpine(props.charId);
});
watch(() => props.charId, async (id) => {
  await nextTick();
  startSpine(id);
});

function toggleSpine(): void {
  if (!spineReady.value) return; // 无动画时忽略点击
  spineVisible.value = !spineVisible.value;
  if (spineVisible.value) resetParallax(); // 开启动画时立绘回中
}

onBeforeUnmount(() => {
  if (spineCleanup) {
    spineCleanup();
    spineCleanup = null;
  }
});
</script>

<template>
  <div ref="heroRef" class="nk-hero nk-hero--char" @mousemove="onHeroMove" @mouseleave="onHeroLeave">
    <div class="nk-hero__visual">
      <div
        ref="heroBgRef"
        class="nk-hero__bg"
        :class="{ 'nk-dim': spineVisible }"
        :style="{ backgroundImage: `url(${heroBg})` }"
      ></div>
      <div ref="spineRef" class="nk-hero__spine" :class="{ 'nk-ready': spineVisible }"></div>
      <div class="nk-hero__scrim"></div>
      <span class="nk-hero__archive">ARCHIVE · № {{ charId }}</span>
      <button
        class="nk-hero__toggle"
        :class="{ off: !spineVisible, 'has-anim': spineReady }"
        :title="spineReady ? undefined : '该角色暂无动画展示'"
        type="button"
        @click="toggleSpine"
      >
        <span class="dot"></span>动画
      </button>
    </div>
    <div class="nk-hero__panel">
      <header class="nk-hero__head">
        <div class="nk-hero__head-left">
          <div class="nk-hero__meta-row">
            <span v-if="d.chara_info && d.chara_info.camp" class="nk-hero__camp">{{ d.chara_info.camp }}</span>
            <span class="nk-hero__stars">{{ stars }}</span>
          </div>
          <h1 class="nk-hero__name">{{ d.name }}</h1>
        </div>
        <div class="nk-hero__head-right">
          <span class="nk-hero__badge">
            <img :src="`${CDN}/assets/hsr/element/${d.damage_type.toLowerCase()}.webp`" alt="">
            <span>{{ ELEM[d.damage_type] || d.damage_type }}</span>
          </span>
          <span class="nk-hero__badge">
            <img :src="`${CDN}/assets/hsr/pathicon/${d.base_type.toLowerCase()}.webp`" alt="">
            <span>{{ PATH[d.base_type] || d.base_type }}</span>
          </span>
        </div>
      </header>

      <div v-if="heroDesc" class="nk-hero__desc" v-html="heroDesc"></div>

      <section v-if="heroStats.length" class="nk-hero__section">
        <div class="nk-hero__section-title">
          <span class="nk-hero__section-bar"></span>
          <span>属性</span>
        </div>
        <div class="nk-hero__stats">
          <div v-for="st in heroStats" :key="st.l" class="nk-hero__stat">
            <img class="nk-hero__stat-icon" :src="st.icon" alt="" aria-hidden="true">
            <span class="nk-hero__stat-label">{{ st.l }}</span>
            <span class="nk-hero__stat-val">{{ st.v }}</span>
          </div>
        </div>
        <div class="nk-hero__level">
          <span class="nk-hero__level-label">Lv. {{ levelLimit }}/{{ MAX_CHAR_LEVEL }}</span>
          <div class="nk-hero__level-track">
            <div class="nk-hero__level-fill" :style="{ width: `${(levelLimit / MAX_CHAR_LEVEL) * 100}%` }"></div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
