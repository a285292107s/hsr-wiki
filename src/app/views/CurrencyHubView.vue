<script setup lang="ts">
/**
 * 货币战争模式枢纽页（/currency）
 * 「交换」的落地目标，与 HomeView 对等的"模式之家"。
 *
 * 反 AI 味重构约束（后续 AI 必须遵守）：
 * - 禁止霓虹 glow（text-shadow 0 0 / box-shadow 0 0）、禁止 div 合成装饰（K 线/粒子/扫光），
 *   视觉资产 = 真实官方货币图标（items.json 驱动 + CDN 双源，itemIconUrl 唯一入口）
 * - 禁止装饰字符（◆ / // 斜杠）、禁止编号型 eyebrow（SECTION 01 类）、禁止 em-dash（—）
 * - 行情涨跌幅原为编造数据，已随重构移除；禁止在本页新增任何伪造数字
 */
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
import { itemIconUrl } from '../../lib/format';
import {
  loadLocalItems, loadLocalCurrencyRoles, loadLocalCurrencySeasons, loadLocalCurrencyEquipment,
  loadLocalCurrencyPortals, loadLocalCurrencyAugments, loadLocalCurrencyTraits,
} from '../../services/api';
import type { CurrencySeason, LocalItemEntry } from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

/* ─── 铸币档案：官方货币白名单（items.json 实测 ID，缺失自动剔除；禁伪造替代） ───
   9 枚 3×3 金库陈列：星琼/信用点/古老梦华/宇宙碎片/灵感/黑塔币/冬城盾/巡镝/金表钞 */
const COIN_IDS = [1, 2, 3, 31, 281018, 120000, 120001, 120002, 120003];

interface CoinEntry { id: number; name: string; icon: string; }

const coins = ref<CoinEntry[]>([]);
/** 铸币名录滚动条：与铸币墙同源（数据驱动，无编造行情） */
const tickerLoop = computed(() => [...coins.value, ...coins.value]);

/* ─── 数据概览（驱动自转换产物，随版本自动更新） ─── */
const stats = ref({ roles: 0, equip: 0, portals: 0, augments: 0, traits: 0 });

/** 数据行配置：结算单式排版，逐项渲染 + 交错入场 */
const STAT_DEFS: ReadonlyArray<{ key: keyof typeof stats.value; code: string; label: string }> = [
  { key: 'roles', code: 'ROLE', label: '角色' },
  { key: 'equip', code: 'EQUIP', label: '装备' },
  { key: 'portals', code: 'PORTAL', label: '投资环境' },
  { key: 'augments', code: 'AUGMENT', label: '投资策略' },
  { key: 'traits', code: 'TRAIT', label: '羁绊' },
];

/* ─── 赛季扩充说明（驱动自 season 转换器产物） ─── */
const seasons = ref<CurrencySeason[]>([]);

