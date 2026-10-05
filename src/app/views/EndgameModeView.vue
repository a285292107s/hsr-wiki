<script setup lang="ts">
// 终局玩法详情页（第四种页面形态：单页数据页）。
// 内容 = 官方规则正文（endgame_guide.json 逐字）+ 结构口径（取当期赛季）+ 赛季增益体系（体系名/条数/选法）
// + 当期增益（仅名称与图标）+ 该玩法赛季列表（复用目录页卡片 HTML）+ 其它玩法入口。
// 不使用 nk-snapshot__entry：单页数据页无条目级覆盖率断言（见 docs/agents/ai-discoverability.md）。
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { SITE_NAME } from '../../lib/constants';
import {
  ENDGAME_MODES, endgamePage, mazeStatus, modeDefaultArtUrl,
} from '../catalog/pages/endgame';
import {
  loadLocalBossList, loadLocalEndgameGuide, loadLocalMazeList,
  loadLocalPeakList, loadLocalStoryList,
} from '../../services/api';
import type {
  EndgameGuideDb, EndgameGuideMode, EndgameGuideSection,
  MazeListDb, MazeListEntry,
} from '../../services/types';
import type { CatalogItem } from '../catalog/types';
import { seasonBuffChoiceLabel, seasonBuffCount } from '../endgame/guide';
import '../../styles/endgame.css';
import '../../styles/endgame-mode.css';

const route = useRoute();
const modeKey = computed(() => String(route.params.mode || ''));

const MODE_LIST_LOADERS: Record<string, () => Promise<MazeListDb>> = {
  maze: loadLocalMazeList,
  story: loadLocalStoryList,
  boss: loadLocalBossList,
  peak: loadLocalPeakList,
};

const phase = ref<'loading' | 'ready' | 'error'>('loading');
const error = ref<string | null>(null);
const guide = ref<EndgameGuideDb | null>(null);
const listDb = ref<MazeListDb | null>(null);
/** 目录卡片（与 /endgame 目录页同源同渲染：renderCard 的 HTML 直接复用） */
const seasonCards = ref<CatalogItem[]>([]);

const mode = computed(() => ENDGAME_MODES.find((m) => m.key === modeKey.value) || null);
const guideMode = computed<EndgameGuideMode | null>(() => guide.value?.modes?.[modeKey.value] ?? null);
const system = computed(() => guideMode.value?.system ?? null);
const heroArt = computed(() => modeDefaultArtUrl(modeKey.value));
const otherModes = computed(() => ENDGAME_MODES.filter((m) => m.key !== modeKey.value));

/** 当期赛季 = **正在进行中**的那一期（判据与目录页状态同源 `mazeStatus`）。
 *  目录排序是「最新在前」，而最新一期常常是「未开始」——直接取首位会把**未上线赛季**的层数/增益
 *  当现状陈述（实测 maze 首位 1036 未开始、进行中的是 1035）。赛季间隙里没有进行中的一期，
 *  此时回落到最新一期，并在文案里显式标注状态，避免让读者误以为那就是当期。
 *  赛季 id 从卡片 href（`/endgame/<mode>/<id>`）解析——目录条目本身不带 id 字段。 */
const currentSeasonInfo = computed<{ id: string; entry: MazeListEntry | null; live: boolean }>(() => {
  const pick = (card: CatalogItem | undefined) => {
    const id = String(card?.href || '').split('/').pop() || '';
    return { id, entry: (id && listDb.value?.[id]) || null };
  };
  for (const card of seasonCards.value) {
    const { id, entry } = pick(card);
    if (entry && mazeStatus(entry) === '进行中') return { id, entry, live: true };
  }
  const { id, entry } = pick(seasonCards.value[0]);
  return { id, entry, live: false };
});
const currentSeason = computed<MazeListEntry | null>(() => currentSeasonInfo.value.entry);
const currentSeasonId = computed(() => currentSeasonInfo.value.id);
const currentSeasonLive = computed(() => currentSeasonInfo.value.live);
/** 非进行中时的状态词（未开始 / 已结束 / 未知），用于把「最新一期」说清楚 */
const currentSeasonStatus = computed(
  () => (currentSeason.value ? mazeStatus(currentSeason.value) : '未知'),
);

