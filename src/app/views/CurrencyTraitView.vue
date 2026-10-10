<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { fmtDesc, gridFightTraitIconUrl, avatarShopIconUrl } from '../../lib/format';
import { SITE_NAME } from '../../lib/constants';
import { propLabel } from '../../lib/currency-role';
import { cwTraitCatKey, cwTraitQualityKey, cwCostKey } from '../../lib/enum-labels';
import { usePageData } from '../composables/use-page-data';
import { loadLocalCurrencyTraits, loadLocalCurrencyRoles } from '../../services/api';
import type { CurrencyTraitEntry, CurrencyRoleEntry } from '../../services/types';
import '../../styles/currency-trait-detail.css';

const route = useRoute();
const { t } = useI18n();
const traitId = computed(() => String(route.params.id));
const members = ref<CurrencyRoleEntry[]>([]);

const QUALITY_CSS: Record<string, string> = {
  Silver: 'silver', Gold: 'gold', Multicolor: 'multicolor', Unique: 'unique',
};

/** 属性值格式化：羁绊层级属性均为比率值（0.2=20%, 1.5=150%, 3.2=320%） */
function propValue(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

function traitIconUrl(icon: string): string {
  return gridFightTraitIconUrl(icon);
}

const cat = computed(() => data.value?.cat || 'special');
const catLabel = computed(() => {
  const k = cwTraitCatKey(cat.value);
  return k ? t(k) : cat.value;
});
const actLabel = computed(() =>
  data.value?.activation_type === 'GreaterEqualThan' ? t('catalog.activationType.ge') : '');


const { data, error, showSkeleton, run, retry } = usePageData<CurrencyTraitEntry>(async () => {
  const [{ traits }, { roles }] = await Promise.all([
    loadLocalCurrencyTraits(),
    loadLocalCurrencyRoles(),
  ]);
  const found = traits.find((t) => String(t.id) === traitId.value);
  if (!found) throw new Error(t('ctrait.notFound'));
  members.value = roles.filter((r) => r.trait_list.includes(Number(traitId.value)));
  return found;
});
watch(
  traitId,
  () => void run(),
  { immediate: true },
);
watch(data, (d) => { if (d) document.title = `${d.name} - ${SITE_NAME}`; }, { immediate: true });
</script>

<template>
  <div class="nk-ctrait">
    <div v-if="showSkeleton" class="nk-ctrait__skeleton" role="status" aria-live="polite" :aria-label="t('ctrait.loadingAria')">
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-icon"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-title" style="width:40%"></div>
      <div class="nk-ctrait__skeleton-body">
        <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:30%"></div>
        <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:80%"></div>
        <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:60%"></div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('ctrait.errorTitle') }}</div>
      <div class="nk-error-state__detail">{{ t('common.loadErrorDetail') }}</div>
      <div class="nk-error-state__tech">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="data">
      <header class="nk-ctrait-hero" :data-cat="cat">
        <div class="nk-ctrait-hero__glow"></div>
        <div class="nk-ctrait-hero__content">
          <div class="nk-ctrait-hero__icon">
            <img :src="traitIconUrl(data.icon)" :alt="data.name" loading="eager" />
          </div>
          <div class="nk-ctrait-hero__info">
            <div class="nk-ctrait-hero__badges">
              <span class="nk-ctrait-hero__cat" :class="`nk-ctrait-hero__cat--${cat}`">{{ catLabel }}</span>
              <span v-if="actLabel" class="nk-ctrait-hero__act">{{ actLabel }}</span>
            </div>
            <h1 class="nk-ctrait-hero__name">{{ data.name }}</h1>
            <p class="nk-ctrait-hero__rubric">ARCHIVE · № {{ data.id }}</p>
          </div>
        </div>
      </header>

      <section class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">{{ t('ctrait.sec.effect') }}</h2>
        <div class="nk-ctrait-desc" v-html="fmtDesc(data.desc, data.base_params)"></div>
      </section>

      <section v-if="data.remarks && data.remarks.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">{{ t('ctrait.sec.mechanics') }}</h2>
        <div class="nk-ctrait-remarks">
          <div v-for="(r, ri) in data.remarks" :key="ri" class="nk-ctrait-remark">
            <div class="nk-ctrait-remark__text" v-html="fmtDesc(r.desc, r.params)"></div>
          </div>
        </div>
      </section>

      <section v-if="members.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">{{ t('ctrait.sec.members') }}<span class="nk-ctrait-section__note">{{ t('ctrait.memberCount', { n: members.length }) }}</span></h2>
        <div class="nk-ctrait-members">
          <router-link
            v-for="m in members"
            :key="m.id"
            :to="`/currency/role/${m.id}`"
            class="nk-ctrait-member"
          >
            <img class="nk-ctrait-member__avatar" :src="avatarShopIconUrl(m.avatar_id || m.id)" :alt="m.name" loading="lazy" />
            <span class="nk-ctrait-member__name">{{ m.name }}</span>
            <span v-if="m.rarity" class="nk-ctrait-member__cost">{{ cwCostKey(String(m.rarity)) ? t(cwCostKey(String(m.rarity))!) : m.rarity }}</span>
          </router-link>
        </div>
      </section>

      <section v-if="data.layers && data.layers.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">{{ t('ctrait.sec.layers') }}<span v-if="actLabel" class="nk-ctrait-section__note">（{{ actLabel }}）</span></h2>
        <div class="nk-ctrait-layers">
          <article
            v-for="ly in data.layers"
            :key="ly.layer"
            class="nk-ctrait-layer"
            :class="`nk-ctrait-layer--${ly.quality ? (QUALITY_CSS[ly.quality] || '') : 'base'}`"
          >
            <div class="nk-ctrait-layer__mark">
              <span class="nk-ctrait-layer__node"><span class="nk-ctrait-layer__num">{{ ly.layer }}</span></span>
            </div>
            <div class="nk-ctrait-layer__body">
              <header class="nk-ctrait-layer__head">
                <span class="nk-ctrait-layer__quality">
                  <i class="nk-ctrait-layer__qdot"></i>{{ t('catalog.qualityLabel', { name: ly.quality ? (cwTraitQualityKey(ly.quality) ? t(cwTraitQualityKey(ly.quality)!) : ly.quality) : t('catalog.qualityBase') }) }}
                </span>
                <span class="nk-ctrait-layer__act">{{ t('catalog.activation', { n: ly.layer }) }}</span>
              </header>
              <div v-if="ly.desc" class="nk-ctrait-layer__desc" v-html="fmtDesc(ly.desc, ly.params)"></div>
              <div v-if="ly.buff_desc" class="nk-ctrait-layer__buff" v-html="fmtDesc(ly.buff_desc, ly.buff_params || [])"></div>
              <div v-if="!ly.desc && (ly.member_props.length || ly.all_props.length)" class="nk-ctrait-layer__props">
                <div v-for="(p, pi) in ly.member_props" :key="'m'+pi" class="nk-ctrait-prop">
                  <span class="nk-ctrait-prop__scope">{{ t('ctrait.scope.member') }}</span>
                  <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                  <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
                </div>
                <div v-for="(p, pi) in ly.all_props" :key="'a'+pi" class="nk-ctrait-prop">
                  <span class="nk-ctrait-prop__scope nk-ctrait-prop__scope--all">{{ t('cwRole.scopeAll') }}</span>
                  <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                  <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
