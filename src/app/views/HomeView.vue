<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { useAppStore } from '../stores/app';
import { useReleaseShowcase } from '../composables/use-release-showcase';
import { prefetchHighPriority } from '../router/chunks';
import { SITE_NAME } from '../../lib/constants';
import { cdnFallbackFromPrimary, cdnUri } from '../../services/cdn';
import { STAR_SVG } from '../catalog/pages/shared';
import '../../styles/home.css';

const app = useAppStore();
const { sections, loaded, failedCount, labels, load } = useReleaseShowcase();

/* ── 地面材料 ──
   上一轮去掉品牌带的渐变后，页面剩「两块平色」，用户反馈「缺乏质感」。正解不是把渐变加回来
   （渐变是被门禁逐条记过的机器感来源），而是用**游戏自己的 Wiki 背景图**当地面：
   `bgpic/BgWiki`（1600×900 本地 webp）＝星野 + 左上暖调星云，就是这个站点所对应的那张背景。
   它同时是一张真实美术资产（同一屏里第 5 张真图），且暗到可以直接压字（实测 12px 模糊后
   最亮区对 `--text2` 仍有 5.23:1，故不叠 scrim——少一层渐变就少一条机器感）。
   走 CSS `background-image`（无 error 事件，主源必须直出）：URL 由解析层给，页面不拼路径。 */
const groundUrl = cdnUri('bgpic', 'BgWiki.webp');

/* 本批次的件数（三分区条目之和）：抬头那行 claim 用它，不另写一份文案口径 */
const totalCount = computed(() => sections.value.reduce((n, s) => n + s.count, 0));

/* 三份索引全失败 ⇒「本版本有没有新增」根本不可判定，必须给错误态：
   显示空态等于把一次网络故障写成「本版本暂无新增条目」这句事实陈述。
   只失败一部分 ⇒ 已拿到的分区照常渲染 + 一行说明（静默少一个分区同样会被读成「本版本没有」）。 */
const allFailed = computed(() => labels.length > 0 && failedCount.value >= labels.length);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);

/* ── 「看立绘」：本页唯一的活物 ──
   卡内头像是 376×512 的商店头像，放到整屏也不到原画的一半；角色立绘是 2048²（本地 550KB 量级）。
   故重量放在**按需**：只有点了按钮才取立绘 URL，页面本身不为它付首屏带宽。
   用原生 <dialog showModal()> 而不是自绘遮罩：top layer 不受 `#app { overflow: clip }` 裁切，
   ESC 与焦点收束是浏览器行为（无障碍三件套之外不必再手写一套）。 */
const art = ref<{ src: string; alt: string } | null>(null);
const artDialog = ref<HTMLDialogElement | null>(null);
const artFallback = computed(() => (art.value ? cdnFallbackFromPrimary(art.value.src) : ''));

function openArt(name: string, src?: string): void {
  if (!src) return;
  art.value = { src, alt: name };
  artDialog.value?.showModal();
}
function closeArt(): void {
  artDialog.value?.close();
}
/** 对话框的 aria-label 与按钮同一个键：它描述的是「看谁的立绘」这一件事 */
const artLabel = computed(() => (art.value ? t('home.viewArt', { name: art.value.alt }) : ''));

/* 登记区的美术是**本页正文**（本批次新增条目，全为本地小文件，合计不足 200KB），故按需改为立即取：
   卡内 `<img>` 由共享卡渲染器写成 `loading="lazy"`，而本应用的真实滚动容器是 `#nk-home-app`
   而不是 window —— 首页只渲染本批次的少数条目，「进入视口才取」在这里既让立绘晚到，
   又会在快速滚动时先露出空板。只在首页的登记区改写这一个属性（共享渲染器不动）。 */
function eagerArt(html: string): string {
  return html.replace(/ loading="lazy"/g, ' loading="eager"');
}

/** 大板的回退源（本地缺失时按 分类 → 远端最优源 反查；无回退源返回空串，交给 CSS 占位降级）。 */
function plateFallback(src?: string): string {
  return src ? cdnFallbackFromPrimary(src) : '';
}

onMounted(() => {
  prefetchHighPriority();
  void load();
});
</script>

