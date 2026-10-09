<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ELEM, MON_RANK, SITE_NAME } from '../../lib/constants';
import {
  elementIconUrl, escHtml, fmtDesc, itemIconUrl, monsterFigureUrl, monsterIconUrl,
} from '../../lib/format';
import type { MonsterEliteGroups, MonsterLevelCurve } from '../../lib/monster-stats';
import { monsterEliteRatiosProduct, monsterMaxLevel, monsterStanceValue, monsterStatAt } from '../../lib/monster-stats';
import { fmtStatValue } from '../../lib/format';
import { atlasFormsOf, monsterFamilyKey, monsterFamilyOf } from '../../lib/monster-family';
import { loadLocalMonsterDetail, loadLocalMonsterEliteGroups, loadLocalMonsterLevelCurve, loadLocalMonsterList } from '../../services/api';
import type { LocalMonsterEntry, MazeBossPhase, MonsterDetail, MonsterExtraEffect, MonsterPhase, MonsterSkillDetail } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import '../../styles/monster-detail.css';

const route = useRoute();

const { data, error, showSkeleton, run: load, retry } = usePageData<MonsterDetail>(() =>
  loadLocalMonsterDetail(String(route.params.id)),
);
onMounted(() => {
  void load();
  void loadFamily();
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== String(data.value?.id)) {
      void load();
      void loadFamily();
    }
  },
);

const d = computed(() => data.value);
watch(d, (data) => {
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});
/* 战斗数值合成（ADR 0040 + 0045 + 0049）：曲线与精英组倍率作为共享单例随详情页拉取。
   缺省等级 = **该难度组曲线的最高档**（不再写死 100：曲线各组上限不同——组 1/2 到 100、组 3 到 120、
   组 1401 只到 40，写死 100 会让组 1401 的怪显示「等级 100」却合成不出曲线值、静默回退基准值）。 */
const curveRef = ref<MonsterLevelCurve | null>(null);
const eliteRef = ref<MonsterEliteGroups | null>(null);
/** 用户拖动后的等级；null = 未拖动 → 用该组最高档 */
const levelOverride = ref<number | null>(null);
onMounted(() => {
  void loadLocalMonsterLevelCurve().then((c) => { curveRef.value = c; });
  void loadLocalMonsterEliteGroups().then((t) => { eliteRef.value = t; });
});
/** 曲线在该怪难度组下的最高等级（滑条上限；曲线缺组 → 0 = 静态展示基准值）。 */
const maxLevel = computed(() => (d.value ? monsterMaxLevel(curveRef.value, String(d.value.level_group ?? 1)) : 0));
const combatLevel = computed(() => {
  const max = maxLevel.value;
  if (max <= 1) return max;
  const want = levelOverride.value ?? max;
  return Math.min(Math.max(1, want), max);
});
const combatStats = computed(() => {
  const v = d.value;
  if (!v) return null;
  const meta = {
    statRatio: v.stat_ratio ?? null,
    levelGroup: v.level_group ?? 1,
    // 精英组倍率行（组缺位 → 中性 1，ADR 0049）
    eliteRatios: eliteRef.value?.[String(v.elite_group ?? 1)] ?? null,
    stats: v.stats,
    curve: curveRef.value,
    // 速度的实例修正值：加在曲线之后（ADR 0045）
    modify: v.speed_modify == null ? null : { speed: v.speed_modify },
  };
  return {
    hp: monsterStatAt('hp', combatLevel.value, meta),
    atk: monsterStatAt('atk', combatLevel.value, meta),
    def: monsterStatAt('def', combatLevel.value, meta),
    speed: monsterStatAt('speed', combatLevel.value, meta),
  };
});
/** 韧性：不入等级曲线链（基准 × 精英组韧性倍率 + 实例修正值；倍率缺位按 1） */
const stanceValue = computed(() => (
  d.value
    ? monsterStanceValue(
        d.value.stance,
        d.value.stance_modify,
        eliteRef.value?.[String(d.value.elite_group ?? 1)]?.stance ?? null,
      )
    : null
));
const figureUrl = computed(() => {
  if (!d.value) return '';
  return monsterFigureUrl(d.value.figure) || monsterIconUrl(d.value.icon);
});
const rankLabel = computed(() => (d.value ? MON_RANK[d.value.rank] || '' : ''));
const invaded = computed(() => d.value?.invaded ?? null);
/** 侵蚀等级序号（同一怪物可被多个等级点名） */
const invadedLevels = computed(() => {
  const ids = invaded.value?.invasion_ids ?? [];
  return [...new Set(ids)].sort((a, b) => a - b).join(' / ');
});

/* ─── 同族变体（P0）：同一怪物的多个数值档 ───
   判据单点在 `src/lib/monster-family.ts`（名称 + 卡面图标 stem），与列表卡「变体 i/n」同源：
   目录 632 条里 392 条有卡面完全一样的同族兄弟，详情页此前没有任何入口能从 1002011 走到
   1002012（同图标、同名称、同 HP/速度/韧性/技能，只有弱点与抗性两行不同）。
   族成员从共享单例 `monsters.json` 取（1 次请求给全族的 id/名称/图标），各档的差异字段再按需
   读该档自己的详情文件（≤8 个、约 600B/个，走 cachedFetch 的 L1/L2 缓存）。 */
