<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { useCwSeason, type CwRoleCard, type CwTraitCard } from '../composables/use-cw-season';
import { iconImgAttrs } from '../../lib/icons';
import '../../styles/currency-hub.css';

const { season, loaded, failedCount, intakeFailed, load } = useCwSeason();

const allFailed = computed(() => intakeFailed.value >= 2);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);
const intakeRoles = computed(() => (season.value?.roles ?? []).reduce((sum, role) => sum + role.variants.length, 0));
const intakeTraits = computed(() => season.value?.traits.length ?? 0);
const hasIntake = computed(() => intakeRoles.value > 0 || intakeTraits.value > 0);

const coverRole = computed<CwRoleCard | null>(() => {
  const roles = season.value?.roles ?? [];
  let best: CwRoleCard | null = null;
  for (const role of roles) {
    if (!best) { best = role; continue; }
    if (role.variants.length > best.variants.length) { best = role; continue; }
    if (role.variants.length === best.variants.length && role.cost > best.cost) best = role;
  }
  return best;
});

const highlightTraitIds = ref<string[]>([]);
const highlightRoleIds = ref<string[]>([]);

function roleNeedsHighlight(role: CwRoleCard): boolean {
  return highlightRoleIds.value.length > 0 && role.variants.some((variant) => highlightRoleIds.value.includes(variant.id));
}

function highlightRoleTraits(role: CwRoleCard): void {
  highlightRoleIds.value = [];
  highlightTraitIds.value = role.traits.filter((chip) => chip.isNew).map((chip) => chip.id);
}

function highlightTraitCarriers(trait: CwTraitCard): void {
  highlightTraitIds.value = [trait.id];
  highlightRoleIds.value = trait.carriers.map((carrier) => carrier.id);
}

function clearHighlight(): void {
  highlightTraitIds.value = [];
  highlightRoleIds.value = [];
}

function traitChipTitle(chip: { name: string; isNew: boolean }): string {
  return chip.isNew ? `${chip.name} · ${t('cwHub.releaseTitle')}` : chip.name;
}

function costLabel(role: CwRoleCard): string {
  return role.costs.map((cost) => t(`catalog.cost.${cost}`)).join(' / ');
}

function costDotClass(cost: number): string {
  return `nk-cwsc-cost--${Math.min(cost, 5)}`;
}