/** 结构事实（全部取自当期赛季，页面上显式标注「以当期赛季为准」） */
const structure = computed<Array<{ label: string; value: string }>>(() => {
  const s = currentSeason.value;
  if (!s) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const floors = s.floor_details || [];
  if (floors.length) {
    rows.push({ label: '关卡层级', value: `${floors.length} 层` });
    const halfs = (floors[0].stage1 ? 1 : 0) + (floors[0].stage2 ? 1 : 0);
    if (halfs) rows.push({ label: '每层场次', value: `${halfs} 场` });
  }
  const levels = s.levels || [];
  if (levels.length) {
    rows.push({ label: '关卡组成', value: `${levels.length} 关` });
    // 异相仲裁没有「层级」概念，关卡分两类（骑士试炼 / 王棋）——分开列，否则事实栏只剩两格、
    // 与另外三个玩法（4–5 格）疏密失衡，也说不清这 4 关是什么
    const knights = levels.filter((l) => l.kind === 'knight').length;
    const kings = levels.filter((l) => l.kind === 'king').length;
    if (knights) rows.push({ label: '骑士试炼', value: `${knights} 关` });
    if (kings) rows.push({ label: '王棋关卡', value: `${kings} 关` });
    const withTargets = levels.filter((l) => (l.targets || []).length).length;
    if (withTargets) rows.push({ label: '设挑战目标', value: `${withTargets} 关` });
  }
  if (s.countdown) rows.push({ label: '回合上限', value: `${s.countdown} 轮` });
  if (s.clear_score) rows.push({ label: '分数上限', value: String(s.clear_score) });
  rows.push({ label: '星启模式', value: s.tierce ? '含' : '不含' });
  return rows;
});

/**
 * 玩法页**不再列出具体增益条目**（原实现列「当期 N 条」）。
 *
 * 判据（按玩法核对数据后定）：
 * - 条目名每期都换（story 66 / boss 70 / peak 28 个去重名），效果又依赖上下文，属**每期信息**，
 *   归赛季页；常青页列它必然要么过时、要么只能截取一部分。
 * - **boss 是硬错误**：同期上/下半场各有一套（`buff_groups.stage1/stage2`，扁平 `buffs` 只是并集），
 *   原实现取 stage1 那 3 条却以「本期 3 条」呈现 ⇒ 玩家会以为整期只有一套。
 * - maze 的条目名恒定（全期去重只有「记忆紊流」）且与层内同文，列出来是假时钟 + 复述。
 * 故：本页只讲常青规格（条数/时机/作用范围），条目与效果一律由赛季页承载，这里给入口。
 */

/** 正文行：字面量 `\n` 拆行；`●`/`○` 起首的行归入列表（列表外的行按段落） */
const ruleBlocks = computed<Array<{ title: string; paras: string[]; items: string[] }>>(
  () => (guideMode.value?.sections || []).map((sec: EndgameGuideSection) => {
    const lines = sec.text.split('\\n').map((l) => l.trim()).filter(Boolean);
    return {
      title: sec.title,
      paras: lines.filter((l) => !l.startsWith('●') && !l.startsWith('○')),
      items: lines.filter((l) => l.startsWith('●') || l.startsWith('○')).map((l) => l.replace(/^[●○]\s*/, '')),
    };
  }),
);

async function load(): Promise<void> {
  const loader = MODE_LIST_LOADERS[modeKey.value];
  if (!loader) {
    phase.value = 'error';
    error.value = `未知的终局玩法: ${modeKey.value}`;
    return;
  }
  phase.value = 'loading';
  error.value = null;
  try {
    const [guideDb, list, cards] = await Promise.all([
      // 体系名/规则正文取不到时页面仍可用（回退站点工作名 + 只渲染结构口径与赛季列表）
      loadLocalEndgameGuide().catch(() => null),
      loader(),
      endgamePage.fetchData?.({ version: '' }) ?? Promise.resolve([]),
    ]);
    guide.value = guideDb;
    listDb.value = list;
    seasonCards.value = cards.filter((c) => c.mode === modeKey.value);
    document.title = `${mode.value?.label || modeKey.value} - ${SITE_NAME}`;
    phase.value = 'ready';
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
  }
}

onMounted(() => { void load(); });
watch(modeKey, () => { void load(); });

function cardHtml(item: CatalogItem, i: number): string {
  return endgamePage.renderCard ? endgamePage.renderCard(item, i) : '';
}
</script>

