<script setup lang="ts">
/**
 * 角色详情页（移植自原 character.js 渲染与交互逻辑）
 * 结构：Hero（视差立绘 + Spine 双通道）/ 吸顶 Tabs（含强化模式切换）/ 四面板
 *   概览：描述 + 总属性加成 diff + TALENTS 附加能力 diff
 *   技能：type+type_name 分组 + 滑条响应式 + REMOVED 卡片 + 忆灵技能
 *   星魂：E1-6 diff + 删除卡片
 *   配装：推荐光锥 / 队伍 / 遗器主副词条 + 套装（异步加载描述）
 * 交互：1-4 热键切 Tab（生命周期内作用域）/ 强化切换纯内存重渲染（store computed 驱动）
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useCharacterStore } from '../stores/character';
import SkillCard from '../character/SkillCard.vue';
import { initSpineViewer } from '../character/spine';
import { loadLocalRelicSet } from '../../services/api';
import {
  avatarDrawCardUrl, eidolonIconUrl, escHtml, fmtDesc, fmtDescDiff,
  hasParamDiff, hasTextDiff, iconUrl, itemName, maxLevelStat, maxLevelValue,
  skillIconUrl, stripAllTags,
} from '../../lib/format';
import { CDN, CHAR_TABS, ELEM, MAX_CHAR_LEVEL, PATH, PROP_ICON, SKILL_ORDER, TYPE } from '../../lib/constants';
import type {
  CharacterData, RelicSetData, Skill, SkillExtra, SkillTree,
} from '../../services/types';

const route = useRoute();
const app = useAppStore();
const char = useCharacterStore();

/* ═══════════ 加载 ═══════════ */

const phase = computed<'loading' | 'error' | 'ready'>(() =>
  char.error ? 'error' : char.data ? 'ready' : 'loading',
);
/** 渲染数据：加强模式 → 加强视图 + 重映射旧视图；原始模式 → oldD=null */
const d = computed<CharacterData | null>(() => char.renderData.d);
const oldD = computed<CharacterData | null>(() => char.renderData.oldD);

async function load(id: string): Promise<void> {
  try {
    await char.load(id);
  } catch {
    app.toast('error', `加载失败: ${char.error || '未知错误'}`);
  }
}
function retry(): void {
  void load(String(route.params.id || ''));
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  void load(String(route.params.id || ''));
});
// 角色 → 角色导航（同组件复用）时重新加载
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== char.charId) void load(String(id));
  },
);

/* ═══════════ Hero：属性 diff / 视差 / Spine ═══════════ */

const heroBg = computed(() => avatarDrawCardUrl(char.charId));
const stars = computed(() =>
  d.value ? '★'.repeat(parseInt(d.value.rarity.replace(/\D/g, ''), 10) || 5) : '',
);

interface HeroStat { v: number | string; l: string; ov: number | string | null; icon: string; raw: number }
/** 全部 8 项展示属性：HP/ATK/DEF/SPD + 暴击率/暴击伤害/嘲讽/能量消耗（参考官方 Wiki 头部） */
const heroStats = computed<HeroStat[]>(() => {
  const dd = d.value;
  if (!dd) return [];
  const s = maxLevelStat(dd.stats);
  if (!s) return [];
  const o = oldD.value ? maxLevelStat(oldD.value.stats) : null;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const mk = (v: number | string, l: string, ov: number | string | null, icon: string, raw: number): HeroStat => ({
    v, l, ov, icon, raw,
  });
  return [
    mk(Math.round(maxLevelValue(s.hp_base, s.hp_add)), 'HP', o ? Math.round(maxLevelValue(o.hp_base, o.hp_add)) : null, 'hp', 0),
    mk(Math.round(maxLevelValue(s.attack_base, s.attack_add)), 'ATK', o ? Math.round(maxLevelValue(o.attack_base, o.attack_add)) : null, 'atk', 1),
    mk(Math.round(maxLevelValue(s.defence_base, s.defence_add)), 'DEF', o ? Math.round(maxLevelValue(o.defence_base, o.defence_add)) : null, 'def', 2),
    mk(s.speed_base, 'SPD', o ? o.speed_base : null, 'spd', 3),
    mk(fmtPct(s.critical_chance), '暴击率', o && o.critical_chance !== s.critical_chance ? fmtPct(o.critical_chance) : null, 'crit-rate', 4),
    mk(fmtPct(s.critical_damage), '暴击伤害', o && o.critical_damage !== s.critical_damage ? fmtPct(o.critical_damage) : null, 'crit-dmg', 5),
    mk(s.base_aggro ?? 0, '嘲讽值', o ? (o.base_aggro ?? 0) : null, 'taunt', 6),
    mk(dd.sp_need ?? 0, '能量消耗', oldD.value ? (oldD.value.sp_need ?? null) : null, 'energy', 7),
  ];
});

/** 当前等级上限（本地数据源无等级上限字段，固定为最大等级） */
const levelLimit = computed<number>(() => MAX_CHAR_LEVEL);

