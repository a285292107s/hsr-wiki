<script setup lang="ts">
/**
 * 货币战争模式枢纽页（/currency）
 * 「交换」的落地目标，与 HomeView 对等的"模式之家"。
 *
 * 叙事定位（V3 重构：冷峻档案馆调性，玩法研究见 docs/currency-war-season-expansion.md）：
 * 货币战争 = 自走棋常驻玩法；「货币」仅为经济表皮（费用/利息/刷新牌库），玩法核心是
 * 羁绊构筑 + 前后台站位 + 投资策略博弈。V3 视觉 = 档案编目：超大排版 + 发丝线 +
 * 账面式阵容表 + 目录行索引 + 近乎零入场动画（反 AI 模板味，高级感来自静态精确）：
 * - 主视觉 = 阵容档案表（真实角色数据，01-10 编号，4 前台 + 6 后台），费用即货币语义落点
 * - 板块入口 = 目录行索引（01-05 序号 + 收录计数），分布统计在机制泳道展示
 * 禁令（后续 AI 必须遵守）：禁止回归铸币墙/行情式视觉（行情曾为编造数据已移除，两次废弃）；
 * 禁止霓虹 glow、div 合成装饰、装饰字符、em-dash、装饰性 eyebrow；
 * 序号/收录数字属于档案编号（数据锚点），允许使用（V2 禁令「编号型 eyebrow」按此语义修订）。
 */
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
import {
  avatarShopIconUrl, gridFightIconUrl, gridFightEquipIconUrl, gridFightTraitIconById,
} from '../../lib/format';
import {
  loadLocalCurrencyRoles, loadLocalCurrencySeasons, loadLocalCurrencyEquipment,
  loadLocalCurrencyPortals, loadLocalCurrencyAugments, loadLocalCurrencyTraits,
} from '../../services/api';
import type { CurrencySeason, CurrencyRoleEntry } from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

/* ─── 板块入口：5 板块全部上线（路由与目录页配置均已注册，无占位） ─── */
const sections = CW_NAV_ITEMS;

/* ─── 图鉴收录统计（驱动自转换产物，随版本自动更新） ─── */
const stats = ref({ roles: 0, equip: 0, portals: 0, augments: 0, traits: 0 });

/* ─── 阵容档案表：真实角色阵容（货币战争区别于常规自走棋的标志性特征） ───
   阵容选取规则（客观可断言，数据固定则结果固定）：
   全角色按 (rarity 降序, id 升序) 排序取前 10；前 4 = 前台（正面作战，暖金槽），
   后 6 = 后台（自动施放技能，冷蓝槽）。rarity 即招募费用（1-5 金币）。 */
interface RosterSlot { id: number; name: string; avatar: string; rarity: number; i: number; no: string; }
const roster = ref<{ front: RosterSlot[]; back: RosterSlot[] }>({ front: [], back: [] });

/** 费用图例：白绿蓝紫金对应 1-5 费（招募费用语义） */
const COST_LEGEND = [
  { cost: 1, name: '白' }, { cost: 2, name: '绿' }, { cost: 3, name: '蓝' },
  { cost: 4, name: '紫' }, { cost: 5, name: '金' },
] as const;

function rosterSlot(r: CurrencyRoleEntry, i: number): RosterSlot {
  /* no = 档案编号（02 位补零，数据锚点非装饰） */
  return { id: r.id, name: r.name, avatar: avatarShopIconUrl(r.avatar_id || r.id), rarity: r.rarity, i, no: String(i + 1).padStart(2, '0') };
}

/* ─── 机制导览：玩法要点 + 真实统计徽章（费用/站位/羁绊分类分布），全部来自转换产物 ─── */
interface MechRow {
  label: string;
  desc: string;
  href: string;
  badges: string[];
  icon: string;
  iconAlt: string;
}
const mechs = ref<MechRow[]>([]);

/** 站位/羁绊分类中文标签（与目录页保持同义） */
const FB_LABEL: Record<string, string> = { Front: '前台', Back: '后台', Both: '前后台' };
const CAT_LABEL: Record<string, string> = { faction: '阵营', combat: '流派', special: '特殊' };