type VariantSigKey =
  | 'weak' | 'resist' | 'stance' | 'hp' | 'atk' | 'def' | 'speed'
  | 'skills' | 'camp' | 'rank' | 'intro' | 'figure' | 'invaded';

const VARIANT_SIG_LABEL: Record<VariantSigKey, string> = {
  weak: '弱点', resist: '抗性', stance: '韧性', hp: 'HP', atk: '攻击', def: '防御', speed: '速度',
  skills: '技能', camp: '阵营', rank: '分类', intro: '图鉴介绍', figure: '立绘', invaded: '侵蚀名单',
};
/** 详情页会渲染出来的一切（除 id）——「差分」标注必须覆盖全部，否则会谎报「与当前档一致」 */
const VARIANT_SIG_KEYS = Object.keys(VARIANT_SIG_LABEL) as VariantSigKey[];
/** 行内直接展示的 5 格；这 5 格才是会被高亮的值格 */
const VARIANT_CELL_KEYS: VariantSigKey[] = ['weak', 'stance', 'hp', 'speed', 'skills'];

function variantSig(d: MonsterDetail): Record<VariantSigKey, string> {
  return {
    weak: JSON.stringify([...(d.weak || [])].sort()),
    resist: JSON.stringify(d.resist || {}),
    stance: String(d.stance ?? ''),
    hp: String(d.stats?.hp ?? ''),
    atk: String(d.stats?.atk ?? ''),
    def: String(d.stats?.def ?? ''),
    speed: String(d.stats?.speed ?? ''),
    skills: (d.skills || []).map((s) => s.id).join(','),
    camp: d.camp || '',
    rank: d.rank || '',
    intro: d.intro || '',
    figure: d.figure || '',
    invaded: JSON.stringify(d.invaded ?? null),
  };
}

const familyRows = ref<LocalMonsterEntry[]>([]);
const familyDetails = ref<Record<string, MonsterDetail>>({});

/* ─── 图鉴族（官方 `TemplateGroupID` → 列表字段 `atlas_group`）：第二个、更粗的维度 ───
   官方把「同一图鉴条目的各具名形态」（完整 / 幻象 / 错误 / 污染，甚至剧情改名）登记为一组，
   比卡面同族判据更粗（113 个多成员组里 12 个连卡面图标都不同），故只作互链、不参与变体序号。
   与上方「同族变体」互补：这里只列**不属于同一张卡**的其他形态，避免同一批卡被列两遍。 */
const atlasSelf = ref<LocalMonsterEntry | null>(null);
const atlasRows = ref<LocalMonsterEntry[]>([]);
/** 图鉴条目的**基准成员**（`id === atlas_group`）的详情：判「另一形态」是否只是同一实体的另一套模型时，
    要拿它的弱点签名做比对。本页就是基准成员（或该字段缺失）时留 null，由消费方退回本页自身签名。 */
const atlasCanonical = ref<MonsterDetail | null>(null);
/** 图鉴族数据是否已就位。形态块的显隐依赖基准成员详情（异步），未就位就渲染会先显后隐、把 hero 拽一下，
    故整块等它——与「图鉴族互链」同一时机。 */
const atlasReady = ref(false);

/** 形态判定与族互链共用一次加载；`atlasReady` 在所有出口（含提前 return）统一落定 */
async function loadFamily(): Promise<void> {
  const id = String(route.params.id);
  atlasReady.value = false;
  try {
    await loadAtlasAndFamily();
  } finally {
    if (String(route.params.id) === id) atlasReady.value = true;
  }
}

async function loadAtlasAndFamily(): Promise<void> {
  const id = String(route.params.id);
  familyRows.value = [];
  familyDetails.value = {};
  atlasSelf.value = null;
  atlasRows.value = [];
  atlasCanonical.value = null;
  let members: LocalMonsterEntry[];
  let list: LocalMonsterEntry[];
  try {
    list = await loadLocalMonsterList();
    const self = list.find((m) => String(m.id) === id);
    if (!self) return; // 实例变体页（长号 ID）不在目录内，快照也不生成，无同族条
    members = monsterFamilyOf(list, self);
    atlasSelf.value = self;
    atlasRows.value = atlasFormsOf(list, self);
    // 基准成员的详情要在「同族不足 2 档」提前返回之前取，否则多数页面拿不到它（形态行与该条同源）
    const group = self.atlas_group;
    if (group != null && String(group) !== id) {
      const canon = await loadLocalMonsterDetail(String(group)).catch(() => null);
      if (String(route.params.id) !== id) return;
      atlasCanonical.value = canon;
    }
  } catch {
    return; // 同族条是附加信息：共享列表拉取失败不得让详情页进错误态
  }
  if (String(route.params.id) !== id) return;
  if (members.length < 2) return;
  familyRows.value = members;
  const loaded = await Promise.all(
    members.map((m) => loadLocalMonsterDetail(String(m.id)).catch(() => null)),
  );
  if (String(route.params.id) !== id) return;
  const out: Record<string, MonsterDetail> = {};
  members.forEach((m, i) => {
    const d = loaded[i];
    if (d) out[String(m.id)] = d;
  });
  familyDetails.value = out;
}

