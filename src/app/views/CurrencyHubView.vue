<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import {
  useCwSeason,
  type CwRoleCard,
  type CwTraitCard,
} from '../composables/use-release-showcase';
import '../../styles/currency-hub.css';

const { season, loaded, failedCount, sourceCount, load } = useCwSeason();

const allFailed = computed(() => failedCount.value >= sourceCount);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);
const totalsKnown = computed(() => loaded.value && !failedCount.value && season.value !== null);
const intakeCount = computed(() => (season.value ? season.value.roles.length + season.value.traits.length : 0));

const highlightTraits = ref<string[]>([]);
const highlightRoles = ref<string[]>([]);

function highlightRoleTraits(role: CwRoleCard): void {
  highlightRoles.value = [];
  highlightTraits.value = role.traits.filter((chip) => chip.isNew).map((chip) => chip.id);
}

function highlightTraitCarriers(trait: CwTraitCard): void {
  highlightTraits.value = [trait.id];
  highlightRoles.value = trait.carriers.map((carrier) => carrier.id);
}

function clearHighlight(): void {
  highlightTraits.value = [];
  highlightRoles.value = [];
}

function traitChipTitle(chip: { name: string; isNew: boolean }): string {
  return chip.isNew ? `${chip.name} · ${t('cwHub.releaseTitle')}` : chip.name;
}

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-cwhub-app">
    <main class="nk-hub-release">
      <header class="nk-hub-masthead">
        <h1 class="nk-hub-masthead__title">{{ t('catalog.currencyWar') }}</h1>
        <p class="nk-hub-masthead__tagline">{{ t('cwHub.tagline') }}</p>
      </header>

      <div class="nk-cwseas__head">
        <h2 class="nk-hub-release__title">{{ t('cwHub.releaseTitle') }}</h2>
        <span class="nk-hub-release__rule" aria-hidden="true"></span>
        <dl v-if="totalsKnown && intakeCount && season" class="nk-cwseas__figures">
          <div class="nk-cwseas__figure">
            <dt class="nk-cwseas__figure-label">{{ t('nav.cwRoleShort') }}</dt>
            <dd class="nk-cwseas__figure-value">{{ season.roles.length }}</dd>
          </div>
          <div class="nk-cwseas__figure">
            <dt class="nk-cwseas__figure-label">{{ t('nav.cwTraitShort') }}</dt>
            <dd class="nk-cwseas__figure-value">{{ season.traits.length }}</dd>
          </div>
        </dl>
        <div v-else-if="!loaded" class="nk-cwseas__figures" aria-hidden="true">
          <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-figure"></span>
          <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-figure"></span>
        </div>
      </div>

      <div
        v-if="!loaded"
        class="nk-hub-release__sk"
        role="status"
        aria-live="polite"
        :aria-label="t('cwHub.loadingAria')"
      >
        <section class="nk-hub-release__section" data-sk="role" aria-hidden="true">
          <div class="nk-hub-release__sechead">
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-label"></span>
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-all"></span>
          </div>
          <div class="nk-cwseas__roster">
            <div v-for="n in 4" :key="`sk-role-${n}`" class="nk-cwrole nk-cwseas__sk-role">
              <span class="nk-cwrole__art"><span class="nk-sk nk-sk--shimmer nk-cwseas__sk-fill"></span></span>
              <span class="nk-cwrole__body">
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--name"></span>
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--meta"></span>
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--traits"></span>
              </span>
            </div>
          </div>
        </section>
        <section class="nk-hub-release__section" data-sk="trait" aria-hidden="true">
          <div class="nk-hub-release__sechead">
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-label"></span>
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-all"></span>
          </div>
          <div class="nk-cwseas__traits">
            <div v-for="n in 3" :key="`sk-trait-${n}`" class="nkcwtrait nk-cwseas__sk-trait">
              <span class="nkcwtrait__icon"><span class="nk-sk nk-sk--shimmer nk-cwseas__sk-fill"></span></span>
              <span class="nkcwtrait__body">
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--trait-name"></span>
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--trait-meta"></span>
                <span class="nk-sk nk-sk--shimmer nk-cwseas__sk-line nk-cwseas__sk-line--trait-desc"></span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <div v-else-if="allFailed" class="nk-error-state" role="alert">
        <div class="nk-error-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div class="nk-error-state__title">{{ t('cwHub.errorTitle') }}</div>
        <div class="nk-error-state__detail">{{ t('cwHub.errorDetail', { labels: `${t('nav.cwRole')} / ${t('nav.cwTrait')}` }) }}</div>
        <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
      </div>

      <template v-else>
        <p v-if="partialFailed" class="nk-hub-release__notice" role="status">
          {{ t('home.partialDetail', { n: failedCount }) }}
          <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
        </p>

        <template v-if="season && (season.roles.length || season.traits.length)">
          <section
            v-if="season.roles.length"
            class="nk-hub-release__section"
            data-kind="role"
            :aria-label="t('nav.cwRole')"
          >
            <div class="nk-hub-release__sechead">
              <h3 class="nk-hub-release__label">{{ t('nav.cwRole') }} <span class="nk-hub-release__label-count">{{ season.roles.length }}</span></h3>
              <RouterLink class="nk-hub-release__all" to="/currency/role">
                {{ t('home.viewAll', { label: t('nav.cwRole') }) }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </RouterLink>
            </div>
            <ul class="nk-cwseas__roster">
              <li v-for="role in season.roles" :key="role.id">
                <RouterLink
                  class="nk-cwrole"
                  :to="role.href"
                  :data-hl="highlightRoles.includes(role.id) ? '' : undefined"
                  @mouseenter="highlightRoleTraits(role)"
                  @mouseleave="clearHighlight"
                  @focusin="highlightRoleTraits(role)"
                  @focusout="clearHighlight"
                >
                  <span class="nk-cwrole__art">
                    <img :src="role.avatar" :alt="role.name" loading="lazy">
                  </span>
                  <span class="nk-cwrole__body">
                    <span class="nk-cwrole__name">{{ role.name }}</span>
                    <span class="nk-cwrole__meta">
                      <span v-if="role.costKey || role.cost" class="nk-cwrole__cost">{{ role.costKey ? t(role.costKey) : role.cost }}</span>
                      <span v-if="role.positionKey" class="nk-cwrole__pos">{{ t(role.positionKey) }}</span>
                      <span v-for="(charge, i) in role.charges" :key="`charge-${i}`">{{ charge.key ? t(charge.key) : charge.text }}</span>
                    </span>
                    <span v-if="role.traits.length" class="nk-cwrole__traits">
                      <span
                        v-for="chip in role.traits"
                        :key="chip.id"
                        class="nk-cwrole__trait"
                        :data-new="chip.isNew ? '' : undefined"
                        :data-hl="highlightTraits.includes(chip.id) ? '' : undefined"
                        :title="traitChipTitle(chip)"
                      >
                        <img :src="chip.icon" alt="" loading="lazy">
                        <span class="nk-cwrole__trait-name">{{ chip.name }}</span>
                      </span>
                    </span>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <section
            v-if="season.traits.length"
            class="nk-hub-release__section"
            data-kind="trait"
            :aria-label="t('nav.cwTrait')"
          >
            <div class="nk-hub-release__sechead">
              <h3 class="nk-hub-release__label">{{ t('nav.cwTrait') }} <span class="nk-hub-release__label-count">{{ season.traits.length }}</span></h3>
              <RouterLink class="nk-hub-release__all" to="/currency/trait">
                {{ t('home.viewAll', { label: t('nav.cwTrait') }) }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </RouterLink>
            </div>
            <ul class="nk-cwseas__traits">
              <li v-for="trait in season.traits" :key="trait.id">
                <RouterLink
                  class="nkcwtrait"
                  :to="trait.href"
                  :data-cat="trait.cat"
                  :data-hl="highlightTraits.includes(trait.id) ? '' : undefined"
                  :title="trait.desc"
                  @mouseenter="highlightTraitCarriers(trait)"
                  @mouseleave="clearHighlight"
                  @focusin="highlightTraitCarriers(trait)"
                  @focusout="clearHighlight"
                >
                  <span class="nkcwtrait__icon">
                    <img :src="trait.icon" alt="" loading="lazy">
                  </span>
                  <span class="nkcwtrait__body">
                    <span class="nkcwtrait__title">
                      <span class="nkcwtrait__name">{{ trait.name }}</span>
                      <span class="nkcwtrait__cat" :data-cat="trait.cat">{{ t(trait.catKey) }}</span>
                    </span>
                    <span class="nkcwtrait__meta">
                      <span v-if="trait.layerCount" class="nkcwtrait__layers">{{ t('cwTrait.layerCount', { n: trait.layerCount }) }}</span>
                      <span v-if="trait.carriers.length" class="nkcwtrait__carriers">
                        {{ t('cwHub.carriers', { names: trait.carriers.map((carrier) => carrier.name).join(' · ') }) }}
                      </span>
                    </span>
                    <span class="nkcwtrait__desc">{{ trait.desc }}</span>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>
        </template>
        <p v-else class="nk-hub-release__empty">{{ t('cwHub.empty') }}</p>
      </template>
    </main>

    <footer class="nk-hub-footer">
      <div v-if="totalsKnown && season" class="nk-cwseas__holds">
        <span class="nk-cwseas__holds-label">{{ t('cwHub.holds') }}</span>
        <RouterLink class="nk-cwseas__hold" to="/currency/role">
          <span class="nk-cwseas__hold-num">{{ season.totals.roles }}</span>
          <span class="nk-cwseas__hold-label">{{ t('nav.cwRole') }}</span>
        </RouterLink>
        <RouterLink class="nk-cwseas__hold" to="/currency/trait">
          <span class="nk-cwseas__hold-num">{{ season.totals.traits }}</span>
          <span class="nk-cwseas__hold-label">{{ t('nav.cwTrait') }}</span>
        </RouterLink>
      </div>
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
    </footer>
  </div>
</template>