<template>
  <div class="nk-page--detail nk-egm" :aria-busy="phase === 'loading'">
    <template v-if="phase === 'ready'">
      <header class="nk-egm__hero" :data-mode="modeKey">
        <nav class="nk-egm__crumbs" aria-label="面包屑">
          <RouterLink to="/">首页</RouterLink>
          <span class="nk-egm__sep">›</span>
          <RouterLink to="/endgame">终局内容</RouterLink>
          <span class="nk-egm__sep">›</span>
          <span>{{ mode?.label }}</span>
        </nav>
        <div class="nk-egm__head">
          <img v-if="heroArt" class="nk-egm__emblem" :src="heroArt" alt="" width="48" height="48">
          <div>
            <h1 class="nk-egm__title">{{ mode?.label }}</h1>
            <p class="nk-egm__en">{{ mode?.en }}</p>
          </div>
        </div>
      </header>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">01</span>玩法规则 RULES</h2>
        <article v-for="(block, bi) in ruleBlocks" :key="bi" class="nk-egm__rule">
          <h3 class="nk-egm__rule-title">{{ block.title }}</h3>
          <p v-for="(p, pi) in block.paras" :key="pi" class="nk-egm__para">{{ p }}</p>
          <ul v-if="block.items.length" class="nk-egm__list">
            <li v-for="(it, ii) in block.items" :key="ii">{{ it }}</li>
          </ul>
        </article>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">02</span>结构口径 STRUCTURE</h2>
        <p class="nk-egm__note">以当期赛季为准（层数与场次历史上变动过，故不取多季统计值）</p>
        <dl class="nk-egm__facts">
          <div v-for="row in structure" :key="row.label" class="nk-egm__fact">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
        <p class="nk-egm__note">
          {{ currentSeasonLive ? '当期赛季' : (currentSeasonStatus === '未知' ? '最新赛季' : `最新赛季（${currentSeasonStatus}）`) }}：<RouterLink class="nk-egm__link" :to="`/endgame/${modeKey}/${currentSeasonId}`">{{ currentSeason?.zh }}</RouterLink>
        </p>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">03</span>{{ system?.name || '赛季增益' }}</h2>
        <!-- 条数与选法是这个区块的**规格**（读者最需要先知道的两件事），故做成可读的规格行，
             不用 0.72rem / --text3 的小字注脚（用户反馈：太小）。 -->
        <p v-if="system" class="nk-egm__system">
          <span class="nk-egm__system-count">每期 {{ seasonBuffCount(guide, modeKey) }} 条</span>
          <span class="nk-egm__system-choice">{{ seasonBuffChoiceLabel(guide, modeKey) }}</span>
        </p>
        <!-- 条目与效果留在赛季页（那里有半场/关卡上下文）：本页给一个明确的入口，不复制一份残缺的清单 -->
        <RouterLink class="nk-guide-link nk-egm__system-cta" :to="`/endgame/${modeKey}/${currentSeasonId}`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          查看{{ currentSeasonLive ? '当期' : '最新' }}赛季（{{ currentSeason?.zh }}）的增益
        </RouterLink>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">04</span>赛季列表 SEASONS</h2>
        <div class="nk-egm__seasons" v-html="seasonCards.map(cardHtml).join('')"></div>
      </section>

      <nav class="nk-egm__others" aria-label="其它玩法">
        <RouterLink v-for="m in otherModes" :key="m.key" class="nk-egm__other" :to="`/endgame/${m.key}`">
          <span class="nk-egm__other-cn">{{ m.label }}</span>
          <span class="nk-egm__other-en">{{ m.en }}</span>
        </RouterLink>
      </nav>
    </template>

    <div v-else-if="phase === 'loading'" class="nk-skeleton nk-skeleton--egm">
      <div class="nk-skeleton__hero nk-skeleton__hero--egm">
        <div class="nk-sk nk-skeleton__hero-panel nk-sk--title"></div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--stat"></div>
        <div class="nk-sk nk-sk--stat"></div>
        <div class="nk-sk nk-sk--stat"></div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state">
      <p class="nk-error-state__title">玩法说明加载失败</p>
      <p class="nk-error-state__desc">{{ error }}</p>
      <button class="nk-error-state__retry" type="button" @click="load">重试</button>
    </div>
  </div>
</template>
