<script setup lang="ts">
/**
 * 终局赛季详情页
 * 结构：Hero（模式铭牌 + 赛季信息 + HUD 指标条）/ 赛季增益 / 关卡层级章节
 *   （每层：推荐属性 + 敌方配置 + 可用增益 + 挑战目标）/ 星启模式 / 相邻赛季导航
 * 数据：按路由 mode 加载对应赛季列表 JSON（与目录页同源，缓存命中即时），按 id 取赛季条目
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ENDGAME_MODES, mazeStatus, mazeDateRange, seasonArtUrl } from '../catalog/pages/endgame';
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
  loadLocalItems,
} from '../../services/api';
import type { LocalItemEntry } from '../../services/types';
import { fmtDesc, escHtml, elementIconUrl, itemIconUrl } from '../../lib/format';
import { ELEM, MON_RANK } from '../../lib/constants';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';
import type { MazeBuffInfo, MazeListDb, MazeListEntry, MazeMonsterInfo, MazeStageDetail, MazeFloorDetail, MazeTargetInfo, PeakLevelInfo } from '../../services/types';
// 敌方完整信息卡（星启 / 末日幻影纯 Boss 战共用）
import EnemyCard from '../components/EnemyCard.vue';
// 终局详情页专属样式（随本路由 chunk 懒加载）
import '../../styles/endgame-detail.css';

const route = useRoute();

/* ═══════════ 加载 ═══════════ */

/** mode → 赛季列表加载器（与目录页 api 同源） */
const MODE_LOADERS: Record<string, () => Promise<MazeListDb>> = {
  maze: loadLocalMazeList,
  story: loadLocalStoryList,
  boss: loadLocalBossList,
  peak: loadLocalPeakList,
};

const phase = ref<'loading' | 'error' | 'ready'>('loading');
const error = ref<string | null>(null);
const data = ref<MazeListEntry | null>(null);
/** 当前赛季在列表中的位置（供"上一赛季 / 下一赛季"导航） */
const seasonIndex = ref(-1);
const seasonKeys = ref<string[]>([]);

/** 物品库 id → {name, icon}（星启通关奖励名称/图标映射；items.json 四级缓存兜底） */
const itemMap = ref<Map<number, Pick<LocalItemEntry, 'name' | 'icon'>>>(new Map());
/** 物品库模块级单例（加载失败降级空表，不阻塞赛季正文） */
let itemsPromise: Promise<Map<number, Pick<LocalItemEntry, 'name' | 'icon'>>> | null = null;
function loadItemMap(): Promise<Map<number, Pick<LocalItemEntry, 'name' | 'icon'>>> {
  if (!itemsPromise) {
    itemsPromise = loadLocalItems()
      .then((list) => new Map(list.map((it) => [it.id, { name: it.name, icon: it.icon }])))
      .catch(() => new Map());
  }
  return itemsPromise;
}

/** 延迟显示骨架屏：加载超过阈值才呈现，缓存命中的快速切换不闪骨架屏 */
const showSkeleton = ref(false);
const SKELETON_DELAY = 150;
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;
watch(phase, (p) => {
  if (p === 'loading') {
    if (skeletonTimer !== null) clearTimeout(skeletonTimer);
    skeletonTimer = setTimeout(() => { showSkeleton.value = true; }, SKELETON_DELAY);
  } else {
    if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
    showSkeleton.value = false;
  }
}, { immediate: true });

async function load(mode: string, id: string): Promise<void> {
  const loader = MODE_LOADERS[mode];
  if (!loader) {
    phase.value = 'error';
    error.value = `未知的终局模式: ${mode}`;
    return;
  }
  phase.value = 'loading';
  error.value = null;
  try {
    const db = await loader();
    const keys = Object.keys(db);
    seasonKeys.value = keys;
    const entry = db[id];
    if (!entry || !entry.zh) {
      phase.value = 'error';
      error.value = `未找到赛季 ${mode}/${id}`;
      return;
    }
    data.value = entry;
    seasonIndex.value = keys.indexOf(id);
    document.title = `${entry.zh} - 咸鱼百科`;
    // 物品库并行预热（奖励名称/图标；失败静默，不影响赛季正文）
    void loadItemMap().then((m) => { itemMap.value = m; });
    // 下一帧再切换 ready，避免 loading 骨架闪烁；随后 nextTick 等正文 DOM 就绪，
    // 重置滚动、初始化折叠与激活态判定。
    // 后台标签页 rAF 会被浏览器暂停导致永久骨架屏：visibility hidden 时用 setTimeout 兜底推进
    const settleReady = (): void => {
      phase.value = 'ready';
      pageRef.value?.scrollTo({ top: 0 });
      void nextTick(() => {
        initExpanded();
        updateActiveSection();
      });
    };
    if (document.visibilityState === 'hidden') {
      setTimeout(settleReady, 0);
    } else {
      requestAnimationFrame(settleReady);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
  }
}

function retry(): void {
  void load(String(route.params.mode || ''), String(route.params.id || ''));
}

onMounted(() => {
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true });
  void load(String(route.params.mode || ''), String(route.params.id || ''));
});
watch(
  () => [route.params.mode, route.params.id],
  ([mode, id]) => {
    if (mode && id) void load(String(mode), String(id));
  },
);

/* ═══════════ 派生 ═══════════ */