/** 数字滚动（rAF · 900ms ease-out；数据反馈动效，有动机允许保留） */
type StatKey = keyof typeof stats.value;
function countUp(key: StatKey, target: number): void {
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
    const items = await loadLocalItems();
    coins.value = COIN_IDS
      .map((id) => items.find((it: LocalItemEntry) => it.id === id))
      .filter((it): it is LocalItemEntry => Boolean(it))
      .map((it) => ({ id: it.id, name: it.name, icon: itemIconUrl(it.icon) }));
  } catch {
    /* 离线降级：铸币墙与滚动条不展示，页面结构仍完整 */
  }

  try {
    const [rolesData, equipData, portalsData, augmentsData, traitsData] = await Promise.all([
      loadLocalCurrencyRoles(),
      loadLocalCurrencyEquipment(),
      loadLocalCurrencyPortals(),
      loadLocalCurrencyAugments(),
      loadLocalCurrencyTraits(),
    ]);
    countUp('roles', rolesData.roles.length);
    countUp('equip', equipData.items.length);
    countUp('portals', portalsData.portals.filter((p) => p.in_book).length);
    countUp('augments', augmentsData.augments.length);
    countUp('traits', traitsData.traits.length);
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
    <!-- ═══ 铸币名录滚动条：与铸币墙同源的官方货币带（纯文字，禁图标 - 与铸币墙 9 张并发会触发 jsDelivr gh 限流挂起） ═══ -->
    <div v-if="coins.length" class="nk-cwhub-ticker" aria-hidden="true">
      <div class="nk-cwhub-ticker__track">
        <span v-for="(c, i) in tickerLoop" :key="i" class="nk-cwhub-ticker__item">
          <b>{{ c.name }}</b>
        </span>
      </div>
    </div>

    <!-- ═══ 主视觉区：标题 + 金库铸币墙 + 结算单数据 ═══ -->
    <header class="nk-cwhub-hero">
      <div class="nk-cwhub-hero__content">
        <div class="nk-cwhub-hero__kicker">模拟宇宙 · 黄金与机械</div>
        <h1 class="nk-cwhub-hero__title">货币战争</h1>
        <div class="nk-cwhub-hero__en">CURRENCY WAR</div>
        <p class="nk-cwhub-hero__tagline">
          以琥珀王之名，让财富流动。收录星际和平公司认证的全部参赛者档案与投资策略。
        </p>
      </div>

      <div v-if="coins.length" class="nk-cwhub-vault" aria-label="货币档案">
        <div
          v-for="(c, i) in coins"
          :key="c.id"
          class="nk-cwhub-coin"
          :style="{ '--i': i }"
        >
          <div class="nk-cwhub-coin__plate"><img :src="c.icon" :alt="c.name" loading="lazy"></div>
          <div class="nk-cwhub-coin__id">{{ c.id }}</div>
          <div class="nk-cwhub-coin__name">{{ c.name }}</div>
        </div>
      </div>

      <div class="nk-cwhub-stats" role="group" aria-label="数据概览">
        <div
          v-for="(s, i) in STAT_DEFS"
          :key="s.key"
          class="nk-cwhub-stat"
          :style="{ '--i': i }"
        >
          <span class="nk-cwhub-stat__code">{{ s.code }}</span>
          <span class="nk-cwhub-stat__val">{{ stats[s.key] }}</span>
          <span class="nk-cwhub-stat__label">{{ s.label }}</span>
        </div>
      </div>
    </header>

    <!-- ═══ 五大板块入口 ═══ -->
    <nav class="nk-cwhub-sections" aria-label="货币战争板块">
      <div class="nk-cwhub-sections__bar" aria-hidden="true"></div>
      <div class="nk-cwhub-sections__grid">
        <RouterLink
          v-for="(s, i) in sections"
          :key="s.path"
          :to="s.path"
          class="nk-cwhub-card"
          :class="{ 'nk-cwhub-card--featured': s.live }"
          :style="{ '--i': i }"
        >
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

    <!-- ═══ 赛季扩充说明（正文 + 扩充内容概览） ═══ -->
    <section v-if="seasonViews.length" class="nk-cwhub-season" aria-label="赛季扩充说明">
      <div class="nk-cwhub-season__bar" aria-hidden="true"></div>
      <article
        v-for="s in seasonViews"
        :key="s.id"
        class="nk-cwhub-season__card"
      >
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
              <span class="nk-cwhub-season__ov-title">{{ s.overview.heading }}</span>
            </div>
            <ul class="nk-cwhub-season__ov-list">
              <li
                v-for="(it, i) in s.overview.items"
                :key="i"
                class="nk-cwhub-season__ov-item"
                :style="{ '--i': i }"
              >
                <span class="nk-cwhub-season__ov-text">{{ it }}</span>
              </li>
            </ul>
          </aside>
        </div>
      </article>
    </section>

    <footer class="nk-cwhub-footer">DATA SOURCE · TurnBasedGameData GRIDFIGHT</footer>
  </div>
</template>