/* ─── 视差（同首页 lerp 方案，作用于 Hero 立绘背景） ─── */
/** 仅精确指针设备启用视差（触屏滚动会模拟 mousemove，导致立绘抖动） */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const heroRef = ref<HTMLElement | null>(null);
const heroBgRef = ref<HTMLElement | null>(null);
let ptx = 0, pty = 0, pcx = 0, pcy = 0;
let pRaf: number | null = null;
function parallaxLoop(): void {
  pcx += (ptx - pcx) * 0.06;
  pcy += (pty - pcy) * 0.06;
  if (heroBgRef.value) {
    heroBgRef.value.style.transform =
      `translate3d(${(pcx * 15).toFixed(2)}px, ${(pcy * 10).toFixed(2)}px, 0) scale(1.06)`;
  }
  if (Math.abs(ptx - pcx) > 0.001 || Math.abs(pty - pcy) > 0.001) {
    pRaf = requestAnimationFrame(parallaxLoop);
  } else {
    pRaf = null;
  }
}
function kickParallax(): void {
  if (pRaf === null) pRaf = requestAnimationFrame(parallaxLoop);
}
function onHeroMove(e: MouseEvent): void {
  if (!finePointer || spineVisible.value) return; // 触屏不触发；动画开启时冻结视差
  const el = heroRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  ptx = (e.clientX - r.left) / r.width - 0.5;
  pty = (e.clientY - r.top) / r.height - 0.5;
  kickParallax();
}
function onHeroLeave(): void {
  ptx = 0; pty = 0;
  kickParallax();
}

/* ─── Spine 查看器（charId + ready 阶段变化时重建；加强切换不重建） ─── */
const spineRef = ref<HTMLElement | null>(null);
const spineReady = ref(false);
const spineVisible = ref(false);
let spineCleanup: (() => void) | null = null;

watch(
  () => [char.charId, phase.value] as const,
  async ([id, ph]) => {
    if (spineCleanup) {
      spineCleanup();
      spineCleanup = null;
    }
    spineReady.value = false;
    spineVisible.value = false;
    if (!id || ph !== 'ready') return;
    await nextTick();
    if (spineRef.value) {
      spineCleanup = initSpineViewer(spineRef.value, id, () => {
        spineReady.value = true;
        spineVisible.value = true;
      });
    }
  },
);

function toggleSpine(): void {
  if (!spineReady.value) return; // 无动画时忽略点击
  spineVisible.value = !spineVisible.value;
  if (spineVisible.value) { ptx = 0; pty = 0; kickParallax(); } // 开启动画时立绘回中
}

/* ═══════════ Tabs / 强化模式 ═══════════ */

const TAB_DEFS: { key: string; label: string }[] = [
  { key: 'overview', label: '概览' },
  { key: 'skills', label: '技能' },
  { key: 'eidolons', label: '星魂' },
  { key: 'builds', label: '配装' },
];

/** 加强摘要横幅（剥离 <color> 标签） */
const enhNotes = computed<string[]>(() => {
  if (!char.enhKey || !char.data) return [];
  const enh = char.data.enhanced && char.data.enhanced[char.enhKey];
  const descs = enh && (enh.descs as string[] | undefined);
  if (!descs || !descs.length) return [];
  return descs.map((t) => stripAllTags(t));
});

/** 角色页热键 1-4 切 Tab（忽略输入框，生命周期内作用域） */
function onKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t) {
    const tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return;
  }
  const idx = ['1', '2', '3', '4'].indexOf(e.key);
  if (idx >= 0) char.setTab(CHAR_TABS[idx]);
}

/* ─── Tabs 横向滚动淡出提示（检测溢出；滚到末尾自动隐藏） ─── */
const tabsRef = ref<HTMLElement | null>(null);
const tabsOverflow = ref(false);
const tabsAtEnd = ref(false);
const tabsFade = computed(() => tabsOverflow.value && !tabsAtEnd.value);
let tabsRo: ResizeObserver | null = null;
function checkTabsOverflow(): void {
  const el = tabsRef.value;
  if (!el) { tabsOverflow.value = false; return; }
  tabsOverflow.value = el.scrollWidth > el.clientWidth + 2;
  tabsAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
}
function onTabsScroll(): void {
  const el = tabsRef.value;
  if (!el) return;
  tabsAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
}
watch(
  () => phase.value,
  () => {
    void nextTick(() => {
      if (tabsRo) { tabsRo.disconnect(); tabsRo = null; }
      if (tabsRef.value) {
        tabsRo = new ResizeObserver(checkTabsOverflow);
        tabsRo.observe(tabsRef.value);
      }
      checkTabsOverflow();
    });
  },
);

/* ═══════════ 概览面板 ═══════════ */

const overviewDesc = computed(() => escHtml((d.value && d.value.desc) || '').replace(/\\n/g, '<br>'));

/* ─── 角色档案（阵营 + 四语 CV） ─── */

interface ProfileRow { label: string; value: string }
const profileRows = computed<ProfileRow[]>(() => {
  const info = d.value && d.value.chara_info;
  if (!info) return [];
  const rows: ProfileRow[] = [];
  const va = info.va;
  if (va) {
    const defs: [string, string | null | undefined][] = [
      ['CV · 中文', va.chinese], ['CV · 日语', va.japanese],
      ['CV · 韩语', va.korean], ['CV · 英语', va.english],
    ];
    for (const [label, v] of defs) {
      if (v) rows.push({ label, value: v });
    }
  }
  return rows;
});

/* ─── 角色故事（折叠手风琴） ─── */