function countBy<T>(arr: T[], pick: (t: T) => string | number): Record<string, number> {
  const m: Record<string, number> = {};
  arr.forEach((t) => { const k = String(pick(t)); m[k] = (m[k] || 0) + 1; });
  return m;
}

/** 图片加载失败降级：隐藏图标位（行/槽位结构保持完整） */
function hideImg(e: Event): void {
  (e.target as HTMLImageElement).style.display = 'none';
}

/* ─── 赛季扩充说明（驱动自 season 转换器产物） ─── */
const seasons = ref<CurrencySeason[]>([]);

/** 数字滚动（rAF · 900ms ease-out；数据加载完成后的反馈动效，一次执行非循环）；
 *  prefers-reduced-motion 时直落终值 */
const REDUCE_MOTION = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
type StatKey = keyof typeof stats.value;

/** 目录索引行 → 统计键映射（收录计数并入索引行，CPA_ONLY 顺序与 CW_NAV_ITEMS 一致） */
const ROW_STAT: Record<string, StatKey> = {
  '/currency/role': 'roles',
  '/currency/item': 'equip',
  '/currency/buff': 'portals',
  '/currency/augment': 'augments',
  '/currency/trait': 'traits',
};

function countUp(key: StatKey, target: number): void {
  if (REDUCE_MOTION) { stats.value[key] = target; return; }
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
    const [rolesData, equipData, portalsData, augmentsData, traitsData] = await Promise.all([
      loadLocalCurrencyRoles(),
      loadLocalCurrencyEquipment(),
      loadLocalCurrencyPortals(),
      loadLocalCurrencyAugments(),
      loadLocalCurrencyTraits(),
    ]);

    /* 图鉴收录统计（口径与各目录页一致） */
    countUp('roles', rolesData.roles.length);
    countUp('equip', equipData.items.length);
    countUp('portals', portalsData.portals.filter((p) => p.in_book).length);
    countUp('augments', augmentsData.augments.length);
    countUp('traits', traitsData.traits.length);

    /* 战术棋盘阵容（规则见上方注释） */
    const picked = [...rolesData.roles]
      .sort((a, b) => (b.rarity - a.rarity) || (a.id - b.id))
      .slice(0, 10);
    roster.value = {
      front: picked.slice(0, 4).map((r, i) => rosterSlot(r, i)),
      back: picked.slice(4).map((r, i) => rosterSlot(r, i + 4)),
    };

    /* 机制导览：真实分布统计 + 官方素材示例（示例取法均按固定规则，禁随机） */
    const costD = countBy(rolesData.roles, (r) => r.rarity);
    const fbD = countBy(rolesData.roles, (r) => r.front_back_type ?? 'Both');
    const catD = countBy(traitsData.traits, (t) => t.cat);
    const topRole = picked[0];
    const backRole = rolesData.roles.find((r) => r.front_back_type === 'Back') ?? rolesData.roles[0];
    const factionTrait = traitsData.traits.find((t) => t.cat === 'faction') ?? traitsData.traits[0];
    const firstEquip = equipData.items.find((it) => it.category) ?? equipData.items[0];
    const firstPortal = portalsData.portals.find((p) => p.in_book);
    const firstAugment = augmentsData.augments[0];
    const portalCount = portalsData.portals.filter((p) => p.in_book).length;

    mechs.value = [
      {
        label: '招募与升星', href: '/currency/role',
        desc: '消耗金币招募员工，三张同名合成升星，最高 3 星',
        badges: [1, 2, 3, 4, 5].map((c) => `${c}费 ×${costD[c] ?? 0}`),
        icon: avatarShopIconUrl(topRole.avatar_id || topRole.id), iconAlt: topRole.name,
      },
      {
        label: '站位与赋能', href: '/currency/role',
        desc: '前台正面作战，后台自动施放技能，站对位置激活赋能',
        badges: ['Front', 'Back', 'Both'].map((k) => `${FB_LABEL[k]} ×${fbD[k] ?? 0}`),
        icon: avatarShopIconUrl(backRole.avatar_id || backRole.id), iconAlt: backRole.name,
      },
      {
        label: '羁绊联动', href: '/currency/trait',
        desc: '凑齐同羁绊角色激活层级加成，人数越多效果越强',
        badges: ['faction', 'combat', 'special'].map((k) => `${CAT_LABEL[k]} ×${catD[k] ?? 0}`),
        icon: gridFightTraitIconById(factionTrait.id), iconAlt: factionTrait.name,
      },
      {
        label: '装备合成', href: '/currency/item',
        desc: '两件简易装备合成进阶装备，提供属性与独特效果',
        badges: [`收录 ×${equipData.items.length}`],
        icon: gridFightEquipIconUrl(firstEquip.icon), iconAlt: firstEquip.name,
      },
      {
        label: '投资环境', href: '/currency/buff',
        desc: '对局环境增益，开局选定影响整局走向',
        badges: [`环境 ×${portalCount}`],
        icon: firstPortal ? gridFightIconUrl(firstPortal.icon) : '', iconAlt: firstPortal?.title ?? '',
      },
      {
        label: '投资策略', href: '/currency/augment',
        desc: '局内策略强化，围绕一个强化构筑成型',
        badges: [`策略 ×${augmentsData.augments.length}`],
        icon: firstAugment ? gridFightIconUrl(firstAugment.icon) : '', iconAlt: firstAugment?.name ?? '',
      },
    ];
  } catch {
    /* 离线降级：统计保持 0，棋盘/机制不展示，页面结构仍完整 */
  }

  try {
    const sData = await loadLocalCurrencySeasons();
    seasons.value = sData.seasons ?? [];
  } catch {
    /* 离线降级：赛季说明不展示，不影响其它板块 */
  }
});

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
    <!-- ═══ 档案头部：左超大排版（唯一 REC 标签） + 右阵容档案表（真实角色数据账面） ═══ -->
    <header class="nk-cwhub-hero">
      <div class="nk-cwhub-hero__content">
        <div class="nk-cwhub-hero__rec" aria-hidden="true">REC · GRIDFIGHT / CURRENCY WAR</div>
        <h1 class="nk-cwhub-hero__title">货币战争</h1>
        <p class="nk-cwhub-hero__tagline">
          赢者通吃的零和博弈。招募、羁绊、站位、策略，构筑你的最强阵容。
        </p>
      </div>

      <!-- 阵容档案表：4 前台 + 6 后台，档案编号 01-10（真实角色数据，全页唯一入场序列） -->
      <div v-if="roster.front.length" class="nk-cwhub-ledger" aria-label="阵容档案：四前台六后台">
        <div class="nk-cwhub-ledger__head">
          <span class="nk-cwhub-ledger__title">阵容档案</span>
          <span class="nk-cwhub-ledger__meta">收录 10 · 4 前台 + 6 后台</span>
        </div>

        <div class="nk-cwhub-ledger__zone nk-cwhub-ledger__zone--front">
          <div class="nk-cwhub-ledger__cols" aria-hidden="true">
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--no">编号</span>
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--unit">单位</span>
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--cost">费</span>
          </div>
          <div class="nk-cwhub-ledger__row">
            <RouterLink
              v-for="c in roster.front" :key="c.id" :to="`/currency/role/${c.id}`"
              class="nk-cwhub-ledger__slot" :style="{ '--i': c.i }"
            >
              <span class="nk-cwhub-ledger__no">{{ c.no }}</span>
              <img class="nk-cwhub-ledger__avatar" :src="c.avatar" :alt="c.name" loading="lazy">
              <span class="nk-cwhub-ledger__name">{{ c.name }}</span>
              <span class="nk-cwhub-ledger__cost" :class="`is-${c.rarity}`">{{ c.rarity }}</span>
            </RouterLink>
          </div>
        </div>

        <div class="nk-cwhub-ledger__zone nk-cwhub-ledger__zone--back">
          <div class="nk-cwhub-ledger__cols" aria-hidden="true">
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--no">编号</span>
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--unit">单位</span>
            <span class="nk-cwhub-ledger__col nk-cwhub-ledger__col--cost">费</span>
          </div>
          <div class="nk-cwhub-ledger__row">
            <RouterLink
              v-for="c in roster.back" :key="c.id" :to="`/currency/role/${c.id}`"
              class="nk-cwhub-ledger__slot" :style="{ '--i': c.i }"
            >
              <span class="nk-cwhub-ledger__no">{{ c.no }}</span>
              <img class="nk-cwhub-ledger__avatar" :src="c.avatar" :alt="c.name" loading="lazy">
              <span class="nk-cwhub-ledger__name">{{ c.name }}</span>
              <span class="nk-cwhub-ledger__cost" :class="`is-${c.rarity}`">{{ c.rarity }}</span>
            </RouterLink>
          </div>
        </div>

        <!-- 费用注脚：1-5 费 = 招募费用（白绿蓝紫金），货币语义在此落点 -->
        <div class="nk-cwhub-ledger__legend" aria-hidden="true">
          <span class="nk-cwhub-ledger__legend-cap">COST</span>
          <span v-for="f in COST_LEGEND" :key="f.cost" class="nk-cwhub-ledger__legend-item">
            <i class="nk-cwhub-ledger__dot" :class="`is-${f.cost}`"></i>{{ f.cost }} {{ f.name }}
          </span>
        </div>
      </div>
    </header>

    <!-- ═══ 板块索引：目录行 01-05（收录计数 = 转换产物真实计数，随行跳动） ═══ -->
    <nav class="nk-cwhub-index" aria-label="货币战争板块">
      <RouterLink
        v-for="(s, i) in sections"
        :key="s.path"
        :to="s.path"
        class="nk-cwhub-index__row"
        :class="{ 'nk-cwhub-index__row--lead': i === 0 }"
      >
        <span class="nk-cwhub-index__no" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="nk-cwhub-index__icon" v-html="s.icon" aria-hidden="true"></span>
        <span class="nk-cwhub-index__body">
          <span class="nk-cwhub-index__cn">{{ s.title }}</span>
          <span class="nk-cwhub-index__en">{{ s.en }}</span>
          <span class="nk-cwhub-index__desc">{{ s.desc }}</span>
        </span>
        <span v-if="ROW_STAT[s.path]" class="nk-cwhub-index__meta" aria-label="收录{{ stats[ROW_STAT[s.path]] }}">
          <span class="nk-cwhub-index__count">{{ stats[ROW_STAT[s.path]] }}</span>
          <span class="nk-cwhub-index__meta-label">收录</span>
        </span>
      </RouterLink>
    </nav>

    <!-- ═══ 玩法机制导览：横向泳道（真实分布徽章取前 2 项 + 省略号） ═══ -->
    <section v-if="mechs.length" class="nk-cwhub-rail" aria-label="玩法机制">
      <div class="nk-cwhub-rail__grid">
        <RouterLink v-for="m in mechs" :key="m.label" :to="m.href" class="nk-cwhub-rail__cell">
          <img
            v-if="m.icon" class="nk-cwhub-rail__icon" :src="m.icon" :alt="m.iconAlt"
            loading="lazy" @error="hideImg"
          >
          <div class="nk-cwhub-rail__body">
            <div class="nk-cwhub-rail__label">{{ m.label }}</div>
            <div class="nk-cwhub-rail__desc">{{ m.desc }}</div>
            <div class="nk-cwhub-rail__badges">
              <span v-for="b in m.badges.slice(0, 2)" :key="b" class="nk-cwhub-rail__badge">{{ b }}</span>
              <span
                v-if="m.badges.length > 2"
                class="nk-cwhub-rail__badge nk-cwhub-rail__badge--more"
                aria-hidden="true"
              >+{{ m.badges.length - 2 }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- ═══ 赛季扩充说明（正文 + 扩充目录，发丝分组纯排版） ═══ -->
    <section v-if="seasonViews.length" class="nk-cwhub-season" aria-label="赛季扩充说明">
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