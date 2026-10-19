<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { elemLabel, pathLabel } from '../../lib/enum-labels';
import { useParallax } from '../composables/use-parallax';
import { initSpineViewer } from './spine';
import { avatarDrawCardUrl, elementIconUrl, escHtml, pathIconUrl } from '../../lib/format';
import { characterBlurb } from '../../lib/character-blurb';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import type { CharacterData } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  d: CharacterData;
  charId: string;
}>();

const heroBg = computed(() => avatarDrawCardUrl(props.charId));
const stars = computed(() =>
  '★'.repeat(parseInt(props.d.rarity.replace(/\D/g, ''), 10) || 5),
);

function badgeIconAttrs(kind: 'element' | 'pathicon', key: string): Record<string, string | undefined> {
  const url = kind === 'element' ? elementIconUrl(key) : pathIconUrl(key);
  if (!url) return {};
  return { src: url, 'data-cdn-fallback': cdnFallbackFromPrimary(url) || undefined, alt: '' };
}

const heroDesc = computed(() => escHtml(characterBlurb(props.d.chara_info?.stories)));

const heroRef = ref<HTMLElement | null>(null);
const heroBgRef = ref<HTMLElement | null>(null);
const spineVisible = ref(false);
const { onMove: onHeroMove, onLeave: onHeroLeave, reset: resetParallax } = useParallax(
  heroRef, heroBgRef, { enabled: () => !spineVisible.value },
);


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