const modeKey = computed(() => String(route.params.mode || ''));
const modeInfo = computed(() => ENDGAME_MODES.find((m) => m.key === modeKey.value));
const status = computed(() => (data.value ? mazeStatus(data.value) : ''));
const dateRange = computed(() => (data.value ? mazeDateRange(data.value) : ''));
const seasonId = computed(() => String(route.params.id || ''));
/** 赛季图标（seasonArtUrl：赛季专属优先，玩法级默认兜底；无图/路径不匹配时空串不渲染） */
const seasonArt = computed(() => seasonArtUrl(data.value?.arts));

/** 逐层章节（以关卡层级为章节名的完整内容；倒序：最高层在前）
 *  全模式全量展示（重构后不再“仅最后一层”回退），配合折叠交互控制页面长度 */
const floorSections = computed(() => [...(data.value?.floor_details || [])].reverse());
/** 异相仲裁关卡组成（3 骑士试炼 + 1 王棋最终关，含绝境变体） */
const peakLevels = computed<PeakLevelInfo[]>(() => data.value?.levels || []);

/** 星启模式板块数据 */
const tierceDamage = computed<string[]>(() => data.value?.tierce?.damage_types || []);
const tierceCountdown = computed<number>(() => data.value?.tierce?.countdown || 0);
const tierceScore = computed<number | null>(() => data.value?.tierce?.score ?? null);
const tierceLevel = computed<number>(() => data.value?.tierce?.level || 0);
/** 回合预算换算：总回合（如 45）− 各档“剩余轮数”目标 = 各档需完成轮数（仅回合制星启，
 *  如“剩余≥15轮” = 45−15 = 30 轮内完成；把内部计数翻译成玩家可行动的档位门槛） */
const tierceRoundHint = computed(() => {
  const total = tierceCountdown.value;
  if (!total) return '';
  const bands = tierceTargets.value
    .filter((t) => t.type === 'ROUNDS_LEFT' && t.param != null && t.param < total)
    .map((t) => total - (t.param as number));
  return bands.length
    ? `总预算 ${total} 轮 · 目标档位需 ≤${bands.join(' / ≤')} 轮`
    : `总回合预算（三场共用）`;
});
const tierceTargets = computed(() => data.value?.tierce?.targets || []);
const tierceMonsters = computed(() => data.value?.tierce?.monsters || []);
/** 星启 3 节点敌方（节点 1/2 = 常规最高难度关上下半场；节点 3 = 星启附加关） */
const tierceNodes = computed(() => data.value?.tierce?.nodes || []);
/** 星启通关奖励（EGEEJLHBALB：物品 id + 数量，经 items.json 映射名称/图标） */
const tierceRewards = computed(() => {
  const rs = data.value?.tierce?.rewards || [];
  if (!rs.length) return [];
  const map = itemMap.value;
  return rs.map((r) => ({ id: r.id, num: r.num, ...(map.get(r.id) || { name: `#${r.id}`, icon: '' }) }));
});
/** 战意赛季主题机制（SubMazeBuffList：机制 1 条 + 效果 2 条，仅 Fever 赛季） */
const subBuffsMech = computed<MazeBuffInfo | null>(() => data.value?.sub_buffs?.[0] || null);
const subBuffsEffects = computed<MazeBuffInfo[]>(() => data.value?.sub_buffs?.slice(1) || []);

/** 相邻赛季导航（排期开始降序；与目录页同序） */
const prevSeason = computed(() => {
  const i = seasonIndex.value;
  if (i <= 0) return null;
  const key = seasonKeys.value[i - 1];
  return key ? { key, href: `/endgame/${modeKey.value}/${key}` } : null;
});
const nextSeason = computed(() => {
  const i = seasonIndex.value;
  if (i < 0 || i >= seasonKeys.value.length - 1) return null;
  const key = seasonKeys.value[i + 1];
  return key ? { key, href: `/endgame/${modeKey.value}/${key}` } : null;
});

/** 增益描述渲染（#N[i] 参数替换 + 富文本标签） */
function buffDescHtml(b: MazeBuffInfo): string {
  return fmtDesc(b.desc, b.param_list || []);
}

/** 增益图标 URL（bufficon CDN；资源未就绪时 404，img error 事件兜底 SVG 占位） */
function buffIconUrl(b: MazeBuffInfo): string {
  return b.icon ? cdnUri('bufficon', `${b.icon}.webp`) : '';
}

/** 增益图标 SVG 占位（data URI，CDN 资源就绪后自动被真实图标取代） */
const BUFF_ICON_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='1.5' stroke-linejoin='round'><path d='M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z'/><circle cx='12' cy='12' r='1.4' fill='%23a0a0b0' stroke='none'/></svg>";

/** 阶段（上半/下半场）是否含内容（推荐属性或敌方配置） */
function stageHasContent(s?: MazeStageDetail): boolean {
  return !!s && (!!s.damage?.length || !!s.monsters?.length);
}

/** 末日幻影阶段对应推荐属性（阶段 1/2 取上下半场属性列；第 3 阶段源数据无属性列） */
function phaseDamage(f: MazeFloorDetail, pi: number): string[] | undefined {
  return pi === 0 ? f.stage1?.damage : pi === 1 ? f.stage2?.damage : undefined;
}

/* 板块序号：页面唯一板块恒为 01（精简模式仅星启；peak 仅关卡组成） */
/** 机制标签行（peak 关卡） */
function peakTagsHtml(tags: string[]): string {
  return tags.map((t) => `<span class="nk-egd-peak__tag">${escHtml(t)}</span>`).join('');
}

/** 挑战目标类型徽标（ChallengeTargetType → 中文短标；星启目标是整场挑战的评价条件，
 *  与 3 个节点（敌方配置）正交——TOTAL_SCORE 分数档 / ROUNDS_LEFT 剩余轮数 / DEAD_AVATAR 减员 */