<template>
  <div id="nk-home-app" :style="{ '--nk-home-ground': `url(${groundUrl})` }">
    <main class="nk-intake">
      <!-- 报头（站名 + 定位）不再是一块「带」：没有底面、没有 210px 盒，直接落在星野上，
           材质从顶端一以贯之（旧品牌带的半透明面板会在 210px 处截断材质，读成一条灰条贴在图上）。
           站名仍是 h1（SEO / 快照守卫 / 首屏导览），但字号降到 28–32px：
           这一页的主语是版本号，不应该是站点名字。 -->
      <header class="nk-hub-masthead">
        <h1 class="nk-hub-masthead__title">{{ SITE_NAME }}</h1>
        <p class="nk-hub-masthead__tagline">{{ t('home.tagline') }}</p>
      </header>

      <!-- 批次抬头：版本号是这一页的主语，故它是首屏最大的字；「版本上新」跟在它旁边当单位，
           不再拿一行小字压在大字上方（旧 LATEST TRANSMISSION 是 eyebrow，已删除）。 -->
      <div class="nk-intake__head">
        <p
          class="nk-intake__batch"
          :aria-label="app.versionLabel ? t('home.releaseTitle', { version: app.versionLabel }) : undefined"
        >
          <span class="nk-intake__batch-num">{{ app.versionLabel || t('home.releaseTitleNoVersion') }}</span>
          <span v-if="app.versionLabel" class="nk-intake__batch-note">{{ t('home.releaseTitleNoVersion') }}</span>
        </p>
        <p v-if="loaded && totalCount > 0" class="nk-intake__claim">
          {{ t('home.batchCount', { n: totalCount }) }}
        </p>
      </div>

      <!-- 加载期：分区标签与卡片位按就绪态的规格占位（桌面 306×408 = 单条目特写档的卡），
           不渲染 `.nk-hub-release__section` —— 该选择器是「数据已就绪」的判定依据。 -->
      <div
        v-if="!loaded"
        class="nk-hub-release__sk"
        role="status"
        aria-live="polite"
        :aria-label="t('home.loadingAria')"
      >
        <div v-for="label in labels" :key="label" class="nk-hub-release__sk-row">
          <div class="nk-hub-release__label">{{ label }}</div>
          <div class="nk-hub-release__sk-band">
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-card" aria-hidden="true"></span>
          </div>
        </div>
      </div>

      <div v-else-if="allFailed" class="nk-error-state" role="alert">
        <div class="nk-error-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div class="nk-error-state__title">{{ t('home.errorTitle') }}</div>
        <div class="nk-error-state__detail">{{ t('home.errorDetail', { labels: labels.join(' / ') }) }}</div>
        <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
      </div>

      <template v-else-if="sections.length">
        <p v-if="partialFailed" class="nk-hub-release__notice" role="status">
          {{ t('home.partialDetail', { n: failedCount }) }}
          <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
        </p>

        <section
          v-for="s in sections"
          :key="s.kind"
          class="nk-hub-release__section"
          :class="{ 'nk-hub-release__section--feature': s.feature }"
          :data-kind="s.kind"
          :aria-label="s.label"
        >
          <div class="nk-hub-release__sechead">
            <h3 class="nk-hub-release__label">{{ s.label }} <span class="nk-hub-release__label-count">{{ s.count }}</span></h3>
            <RouterLink class="nk-hub-release__all" :to="s.listHref">
              {{ t('home.viewAll', { label: s.label }) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </RouterLink>
          </div>
          <div v-if="s.feature" class="nk-hub-release__band nk-hub-release__band--feature">
            <!-- 单条目分区的主图＝该条目自己的大图（角色切入图 / 光锥全图），**不套卡片**：
                 卡片是目录页的语言（角落星标飘带、卡面文字层、渐变遮罩），摆在首页大板尺寸下
                 那些装饰都会放大成噪声；且卡面文字与注释栏必然逐字重复（e2e 已把这类重复记成缺陷）。
                 大板本身仍是入口链接，名字走 alt 与注释栏。 -->
            <div class="nk-hub-release__cell">
              <a
                v-if="s.leadMeta?.plateSrc && s.leadMeta.href"
                class="nk-hub-release__plate"
                :href="s.leadMeta.href"
              >
                <img
                  class="nk-hub-release__plate-img"
                  :src="s.leadMeta.plateSrc"
                  :data-cdn-fallback="plateFallback(s.leadMeta.plateSrc) || undefined"
                  :alt="s.leadMeta.name"
                >
              </a>
            </div>
            <aside
              v-if="s.leadMeta"
              class="nk-hub-release__spec"
              :aria-label="s.leadMeta.name"
            >
              <h4 class="nk-hub-release__spec-name">{{ s.leadMeta.name }}</h4>
              <p
                v-if="s.leadMeta.facts?.length || s.leadMeta.rarity"
                class="nk-hub-release__spec-facts"
              >
                <span v-for="f in s.leadMeta.facts" :key="f" class="nk-hub-release__spec-fact">{{ f }}</span>
                <span
                  v-if="s.leadMeta.rarity"
                  class="nk-hub-release__spec-fact nk-hub-release__spec-rarity"
                  :aria-label="`${t('catalog.filter.rarity')} ${s.leadMeta.rarity}`"
                >
                  <span class="nk-hub-release__spec-star" aria-hidden="true" v-html="STAR_SVG" />{{ s.leadMeta.rarity }}
                </span>
              </p>
              <p v-if="s.leadMeta.brief" class="nk-hub-release__spec-brief" v-html="s.leadMeta.brief"></p>
              <div class="nk-hub-release__spec-acts">
                <RouterLink v-if="s.leadMeta.href" class="nk-hub-release__spec-link" :to="s.leadMeta.href">
                  {{ t('home.viewArchive') }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </RouterLink>
                <button
                  v-if="s.leadMeta.artSrc"
                  class="nk-hub-release__art"
                  type="button"
                  @click="openArt(s.leadMeta.name, s.leadMeta.artSrc)"
                >{{ t('home.viewArt', { name: s.leadMeta.name }) }}</button>
              </div>
            </aside>
          </div>
          <div v-else class="nk-hub-release__band" v-html="eagerArt(s.html)"></div>
        </section>
      </template>
      <p v-else class="nk-hub-release__empty">{{ t('home.empty') }}</p>
    </main>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
    </footer>

    <dialog ref="artDialog" class="nk-intake__art" :aria-label="artLabel" @close="art = null">
      <button class="nk-intake__art-close" type="button" :aria-label="t('home.closeArt')" @click="closeArt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
      <img
        v-if="art"
        class="nk-intake__art-img"
        :src="art.src"
        :data-cdn-fallback="artFallback || undefined"
        :alt="art.alt"
      >
    </dialog>
  </div>
</template>