interface StoryEntry { key: string; idx: number; html: string }
const storyEntries = computed<StoryEntry[]>(() => {
  const info = d.value && d.value.chara_info;
  if (!info || !info.stories) return [];
  return Object.entries(info.stories)
    .filter(([, v]) => !!v)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, v]) => ({
      key,
      idx: Number(key) + 1,
      html: escHtml(v as string).replace(/\\n/g, '<br>'),
    }));
});
const openStory = ref<string | null>(null);
function toggleStory(key: string): void {
  openStory.value = openStory.value === key ? null : key;
}
// 切换角色时重置故事展开状态
watch(() => char.charId, () => { openStory.value = null; });

interface AttrBonus { name: string; v: string; ov: string | null; icon: string }

/** 聚合行迹树全部节点的 status_add_list（同 property 求和） */
function aggregateBonuses(
  trees: Record<string, Record<string, SkillTree>> | undefined,
): Map<string, { name: string; sum: number }> {
  const agg = new Map<string, { name: string; sum: number }>();
  if (!trees) return agg;
  for (const tree of Object.values(trees)) {
    for (const node of Object.values(tree)) {
      if (!node.status_add_list) continue;
      for (const s of node.status_add_list) {
        const cur = agg.get(s.property_type);
        if (cur) cur.sum += s.value;
        else agg.set(s.property_type, { name: s.name, sum: s.value });
      }
    }
  }
  return agg;
}

/** 加成值格式化：速度为固定值，其余为百分比（保留 1 位小数） */
function fmtBonus(type: string, sum: number): string {
  if (type === 'SpeedDelta') return `+${Math.round(sum)}`;
  return `+${Math.round(sum * 1000) / 10}%`;
}

/** 总属性加成：行迹树属性节点汇总（加强模式随 renderData 联动，支持与旧版 diff） */
const attrBonuses = computed<AttrBonus[]>(() => {
  const agg = aggregateBonuses(d.value ? d.value.skill_trees : undefined);
  const oldAgg = oldD.value ? aggregateBonuses(oldD.value.skill_trees) : null;
  return [...agg.entries()].map(([type, b]) => {
    const v = fmtBonus(type, b.sum);
    const ob = oldAgg && oldAgg.get(type);
    const ov = ob && fmtBonus(type, ob.sum) !== v ? fmtBonus(type, ob.sum) : null;
    const key = PROP_ICON[type];
    return {
      name: PROP_NAMES[type] || (b.name && b.name !== '{}' ? b.name : type),
      v, ov, icon: key ? `${CDN}/assets/hsr/trace/Icon${key}.webp` : '',
    };
  });
});

