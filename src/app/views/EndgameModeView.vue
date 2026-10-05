<script setup lang="ts">
// 终局玩法详情页（第四种页面形态：单页数据页）。
// 内容 = 官方规则正文（endgame_guide.json 逐字）+ 结构口径（取当期赛季）+ 赛季增益体系（体系名/条数/选法）
// + 当期增益（仅名称与图标）+ 该玩法赛季列表（复用目录页卡片 HTML）+ 其它玩法入口。
// 不使用 nk-snapshot__entry：单页数据页无条目级覆盖率断言（见 docs/agents/ai-discoverability.md）。
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { SITE_NAME } from '../../lib/constants';
import {
  ENDGAME_MODES, endgamePage, modeDefaultArtUrl,
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
import { buffIconUrl, BUFF_ICON_FALLBACK } from '../endgame/renders';
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

/** 当期赛季 = 目录排序第一位（结构口径与当期增益都以它为准；层数历史上变过，禁用多季众数）。
 *  赛季 id 从卡片 href（`/endgame/<mode>/<id>`）解析——目录条目本身不带 id 字段。 */
const currentSeason = computed<MazeListEntry | null>(() => {
  const href = String(seasonCards.value[0]?.href || '');
  const id = href.split('/').pop() || '';
  return (id && listDb.value?.[id]) || null;
});
const currentSeasonId = computed(() => String(seasonCards.value[0]?.href || '').split('/').pop() || '');

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
  if (levels.length) rows.push({ label: '关卡组成', value: `${levels.length} 关` });
  if (s.countdown) rows.push({ label: '回合上限', value: `${s.countdown} 轮` });
  if (s.clear_score) rows.push({ label: '分数上限', value: String(s.clear_score) });
  rows.push({ label: '星启模式', value: s.tierce ? '含' : '不含' });
  return rows;
});

/** 当期增益（D6：只输出名称与图标，不输出 desc——避免快照里出现未展开的 #N[i] 占位） */
const currentBuffs = computed(() => {
  const s = currentSeason.value;
  if (!s) return [];
  if (modeKey.value === 'peak') {
    const king = (s.levels || []).find((l) => l.kind === 'king') || (s.levels || []).slice(-1)[0];
    return king?.buffs || [];
  }
  if (modeKey.value === 'boss') {
    // 「每场战斗 3 选 1」必须取分场次表：扁平 buffs 是 1∪2 的并集（20 季 6 条、2 季 5 条）
    return s.buff_groups?.stage1 || [];
  }
  return s.buffs || [];
});

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
          当期赛季：<RouterLink class="nk-egm__link" :to="`/endgame/${modeKey}/${currentSeasonId}`">{{ seasonCards[0]?.name }}</RouterLink>
        </p>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">03</span>{{ system?.name || '赛季增益' }}</h2>
        <p v-if="system" class="nk-egm__note">
          本期 {{ seasonBuffCount(guide, modeKey) }} 条 · {{ seasonBuffChoiceLabel(guide, modeKey) }}
        </p>
        <ul v-if="currentBuffs.length" class="nk-egm__buffs">
          <li v-for="b in currentBuffs" :key="b.id" class="nk-egm__buff">
            <img v-if="b.icon" :src="buffIconUrl(b)" :alt="b.name" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
            <span class="nk-egm__buff-name">{{ b.name }}</span>
          </li>
        </ul>
        <p v-else class="nk-egm__note">当期赛季没有增益记录。</p>
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
