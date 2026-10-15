<script setup lang="ts">
/**
 * 仅在数据就绪后由父组件挂载（加载期模板整体卸载），故 Spine 生命周期跟随组件挂载/卸载。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { elemLabel, pathLabel } from '../../lib/enum-labels';
import { useParallax } from '../composables/use-parallax';
import { initSpineViewer } from './spine';
import { avatarDrawCardUrl, elementIconUrl, escHtml, pathIconUrl } from '../../lib/format';
import { characterBlurb } from '../../lib/character-blurb';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import type { CharacterData } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
const props = defineProps<{
  d: CharacterData;
  charId: string;
  /** 强化版本键列表（空 = 无强化；非空时 meta 行显示「强化形态」入口徽章） */
  enhKeys?: string[];
}>();

const emit = defineEmits<{ 'go-enh': [] }>();

const enhanceable = computed(() => props.enhKeys && props.enhKeys.length > 0);

const heroBg = computed(() => avatarDrawCardUrl(props.charId));
const stars = computed(() =>
  '★'.repeat(parseInt(props.d.rarity.replace(/\D/g, ''), 10) || 5),
);

/* 属性 / 命途徽标图标：必须经 CDN 解析层（`cdnUri` 的 local-first + 回退链），
   原先直拼 `${CDN}/assets/hsr/{element,pathicon}/…` 绕过了解析层——本地入库与 jsDelivr
   回退对它全部失效。回退源须一并落 `data-cdn-fallback`：只绑 `:src` 的图标位在主源 404 时
   读不到第二源，会判死（新命途未入库时正走这条路径）。 */
function badgeIconAttrs(kind: 'element' | 'pathicon', key: string): Record<string, string | undefined> {
  const url = kind === 'element' ? elementIconUrl(key) : pathIconUrl(key);
  if (!url) return {};
  return { src: url, 'data-cdn-fallback': cdnFallbackFromPrimary(url) || undefined, alt: '' };
}

/** 简介：从角色档案派生（口径唯一落在 `lib/character-blurb.ts`，见该文件注释与 ADR 0052 决策 2/3） */
const heroDesc = computed(() => escHtml(characterBlurb(props.d.chara_info?.stories)));

const heroRef = ref<HTMLElement | null>(null);
const heroBgRef = ref<HTMLElement | null>(null);
const spineVisible = ref(false);
const { onMove: onHeroMove, onLeave: onHeroLeave, reset: resetParallax } = useParallax(
  heroRef, heroBgRef, { enabled: () => !spineVisible.value },
);

/* Spine 查看器：charId 变化时重建；强化切换不重建 */

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
  if (!spineReady.value) return;
  spineVisible.value = !spineVisible.value;
  if (spineVisible.value) resetParallax();
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
      <button
        class="nk-hero__toggle"
        :class="{ off: !spineVisible, 'has-anim': spineReady }"
        :title="spineReady ? undefined : t('char.noAnimation')"
        type="button"
        @click="toggleSpine"
      >
        <span class="dot"></span>{{ t('char.animation') }}
      </button>
    </div>
    <div class="nk-hero__panel">
      <header class="nk-hero__head">
        <div class="nk-hero__rubric">
          <span class="nk-hero__archive">ARCHIVE · <span class="nk-hero__archive-no">№ {{ charId }}</span></span>
          <span class="nk-hero__rubric-rule" aria-hidden="true"></span>
          <span v-if="d.chara_info && d.chara_info.camp" class="nk-hero__camp">{{ d.chara_info.camp }}</span>
        </div>
        <div class="nk-hero__meta-row">
          <span class="nk-hero__stars">{{ stars }}</span>
          <span class="nk-hero__badge">
            <img v-bind="badgeIconAttrs('element', d.damage_type)">
            <span>{{ elemLabel(d.damage_type) }}</span>
          </span>
          <span class="nk-hero__badge">
            <img v-bind="badgeIconAttrs('pathicon', d.base_type)">
            <span>{{ pathLabel(d.base_type) }}</span>
          </span>
          <button
            v-if="enhanceable"
            class="nk-hero__badge nk-hero__badge--enh"
            type="button"
            @click="emit('go-enh')"
          >
            <span class="nk-hero__badge-mark" aria-hidden="true"></span>
            <span>{{ t('char.enhForm') }}</span>
          </button>
        </div>
        <div class="nk-hero__title">
          <span class="nk-hero__name-slot">
            <h1 class="nk-hero__name" :data-len="[...(d.name || '')].length">{{ d.name }}</h1>
            <span v-if="d.name_en" class="nk-hero__name-en">{{ d.name_en }}</span>
          </span>
        </div>
      </header>

      <div v-if="heroDesc" class="nk-hero__desc" v-html="heroDesc"></div>
    </div>
  </div>
</template>