/** 词条（extra 按 name 去重；行迹树节点 extra 为 unknown，运行时过滤） */
function extraTerms(src: { extra?: Record<string, unknown> | null }): SkillExtra[] {
  const extra = src.extra as Record<string, SkillExtra> | undefined;
  if (!extra) return [];
  const seen = new Set<string>();
  return Object.values(extra).filter((t) => {
    if (!t || typeof t !== 'object' || !t.name || seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

interface Ability {
  name: string;
  icon: string;
  descHtml: string;
  status: '' | 'changed' | 'added';
  idx: number;
  terms: SkillExtra[];
}
const abilities = computed<Ability[]>(() => {
  const dd = d.value;
  if (!dd || !dd.skill_trees) return [];
  const list: SkillTree[] = [];
  Object.values(dd.skill_trees).forEach((tree) => {
    const n = tree['1'] || tree[Object.keys(tree)[0]];
    if (n && n.point_name && n.point_desc) list.push(n);
  });
  const oldMap: Record<string, SkillTree> = {};
  if (oldD.value && oldD.value.skill_trees) {
    Object.values(oldD.value.skill_trees).forEach((tree) => {
      const n = tree['1'] || tree[Object.keys(tree)[0]];
      if (n && n.point_name) oldMap[n.point_name] = n;
    });
  }
  return list.map((ab, idx) => {
    const oldAb = oldMap[ab.point_name as string] || null;
    const descHtml = oldD.value
      ? fmtDescDiff(ab.point_desc, ab.param_list || [], oldAb ? oldAb.point_desc : null, oldAb ? oldAb.param_list || [] : null)
      : fmtDesc(ab.point_desc, ab.param_list || []);
    const status: '' | 'changed' | 'added' = oldD.value
      ? oldAb
        ? hasParamDiff(ab.param_list || [], oldAb.param_list || []) || hasTextDiff(ab.point_desc, oldAb.point_desc)
          ? 'changed'
          : ''
        : 'added'
      : '';
    return {
      name: ab.point_name as string,
      icon: ab.icon ? iconUrl(ab.icon) : '',
      descHtml,
      status,
      idx,
      terms: extraTerms(ab),
    };
  });
});

/* ═══════════ 技能面板 ═══════════ */

interface SkillGroup { main: Skill; children: Skill[] }
/** 按 (type + type_name) 分组：首个为主技能，同组后续为子技能 */
function groupSkills(skills: Skill[]): SkillGroup[] {
  const valid = skills.filter(
    (s) => s.type !== 'MazeNormal' && !!s.type_name && SKILL_ORDER.includes(s.type),
  );
  const map = new Map<string, SkillGroup>();
  const groups: SkillGroup[] = [];
  valid.forEach((sk) => {
    const key = (sk.type || 'null') + '|' + (sk.type_name || '');
    const exist = map.get(key);
    if (!exist) {
      const g: SkillGroup = { main: sk, children: [] };
      map.set(key, g);
      groups.push(g);
    } else {
      exist.children.push(sk);
    }
  });
  groups.sort((a, b) => SKILL_ORDER.indexOf(a.main.type) - SKILL_ORDER.indexOf(b.main.type));
  return groups;
}

const skillGroups = computed<SkillGroup[]>(() =>
  d.value ? groupSkills(Object.values(d.value.skills)) : [],
);
const oldSkillById = computed<Record<string, Skill>>(() => {
  const map: Record<string, Skill> = {};
  if (oldD.value) {
    Object.values(oldD.value.skills).forEach((sk) => {
      if (sk.id != null) map[String(sk.id)] = sk;
    });
  }
  return map;
});

/** 旧版中删除的技能（在新版中不存在） */
const removedSkills = computed(() => {
  const dd = d.value;
  const od = oldD.value;
  if (!dd || !od) return [];
  const newIds = new Set(Object.values(dd.skills).map((s) => s.id));
  const removed: Skill[] = [];
  groupSkills(Object.values(od.skills)).forEach((g) => {
    if (!newIds.has(g.main.id)) removed.push(g.main);
    g.children.forEach((c) => {
      if (!newIds.has(c.id)) removed.push(c);
    });
  });
  return removed.map((sk) => {
    const lvObj = sk.level ? sk.level[Object.keys(sk.level).pop() as string] : null;
    return {
      sk,
      tn: sk.type_name || TYPE[sk.type] || '',
      icon: skillIconUrl(sk, char.charId, dd),
      descHtml: fmtDesc(sk.desc, (lvObj && lvObj.param_list) || []),
    };
  });
});

/* ─── 忆灵技能（记忆命途召唤物，单独渲染） ─── */
const memoSkills = computed<Skill[]>(() =>
  d.value && d.value.memosprite && d.value.memosprite.skills
    ? Object.values(d.value.memosprite.skills)
    : [],
);
const oldMemoById = computed<Record<string, Skill>>(() => {
  const map: Record<string, Skill> = {};
  const od = oldD.value;
  if (od && od.memosprite && od.memosprite.skills) {
    Object.values(od.memosprite.skills).forEach((sk) => {
      if (sk.id != null) map[String(sk.id)] = sk;
    });
  }
  return map;
});

/* ═══════════ 星魂面板 ═══════════ */

interface EidolonCard {
  num: string;
  name: string;
  img: string;
  descHtml: string;
  status: '' | 'changed' | 'added';
  terms: SkillExtra[];
}
const eidolons = computed<EidolonCard[]>(() => {
  const dd = d.value;
  if (!dd) return [];
  const oldRanks = oldD.value && oldD.value.ranks ? oldD.value.ranks : null;
  return Object.entries(dd.ranks || {}).map(([num, rk]) => {
    const oldRk = oldRanks ? oldRanks[num] || null : null;
    const changed = !!(oldRk &&
      (hasParamDiff(rk.param_list || [], oldRk.param_list || []) || hasTextDiff(rk.desc, oldRk.desc)));
    const status: '' | 'changed' | 'added' = changed ? 'changed' : !oldRk && !!oldD.value ? 'added' : '';
    const descHtml = oldD.value && oldRk
      ? fmtDescDiff(rk.desc, rk.param_list || [], oldRk.desc, oldRk.param_list || [])
      : fmtDesc(rk.desc, rk.param_list || []);
    return {
      num,
      name: rk.name,
      img: eidolonIconUrl(char.charId, num),
      descHtml,
      status,
      terms: extraTerms(rk),
    };
  });
});
/** 旧版中删除的星魂 */
const removedEidolons = computed(() => {
  const dd = d.value;
  const od = oldD.value;
  if (!dd || !od || !od.ranks) return [];
  const newIds = new Set(Object.keys(dd.ranks || {}));
  return Object.entries(od.ranks)
    .filter(([num]) => !newIds.has(num))
    .map(([num, rk]) => ({
      num,
      name: rk.name,
      img: eidolonIconUrl(char.charId, num),
      descHtml: fmtDesc(rk.desc, rk.param_list || []),
    }));
});

/* ═══════════ 配装面板 ═══════════ */

const PROP_NAMES: Record<string, string> = {
  CriticalDamageBase: '暴击伤害', CriticalChanceBase: '暴击率', SpeedDelta: '速度',
  HPAddedRatio: '生命值%', AttackAddedRatio: '攻击力%', SPRatioBase: '能量恢复效率',
  BreakDamageAddedRatio: '击破特攻', BreakDamageAddedRatioBase: '击破特攻',
  FireAddedRatio: '火属性伤害提高',
  PhysicalAddedRatio: '物理属性伤害提高', IceAddedRatio: '冰属性伤害提高',
  LightningAddedRatio: '雷属性伤害提高', ThunderAddedRatio: '雷属性伤害提高',
  WindAddedRatio: '风属性伤害提高',
  QuantumAddedRatio: '量子属性伤害提高', ImaginaryAddedRatio: '虚数属性伤害提高',
  HPDelta: '生命值', AttackDelta: '攻击力', DefenceDelta: '防御力',
  DefenceAddedRatio: '防御力%', HealRatioBase: '治疗量加成',
  EffectHitRateBase: '效果命中', EffectResistBase: '效果抵抗',
  StatusProbabilityBase: '效果命中', StatusResistanceBase: '效果抵抗',
  ElationDamageAddedRatioBase: '欢愉伤害提高',
};
const SLOT_ICONS: Record<string, string> = {
  BODY: 'IconRelicBody', FOOT: 'IconRelicFoot', NECK: 'IconRelicNeck', OBJECT: 'IconRelicGoods',
};
const SLOT_NAMES: Record<string, string> = {
  HEAD: '头部', HAND: '手部', BODY: '躯干', FOOT: '脚部', NECK: '位面球', OBJECT: '连结绳',
};

const cones = computed(() =>
  ((d.value && d.value.lightcones) || []).map((id, i) => ({
    id,
    rank: i + 1,
    name: itemName(id, app.nameCache, app.itemDb),
    img: `${CDN}/assets/hsr/lightconemediumicon/${id}.webp`,
  })),
);

interface TeamSlot {
  mid: number;
  name: string;
  img: string;
  backups: { id: number; name: string; img: string }[];
}
const teams = computed<{ teamId: number; members: TeamSlot[] }[]>(() => {
  const dd = d.value;
  if (!dd || !dd.teams || !dd.teams.length) return [];
  return dd.teams.map((team) => {
    const raw = team as unknown as Record<string, unknown>;
    const members = (team.member_list || []).map((mid, i) => {
      const backups = (raw[`backup_list${i + 1}`] as number[] | undefined) || [];
      return {
        mid,
        name: itemName(mid, app.nameCache, app.itemDb),
        img: `${CDN}/assets/hsr/avatarroundicon/${mid}.webp`,
        backups: backups.slice(0, 4).map((b) => ({
          id: b,
          name: itemName(b, app.nameCache, app.itemDb),
          img: `${CDN}/assets/hsr/avatarroundicon/${b}.webp`,
        })),
      };
    });
    return { teamId: team.team_id, members };
  });
});

const relic = computed(() => (d.value && d.value.relics) || null);
const relicMainStats = computed(() => (relic.value && relic.value.property_list) || []);
const relicSubs = computed(() =>
  ((relic.value && relic.value.sub_affix_property_list) || []).map((p) => PROP_NAMES[p] || p),
);
const setIdList = computed<{ id: number; pc: number }[]>(() => {
  const arr: { id: number; pc: number }[] = [];
  const r = relic.value;
  if (r) {
    (r.set4_id_list || []).forEach((id) => arr.push({ id, pc: 4 }));
    (r.set2_id_list || []).forEach((id) => arr.push({ id, pc: 2 }));
  }
  return arr;
});
const hasRelicSection = computed(() =>
  relicMainStats.value.length > 0 || relicSubs.value.length > 0 || setIdList.value.length > 0,
);
const buildsEmpty = computed(() =>
  !cones.value.length && !teams.value.length && !hasRelicSection.value,
);

/* ─── 遗器套装描述异步加载（base data 变化时触发；加强切换不重复） ─── */
const relicSets = ref<Record<string, RelicSetData | null>>({});
watch(
  () => char.data,
  (data) => {
    relicSets.value = {};
    const r = data && data.relics;
    if (!r) return;
    const ids: { id: number; pc: number }[] = [];
    (r.set4_id_list || []).forEach((id) => ids.push({ id, pc: 4 }));
    (r.set2_id_list || []).forEach((id) => ids.push({ id, pc: 2 }));
    ids.forEach((s) => {
      void loadLocalRelicSet(s.id).then((rs) => {
        relicSets.value = { ...relicSets.value, [String(s.id)]: rs };
      });
    });
  },
);

function setIcon(data: RelicSetData | null | undefined): string {
  if (data && data.icon) {
    const iconId = data.icon.split('/').pop()!.replace('.png', '');
    return `${CDN}/assets/hsr/itemfigures/${iconId}.webp`;
  }
  return '';
}
function setName(id: number, data: RelicSetData | null | undefined): string {
  return (data && data.name) || itemName(id, app.nameCache, app.itemDb);
}
function setDescHtml(pc: number, data: RelicSetData | null | undefined): string {
  const info = data && data.require_num && data.require_num[String(pc)];
  return info && info.desc ? fmtDesc(info.desc, info.param_list || []) : '';
}

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (pRaf !== null) cancelAnimationFrame(pRaf);
  if (tabsRo) { tabsRo.disconnect(); tabsRo = null; }
  if (spineCleanup) {
    spineCleanup();
    spineCleanup = null;
  }
  char.reset();
});
</script>

<template>
  <div class="nk-page--detail">
    <!-- ─── 加载骨架屏 ─── -->
    <div v-if="phase === 'loading'" class="nk-skeleton nk-skeleton--char">
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer" style="position:absolute;inset:0;border-radius:0;"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-sk nk-sk--shimmer" style="width:90px;height:14px;border-radius:4px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:180px;height:28px;border-radius:6px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:120px;height:14px;border-radius:4px;"></div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer" style="width:64px;height:22px;border-radius:14px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:60px;height:22px;border-radius:14px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:70px;height:22px;border-radius:14px;"></div>
          </div>
          <div class="nk-sk nk-sk--shimmer" style="width:100%;height:14px;border-radius:4px;margin-top:14px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:100%;height:6px;border-radius:3px;"></div>
          <div class="nk-skeleton__stat-grid" style="margin-top:12px;">
            <div v-for="i in 8" :key="i" class="nk-sk nk-sk--shimmer" style="height:48px;border-radius:8px;"></div>
          </div>
        </div>
      </div>
      <div class="nk-skeleton__tabs">
        <div class="nk-skeleton__tabs-bar">
          <div class="nk-skeleton__tabs-left">
            <div class="nk-sk nk-sk--shimmer" style="width:48px;height:14px;border-radius:4px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:48px;height:14px;border-radius:4px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:48px;height:14px;border-radius:4px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:48px;height:14px;border-radius:4px;"></div>
          </div>
          <div class="nk-sk nk-sk--shimmer" style="width:120px;height:28px;border-radius:8px;"></div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer" style="width:100%;height:60px;border-radius:8px;"></div>
        <div class="nk-sk nk-sk--shimmer" style="width:100px;height:14px;border-radius:4px;"></div>
        <div class="nk-skeleton__stat-grid">
          <div v-for="i in 6" :key="i" class="nk-sk nk-sk--shimmer" style="width:100%;height:56px;border-radius:8px;"></div>
        </div>
        <div class="nk-sk nk-sk--shimmer" style="width:80px;height:14px;border-radius:4px;"></div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer" style="width:120px;height:16px;border-radius:4px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:100%;height:36px;border-radius:6px;"></div>
        </div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer" style="width:100px;height:16px;border-radius:4px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:100%;height:36px;border-radius:6px;"></div>
        </div>
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
      <div class="nk-error-state__title">角色数据加载失败</div>
      <div v-if="char.error" class="nk-error-state__detail">{{ char.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <!-- ─── 正文 ─── -->
    <template v-else-if="d">
      <!-- Hero（左右结构：左视觉区 / 右信息面板，宽屏自适应提升空间利用率） -->
      <div ref="heroRef" class="nk-hero" @mousemove="onHeroMove" @mouseleave="onHeroLeave">
        <div class="nk-hero__visual">
          <div
            ref="heroBgRef"
            class="nk-hero__bg"
            :class="{ 'nk-dim': spineVisible }"
            :style="{ backgroundImage: `url(${heroBg})` }"
          ></div>
          <div ref="spineRef" class="nk-hero__spine" :class="{ 'nk-ready': spineVisible }"></div>
          <div class="nk-hero__scrim"></div>
          <button
            class="nk-hero__toggle"
            :class="{ off: !spineVisible, 'has-anim': spineReady }"
            :title="spineReady ? undefined : '该角色暂无动画展示'"
            type="button"
            @click="toggleSpine"
          >
            <span class="dot"></span>动画
          </button>
        </div>
        <div class="nk-hero__panel">
          <header class="nk-hero__head">
            <div v-if="d.chara_info && d.chara_info.camp" class="nk-hero__camp">{{ d.chara_info.camp }}</div>
            <h1 class="nk-hero__name">{{ d.name }}</h1>
            <div class="nk-hero__meta">
              <span class="nk-hero__stars">{{ stars }}</span>
              <span class="nk-hero__tag">
                <img :src="`${CDN}/assets/hsr/element/${d.damage_type.toLowerCase()}.webp`">
                {{ ELEM[d.damage_type] || d.damage_type }}
              </span>
              <span class="nk-hero__tag">
                <img :src="`${CDN}/assets/hsr/pathicon/${d.base_type.toLowerCase()}.webp`">
                {{ PATH[d.base_type] || d.base_type }}
              </span>
              <span class="nk-hero__id">
                <span class="nk-hero__id-num">{{ char.charId }}</span>
              </span>
            </div>
          </header>

          <section v-if="heroStats.length" class="nk-hero__section">
            <div class="nk-hero__section-title">
              <span class="nk-hero__section-bar"></span>
              <span>属性</span>
            </div>
            <div class="nk-hero__level">
              <span class="nk-hero__level-label">Lv. {{ levelLimit }}/{{ MAX_CHAR_LEVEL }}</span>
              <div class="nk-hero__level-track">
                <div class="nk-hero__level-fill" :style="{ width: `${(levelLimit / MAX_CHAR_LEVEL) * 100}%` }"></div>
              </div>
            </div>
            <div class="nk-hero__stats">
              <div v-for="st in heroStats" :key="st.l" class="nk-hero__stat">
                <span class="nk-hero__stat-icon" :data-icon="st.icon" aria-hidden="true"></span>
                <span class="nk-hero__stat-label">{{ st.l }}</span>
                <span class="nk-hero__stat-val">
                  <template v-if="st.ov !== null">
                    <span class="nk-d-c">{{ st.ov }}</span><span class="nk-d-n">{{ st.v }}</span>
                  </template>
                  <template v-else>{{ st.v }}</template>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Tabs + 强化模式切换器（外壳全宽吸顶，内容条与面板同宽居中） -->
      <div class="nk-tabs">
        <div ref="tabsRef" class="nk-tabs__bar" :class="{ 'nk-tabs--fade': tabsFade }" @scroll.passive="onTabsScroll">
          <div class="nk-tabs__left">
            <button
              v-for="t in TAB_DEFS"
              :key="t.key"
              :class="['nk-tab', { 'nk-tab--active': char.activeTab === t.key }]"
              type="button"
              @click="char.setTab(t.key)"
            >
              {{ t.label }}
            </button>
          </div>
          <div v-if="char.enhKeys.length" class="nk-enh-toggle">
            <span class="nk-enh-toggle__label">强化模式</span>
            <button
              :class="['nk-enh-toggle__btn', { 'nk-enh-toggle__btn--active': !char.enhKey }]"
              type="button"
              @click="char.setEnhKey(null)"
            >
              原始
            </button>
            <button
              v-for="k in char.enhKeys"
              :key="k"
              :class="['nk-enh-toggle__btn', { 'nk-enh-toggle__btn--active': char.enhKey === k }]"
              type="button"
              @click="char.setEnhKey(k)"
            >
              强化 V{{ k }}
            </button>
          </div>
        </div>
      </div>

      <!-- 加强摘要横幅 -->
      <div class="nk-enh-notes">
        <div v-if="enhNotes.length" class="nk-enh-notes__banner">
          <span class="nk-enh-notes__title">强化内容</span>
          <ul class="nk-enh-notes__list">
            <li v-for="(n, i) in enhNotes" :key="i">{{ n }}</li>
          </ul>
        </div>
      </div>

      <!-- 面板区（全部挂载，nk-panel--active 切换显示，保留各面板交互状态） -->
      <div class="nk-panels">
        <!-- 概览 -->
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'overview' }]" data-panel="overview">
          <div class="nk-overview__desc" v-html="overviewDesc"></div>
          <template v-if="profileRows.length">
            <div class="nk-title">PROFILE</div>
            <div class="nk-profile">
              <div v-for="p in profileRows" :key="p.label" class="nk-profile__item">
                <span class="nk-profile__label">{{ p.label }}</span>
                <span class="nk-profile__val">{{ p.value }}</span>
              </div>
            </div>
          </template>
          <template v-if="attrBonuses.length">
            <div class="nk-title">STAT BONUSES</div>
            <div class="nk-bonus-grid">
              <div v-for="b in attrBonuses" :key="b.name" class="nk-bonus">
                <img v-if="b.icon" class="nk-bonus__icon" :src="b.icon" loading="lazy">
                <span class="nk-bonus__val">
                  <template v-if="b.ov !== null">
                    <span class="nk-d-c">{{ b.ov }}</span><span class="nk-d-n">{{ b.v }}</span>
                  </template>
                  <template v-else>{{ b.v }}</template>
                </span>
                <span class="nk-bonus__name">{{ b.name }}</span>
              </div>
            </div>
          </template>
          <template v-if="abilities.length">
            <div class="nk-title">TALENTS</div>
            <div
              v-for="ab in abilities"
              :key="ab.name"
              :class="['nk-ability', { 'nk-inline-diff': !!ab.status }]"
              :data-status="ab.status || undefined"
            >
              <span v-if="ab.status" :class="`nk-diff-badge nk-diff-badge--${ab.status}`">
                {{ ab.status === 'changed' ? 'CHANGED' : 'NEW' }}
              </span>
              <div class="nk-skill__title-row">
                <img v-if="ab.icon" class="nk-skill__icon" :src="ab.icon">
                <div class="nk-skill__title">
                  <span class="nk-skill__name">{{ ab.name }}</span>
                  <span class="nk-skill__tag">附加能力 {{ ab.idx + 1 }}</span>
                </div>
              </div>
              <div class="nk-skill__desc" v-html="ab.descHtml"></div>
              <div v-if="ab.terms.length" class="nk-skill__terms">
                <div v-for="t in ab.terms" :key="t.name" class="nk-term">
                  <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
                </div>
              </div>
            </div>
          </template>
          <template v-if="storyEntries.length">
            <div class="nk-title">STORIES</div>
            <div class="nk-stories">
              <div
                v-for="s in storyEntries"
                :key="s.key"
                :class="['nk-story', { 'nk-story--open': openStory === s.key }]"
              >
                <button class="nk-story__head" type="button" @click="toggleStory(s.key)">
                  <span class="nk-story__num">{{ String(s.idx).padStart(2, '0') }}</span>
                  <span class="nk-story__label">角色档案 · {{ s.idx }}</span>
                  <span class="nk-story__arrow"></span>
                </button>
                <div class="nk-story__clip">
                  <div class="nk-story__inner">
                    <div class="nk-story__text" v-html="s.html"></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 技能 -->
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'skills' }]" data-panel="skills">
          <div class="nk-title">SKILLS</div>
          <SkillCard
            v-for="g in skillGroups"
            :key="`${char.enhKey}|${g.main.id}`"
            :sk="g.main"
            :child-skills="g.children"
            :old-sk="oldSkillById[String(g.main.id)] || null"
            :child-old-by-id="oldSkillById"
            :is-diff-mode="!!oldD"
            :char-id="char.charId"
            :char-data="d"
          />
          <div
            v-for="rc in removedSkills"
            :key="`rm-${rc.sk.id}`"
            class="nk-skill nk-inline-diff"
            data-status="removed"
          >
            <span class="nk-diff-badge nk-diff-badge--removed">REMOVED</span>
            <div class="nk-skill__head">
              <span class="nk-skill__type-dot" :title="rc.tn"></span>
            </div>
            <div class="nk-skill__body">
              <div class="nk-skill__title-row">
                <img v-if="rc.icon" class="nk-skill__icon" :src="rc.icon">
                <div class="nk-skill__title">
                  <span class="nk-skill__name">{{ rc.sk.name }}</span>
                </div>
              </div>
              <div class="nk-skill__desc" v-html="rc.descHtml"></div>
            </div>
          </div>
          <SkillCard
            v-for="ms in memoSkills"
            :key="`memo-${char.enhKey}|${ms.id}`"
            :sk="ms"
            :old-sk="oldMemoById[String(ms.id)] || null"
            :is-diff-mode="!!oldD"
            :char-id="char.charId"
            :char-data="d"
          />
        </div>

        <!-- 星魂 -->
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'eidolons' }]" data-panel="eidolons">
          <div class="nk-title">EIDOLONS</div>
          <div
            v-for="e in eidolons"
            :key="e.num"
            :class="['nk-eidolon', { 'nk-inline-diff': !!e.status }]"
            :data-status="e.status || undefined"
          >
            <span v-if="e.status" :class="`nk-diff-badge nk-diff-badge--${e.status}`">
              {{ e.status === 'changed' ? 'CHANGED' : 'NEW' }}
            </span>
            <div class="nk-skill__title-row">
              <img class="nk-skill__icon" :src="e.img" loading="lazy">
              <div class="nk-skill__title">
                <span class="nk-skill__name">{{ e.name }}</span>
                <span class="nk-skill__tag">E{{ e.num }}</span>
              </div>
            </div>
            <div class="nk-skill__desc" v-html="e.descHtml"></div>
            <div v-if="e.terms.length" class="nk-skill__terms">
              <div v-for="t in e.terms" :key="t.name" class="nk-term">
                <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
              </div>
            </div>
          </div>
          <div
            v-for="re in removedEidolons"
            :key="`rm-${re.num}`"
            class="nk-eidolon nk-inline-diff"
            data-status="removed"
          >
            <span class="nk-diff-badge nk-diff-badge--removed">REMOVED</span>
            <div class="nk-skill__title-row">
              <img class="nk-skill__icon" :src="re.img" loading="lazy">
              <div class="nk-skill__title">
                <span class="nk-skill__name">{{ re.name }}</span>
                <span class="nk-skill__tag">E{{ re.num }}</span>
              </div>
            </div>
            <div class="nk-skill__desc" v-html="re.descHtml"></div>
          </div>
        </div>

        <!-- 配装 -->
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'builds' }]" data-panel="builds">
          <template v-if="cones.length">
            <div class="nk-title">LIGHT CONES</div>
            <div class="nk-build__cones">
              <div v-for="c in cones" :key="c.id" class="nk-build__cone">
                <img :src="c.img">
                <div>
                  <div class="nk-build__cone-name">{{ c.name }}</div>
                  <div class="nk-build__cone-rank">REC. {{ c.rank }}</div>
                </div>
              </div>
            </div>
          </template>
          <template v-if="teams.length">
            <div class="nk-title">TEAMS</div>
            <div class="nk-build__teams">
              <div v-for="t in teams" :key="t.teamId" class="nk-build__team">
                <div class="nk-build__team-slot nk-build__team-slot--main">
                  <img :src="`${CDN}/assets/hsr/avatarroundicon/${char.charId}.webp`" title="当前角色">
                </div>
                <span class="nk-build__team-plus">+</span>
                <template v-for="(m, i) in t.members" :key="m.mid">
                  <div class="nk-build__team-slot">
                    <img :src="m.img" :title="m.name">
                    <div v-if="m.backups.length" class="nk-build__team-alt">
                      <img v-for="b in m.backups" :key="b.id" :src="b.img" :title="b.name">
                    </div>
                  </div>
                  <span v-if="i < t.members.length - 1" class="nk-build__team-plus">+</span>
                </template>
              </div>
            </div>
          </template>
          <template v-if="hasRelicSection">
            <div class="nk-title">RELICS</div>
            <div class="nk-build__relics">
              <!-- 主词条槽位卡片 -->
              <div v-if="relicMainStats.length" class="nk-relic-slots">
                <div
                  v-for="p in relicMainStats"
                  :key="p.relic_type + p.property_type"
                  class="nk-relic-slot"
                >
                  <img class="nk-relic-slot__icon" :src="`${CDN}/assets/hsr/relicfigures/${SLOT_ICONS[p.relic_type] || 'IconRelicBody'}.webp`">
                  <span class="nk-relic-slot__stat">{{ PROP_NAMES[p.property_type] || p.property_type }}</span>
                  <span class="nk-relic-slot__slot">{{ SLOT_NAMES[p.relic_type] || p.relic_type }}</span>
                </div>
              </div>
              <!-- 推荐副词条卡片 -->
              <div v-if="relicSubs.length" class="nk-relic-sub">
                <span class="nk-relic-sub__label">推荐副词条</span>
                <div class="nk-relic-sub__list">
                  <span v-for="s in relicSubs" :key="s" class="nk-relic-sub__chip">{{ s }}</span>
                </div>
              </div>
              <div v-if="setIdList.length" class="nk-build__sets">
                <div v-for="s in setIdList" :key="`${s.id}-${s.pc}`" class="nk-build__set">
                  <div class="nk-build__set-head">
                    <img :src="setIcon(relicSets[s.id]) || undefined">
                    <div>
                      <div class="nk-build__set-badge">{{ s.pc }}PC</div>
                      <div class="nk-build__set-name">{{ setName(s.id, relicSets[s.id]) }}</div>
                    </div>
                  </div>
                  <div class="nk-build__set-desc" v-html="setDescHtml(s.pc, relicSets[s.id])"></div>
                </div>
              </div>
            </div>
          </template>
          <p v-if="buildsEmpty" style="color: var(--text3)">暂无配装数据</p>
        </div>
      </div>
    </template>
  </div>
</template>
