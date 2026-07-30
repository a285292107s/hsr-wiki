<script setup lang="ts">
/**
 * 货币战争模式枢纽页（/currency）
 * 「交换」的落地目标，与 HomeView 对等的"模式之家"。
 * 开场即身份：交易所行情滚动条 + K 线纹理背景 + 金色光斑粒子 + 数据概览条。
 */
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
import { loadLocalCurrencyRoles, loadLocalCurrencySeasons } from '../../services/api';
import type { CurrencySeason } from '../../services/types';

/* ─── 行情滚动条（装饰性：游戏内货币的交易所行情） ─── */
const TICKER = [
  { name: '信用点', pair: 'CREDIT/FRAG', chg: '+2.41%', up: true },
  { name: '宇宙碎片', pair: 'FRAG/AMBER', chg: '-0.83%', up: false },
  { name: '灵感', pair: 'IDEA/CREDIT', chg: '+5.12%', up: true },
  { name: '幸运硬币', pair: 'LUCK/FRAG', chg: '+1.07%', up: true },
  { name: '琥珀王币', pair: 'AMBER/CREDIT', chg: '-1.96%', up: false },
  { name: '星琼', pair: 'JADE/AMBER', chg: '+0.64%', up: true },
  { name: '黑塔币', pair: 'HERTA/FRAG', chg: '+3.35%', up: true },
  { name: '冬城盾', pair: 'SHIELD/CREDIT', chg: '-0.42%', up: false },
];
/** 复制一份实现无缝循环（track 位移 -50%） */
const tickerLoop = [...TICKER, ...TICKER];

/* ─── K 线纹理（确定性伪随机高度，纯装饰） ─── */
const CANDLES = Array.from({ length: 56 }, (_, i) => {
  const h = 16 + Math.abs(Math.sin(i * 1.71) * 58 + Math.sin(i * 0.53) * 30);
  return { h: Math.min(Math.round(h), 92), up: Math.sin(i * 2.3 + 1) > -0.25 };
});

/* ─── 金色光斑粒子 ─── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.9 + 4) % 96,
  top: 10 + ((i * 19) % 62),
  size: i % 4 === 0 ? 5 : 3,
  delay: +((i * 0.63) % 4).toFixed(2),
  dur: 3.6 + (i % 4) * 0.9,
}));

/* ─── 数据概览（驱动自转换产物，随版本自动更新） ─── */
const stats = ref({ roles: 0, traits: 0, equip: 0, version: '—' });

/* ─── 赛季扩充说明（驱动自 season 转换器产物） ─── */
const seasons = ref<CurrencySeason[]>([]);

