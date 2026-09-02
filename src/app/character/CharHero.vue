<script setup lang="ts">
/**
 * 角色详情 Hero 区：视差立绘 + Spine 双通道（以立绘展示为主；属性面板已迁出至 00 属性区块 StatsPanel）。
 * 仅在数据就绪后由父组件挂载（加载期模板整体卸载），故 Spine 生命周期跟随组件挂载/卸载。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useParallax } from '../composables/use-parallax';
import { initSpineViewer } from './spine';
import { avatarDrawCardUrl, escHtml } from '../../lib/format';
import { CDN, ELEM, PATH } from '../../lib/constants';
import type { CharacterData } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  charId: string;
  /** 强化版本键列表（空 = 无强化；非空时 meta 行显示「强化形态」入口徽章） */
  enhKeys?: string[];
}>();

const emit = defineEmits<{ 'go-enh': [] }>();

/** 是否有强化数据（驱动入口徽章挂载） */
const enhanceable = computed(() => props.enhKeys && props.enhKeys.length > 0);

/* ─── 基础展示 ─── */

const heroBg = computed(() => avatarDrawCardUrl(props.charId));
const stars = computed(() =>
  '★'.repeat(parseInt(props.d.rarity.replace(/\D/g, ''), 10) || 5),
);

/** 一句话介绍（位于 Hero 面板头部下方） */
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
            <span class="nk-hero__badge">
              <img :src="`${CDN}/assets/hsr/element/${d.damage_type.toLowerCase()}.webp`" alt="">
              <span>{{ ELEM[d.damage_type] || d.damage_type }}</span>
            </span>
            <span class="nk-hero__badge">
              <img :src="`${CDN}/assets/hsr/pathicon/${d.base_type.toLowerCase()}.webp`" alt="">
              <span>{{ PATH[d.base_type] || d.base_type }}</span>
            </span>
            <!-- 强化形态入口：仅强化角色显示；金色强调（数据语义色），点击滚动至强化模块 -->
            <button
              v-if="enhanceable"
              class="nk-hero__badge nk-hero__badge--enh"
              type="button"
              @click="emit('go-enh')"
            >
              <span class="nk-hero__badge-mark" aria-hidden="true"></span>
              <span>强化形态</span>
            </button>
          </div>
          <h1 class="nk-hero__name">{{ d.name }}</h1>
        </div>
      </header>

      <div v-if="heroDesc" class="nk-hero__desc" v-html="heroDesc"></div>
    </div>
  </div>
</template>