const TARGET_TYPE_LABEL: Record<string, string> = {
  TOTAL_SCORE: '分数',
  ROUNDS_LEFT: '回合',
  DEAD_AVATAR: '减员',
};

/** 挑战目标渲染：#N[i] 参数替换（param 缺省时剥离占位符，避免残留） */
function targetHtml(t: MazeTargetInfo): string {
  if (t.param != null) return fmtDesc(t.text, [t.param]);
  return t.text.replace(/#\d+\[[^\]]*\]%?/g, '').replace(/#\d+/g, '');
}

/** 元素图标行 */
function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
      : '';
  }).join('');
}

/** 小图悬浮提示（层级/peak 非 Boss 模式）：名称 · 分类 · 阵营 · 韧性 · 弱点 · 抗性 */
function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = m.rank ? (MON_RANK[m.rank] || '') : '';
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(`韧性 ${m.stance}`);
  if (m.speed) parts.push(`速度 ${m.speed}`);
  if (m.weak?.length) parts.push(`弱点：${m.weak.map((d) => ELEM[d] || d).join(' / ')}`);
  const es = Object.entries(m.resist || {});
  if (es.length) parts.push(`抗性：${es.map(([d, v]) => `${ELEM[d] || d} ${Math.round(v * 100)}%`).join(' / ')}`);
  return parts.join(' · ');
}

/** 波次分组：带 wave 的敌方 → [{wave, items}]（按出场序；无 wave 视为单波） */
function monWaveGroups(mons: MazeMonsterInfo[]): { wave: number; items: MazeMonsterInfo[] }[] {
  const groups: { wave: number; items: MazeMonsterInfo[] }[] = [];
  for (const m of mons) {
    const w = m.wave || 1;
    const last = groups[groups.length - 1];
    if (!last || last.wave !== w) {
      groups.push({ wave: w, items: [m] });
    } else {
      last.items.push(m);
    }
  }
  return groups;
}

/** 波数 · 敌数标签（如"3 波 · 9 敌"；空列表返回空串） */
function monCountLabel(mons: MazeMonsterInfo[] | undefined): string {
  if (!mons?.length) return '';
  const waves = new Set(mons.map((m) => m.wave || 1)).size;
  return `${waves} 波 · ${mons.length} 敌`;
}

/** 层级推荐属性摘要（折叠态层头索引）：上下半场合并去重 */
function stageDamageSummary(f: MazeFloorDetail): string {
  const uniq = [...new Set([...(f.stage1?.damage || []), ...(f.stage2?.damage || [])])];
  return uniq.length ? elemRow(uniq) : '';
}

/** 层级上下半场合并敌数汇总（折叠摘要右侧数据；空配置返回空串） */
function mergedMonCount(f: MazeFloorDetail): string {
  const mons = [...(f.stage1?.monsters || []), ...(f.stage2?.monsters || [])];
  return mons.length ? monCountLabel(mons) : '';
}

/* ═══════════ 层级折叠状态机 ═══════════ */