const variants = computed(() => {  const cur = data.value;
  if (!cur || familyRows.value.length < 2) return [];
  const curSig = variantSig(cur);
  return familyRows.value.map((row) => {
    const key = String(row.id);
    const det = familyDetails.value[key] ?? null;
    const sig = det ? variantSig(det) : null;
    const diffAll = sig ? VARIANT_SIG_KEYS.filter((k) => sig[k] !== curSig[k]) : [];
    const diffCells = diffAll.filter((k) => VARIANT_CELL_KEYS.includes(k));
    const isCurrent = key === String(cur.id);
    const flag = isCurrent
      ? '当前档'
      : diffAll.length
        ? `差分 ${diffAll.map((k) => VARIANT_SIG_LABEL[k]).join(' / ')}`
        : '与当前档一致';
    return { row, det, isCurrent, diffCells, flag };
  });
});

/** 图鉴族里**不属于当前这张卡**的其他形态（同卡面的档位已由上方「同族变体」列出，去重避免列两遍）。 */
const atlasOthers = computed(() => {
  const self = atlasSelf.value;
  if (!self || atlasRows.value.length < 2) return [];
  const key = monsterFamilyKey(self);
  return atlasRows.value.filter((r) => monsterFamilyKey(r) !== key);
});

/** 活动出处里那个「等级」区间的文案：**单档时只写一个数**（源数据里确有 5 个活动敌人
 *  全档同等级，写「85–85」是假区间）。 */
const eventLevelText = computed(() => {
  const levels = d.value?.event?.levels ?? [];
  if (!levels.length) return '';
  return levels.length > 1 ? `${levels[0]}–${levels[levels.length - 1]}` : String(levels[0]);
});