function pkgSlots(trait: CwTraitCard): Array<{ key: string; on: boolean }> {
  return [
    { key: t('cwHub.packageInvite'), on: trait.pkg.invite },
    { key: t('cwHub.packageStock'), on: trait.pkg.stock },
    { key: t('cwHub.packageBadge'), on: trait.pkg.badge },
  ];
}

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-cwhub-app">
    <main class="nk-cwsc">
      <header class="nk-hub-masthead">
        <h1 class="nk-hub-masthead__title">{{ t('catalog.currencyWar') }}</h1>
        <p class="nk-hub-masthead__tagline">{{ t('cwHub.tagline') }}</p>
      </header>

      <div v-if="loaded && season" class="nk-cwsc-imprint">
        <span v-if="season.seasonId != null" class="nk-cwsc-imprint__item">{{ t('cwHub.seasonMark', { n: season.seasonId }) }}</span>
        <span v-if="season.version" class="nk-cwsc-imprint__item">{{ t('cwHub.versionMark', { version: season.version }) }}</span>
        <span v-if="season.syncedAt" class="nk-cwsc-imprint__item">{{ t('home.releaseDate', { date: season.syncedAt }) }}</span>
      </div>

      <div v-if="!loaded" class="nk-cwsc-sk" role="status" aria-live="polite" :aria-label="t('cwHub.loadingAria')">
        <div class="nk-cwsc-sk__head" aria-hidden="true">
          <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__title"></span>
          <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__lead"></span>
        </div>
        <div class="nk-cwsc-sk__premiere" aria-hidden="true">
          <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__art"></span>
          <span class="nk-cwsc-sk__facts">
            <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__line"></span>
            <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__line"></span>
            <span class="nk-sk nk-sk--shimmer nk-cwsc-sk__line"></span>
          </span>
        </div>
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
        <p v-if="partialFailed" class="nk-cwsc-notice" role="status">
          {{ t('home.partialDetail', { n: failedCount }) }}
          <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
        </p>

        <template v-if="hasIntake && season">
          <section v-if="coverRole" class="nk-cwsc-act" data-act="premiere" :aria-label="t('cwHub.act1Title')">
            <div class="nk-cwsc-act__head">
              <span class="nk-cwsc-act__no" aria-hidden="true">01</span>
              <h2 class="nk-cwsc-act__title">{{ t('cwHub.act1Title') }}</h2>
            </div>
            <div class="nk-cwsc-premiere">
              <div class="nk-cwsc-premiere__body">
                <p class="nk-cwsc-act__lead">{{ t('cwHub.act1Lead') }}</p>
                <dl class="nk-cwsc-dist">
                  <div class="nk-cwsc-dist__row">
                    <dt class="nk-cwsc-dist__label">{{ t('catalog.filter.cost') }}</dt>
                    <dd class="nk-cwsc-dist__items">
                      <span v-for="item in season.costDist" :key="`cost-${item.cost}`" class="nk-cwsc-dist__item">
                        <span class="nk-cwsc-dist__key">{{ t(item.key) }}</span>
                        <span class="nk-cwsc-dist__val" :class="costDotClass(item.cost)">{{ item.count }}</span>
                      </span>
                    </dd>
                  </div>
                  <div class="nk-cwsc-dist__row">
                    <dt class="nk-cwsc-dist__label">{{ t('catalog.filter.position') }}</dt>
                    <dd class="nk-cwsc-dist__items">
                      <span v-for="item in season.posDist" :key="`pos-${item.position}`" class="nk-cwsc-dist__item">
                        <span class="nk-cwsc-dist__key">{{ t(item.key) }}</span>
                        <span class="nk-cwsc-dist__val">{{ item.count }}</span>
                      </span>
                    </dd>
                  </div>
                </dl>
                <ul class="nk-cwsc-figures">
                  <li class="nk-cwsc-figure">
                    <RouterLink class="nk-cwsc-figure__link" :to="`/currency/role`">
                      <span class="nk-cwsc-figure__label">{{ t('cwHub.rolesLabel') }}</span>
                      <span class="nk-cwsc-figure__num">{{ intakeRoles }}<span class="nk-cwsc-figure__total">/{{ season.totals.roles }}</span></span>
                    </RouterLink>
                  </li>
                  <li class="nk-cwsc-figure">
                    <RouterLink class="nk-cwsc-figure__link" :to="`/currency/trait`">
                      <span class="nk-cwsc-figure__label">{{ t('cwHub.traitsLabel') }}</span>
                      <span class="nk-cwsc-figure__num">{{ intakeTraits }}<span class="nk-cwsc-figure__total">/{{ season.totals.traits }}</span></span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
              <figure class="nk-cwsc-premiere__art">
                <img v-bind="iconImgAttrs(coverRole.art)" :alt="coverRole.name" loading="eager">
                <figcaption class="nk-cwsc-premiere__cap">
                  <span class="nk-cwsc-premiere__name">{{ coverRole.name }}</span>
                  <span v-if="coverRole.positionKey" class="nk-cwsc-premiere__pos">{{ t(coverRole.positionKey) }}</span>
                  <span v-if="coverRole.variants.length > 1" class="nk-cwsc-premiere__variants">
                    {{ t('cwHub.variantCount', { n: coverRole.variants.length }) }} {{ costLabel(coverRole) }}
                  </span>
                  <span v-if="coverRole.traits.length" class="nk-cwsc-premiere__traits">
                    {{ coverRole.traits.map((chip) => chip.name).join(' · ') }}
                  </span>
                </figcaption>
              </figure>
            </div>
          </section>

          <section v-if="intakeTraits" class="nk-cwsc-act" data-act="traits" :aria-label="t('cwHub.act2Title', { n: intakeTraits })">
            <div class="nk-cwsc-act__head">
              <span class="nk-cwsc-act__no" aria-hidden="true">02</span>
              <h2 class="nk-cwsc-act__title">{{ t('cwHub.act2Title', { n: intakeTraits }) }}</h2>
              <p class="nk-cwsc-act__note">{{ t('cwHub.packageNote', { complete: season.packages.complete }) }}</p>
            </div>
            <p class="nk-cwsc-act__lead">{{ t('cwHub.act2Lead') }}</p>
            <div class="nk-cwsc-traits">
              <div v-for="cat in (['faction', 'combat', 'special'] as const)" :key="cat" class="nk-cwsc-traits__col" :data-cat="cat">
                <h3 class="nk-cwsc-traits__label">
                  {{ t(`catalog.traitCat.${cat}`) }}
                  <span class="nk-cwsc-traits__count">{{ season.byCat[cat].length }}</span>
                </h3>
                <ul class="nk-cwsc-traits__list">
                  <li v-for="trait in season.byCat[cat]" :key="trait.id">
                    <RouterLink
                      class="nk-cwsc-trait"
                      :to="trait.href"
                      :data-cat="trait.cat"
                      :data-hl="highlightTraitIds.includes(trait.id) ? '' : undefined"
                      :title="`${trait.name}：${trait.desc}`"
                      @mouseenter="highlightTraitCarriers(trait)"
                      @mouseleave="clearHighlight"
                      @focusin="highlightTraitCarriers(trait)"
                      @focusout="clearHighlight"
                    >
                      <span class="nk-cwsc-trait__no">{{ String(trait.seqCat).padStart(2, '0') }}</span>
                      <span class="nk-cwsc-trait__icon"><img v-bind="iconImgAttrs(trait.icon)" alt="" loading="lazy"></span>
                      <span class="nk-cwsc-trait__name">{{ trait.name }}</span>
                      <span v-if="trait.qualityKeys.length" class="nk-cwsc-trait__quality">{{ t(trait.qualityKeys[trait.qualityKeys.length - 1]!) }}</span>
                      <span class="nk-cwsc-trait__layers">{{ t('cwTrait.layerCount', { n: trait.layers }) }}</span>
                      <span class="nk-cwsc-pkg" :aria-label="t('cwHub.package')">
                        <span
                          v-for="slot in pkgSlots(trait)"
                          :key="slot.key"
                          class="nk-cwsc-pkg__slot"
                          :data-on="slot.on ? '' : undefined"
                          :title="slot.key"
                        ></span>
                      </span>
                      <span v-if="trait.carriers.length" class="nk-cwsc-trait__carriers">{{ t('cwHub.carrierCount', { n: trait.carriers.length }) }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section v-if="intakeRoles" class="nk-cwsc-act" data-act="roles" :aria-label="t('cwHub.act3Title', { n: intakeRoles })">
            <div class="nk-cwsc-act__head">
              <span class="nk-cwsc-act__no" aria-hidden="true">03</span>
              <h2 class="nk-cwsc-act__title">{{ t('cwHub.act3Title', { n: intakeRoles }) }}</h2>
            </div>
            <p class="nk-cwsc-act__lead">{{ t('cwHub.act3Lead') }}</p>
            <ul class="nk-cwsc-roster">
              <li v-for="role in season.roles" :key="role.avatarId">
                <RouterLink
                  class="nk-cwsc-role"
                  :to="role.href"
                  :data-hl="roleNeedsHighlight(role) ? '' : undefined"
                  @mouseenter="highlightRoleTraits(role)"
                  @mouseleave="clearHighlight"
                  @focusin="highlightRoleTraits(role)"
                  @focusout="clearHighlight"
                >
                  <span class="nk-cwsc-role__avatars" :data-multi="role.variants.length > 1 ? '' : undefined">
                    <img
                      v-for="variant in role.variants"
                      :key="variant.id"
                      v-bind="iconImgAttrs(role.avatar)"
                      :alt="role.name"
                      loading="lazy"
                    >
                  </span>
                  <span class="nk-cwsc-role__body">
                    <span class="nk-cwsc-role__line">
                      <span class="nk-cwsc-role__name">{{ role.name }}</span>
                      <span class="nk-cwsc-role__cost">{{ costLabel(role) }}</span>
                      <span v-if="role.positionKey" class="nk-cwsc-role__pos">{{ t(role.positionKey) }}</span>
                    </span>
                    <span v-if="role.traits.length" class="nk-cwsc-role__traits">
                      <span
                        v-for="chip in role.traits"
                        :key="chip.id"
                        class="nk-cwsc-role__trait"
                        :data-cat="chip.cat"
                        :data-new="chip.isNew ? '' : undefined"
                        :data-hl="highlightTraitIds.includes(chip.id) ? '' : undefined"
                        :title="traitChipTitle(chip)"
                      >{{ chip.name }}</span>
                    </span>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <section v-if="season.ledger.length" class="nk-cwsc-act" data-act="ledger" :aria-label="t('cwHub.act4Title')">
            <div class="nk-cwsc-act__head">
              <span class="nk-cwsc-act__no" aria-hidden="true">04</span>
              <h2 class="nk-cwsc-act__title">{{ t('cwHub.act4Title') }}</h2>
            </div>
            <p class="nk-cwsc-act__lead">{{ t('cwHub.act4Lead') }}</p>
            <ul class="nk-cwsc-ledger">
              <li v-for="row in season.ledger" :key="row.key">
                <RouterLink class="nk-cwsc-ledger__row" :to="row.href">
                  <span class="nk-cwsc-ledger__label">{{ t(row.navKey) }}</span>
                  <span class="nk-cwsc-ledger__num">
                    <template v-if="row.season != null">{{ row.season }}<span class="nk-cwsc-ledger__total">/{{ row.total }}</span></template>
                    <template v-else>{{ row.total }}</template>
                  </span>
                  <span v-if="row.season == null" class="nk-cwsc-ledger__note">{{ t('cwHub.equipNote') }}</span>
                  <span class="nk-cwsc-ledger__go" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>
        </template>
        <p v-else class="nk-cwsc-empty">{{ t('cwHub.empty') }}</p>
      </template>
    </main>

    <footer class="nk-hub-footer">
      <div v-if="season" class="nk-cwsc-holds">
        <span class="nk-cwsc-holds__label">{{ t('cwHub.holds') }}</span>
        <RouterLink class="nk-cwsc-hold" to="/currency/role">
          <span class="nk-cwsc-hold__num">{{ season.totals.roles }}</span>
          <span class="nk-cwsc-hold__label">{{ t('nav.cwRole') }}</span>
        </RouterLink>
        <RouterLink class="nk-cwsc-hold" to="/currency/trait">
          <span class="nk-cwsc-hold__num">{{ season.totals.traits }}</span>
          <span class="nk-cwsc-hold__label">{{ t('cwHub.traitsLabel') }}</span>
        </RouterLink>
      </div>
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
    </footer>
  </div>
</template>