/** 展开的层级集合（key：MazeFloorDetail.floor） */
const expanded = ref<Set<number>>(new Set());
/** 默认展开阈值：层级 ≤6 全展开（开箱即读），>6 全折叠（10+ 层紧凑索引） */
const EXPAND_THRESHOLD = 6;
function initExpanded(): void {
  expanded.value = new Set(floorSections.value.length > EXPAND_THRESHOLD ? [] : floorSections.value.map((f) => f.floor));
}
function toggleFloor(id: number): void {
  const s = new Set(expanded.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  expanded.value = s;
}
function expandAll(): void { expanded.value = new Set(floorSections.value.map((f) => f.floor)); }
function collapseAll(): void { expanded.value = new Set(); }
const allExpanded = computed(() => floorSections.value.length > 0 && expanded.value.size === floorSections.value.length);
const noneExpanded = computed(() => expanded.value.size === 0);
function isExpanded(id: number): boolean { return expanded.value.has(id); }

/* ═══════════ 吸顶工具条（章节导航 + 阅读进度线 + 返回顶部） ═══════════ */

const pageRef = ref<HTMLElement | null>(null);
const progressPct = ref(0);
const showTop = ref(false);
function onScroll(): void {
  const el = pageRef.value;
  if (!el) return;
  const max = el.scrollHeight - el.clientHeight;
  progressPct.value = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
  showTop.value = el.scrollTop > 480;
  updateActiveSection();
}
function scrollTop(): void {
  pageRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
}
/** 章节导航（吸顶条）：编号与 .nk-title 同源（战意机制 01 / 赛季增益 02 / 星启 03 / 层级 04；
 *  peak 关卡组成 01）；编号随板块存在性动态顺延 */
const navSections = computed(() => {
  const s: { id: string; idx: string; label: string }[] = [];
  if (modeKey.value === 'peak') {
    if (peakLevels.value.length) s.push({ id: 'levels', idx: '01', label: '关卡组成' });
  } else {
    let idx = 1;
    const push = (id: string, label: string) => {
      s.push({ id, idx: String(idx++).padStart(2, '0'), label });
    };
    if (subBuffsMech.value) push('sub-buffs', '战意机制');
    if (data.value?.buffs?.length) push('buffs', '赛季增益');
    if (data.value?.tierce) push('tierce', '星启模式');
    if (floorSections.value.length) push('floors', '关卡层级');
  }
  return s;
});
/** 板块编号映射（模板 .nk-title__idx 与吸顶条导航同源） */
const sectionIdx = computed(() => {
  const m: Record<string, string> = {};
  for (const s of navSections.value) m[s.id] = s.idx;
  return m;
});
const activeSection = ref('');
/** 激活态滚动判定：最后一个板块标题顶部越过吸顶条（64px）即激活；未滚动时取首板块 */
function updateActiveSection(): void {
  const offset = 64;
  let current = '';
  for (const s of navSections.value) {
    const node = document.getElementById(`egd-${s.id}`);
    if (node && node.getBoundingClientRect().top <= offset) current = s.id;
  }
  activeSection.value = current || navSections.value[0]?.id || '';
}
function jumpTo(id: string): void {
  document.getElementById(`egd-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  pageRef.value?.removeEventListener('scroll', onScroll);
  data.value = null;
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-egd" :data-mode="modeKey" :aria-busy="phase === 'loading'">
    <!-- ─── 加载骨架屏（延迟显示，缓存命中不闪屏） ─── -->
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--egd"
      role="status"
      aria-live="polite"
      aria-label="赛季详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-egd-sk nk-sk--shimmer"></div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
      </div>
    </div>

    <!-- ─── 错误态 ─── -->
    <div v-else-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">赛季数据加载失败</div>
      <div v-if="error" class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <!-- ─── 正文 ─── -->
    <template v-else-if="data">
      <!-- 吸顶工具条：章节导航 + 层级折叠控制 + 阅读进度线（fixed 视口级，近实底） -->
      <div class="nk-egd-bar">
        <div class="nk-egd-bar__inner">
          <nav class="nk-secnav nk-egd-secnav" aria-label="内容区块导航">
            <button
              v-for="s in navSections"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeSection === s.id }"
              :aria-current="activeSection === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ s.idx }}</span>
              {{ s.label }}
            </button>
          </nav>
          <div v-if="floorSections.length > 1" class="nk-egd-bar__tools" role="group" aria-label="层级展开控制">
            <button v-if="!allExpanded" type="button" class="nk-egd-bar__tool" @click="expandAll">全部展开</button>
            <button v-if="!noneExpanded" type="button" class="nk-egd-bar__tool" @click="collapseAll">全部折叠</button>
          </div>
        </div>
        <div class="nk-egd-bar__progress" :style="{ width: `${progressPct}%` }"></div>
      </div>

      <!-- 返回顶部（滚动超过阈值出现） -->
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <!-- Hero：模式铭牌 + 赛季信息 -->
      <header class="nk-egd-hero">
        <div class="nk-egd-hero__plate">
          <span class="nk-egd-hero__emblem" v-html="modeInfo?.emblem || ''"></span>
          <img v-if="seasonArt" class="nk-egd-hero__art" :src="seasonArt" alt="" @error="($event.target as HTMLImageElement).style.display='none'">
          <span class="nk-egd-hero__num" :class="{ 'nk-egd-hero__num--long': seasonId.length >= 4 }">{{ seasonId }}</span>
        </div>
        <div class="nk-egd-hero__panel">
          <div class="nk-egd-hero__camp">{{ modeInfo?.label || modeKey }} · {{ modeInfo?.en || '' }}</div>
          <h1 class="nk-egd-hero__name">{{ data.zh }}</h1>
          <div class="nk-egd-hero__meta">
            <span
              class="nk-egd-hero__status"
              :class="`nk-egd-hero__status--${status === '进行中' ? 'live' : status === '已结束' ? 'ended' : status === '未开始' ? 'upcoming' : 'unknown'}`"
            >{{ status }}</span>
            <span v-if="dateRange" class="nk-egd-hero__date">{{ dateRange }}</span>
          </div>
        </div>
      </header>

      <!-- 内容面板 -->
      <div class="nk-panels nk-egd-body">
        <div class="nk-panel nk-panel--active">
          <!-- 战意机制：战意（Fever）赛季主题机制 + 两阶段效果（官网“战意机制 / 战意效果”
               对应 SubMazeBuffList：机制 1 条 + 效果 2 条，仅虚构叙事 Fever 赛季） -->
          <template v-if="modeKey === 'story' && subBuffsMech">
            <div id="egd-sub-buffs" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['sub-buffs'] }}</span>战意机制 FURY</div>
            <div class="nk-egd-fury">
              <div class="nk-egd-fury__mech">
                <span class="nk-egd-fury__label">战意机制</span>
                <article class="nk-egd-buff">
                  <div class="nk-egd-buff__head">
                    <span class="nk-egd-buff__idx">01</span>
                    <img v-if="subBuffsMech.icon" class="nk-egd-buff__icon" :src="buffIconUrl(subBuffsMech)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                    <h2 class="nk-egd-buff__name">{{ subBuffsMech.name }}</h2>
                  </div>
                  <p v-if="subBuffsMech.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(subBuffsMech)"></p>
                </article>
              </div>
              <div v-if="subBuffsEffects.length" class="nk-egd-fury__eff">
                <span class="nk-egd-fury__label">战意效果</span>
                <div class="nk-egd-buffs">
                  <article
                    v-for="(b, i) in subBuffsEffects"
                    :key="b.id"
                    class="nk-egd-buff"
                    :style="{ '--i': i + 1 }"
                  >
                    <div class="nk-egd-buff__head">
                      <span class="nk-egd-buff__idx">{{ String(i + 2).padStart(2, '0') }}</span>
                      <img v-if="b.icon" class="nk-egd-buff__icon" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                      <h2 class="nk-egd-buff__name">{{ b.name }}</h2>
                    </div>
                    <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
                  </article>
                </div>
              </div>
            </div>
          </template>

          <!-- 赛季增益：当期环境效果（记忆紊流/战意/坚防守备），作用于全赛季挑战（星启同样生效）
               独立模块——与层级内 buff（关卡级）区分；peak 的王棋增益在王棋章节内展示，不在此处 -->
          <template v-if="modeKey !== 'peak' && data.buffs?.length">
            <div id="egd-buffs" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['buffs'] }}</span>赛季增益 BUFFS</div>
            <div class="nk-egd-buffs">
              <article
                v-for="(b, i) in data.buffs"
                :key="b.id"
                class="nk-egd-buff"
                :style="{ '--i': i }"
              >
                <div class="nk-egd-buff__head">
                  <span class="nk-egd-buff__idx">{{ String(i + 1).padStart(2, '0') }}</span>
                  <img v-if="b.icon" class="nk-egd-buff__icon" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                  <h2 class="nk-egd-buff__name">{{ b.name }}</h2>
                </div>
                <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
              </article>
            </div>
          </template>

          <!-- 异相仲裁关卡组成（3 骑士试炼 + 1 王棋最终关，含绝境变体） -->
          <template v-if="modeKey === 'peak' && peakLevels.length">
            <div id="egd-levels" class="nk-title"><span class="nk-title__idx">01</span>关卡组成 LEVELS</div>
            <!-- 段位徽章：当期青铜/白银/黄金/彩钻勋章（ChallengeBadgeConfig） -->
            <div v-if="data.badges?.length" class="nk-egd-peak__badges">
              <div v-for="b in data.badges" :key="b.level" class="nk-egd-peak__badge" :title="b.desc || b.name">
                <img v-if="itemIconUrl(b.icon)" :src="itemIconUrl(b.icon)" :alt="b.name" loading="lazy" @error="($event.target as HTMLImageElement).classList.add('nk-img-error')">
                <span>{{ b.name }}</span>
              </div>
            </div>
            <div class="nk-egd-floors">
              <section
                v-for="(l, i) in peakLevels"
                :key="l.id"
                class="nk-egd-floor nk-egd-peak"
                :style="{ '--i': i }"
              >
                <!-- 章节头：骑士/王棋徽标 + 官方关卡名 + 等级 -->
                <header class="nk-egd-floor__head">
                  <span class="nk-egd-peak__kind" :class="`nk-egd-peak__kind--${l.kind}`">
                    {{ l.kind === 'king' ? '王棋' : '骑士' }}
                  </span>
                  <h2 class="nk-egd-floor__title">{{ l.name }}</h2>
                  <span v-if="l.level" class="nk-egd-floor__data">
                    <span class="nk-egd-floor__dataitem">
                      <span class="nk-egd-floor__dataval">{{ l.level }}</span>
                      <span class="nk-egd-floor__datalabel">等级</span>
                    </span>
                  </span>
                </header>

                <!-- 推荐属性 + 敌方配置 -->
                <div class="nk-egd-floor__stage">
                  <div v-if="l.damage?.length" class="nk-egd-floor__row">
                    <span class="nk-egd-floor__label">推荐属性</span>
                    <span class="nk-egd-floor__elems" v-html="elemRow(l.damage)"></span>
                  </div>
                  <div v-if="l.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
                    <span class="nk-egd-floor__label">敌方配置</span>
                    <span v-if="monCountLabel(l.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(l.monsters) }}</span>
                    <span class="nk-egd-floor__monswrap">
                      <span v-for="(g, gi) in monWaveGroups(l.monsters)" :key="gi" class="nk-egd-floor__wave">
                        <span v-if="monWaveGroups(l.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                        <span class="nk-egd-floor__mons">
                          <router-link
                            v-for="m in g.items"
                            :key="`${m.id}-${gi}`"
                            class="nk-egd-floor__monlink"
                            :to="`/monster/${m.tpl || m.id}`"
                            :title="monTitle(m)"
                            :aria-label="`查看 ${m.name} 详情`"
                          >
                            <img
                              class="nk-egd-floor__mon"
                              :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                              :alt="m.name"
                              loading="lazy"
                              @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                            >
                          </router-link>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>

                <!-- 机制标签（如韧甲/反相/吸能） -->
                <div v-if="l.tags?.length" class="nk-egd-floor__tagsrow">
                  <span class="nk-egd-floor__label">机制</span>
                  <span class="nk-egd-floor__tags" v-html="peakTagsHtml(l.tags)"></span>
                </div>

                <!-- 挑战目标 -->
                <ol v-if="l.targets?.length" class="nk-egd-floor__targets">
                  <li v-for="(t, ti) in l.targets" :key="ti" class="nk-egd-floor__target">
                    <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
                    <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
                  </li>
                </ol>

                <!-- 王棋增益（出奇制胜/步骑协同/锤砧战术） -->
                <div v-if="l.buffs?.length" class="nk-egd-floor__buffs">
                  <div v-for="b in l.buffs" :key="b.id" class="nk-egd-floor__buff">
                    <div class="nk-egd-floor__buffhead">
                      <img v-if="b.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                      <span class="nk-egd-floor__bufflabel">可用增益</span>
                      <span class="nk-egd-floor__buffname">{{ b.name }}</span>
                    </div>
                    <p v-if="b.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(b)"></p>
                  </div>
                </div>

                <!-- 王棋•绝境变体 -->
                <div v-if="l.hard" class="nk-egd-floor__hard">
                  <div class="nk-egd-floor__hardhead">
                    <span class="nk-egd-peak__kind nk-egd-peak__kind--hard">绝境</span>
                    <span class="nk-egd-floor__hardname">{{ l.hard.name }}</span>
                    <span v-if="l.hard.level" class="nk-egd-floor__data">
                      <span class="nk-egd-floor__dataitem">
                        <span class="nk-egd-floor__dataval">{{ l.hard.level }}</span>
                        <span class="nk-egd-floor__datalabel">等级</span>
                      </span>
                    </span>
                  </div>
                  <div v-if="l.hard.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
                    <span class="nk-egd-floor__label">敌方配置</span>
                    <span v-if="monCountLabel(l.hard.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(l.hard.monsters) }}</span>
                    <span class="nk-egd-floor__monswrap">
                      <span v-for="(g, gi) in monWaveGroups(l.hard.monsters)" :key="gi" class="nk-egd-floor__wave">
                        <span v-if="monWaveGroups(l.hard.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                        <span class="nk-egd-floor__mons">
                          <router-link
                            v-for="m in g.items"
                            :key="`${m.id}-${gi}`"
                            class="nk-egd-floor__monlink"
                            :to="`/monster/${m.tpl || m.id}`"
                            :title="monTitle(m)"
                            :aria-label="`查看 ${m.name} 详情`"
                          >
                            <img
                              class="nk-egd-floor__mon"
                              :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                              :alt="m.name"
                              loading="lazy"
                              @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                            >
                          </router-link>
                        </span>
                      </span>
                    </span>
                  </div>
                  <div v-if="l.hard.tags?.length" class="nk-egd-floor__tagsrow">
                    <span class="nk-egd-floor__label">机制</span>
                    <span class="nk-egd-floor__tags" v-html="peakTagsHtml(l.hard.tags)"></span>
                  </div>
                  <ol v-if="l.hard.targets?.length" class="nk-egd-floor__targets">
                    <li v-for="(t, ti) in l.hard.targets" :key="ti" class="nk-egd-floor__target">
                      <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
                      <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
                    </li>
                  </ol>
                </div>
              </section>
            </div>
          </template>

          <!-- 星启模式（独立进阶关卡：星启弱点 / 目标 / Boss；当期赛季增益见上方独立模块） -->
          <template v-if="data.tierce">
            <div id="egd-tierce" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['tierce'] }}</span>星启模式 STARLIT</div>
            <div class="nk-egd-tierce">
              <!-- 星启节点指标：推荐属性 / 等级 / 回合 / 分数（副注把内部计数翻译成玩家语义） -->
              <div v-if="tierceDamage.length || tierceLevel || tierceCountdown || tierceScore != null" class="nk-egd-tierce__stats">
                <div v-if="tierceDamage.length" class="nk-egd-tierce__stat">
                  <span class="nk-egd-tierce__val nk-egd-tierce__val--elems" v-html="elemRow(tierceDamage)"></span>
                  <span class="nk-egd-tierce__label">推荐属性 RECOMMENDED</span>
                  <span class="nk-egd-tierce__hint">关卡推荐弱点</span>
                </div>
                <div v-if="tierceLevel" class="nk-egd-tierce__stat">
                  <span class="nk-egd-tierce__val">{{ tierceLevel }}</span>
                  <span class="nk-egd-tierce__label">敌人等级 ENEMY LV</span>
                  <span class="nk-egd-tierce__hint">当期最高难度</span>
                </div>
                <div v-if="tierceCountdown" class="nk-egd-tierce__stat">
                  <span class="nk-egd-tierce__val">{{ tierceCountdown }}</span>
                  <span class="nk-egd-tierce__label">回合 CYCLES</span>
                  <span class="nk-egd-tierce__hint">{{ tierceRoundHint }}</span>
                </div>
                <div v-if="tierceScore != null" class="nk-egd-tierce__stat">
                  <span class="nk-egd-tierce__val">{{ tierceScore.toLocaleString() }}</span>
                  <span class="nk-egd-tierce__label">分数 SCORE</span>
                  <span class="nk-egd-tierce__hint">通关分数线</span>
                </div>
              </div>
              <!-- 星启目标：整场星启挑战的评价条件（分数档/剩余轮数/减员限制），
                   与 3 个节点（敌方配置）正交，非节点级条件 -->
              <div v-if="tierceTargets.length" class="nk-egd-tierce__targets">
                <div v-for="(t, i) in tierceTargets" :key="i" class="nk-egd-node">
                  <span class="nk-egd-node__idx">目标 {{ String(i + 1).padStart(2, '0') }}</span>
                  <span v-if="t.type && TARGET_TYPE_LABEL[t.type]" class="nk-egd-node__type">{{ TARGET_TYPE_LABEL[t.type] }}</span>
                  <span class="nk-egd-node__text" v-html="targetHtml(t)"></span>
                </div>
              </div>
              <!-- 星启敌方：3 节点各自挑战（节点 1/2 = 常规最高难度关上下半场；节点 3 = 星启附加关），
                   节点内按波次分组的完整信息卡
                   分组层级视觉：节点 = 模式色胶囊（与“上半场/下半场”同级），波 = 灰色小字（次级） -->
              <div v-if="tierceNodes.length" class="nk-egd-tierce__waves">
                <div v-for="(nd, ni) in tierceNodes" :key="ni" class="nk-egd-tierce__node">
                  <span class="nk-egd-tierce__nodelabel">节点 {{ String(nd.idx).padStart(2, '0') }}</span>
                  <div v-for="(g, gi) in monWaveGroups(nd.monsters)" :key="gi" class="nk-egd-tierce__wave">
                    <span v-if="monWaveGroups(nd.monsters).length > 1" class="nk-egd-tierce__wavelabel">第 {{ g.wave }} 波</span>
                    <div class="nk-egd-mons">
                      <EnemyCard v-for="m in g.items" :key="`${m.id}-${ni}-${gi}`" :monster="m" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- 兼容：无 nodes 时回退 tierceMonsters 直接渲染 -->
              <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
                <EnemyCard v-for="m in tierceMonsters" :key="m.id" :monster="m" />
              </div>
              <!-- 通关奖励（仅虚构叙事：EGEEJLHBALB 每期固定，与 score 通关分数线对应） -->
              <div v-if="tierceRewards.length" class="nk-egd-reward">
                <div class="nk-egd-reward__head">
                  <span class="nk-egd-reward__label">通关奖励</span>
                  <span v-if="tierceScore" class="nk-egd-reward__goal">通关目标：获得 {{ tierceScore.toLocaleString() }} 分</span>
                </div>
                <div class="nk-egd-reward__items">
                  <span v-for="r in tierceRewards" :key="r.id" class="nk-egd-reward__item">
                    <img v-if="r.icon" class="nk-egd-reward__icon" :src="itemIconUrl(r.icon)" :alt="r.name" :title="r.name" loading="lazy" @error="($event.target as HTMLImageElement).classList.add('nk-img-error')">
                    <span v-else class="nk-egd-reward__icon nk-egd-reward__icon--void">{{ String(r.id).slice(0, 2) }}</span>
                    <span class="nk-egd-reward__name">{{ r.name }}</span>
                    <span v-if="r.num" class="nk-egd-reward__num">×{{ r.num.toLocaleString() }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- 数据空态提示（无星启 / 无层级 / 无关卡组成时） -->
          <div v-if="!data.tierce && !floorSections.length && !peakLevels.length" class="nk-egd-empty">本赛季暂无关卡数据</div>

          <!-- 关卡层级：以层级为章节（倒序：最高层在前），模块内展示推荐属性 / 敌方配置 / 可用增益 / 挑战目标；
               层级默认折叠（>6 层），层头即索引 -->
          <template v-if="floorSections.length">
            <div id="egd-floors" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['floors'] }}</span>关卡层级 LEVELS</div>
            <div class="nk-egd-floors">
              <section
                v-for="(f, i) in floorSections"
                :key="f.floor"
                class="nk-egd-floor"
                :class="{ 'nk-egd-floor--open': isExpanded(f.floor) }"
                :style="{ '--i': i }"
              >
                <!-- 层头（button：点击切换折叠；折叠态即层级索引） -->
                <button
                  type="button"
                  class="nk-egd-floor__head"
                  :aria-expanded="isExpanded(f.floor)"
                  :aria-controls="`egd-floor-${f.floor}`"
                  @click="toggleFloor(f.floor)"
                >
                  <svg class="nk-egd-floor__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
                  <span class="nk-egd-floor__idx">{{ String(f.floor).padStart(2, '0') }}</span>
                  <span class="nk-egd-floor__title">第 {{ f.floor }} 层</span>
                  <span v-if="f.name" class="nk-egd-floor__name">{{ f.name }}</span>
                  <span
                    v-if="f.level || f.countdown || (modeKey === 'story' && data.clear_score)"
                    class="nk-egd-floor__data"
                  >
                    <span v-if="f.level" class="nk-egd-floor__dataitem">
                      <span class="nk-egd-floor__dataval">{{ f.level }}</span>
                      <span class="nk-egd-floor__datalabel">等级</span>
                    </span>
                    <span v-if="f.countdown" class="nk-egd-floor__dataitem">
                      <span class="nk-egd-floor__dataval">{{ f.countdown }}</span>
                      <span class="nk-egd-floor__datalabel">回合</span>
                    </span>
                    <span v-if="modeKey === 'story' && data.clear_score" class="nk-egd-floor__dataitem">
                      <span class="nk-egd-floor__dataval">{{ data.clear_score.toLocaleString() }}</span>
                      <span class="nk-egd-floor__datalabel">分数线</span>
                    </span>
                  </span>
                </button>
                <!-- 折叠态摘要：推荐属性（上下半场合并去重） -->
                <div v-if="!isExpanded(f.floor)" class="nk-egd-floor__summary">
                  <template v-if="stageDamageSummary(f)">
                    <span class="nk-egd-floor__summarylabel">推荐属性</span>
                    <span class="nk-egd-floor__elems" v-html="stageDamageSummary(f)"></span>
                  </template>
                  <span v-if="mergedMonCount(f)" class="nk-egd-floor__summarydata">{{ mergedMonCount(f) }}</span>
                </div>
                <!-- 展开体（grid-rows 折叠动画） -->
                <div :id="`egd-floor-${f.floor}`" class="nk-egd-floor__body">
                  <div class="nk-egd-floor__body-inner">

                <!-- 上下半场模块（单阶段层仅上半场）；末日幻影为阶段制，优先渲染阶段清单（含第 3 阶段） -->
                <div class="nk-egd-floor__stages">
                  <template v-if="modeKey === 'boss' && f.phases?.length">
                    <div v-for="(p, pi) in f.phases" :key="p.id" class="nk-egd-floor__stage">
                      <div class="nk-egd-floor__stagehead">
                        <span class="nk-egd-floor__stagelabel">阶段 {{ pi + 1 }}</span>
                      </div>
                      <div v-if="phaseDamage(f, pi)?.length" class="nk-egd-floor__row">
                        <span class="nk-egd-floor__label">推荐属性</span>
                        <span class="nk-egd-floor__elems" v-html="elemRow(phaseDamage(f, pi) || [])"></span>
                      </div>
                      <div class="nk-egd-floor__row nk-egd-floor__row--mons">
                        <span class="nk-egd-floor__label">敌方配置</span>
                        <span class="nk-egd-mons">
                          <EnemyCard :monster="p" />
                        </span>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                  <div v-if="stageHasContent(f.stage1)" class="nk-egd-floor__stage">
                    <div class="nk-egd-floor__stagehead">
                      <span class="nk-egd-floor__stagelabel">上半场</span>
                      <span v-if="monCountLabel(f.stage1?.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(f.stage1?.monsters) }}</span>
                    </div>
                    <div v-if="f.stage1?.damage?.length" class="nk-egd-floor__row">
                      <span class="nk-egd-floor__label">推荐属性</span>
                      <span class="nk-egd-floor__elems" v-html="elemRow(f.stage1.damage)"></span>
                    </div>
                    <div v-if="f.stage1?.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
                      <span class="nk-egd-floor__label">敌方配置</span>
                      <span class="nk-egd-floor__monswrap">
                        <span v-for="(g, gi) in monWaveGroups(f.stage1.monsters)" :key="gi" class="nk-egd-floor__wave">
                          <span v-if="monWaveGroups(f.stage1.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                          <!-- 末日幻影纯 Boss 战：完整信息卡；其余模式：小图行 -->
                          <span v-if="modeKey === 'boss'" class="nk-egd-mons">
                            <EnemyCard v-for="m in g.items" :key="`${m.id}-${gi}`" :monster="m" />
                          </span>
                          <span v-else class="nk-egd-floor__mons">
                            <router-link
                              v-for="m in g.items"
                              :key="`${m.id}-${gi}`"
                              class="nk-egd-floor__monlink"
                              :to="`/monster/${m.tpl || m.id}`"
                              :title="monTitle(m)"
                              :aria-label="`查看 ${m.name} 详情`"
                            >
                              <img
                                class="nk-egd-floor__mon"
                                :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                                :alt="m.name"
                                loading="lazy"
                                @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                              >
                            </router-link>
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>

                  <div v-if="stageHasContent(f.stage2)" class="nk-egd-floor__stage">
                    <div class="nk-egd-floor__stagehead">
                      <span class="nk-egd-floor__stagelabel">下半场</span>
                      <span v-if="monCountLabel(f.stage2?.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(f.stage2?.monsters) }}</span>
                    </div>
                    <div v-if="f.stage2?.damage?.length" class="nk-egd-floor__row">
                      <span class="nk-egd-floor__label">推荐属性</span>
                      <span class="nk-egd-floor__elems" v-html="elemRow(f.stage2.damage)"></span>
                    </div>
                    <div v-if="f.stage2?.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
                      <span class="nk-egd-floor__label">敌方配置</span>
                      <span class="nk-egd-floor__monswrap">
                        <span v-for="(g, gi) in monWaveGroups(f.stage2.monsters)" :key="gi" class="nk-egd-floor__wave">
                          <span v-if="monWaveGroups(f.stage2.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                          <!-- 末日幻影纯 Boss 战：完整信息卡；其余模式：小图行 -->
                          <span v-if="modeKey === 'boss'" class="nk-egd-mons">
                            <EnemyCard v-for="m in g.items" :key="`${m.id}-${gi}`" :monster="m" />
                          </span>
                          <span v-else class="nk-egd-floor__mons">
                            <router-link
                              v-for="m in g.items"
                              :key="`${m.id}-${gi}`"
                              class="nk-egd-floor__monlink"
                              :to="`/monster/${m.tpl || m.id}`"
                              :title="monTitle(m)"
                              :aria-label="`查看 ${m.name} 详情`"
                            >
                              <img
                                class="nk-egd-floor__mon"
                                :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                                :alt="m.name"
                                loading="lazy"
                                @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                              >
                            </router-link>
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                  </template>
                </div>

                <!-- 可用增益（层级 MazeBuff，如记忆紊流） -->
                <div v-if="f.buff" class="nk-egd-floor__buff">
                  <div class="nk-egd-floor__buffhead">
                    <img v-if="f.buff.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(f.buff)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                    <span class="nk-egd-floor__bufflabel">可用增益</span>
                    <span class="nk-egd-floor__buffname">{{ f.buff.name }}</span>
                  </div>
                  <p v-if="f.buff.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(f.buff)"></p>
                </div>

                <!-- 层级挑战目标 -->
                <ol v-if="f.targets?.length" class="nk-egd-floor__targets">
                  <li v-for="(t, ti) in f.targets" :key="ti" class="nk-egd-floor__target">
                    <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
                    <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
                  </li>
                </ol>
                  </div>
                </div>
              </section>
            </div>
          </template>

          <!-- 相邻赛季导航 -->
          <nav v-if="prevSeason || nextSeason" class="nk-egd-nav" aria-label="相邻赛季">
            <router-link
              v-if="prevSeason"
              class="nk-egd-nav__item nk-egd-nav__item--prev"
              :to="prevSeason.href"
            >
              <span class="nk-egd-nav__dir">← 上一赛季</span>
              <span class="nk-egd-nav__id">{{ prevSeason.key }}</span>
            </router-link>
            <span v-else class="nk-egd-nav__item nk-egd-nav__item--void"></span>
            <router-link
              v-if="nextSeason"
              class="nk-egd-nav__item nk-egd-nav__item--next"
              :to="nextSeason.href"
            >
              <span class="nk-egd-nav__dir">下一赛季 →</span>
              <span class="nk-egd-nav__id">{{ nextSeason.key }}</span>
            </router-link>
          </nav>
        </div>
      </div>
    </template>
  </div>
</template>