/** 数字滚动（rAF · 900ms ease-out） */
function countUp(key: 'roles' | 'traits' | 'equip', target: number): void {
  const t0 = performance.now();
  const dur = 900;
  const tick = (now: number): void => {
    const p = Math.min((now - t0) / dur, 1);
    stats.value[key] = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

onMounted(async () => {
  try {
    const data = await loadLocalCurrencyRoles();
    const traitSet = new Set<number>();
    let equip = 0;
    for (const r of data.roles) {
      for (const t of r.trait_list) traitSet.add(t);
      if (r.equipment_id != null) equip++;
    }
    countUp('roles', data.roles.length);
    countUp('traits', traitSet.size);
    countUp('equip', equip);
    // 版本来自本地转换产物（converter 从赛季标题 TextMap 提取）
    stats.value.version = data.version && data.version !== 'local' ? `v${data.version}` : '—';
  } catch {
    /* 离线降级：统计保持 0，页面结构仍完整 */
  }

  try {
    const sData = await loadLocalCurrencySeasons();
    seasons.value = sData.seasons ?? [];
  } catch {
    /* 离线降级：赛季说明不展示，不影响其它板块 */
  }
});

/* ─── 板块入口（角色图鉴已上线，其余占位） ─── */
const LIVE_PATHS = new Set(['/currency/role']);
const sections = CW_NAV_ITEMS.map((s) => ({ ...s, live: LIVE_PATHS.has(s.path) }));

/* ─── 赛季扩充说明文本解析 ───
   数据管线约定：JSON 中以字面 \n（反斜杠+n）分隔段落，与其余数据一致，
   前端负责转渲染。此处按字面 \n 切分（(?:\\n)+ 合并连续换行）。 */
/** 正文 → 段落数组 */
function bodyParas(s: CurrencySeason): string[] {
  return s.body.split(/(?:\\n)+/).map((p) => p.trim()).filter(Boolean);
}
/** 概览 → { heading, items }（▌标题行 + ● 条目行；缺失返回 null） */
function overviewOf(s: CurrencySeason): { heading: string; items: string[] } | null {
  if (!s.overview) return null;
  const lines = s.overview.split(/(?:\\n)+/).map((l) => l.trim()).filter(Boolean);
  let heading = '';
  const items: string[] = [];
  for (const l of lines) {
    if (l.startsWith('▌')) { heading = l.replace(/^▌\s*/, ''); continue; }
    items.push(l.replace(/^●\s*/, ''));
  }
  return { heading: heading || '扩充内容概览', items };
}
/** 预解析赛季 → 段落 + 概览，避免模板内重复计算 */
const seasonViews = computed(() =>
  seasons.value.map((s) => ({
    id: s.id,
    title: s.title,
    paras: bodyParas(s),
    overview: overviewOf(s),
  })),
);
</script>

<template>
  <div id="nk-cwhub-app">
    <!-- ═══ 行情滚动条：交易所式开场 ═══ -->
    <div class="nk-cwhub-ticker" aria-hidden="true">
      <div class="nk-cwhub-ticker__track">
        <span
          v-for="(t, i) in tickerLoop"
          :key="i"
          class="nk-cwhub-ticker__item"
          :class="t.up ? 'is-up' : 'is-down'"
        ><b>{{ t.name }}</b>&nbsp;{{ t.pair }}&nbsp;<i>{{ t.chg }}</i><em>◆</em></span>
      </div>
    </div>

    <!-- ═══ 主视觉区：K 线纹理 + 金色光斑 + 标题 + 数据概览 ═══ -->
    <header class="nk-cwhub-hero">
      <div class="nk-cwhub-hero__candles" aria-hidden="true">
        <span
          v-for="(c, i) in CANDLES"
          :key="i"
          class="nk-cwhub-candle"
          :class="{ 'is-up': c.up }"
          :style="{ height: c.h + 'px', animationDelay: ((i * 0.13) % 3.2).toFixed(2) + 's' }"
        ></span>
      </div>
      <div class="nk-cwhub-hero__particles" aria-hidden="true">
        <span
          v-for="(p, i) in PARTICLES"
          :key="i"
          class="nk-cwhub-particle"
          :style="{
            left: p.left + '%', top: p.top + '%',
            width: p.size + 'px', height: p.size + 'px',
            animationDelay: p.delay + 's', animationDuration: p.dur + 's',
          }"
        ></span>
      </div>
      <div class="nk-cwhub-hero__glow" aria-hidden="true"></div>

      <div class="nk-cwhub-hero__content">
        <div class="nk-cwhub-hero__kicker">GRIDFIGHT // 模拟宇宙 · 黄金与机械</div>
        <h1 class="nk-cwhub-hero__title">货币战争</h1>
        <div class="nk-cwhub-hero__en">CURRENCY&nbsp;WAR</div>
        <p class="nk-cwhub-hero__tagline">
          以琥珀王之名，让财富流动——信用点、灵感与运气的终极博弈场。
          收录星际和平公司认证的全部参赛者档案与投资策略。
        </p>
      </div>

      <div class="nk-cwhub-stats" role="group" aria-label="数据概览">
        <div class="nk-cwhub-stat">
          <span class="nk-cwhub-stat__val">{{ stats.roles }}</span>
          <span class="nk-cwhub-stat__label">收录角色</span>
        </div>
        <div class="nk-cwhub-stat">
          <span class="nk-cwhub-stat__val">{{ stats.traits }}</span>
          <span class="nk-cwhub-stat__label">羁绊特质</span>
        </div>
        <div class="nk-cwhub-stat">
          <span class="nk-cwhub-stat__val">{{ stats.equip }}</span>
          <span class="nk-cwhub-stat__label">预设光锥</span>
        </div>
        <div class="nk-cwhub-stat">
          <span class="nk-cwhub-stat__val">{{ stats.version }}</span>
          <span class="nk-cwhub-stat__label">数据版本</span>
        </div>
      </div>
    </header>

    <!-- ═══ 五大板块入口 ═══ -->
    <nav class="nk-cwhub-sections" aria-label="货币战争板块">
      <div class="nk-cwhub-sections__head">
        <span class="nk-cwhub-sections__label">SECTORS</span>
        <span class="nk-cwhub-sections__line"></span>
        <span class="nk-cwhub-sections__count">0{{ sections.length }}</span>
      </div>
      <div class="nk-cwhub-sections__grid">
        <RouterLink
          v-for="(s, i) in sections"
          :key="s.path"
          :to="s.path"
          class="nk-cwhub-card"
          :class="{ 'nk-cwhub-card--featured': s.live }"
          :style="{ '--i': i }"
        >
          <div class="nk-cwhub-card__sheen"></div>
          <span class="nk-cwhub-card__badge" :class="s.live ? 'is-live' : 'is-soon'">
            {{ s.live ? 'LIVE' : 'SOON' }}
          </span>
          <div class="nk-cwhub-card__icon" v-html="s.icon"></div>
          <div class="nk-cwhub-card__body">
            <div class="nk-cwhub-card__cn">{{ s.title }}</div>
            <div class="nk-cwhub-card__en">{{ s.en }}</div>
            <div class="nk-cwhub-card__desc">{{ s.desc }}</div>
          </div>
          <svg
            class="nk-cwhub-card__arrow"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"
          ><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
        </RouterLink>
      </div>
    </nav>

    <!-- ═══ 赛季扩充说明（正文 + 扩充内容概览补充） ═══ -->
    <section v-if="seasonViews.length" class="nk-cwhub-season" aria-label="赛季扩充说明">
      <div class="nk-cwhub-season__head">
        <span class="nk-cwhub-season__label">SEASON&nbsp;INTEL</span>
        <span class="nk-cwhub-season__line"></span>
        <span class="nk-cwhub-season__count">{{ seasonViews.length }}</span>
      </div>
      <article
        v-for="s in seasonViews"
        :key="s.id"
        class="nk-cwhub-season__card"
      >
        <span class="nk-cwhub-season__tag">赛季扩充说明</span>
        <h2 class="nk-cwhub-season__title">{{ s.title }}</h2>
        <div class="nk-cwhub-season__cols">
          <div class="nk-cwhub-season__body">
            <p v-for="(p, i) in s.paras" :key="i">{{ p }}</p>
          </div>
          <aside
            v-if="s.overview"
            class="nk-cwhub-season__overview"
            aria-label="扩充内容概览"
          >
            <div class="nk-cwhub-season__ov-head">
              <span class="nk-cwhub-season__ov-bar" aria-hidden="true"></span>
              <span class="nk-cwhub-season__ov-title">{{ s.overview.heading }}</span>
              <span class="nk-cwhub-season__ov-en">EXPANSION&nbsp;OVERVIEW</span>
            </div>
            <ul class="nk-cwhub-season__ov-list">
              <li
                v-for="(it, i) in s.overview.items"
                :key="i"
                class="nk-cwhub-season__ov-item"
                :style="{ '--i': i }"
              >
                <span class="nk-cwhub-season__ov-dot" aria-hidden="true">◆</span>
                <span class="nk-cwhub-season__ov-text">{{ it }}</span>
              </li>
            </ul>
          </aside>
        </div>
      </article>
    </section>

    <footer class="nk-cwhub-footer">DATA SOURCE — TurnBasedGameData · GRIDFIGHT</footer>
  </div>
</template>