function elemTag(elem: string): string {
  const name = ELEM[elem] || elem;
  return `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)}</span>`;
}
const weakHtml = computed(() => (d.value?.weak ?? []).map(elemTag).join(''));
const resistHtml = computed(() =>
  Object.entries(d.value?.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(ELEM[k] || k)} ${Math.round(v * 100)}%</span>`)
    .join(''));
const introHtml = computed(() => {
  if (!d.value) return '';
  const t = fmtDesc(d.value.intro, []);
  return t || '<span class="nk-mob-empty">暂无图鉴介绍</span>';
});
function skillHtml(s: MonsterSkillDetail): string {
  return fmtDesc(s.desc, s.param_list);
}
function skillMeta(s: MonsterSkillDetail): string {
  const parts: string[] = [];
  if (s.damage_type) {
    const name = ELEM[s.damage_type] || s.damage_type;
    parts.push(
      `<span class="nk-mob-skill__elem"><img src="${escHtml(elementIconUrl(s.damage_type))}" alt="${escHtml(name)}" title="${escHtml(name)}" loading="lazy">${escHtml(name)}</span>`,
    );
  }
  if (s.type_desc) {
    parts.push(`<span class="nk-mob-skill__type">${escHtml(s.type_desc)}</span>`);
  }
  return parts.join('<span class="nk-mob-skill__sep">/</span>');
}

/** 附带效果描述（与技能描述同渲染管线：`#N[i]` 占位符按 param_list 替换） */
function fxHtml(fx: MonsterExtraEffect): string {
  return fmtDesc(fx.desc, fx.param_list);
}

/** 状态词条类型：源字段枚举 → 中文（与 ELEM / MON_RANK 同类的枚举映射，不是自建数据源） */
const STATUS_TYPE: Record<string, string> = { Buff: '增益', Debuff: '减益', Other: '其他' };

function statusTypeLabel(type: string): string {
  return STATUS_TYPE[type] || type || '其他';
}

/** 阶段编号的中文序数（官方阶段名把「第几阶段」写在名字里：实测 36 条阶段行里 28 条带「阶段N：」前缀，
 *  且前缀序号与 `PhaseList` 顺序 100% 一致）。只用于**校验**前缀能不能剥，不参与展示。 */
const CN_ORDINAL = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 阶段标题：编号另起一个标记位（`阶段 {{i+1}}`，见模板），故把名字里那句「阶段N：」剥掉——
 *  同一行把「第几阶段」说两遍会被读成两个不同的东西。前缀与顺序不一致（当前 0 例）或超出十时
 *  **保留原样**：宁可重复，不可标错号。名字本身不动（源文本保真），这里只是取它的一段。 */
function guidePhaseName(p: MazeBossPhase, i: number): string {
  const m = p.name.match(/^阶段\s*([一二三四五六七八九十\d]+)\s*[：:]\s*/);
  return m && m[1] === CN_ORDINAL[i] ? p.name.slice(m[0].length) : p.name;
}

/** 状态词条描述：本仓只落**无 `#N[i]` 占位符**的描述，故按普通富文本渲染（换行仍走 fmtDesc） */
function statusDesc(desc?: string): string {
  return fmtDesc(desc, []);
}

/** 同族条的 4 个数值格（弱点格单独渲染：图标）。该档详情未到达时给破折号，不猜值。 */
function variantCell(det: MonsterDetail | null, key: 'stance' | 'hp' | 'speed' | 'skills'): string {
  if (!det) return '—';
  if (key === 'stance') return fmtStatValue(det.stance);
  if (key === 'hp') return fmtStatValue(det.stats.hp);
  if (key === 'speed') return fmtStatValue(det.stats.speed);
  return String(det.skills.length);
}

/* ─── 掉落 / 出没 / 额外阶段（monster_extra.py 的三块，按模板归属） ───
   掉落按均衡等级分档（`world_level == null` 是基准档）；出没给关卡数与关卡名样本（样本可能为空：
   关卡无名时不落样本，此时只呈现总数）；额外阶段按源表 PhaseID 呈现，**不翻译成游戏内阶段号**。 */
const drops = computed(() => d.value?.drops ?? []);
const appearances = computed(() => d.value?.appearances ?? null);
/* 关卡实战面板（ADR 0050）：样本带关卡语境（等级 / 难度组 / 关卡精英组），
   Π精英组别系数 = 怪物自身组 × 关卡指派组；曲线行缺失或四维任一合成失败 → 该样本无面板（不假数值）。 */
type MonsterSamplePanel = { hp: number; atk: number; def: number; speed: number };
const samplePanels = computed<Record<number, MonsterSamplePanel | null> | null>(() => {
  const v = d.value;
  if (!v) return null;
  const own = eliteRef.value?.[String(v.elite_group ?? 1)] ?? null;
  const out: Record<number, MonsterSamplePanel | null> = {};
  for (const s of v.appearances?.samples ?? []) {
    if (s.level == null) {
      out[s.id] = null;
      continue;
    }
    const stageElite = eliteRef.value?.[String(s.elite_group ?? 1)] ?? null;
    const meta = {
      statRatio: v.stat_ratio ?? null,
      levelGroup: s.level_group ?? 1,
      eliteRatios: monsterEliteRatiosProduct(own, stageElite),
      stats: v.stats,
      curve: curveRef.value,
      modify: v.speed_modify == null ? null : { speed: v.speed_modify },
    };
    const hp = monsterStatAt('hp', s.level, meta);
    const atk = monsterStatAt('atk', s.level, meta);
    const def = monsterStatAt('def', s.level, meta);
    const speed = monsterStatAt('speed', s.level, meta);
    out[s.id] = hp != null && atk != null && def != null && speed != null
      ? { hp, atk, def, speed }
      : null;
  }
  return out;
});
/** 弱点 + 抗性的比对签名（抗性键序归一：JSON 键序会随写入顺序变，直接 stringify 会误判为不同） */
function phaseSig(weak: string[] | undefined, resist: Record<string, number> | undefined): string {
  return JSON.stringify([
    [...(weak ?? [])].sort(),
    Object.entries(resist ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
/**
 * 「其他形态」：源表 `MonsterAtlasExtraPhase(s)` 是**图鉴条目**（`TemplateGroupID`）的额外立绘形态表，
 * 按组挂到该组的每个变体上，且**上游没有给这些行编阶段号**（`PhaseID` 只是组内行键：4015011 的两行
 * 行序与立绘序号相反，3025010 的 `PhaseID=1` 行立绘名就写着 `_Phase2`）。故只呈现**含新信息**的行：
 *
 * ① 与本体现值相同 → 丢弃（同一屏把同样两行再说一遍）；
 * ② **该形态本身就是同条目的另一个条目页** → 丢弃：名字能在条目成员里找到时，那份弱点属于那个页面
 *    （`4034013` 的「无缘黎明」卡厄斯兰那 = 条目 `4034015`，连 `MonsterConfig` 都逐字相同），
 *    摆到本页等于同一事实两处说，还会被读成「本怪的第二形态／阶段」；「图鉴族」互链已给入口。
 *    实测这条只吃掉 `4034013` / `4034018`，神主日那条（「哲学的胎儿」星期日）**不在目录里**、故保留；
 * ③ 与**条目基准成员**（`id === atlas_group`）逐字相同、且自己不带名字/介绍 → 丢弃。实测 12 条形态行里
 *    11 条是这样的「同一实体的另一套模型」，弱点只是条目基线的副本；挂到配置不同的变体上（煽动者
 *    `8015022`、常胜军 `4014013`）会把基准成员的弱点说成它的形态弱点；
 * ④ 行间逐字同名（连名字都相同）→ 合并。
 * 数据保持原样落盘（源表保真），判定只发生在渲染层。
 */
const phases = computed(() => {
  const cur = d.value;
  if (!cur) return [];
  const base = phaseSig(cur.weak, cur.resist);
  const canon = atlasCanonical.value;
  const canonSig = canon ? phaseSig(canon.weak, canon.resist) : base;
  const siblingNames = new Set(atlasRows.value.map((r) => r.name));
  const rows: Array<MonsterPhase & { phase_ids: number[] }> = [];
  const seen = new Map<string, number>();
  for (const p of cur.phases ?? []) {
    const s = phaseSig(p.weak, p.resist);
    if (s === base) continue;
    if (p.name && siblingNames.has(p.name)) continue;
    if (s === canonSig && !p.name && !p.intro) continue;
    const key = `${s}\u0000${p.name ?? ''}`;
    const hit = seen.get(key);
    if (hit !== undefined) {
      rows[hit].phase_ids.push(p.phase_id);
      continue;
    }
    seen.set(key, rows.length);
    rows.push({ ...p, phase_ids: [p.phase_id] });
  }
  return rows;
});

function tierLabel(worldLevel: number | null): string {
  return worldLevel == null ? '基准档' : `均衡等级 ${worldLevel}`;
}

/** 一个阶段的弱点/抗性标签（与本体行同一渲染口径：元素图标 + 名称/百分比） */
function phaseTags(phase: MonsterPhase, kind: 'weak' | 'resist'): string {
  if (kind === 'weak') return (phase.weak ?? []).map(elemTag).join('');
  return Object.entries(phase.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(ELEM[k] || k)} ${Math.round(v * 100)}%</span>`)
    .join('');
}
</script>

<template>
  <div class="nk-mob-page">
    <div v-if="showSkeleton" class="nk-mob-skeleton" aria-hidden="true">
      <div class="nk-mob-skeleton__hero"></div>
      <div class="nk-mob-skeleton__body">
        <div class="nk-mob-skeleton__line"></div>
        <div class="nk-mob-skeleton__line"></div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">怪物数据加载失败</div>
      <div class="nk-error-state__detail">可能是网络波动或该条目暂时不可用，重试即可恢复。</div>
      <div class="nk-error-state__tech">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="d">
      <div class="nk-mob-hero">
        <div class="nk-mob-hero__figure">
          <img :src="figureUrl" :alt="d.name" loading="eager">
        </div>
        <div class="nk-mob-hero__info">
          <div class="nk-mob-hero__meta">
            <span class="nk-mob-hero__no">ARCHIVE · № {{ d.id }}</span>
            <span v-if="rankLabel">{{ rankLabel }}</span>
            <span v-if="d.camp">{{ d.camp }}</span>
            <span v-if="d.stance">韧性 {{ d.stance }}</span>
          </div>
          <h1 class="nk-mob-hero__name">{{ d.name }}</h1>
          <RouterLink v-if="invaded" class="nk-mob-invaded" to="/voracity">
            <span class="nk-mob-invaded__text">受『贪饕』侵蚀</span>
            <span v-if="invadedLevels" class="nk-mob-invaded__lv">· 等级 {{ invadedLevels }}</span>
          </RouterLink>
          <!-- 弱点与抗性上收进 hero 信息列：条数有限、占位固定，不像图鉴正文那样会把 hero 撑长 -->
          <section class="nk-mob-hero__sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">弱点与抗性</h2>
              <span class="nk-mob-sec__en">VULNERABILITY</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-resist">
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">韧性弱点</span>
                <span v-if="weakHtml" class="nk-mob-resist__tags" v-html="weakHtml"></span>
                <span v-else class="nk-mob-empty">无弱点信息</span>
              </div>
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">伤害抗性</span>
                <span v-if="resistHtml" class="nk-mob-resist__tags" v-html="resistHtml"></span>
                <span v-else class="nk-mob-empty">无抗性信息</span>
              </div>
            </div>
            <!-- 其他形态（源表 MonsterAtlasExtraPhase(s)）：该图鉴条目另有立绘形态，各有自己的弱点/抗性。
                 上游没有阶段号可依（`PhaseID` 只是组内行键），故**不写「阶段 N」**：官方给了名字就用名字，
                 没名字的（多为同一实体的另一套模型）只标「其他形态」。判定见 `phases` 计算属性。 -->
            <div v-if="atlasReady && phases.length" class="nk-mob-phases">
              <div v-for="p in phases" :key="p.phase_ids[0]" class="nk-mob-phase">
                <div class="nk-mob-phase__head">
                  <span v-if="p.name" class="nk-mob-phase__name">{{ p.name }}</span>
                  <span v-else class="nk-mob-phase__label">其他形态</span>
                </div>
                <div class="nk-mob-resist__row">
                  <span class="nk-mob-resist__label">韧性弱点</span>
                  <span v-if="(p.weak || []).length" class="nk-mob-resist__tags" v-html="phaseTags(p, 'weak')"></span>
                  <span v-else class="nk-mob-empty">无弱点信息</span>
                </div>
                <div class="nk-mob-resist__row">
                  <span class="nk-mob-resist__label">伤害抗性</span>
                  <span v-if="Object.keys(p.resist || {}).length" class="nk-mob-resist__tags" v-html="phaseTags(p, 'resist')"></span>
                  <span v-else class="nk-mob-empty">无抗性信息</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 图鉴正文回文档流：长度不可控（目录里 0~356 字），不该由 hero 承担 -->
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">图鉴记录</h2>
              <span class="nk-mob-sec__en">DOSSIER</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-sec__body nk-mob-intro" v-html="introHtml"></p>
          </section>

          <!-- 首领阶段机制（MonsterGuideConfig × MonsterGuidePhase，官方文案）：与末日幻影敌方卡的首领机制
               同源同形。阶段名自带「阶段一：…」前缀——站内唯一有来源的阶段号（`phases[].phase_id` 不是）。
               仅 22 个目录条目登记了这套文案，其余不渲染整块。 -->
          <section v-if="d.guide_phases?.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">阶段机制</h2>
              <span class="nk-mob-sec__en">BOSS GUIDE</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-guides">
              <article v-for="(g, i) in d.guide_phases" :key="g.id" class="nk-mob-guide">
                <header class="nk-mob-guide__head">
                  <span class="nk-mob-guide__no">阶段 {{ i + 1 }}</span>
                  <h3 class="nk-mob-guide__name">{{ guidePhaseName(g, i) }}</h3>
                </header>
                <p v-if="g.desc" class="nk-mob-guide__desc" v-html="fmtDesc(g.desc, [])"></p>
                <p v-if="g.answer" class="nk-mob-guide__answer" v-html="fmtDesc(g.answer, [])"></p>
                <ul v-if="g.skills?.length" class="nk-mob-guide__qas">
                  <li v-for="s in g.skills" :key="s.name" class="nk-mob-guide__qa">
                    <span class="nk-mob-guide__q">{{ s.name }}</span>
                    <span v-if="s.desc" class="nk-mob-guide__a" v-html="fmtDesc(s.desc, [])"></span>
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">战斗数值</h2>
              <span class="nk-mob-sec__en">COMBAT STATS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <!-- 等级档滑条：复用光锥页「叠影」range 原语（.nk-skill__slider），页级字号口径 -->
            <div v-if="maxLevel > 1" class="nk-mob-level">
              <span class="nk-mob-level__label">等级 {{ combatLevel }}</span>
              <input
                type="range"
                aria-label="敌人等级"
                :min="1"
                :max="maxLevel"
                :value="combatLevel"
                :style="{ '--fill': `${((combatLevel - 1) / (maxLevel - 1)) * 100}%` }"
                @input="levelOverride = Number(($event.target as HTMLInputElement).value)"
              >
            </div>
            <p v-else class="nk-mob-empty">该怪物的等级曲线暂缺组 {{ d?.level_group ?? 1 }}，仅展示档案基准值。</p>
            <dl class="nk-mob-stats">
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">HP 生命</dt>
                <dd class="nk-mob-stat__val" data-prop="hp">{{ fmtStatValue(combatStats?.hp ?? d.stats.hp) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">ATK 攻击</dt>
                <dd class="nk-mob-stat__val" data-prop="atk">{{ fmtStatValue(combatStats?.atk ?? d.stats.atk) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">DEF 防御</dt>
                <dd class="nk-mob-stat__val" data-prop="def">{{ fmtStatValue(combatStats?.def ?? d.stats.def) }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">SPD 速度</dt>
                <dd class="nk-mob-stat__val" data-prop="spd">{{ fmtStatValue(combatStats?.speed ?? d.stats.speed) }}</dd>
              </div>
              <div v-if="d.stance" class="nk-mob-stat nk-mob-stat--stance">
                <dt class="nk-mob-stat__label">韧性</dt>
                <dd class="nk-mob-stat__val">{{ fmtStatValue(stanceValue ?? d.stance) }}</dd>
              </div>
            </dl>
            <p class="nk-mob-stat-note">口径：模板基准 × 维度修饰比 × 精英组倍率（组 {{ d.elite_group ?? 1 }}）× 等级曲线（难度组 {{ d.level_group ?? 1 }}）＋ 实例修正值；<strong>韧性不入该曲线</strong>（韧性 = 韧性基准 × 精英组韧性倍率 + 实例修正值，不随等级变化，故在上方单独一行）；基准值 {{ d.stats.hp }} / {{ d.stats.atk }} / {{ d.stats.def }} / {{ d.stats.speed }}<template v-if="d.stance_modify != null || d.speed_modify != null">，本档修正 <template v-if="d.stance_modify != null">韧性 {{ d.stance_modify > 0 ? '+' : '' }}{{ d.stance_modify }}</template><template v-if="d.stance_modify != null && d.speed_modify != null"> / </template><template v-if="d.speed_modify != null">速度 {{ d.speed_modify > 0 ? '+' : '' }}{{ d.speed_modify }}</template></template>，未含关卡侧精英组指派（侵蚀隧洞、拟造花萼等副本的额外倍率）与剧情系数。</p>
          </section>

          <section v-if="d.skills.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">技能</h2>
              <span class="nk-mob-sec__en">SKILLS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-skills">
              <article v-for="s in d.skills" :key="s.id" class="nk-mob-skill">
                <header class="nk-mob-skill__head">
                  <span class="nk-mob-skill__name">{{ s.name }}</span>
                  <span v-if="s.tag" class="nk-mob-skill__tag">{{ s.tag }}</span>
                </header>
                <div v-if="skillMeta(s)" class="nk-mob-skill__meta" v-html="skillMeta(s)"></div>
                <div v-if="skillHtml(s)" class="nk-mob-skill__desc" v-html="skillHtml(s)"></div>
                <!-- 原始参数（ParamList 数组原值）：描述引用与否都展示——#N 已展开的技能重复一次
                     供对照，缺行比重复更困惑（描述常只写「大概率」不说值）；值间「 / 」分隔，
                     防止 1 与 1 连读成 11。官方 ParamList 是无标注数组，不声称任何语义含义。 -->
                <div v-if="s.param_list?.length" class="nk-mob-skill__params">
                  <span class="nk-mob-skill__paramsk">参数</span>
                  <span class="nk-mob-skill__paramsvals">{{ s.param_list.map((p) => fmtStatValue(p)).join(' / ') }}</span>
                </div>
                <!-- 附带效果（ExtraEffectIDList × ExtraEffectConfig，完整外键）：技能另外施加的机制，
                     名称 + 描述都是数据文本；图标在两侧 CDN 全 404，故不落图标 -->
                <div v-if="s.extra_effects?.length" class="nk-mob-skill__fx">
                  <span class="nk-mob-skill__fxk">附带效果</span>
                  <span v-for="fx in s.extra_effects" :key="fx.id" class="nk-mob-skill__fxitem">
                    <span class="nk-mob-skill__fxname">{{ fx.name }}</span>
                    <span v-if="fxHtml(fx)" class="nk-mob-skill__fxdesc" v-html="fxHtml(fx)"></span>
                  </span>
                </div>
              </article>
            </div>
          </section>

          <section v-if="d.statuses?.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">状态词条</h2>
              <span class="nk-mob-sec__en">STATUSES</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <!-- 口径：归属靠命名约定（`MonsterStatusConfig.ModifierName` 含怪物配置名），不是外键；
                 只保留「该配置名下的模板去形态后缀后同名」的词条（宁可少归不可错归）。
                 带 `#N[i]` 的描述（数值来自动态属性）本仓无值，按仓规整段省略——故有些词条只有名称与类型。 -->
            <p class="nk-mob-status__lead">口径：按状态配置名与怪物配置名的命名约定归属；数值或动态名称未公开的词条只列名称与类型。</p>
            <div class="nk-mob-statuses">
              <article v-for="s in d.statuses" :key="s.id" class="nk-mob-status" :data-type="s.type">
                <header class="nk-mob-status__head">
                  <!-- 图标位（占位）：状态图标源路径 `StatusIconPath` 全是 `BuffIcon/Inlevel/*`，
                       该目录在 nanoka 与 jsDelivr **双侧 404**（实测），本仓也没有本地入库，
                       故先放占位符、把尺寸与位置固定下来。
                       图标资源到位后：数据侧给 `statuses[]` 加 `icon`（basename），
                       这里把 <svg> 换成 <img :src="cdnUri('bufficon', `${s.icon}.webp`)">，
                       并给 img 加 @error 兜底（与终局增益图标同款 SVG）。 -->
                  <span class="nk-mob-status__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                      <path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z" />
                      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <span class="nk-mob-status__name">{{ s.name }}</span>
                  <span class="nk-mob-status__type">{{ statusTypeLabel(s.type) }}</span>
                  <span v-if="s.dispel" class="nk-mob-status__dispel">可驱散</span>
                </header>
                <p v-if="s.desc" class="nk-mob-status__desc" v-html="statusDesc(s.desc)"></p>
              </article>
            </div>
          </section>

          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">出没关卡</h2>
              <span class="nk-mob-sec__en">ENCOUNTERS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <!-- 三行结构：计数（大数）→ 样本（活动名弱化 + 关卡名）→ 一句人话说明；技术口径收进折叠块。
                 空态与「有计数无样本」都显式：源数据里没有关卡名的关卡只计数、不以敌人名替代（ADR 0047）。 -->
            <template v-if="appearances">
              <p class="nk-mob-appear__count">
                出现在 <strong>{{ appearances.total }}</strong> 个关卡<template v-if="appearances.samples.length">，以下为其中几处：</template><template v-else>。</template>
              </p>
              <ul v-if="appearances.samples.length" class="nk-mob-appear__samples">
                <li v-for="s in appearances.samples" :key="s.id" class="nk-mob-appear__sample">
                  <span class="nk-mob-appear__sample-name"><template v-if="s.activity"><span class="nk-mob-appear__sample-from">{{ s.activity }}</span> · </template>{{ s.name }}</span>
                  <!-- 单行插值：textContent 逐字可断言（等级 + 四维，千分位同 fmtStatValue 口径） -->
                  <span v-if="samplePanels?.[s.id]" class="nk-mob-appear__sample-panel"><span class="nk-mob-appear__sample-panel-lv">等级 {{ s.level }}</span> · HP {{ fmtStatValue(samplePanels[s.id]!.hp) }} / ATK {{ fmtStatValue(samplePanels[s.id]!.atk) }} / DEF {{ fmtStatValue(samplePanels[s.id]!.def) }} / SPD {{ fmtStatValue(samplePanels[s.id]!.speed) }}</span>
                </li>
              </ul>
              <p class="nk-mob-appear__tip">
                <template v-if="appearances.samples.length">关卡名取自游戏内（活动关卡 / 终局层级 / 侵蚀隧洞 · 凝滞虚影 / 强敌挑战 · 剑试），至多列 3 处。</template>
                <template v-else>这些关卡在游戏内没有关卡名，只计入上面的数量。</template>
              </p>
            </template>
            <p v-else class="nk-mob-appear__count nk-mob-appear__count--none">暂无关卡出场记录。</p>
            <details class="nk-mob-appear__how">
              <summary>统计口径</summary>
              <p>按关卡波次统计，被其他敌人召唤出场的关卡也算；同一个关卡只算一次，一个关卡名可能覆盖多个难度档或上下半场。无限波次玩法里随机抽取的编组不算关卡，不计入。</p>
            </details>
            <!-- 活动出处（判据见 ADR 0048）：活动名/页签名是源文本；「美术复用」按转换器给的
                 `art_shared`（同卡面图标 + 立绘是否相同两个维度）表述，**不写站点证不了的「技能组复用」**。 -->
            <div v-if="d.event" class="nk-mob-event">
              <p class="nk-mob-event__k">活动出处</p>
              <p class="nk-mob-event__line">
                <template v-if="d.event.count !== (appearances?.total ?? -1)">其中 {{ d.event.count }} 个在「{{ d.event.name }}」活动里，</template>
                <template v-else>全部关卡都在「{{ d.event.name }}」活动里，</template>
                等级 {{ eventLevelText }}<template v-if="d.event.tabs.length">；页签：{{ d.event.tabs.join(' / ') }}</template>。
              </p>
              <p v-if="d.art_shared" class="nk-mob-event__line">
                <template v-if="d.art_shared.figure">本形态没有独立美术：卡面与立绘与「{{ d.art_shared.name }}」共用（同卡面共 {{ d.art_shared.forms }} 个形态）。</template>
                <template v-else>本形态与「{{ d.art_shared.name }}」等 {{ d.art_shared.forms }} 个形态同卡面图标，立绘不同。</template>
              </p>
            </div>
          </section>

          <section v-if="drops.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">掉落</h2>
              <span class="nk-mob-sec__en">DROPS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-drop__lead">按均衡等级分档；「基准档」为无均衡等级限制的那一档。</p>
            <div class="nk-mob-drops">
              <div v-for="t in drops" :key="String(t.world_level)" class="nk-mob-drop">
                <div class="nk-mob-drop__head">
                  <span class="nk-mob-drop__tier">{{ tierLabel(t.world_level) }}</span>
                  <span v-if="t.avatar_exp" class="nk-mob-drop__exp">角色经验 {{ t.avatar_exp }}</span>
                </div>
                <div class="nk-mob-drop__items">
                  <span v-for="it in t.items" :key="it.id" class="nk-mob-drop__item" :title="it.name">
                    <img v-if="itemIconUrl(it.icon)" :src="itemIconUrl(it.icon)" :alt="it.name" loading="lazy">
                    <span>{{ it.name }}</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section v-if="variants.length || atlasOthers.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">同族变体</h2>
              <span class="nk-mob-sec__en">VARIANTS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
              <span v-if="variants.length" class="nk-mob-var__count">{{ variants.length }} 档</span>
            </header>
            <p v-if="variants.length" class="nk-mob-var__lead">
              名称与卡面相同的 {{ variants.length }} 个数值档，弱点／韧性／数值／技能各不相同。
              「差分」列出的字段是本档与本页当前档不同的全部差异。
            </p>
            <div class="nk-mob-var">
              <RouterLink
                v-for="v in variants"
                :key="v.row.id"
                class="nk-mob-var__row"
                :class="{ 'is-current': v.isCurrent }"
                :to="`/monster/${v.row.id}`"
                :aria-current="v.isCurrent ? 'page' : undefined"
                :title="`${v.row.name} №${v.row.id} · ${v.flag}`"
              >
                <span class="nk-mob-var__fig">
                  <img :src="monsterIconUrl(v.row.icon)" :alt="v.row.name" loading="lazy">
                </span>
                <span class="nk-mob-var__id">№ {{ v.row.id }}</span>
                <span class="nk-mob-var__cells">
                  <span class="nk-mob-var__cell" :class="{ 'is-diff': v.diffCells.includes('weak') }">
                    <span class="nk-mob-var__k">弱点</span>
                    <span v-if="v.det" class="nk-mob-var__weak">
                      <img
                        v-for="e in v.det.weak"
                        :key="e"
                        :src="elementIconUrl(e)"
                        :alt="ELEM[e] || e"
                        :title="ELEM[e] || e"
                        loading="lazy"
                      >
                      <span v-if="!v.det.weak.length" class="nk-mob-var__none">无</span>
                    </span>
                    <span v-else class="nk-mob-var__none">—</span>
                  </span>
                  <span class="nk-mob-var__cell" :class="{ 'is-diff': v.diffCells.includes('stance') }">
                    <span class="nk-mob-var__k">韧性</span>{{ variantCell(v.det, 'stance') }}
                  </span>
                  <span class="nk-mob-var__cell" :class="{ 'is-diff': v.diffCells.includes('hp') }">
                    <span class="nk-mob-var__k">HP</span>{{ variantCell(v.det, 'hp') }}
                  </span>
                  <span class="nk-mob-var__cell" :class="{ 'is-diff': v.diffCells.includes('speed') }">
                    <span class="nk-mob-var__k">速度</span>{{ variantCell(v.det, 'speed') }}
                  </span>
                  <span class="nk-mob-var__cell" :class="{ 'is-diff': v.diffCells.includes('skills') }">
                    <span class="nk-mob-var__k">技能</span>{{ variantCell(v.det, 'skills') }}
                  </span>
                </span>
                <span class="nk-mob-var__flag">{{ v.flag }}</span>
              </RouterLink>
            </div>
            <!-- 图鉴族（官方 `TemplateGroupID`）：与上方互补的第二个维度——官方把「同一图鉴条目的
                 各具名形态」并组，比卡面判据粗（12 个多成员组连卡面图标都不同）。此处只列非同卡面的
                 形态，且**不用它排变体序号**。官方 `AtlasSortID` 不作序（169/472 有值、仅 2/113 组齐全）。 -->
            <div v-if="atlasOthers.length" class="nk-mob-atlas">
              <span class="nk-mob-atlas__k">图鉴族</span>
              <span class="nk-mob-atlas__note">
                官方登记的同一条目下另有 {{ atlasOthers.length }} 个形态（共 {{ atlasRows.length }} 个，含本页）
              </span>
              <span class="nk-mob-atlas__links">
                <RouterLink
                  v-for="f in atlasOthers"
                  :key="f.id"
                  class="nk-mob-atlas__link"
                  :to="`/monster/${f.id}`"
                >{{ f.name }}</RouterLink>
              </span>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
