/**
 * 纯函数工具：格式化 / Diff / URL 构建 / 数据校验
 * 全部无状态（显式传参），可被 Vitest 直接覆盖。
 */
import { CDN, MAX_CHAR_LEVEL, SKILL_ICON_KEY, SKILL_ICON_KEY_BY_NAME, STANCE_LABEL, TAG } from './constants';
import { NkError } from './errors';
import type { CharacterData, CharStats, ItemDb, NameCache, Skill } from '../services/types';

/* ─── HTML 安全 ─── */

const ESC_MAP: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

/** HTML 转义：防止 CDN 数据中的特殊字符被解析为 DOM（XSS 防御） */
export function escHtml(s: unknown): string {
  return s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/** 剥离游戏内标签（{SPACE}/{NICKNAME}/<color>/<unbreak> 等），保留 <u> */
export function stripTags(desc: string | null | undefined): string {
  if (!desc) return '';
  return desc
    .replaceAll('{SPACE}', ' ')
    .replace(/\{NICKNAME\}/g, '开拓者')
    .replace(/\{RUBY_[EB]#(?:[^}]*)?\}/g, '')
    .replace(/<color=([^>]+)>/g, '<span style="color:$1"><strong>')
    .replace(/<\/color>/g, '</strong></span>')
    .replace(/<\/?unbreak>/g, '')
    .replace(/<(?!\/?u>)[^>]+>/g, '');
}

/** 剥离所有 HTML 标签（用于 diff 前清理已渲染的 HTML） */
export function stripAllTags(s: string | null | undefined): string {
  return (s || '').replace(/<[^>]+>/g, '');
}

/* ─── 数值格式化 ─── */

export function fmtVal(v: number | null | undefined, tag: string, isPct: boolean): string {
  if (v == null) return '?';
  let n = v;
  if (isPct) n = n * 100;
  if (tag === 'i') return String(Math.round(n));
  if (/^f[1-6]$/.test(tag)) {
    const f = 10 ** Number(tag.slice(1));
    return String(Math.round(n * f) / f);
  }
  return String(Math.round(n));
}

/**
 * 渲染技能描述：替换 #N[tag]% 占位符为参数值。
 * oldParams 提供时对变化值做新旧对比（旧值红删除线 nk-d-c + 新值绿 nk-d-n）。
 */
export function fmtDesc(
  desc: string | null | undefined,
  params?: number[] | null,
  oldParams?: number[] | null,
): string {
  if (!desc) return '';
  let s = stripTags(desc);
  const rep = (i: string, t: string, pct: string, oldP?: number | null): string => {
    const n = fmtVal(params && params[parseInt(i) - 1], t, pct === '%');
    if (oldP === undefined || oldP === null) return `<span class="hl">${n}${pct}</span>`;
    const o = fmtVal(oldP, t, pct === '%');
    if (o === n) return `<span class="hl">${n}${pct}</span>`;
    return `<span class="hl nk-d-c">${o}${pct}</span><span class="hl nk-d-n">${n}</span>`;
  };
  s = s.replace(/#(\d+)\[([^\]]*)\](%?)/g, (_, i: string, t: string, pct: string) =>
    rep(i, t, pct, oldParams && oldParams[parseInt(i) - 1]));
  s = s.replace(/#(\d+)/g, (_, i: string) => rep(i, '', '', oldParams && oldParams[parseInt(i) - 1]));
  s = s.replace(/\\n|\n/g, '<br>');
  return s;
}

/** 韧性条格式化（show_stance_list /3 保留 2 位） */
export function fmtToughness(sk: Skill): string {
  const list = sk.show_stance_list;
  if (!list) return '';
  const parts = list
    .map((v, i) => {
      if (!v) return '';
      const label = TAG[STANCE_LABEL[i]] || STANCE_LABEL[i];
      const val = Math.round((v / 3) * 100) / 100;
      return `${label}: ${val}`;
    })
    .filter(Boolean);
  return parts.join(' / ');
}

/* ─── Diff 工具 ─── */

/** 浮点安全的参数相等判定 */
export function paramEqual(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  return String(a) === String(b);
}

export function hasParamDiff(newParams: number[], oldParams: number[]): boolean {
  const len = Math.max(newParams.length, oldParams.length);
  for (let i = 0; i < len; i++) {
    if (!paramEqual(newParams[i], oldParams[i])) return true;
  }
  return false;
}

/** 快速判断两段描述是否有实质差异（剥离标签后比较） */
export function hasTextDiff(a: string | null | undefined, b: string | null | undefined): boolean {
  return stripTags(a).replace(/\s+/g, ' ').trim() !== stripTags(b).replace(/\s+/g, ' ').trim();
}

/* ─── Word-level diff（LCS） ─── */

export interface DiffOp {
  type: 'equal' | 'add' | 'remove';
  text: string;
}

/** 检测文本是否含中文（CJK 统一汉字 + 扩展） */
function hasChinese(s: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(s);
}

/** 中文按字符拆分（每个汉字一个 token），英文按空白拆词 */
export function wordDiff(oldText: string, newText: string): DiffOp[] {
  const isCjk = hasChinese(oldText) || hasChinese(newText);
  const oldW = isCjk ? Array.from(oldText).filter(Boolean) : oldText.split(/\s+/).filter(Boolean);
  const newW = isCjk ? Array.from(newText).filter(Boolean) : newText.split(/\s+/).filter(Boolean);
  const m = oldW.length;
  const n = newW.length;
  if (!m && !n) return [];
  if (!m) return newW.map((w) => ({ type: 'add' as const, text: w }));
  if (!n) return oldW.map((w) => ({ type: 'remove' as const, text: w }));
  // LCS DP
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldW[i - 1] === newW[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // Backtrack
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldW[i - 1] === newW[j - 1]) {
      ops.push({ type: 'equal', text: oldW[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', text: newW[j - 1] }); j--;
    } else {
      ops.push({ type: 'remove', text: oldW[i - 1] }); i--;
    }
  }
  return ops.reverse();
}

/** 渲染 word-diff 结果为 HTML */
export function renderWordDiffHtml(ops: DiffOp[]): string {
  return ops
    .map((op) => {
      if (op.type === 'equal') return op.text;
      if (op.type === 'add') return `<span class="diff-added">${op.text}</span>`;
      return `<span class="diff-removed">${op.text}</span>`;
    })
    .join('');
}

/**
 * 新版描述渲染（带 word-level diff）：
 * 模板文本变化 → 词级 diff；仅参数变化 → 参数级高亮（fmtDesc）。
 */
export function fmtDescDiff(
  desc: string | null | undefined,
  params: number[] | null | undefined,
  oldDesc: string | null | undefined,
  oldParams: number[] | null | undefined,
): string {
  if (!desc) return '';
  const stripped = stripTags(desc);
  const oldStripped = oldDesc ? stripTags(oldDesc) : '';
  const tplChanged = stripped !== oldStripped;
  const hasPDiff = oldParams && hasParamDiff(params || [], oldParams);
  // 仅参数变化、模板相同 → 参数级高亮
  if (!tplChanged && hasPDiff) return fmtDesc(desc, params, oldParams);
  // 无旧数据 → 普通渲染
  if (!oldParams && !tplChanged) return fmtDesc(desc, params);
  // 模板文本变化 → 词级 diff（先剥离渲染 HTML 再 diff，避免标签被当作文本）
  if (tplChanged && oldDesc) {
    const newRendered = stripAllTags(fmtDesc(desc, params));
    const oldRendered = stripAllTags(fmtDesc(oldDesc, oldParams || params));
    return renderWordDiffHtml(wordDiff(oldRendered, newRendered));
  }
  return fmtDesc(desc, params);
}

/* ─── 加强模式：视图构建 ─── */

/** 深拷贝（优先 structuredClone，失败时降级 JSON——如传入 reactive Proxy 的场景） */
export function deepClone<T>(o: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(o); } catch { /* Proxy 等不可克隆对象走 JSON 回退 */ }
  }
  return JSON.parse(JSON.stringify(o)) as T;
}

/** 返回加强版本键列表（空数组 = 该角色无加强） */
export function getEnhancedKeys(d: CharacterData | null | undefined): string[] {
  return Object.keys((d && d.enhanced) || {});
}

/** 构建"加强后"视图：base 副本上覆盖 enhanced[enhKey] 的 skills/ranks/skill_trees */
export function buildEnhancedView(d: CharacterData, enhKey: string): CharacterData {
  const enh = d.enhanced && d.enhanced[enhKey];
  if (!enh) return d;
  const view = deepClone(d);
  if (enh.skills) view.skills = deepClone(enh.skills);
  if (enh.ranks) view.ranks = deepClone(enh.ranks);
  if (enh.skill_trees) view.skill_trees = deepClone(enh.skill_trees);
  return view;
}

/**
 * 构建用于 diff 的"加强前"视图：将 base 技能 ID 重映射为加强 ID 以便按 ID 匹配。
 * 加强技能 ID = 加强键 + 基础技能 ID（100502 → 1100502）；星魂按序号、行迹按 point_name 匹配，不受影响。
 */
export function buildEnhancedOld(d: CharacterData, enhKey: string): CharacterData {
  const old = deepClone(d);
  if (old.skills) {
    const remapped: Record<string, Skill> = {};
    Object.values(old.skills).forEach((sk) => {
      if (sk.id != null) sk.id = Number(enhKey + sk.id);
      remapped[sk.id] = sk;
    });
    old.skills = remapped;
  }
  return old;
}

/** 依据当前加强模式返回渲染数据：{ d, oldD }（原始模式 oldD=null） */
export function getRenderData(
  base: CharacterData | null,
  enhKey: string | null,
): { d: CharacterData | null; oldD: CharacterData | null } {
  if (enhKey && base && base.enhanced && base.enhanced[enhKey]) {
    return { d: buildEnhancedView(base, enhKey), oldD: buildEnhancedOld(base, enhKey) };
  }
  return { d: base, oldD: null };
}

/* ─── 属性 / 图标 URL ─── */

/** 稳定取最高等级的 stats（不依赖 key 插入顺序） */
export function maxLevelStat(stats: Record<string, CharStats> | null | undefined): CharStats | null {
  if (!stats) return null;
  if (stats['6']) return stats['6'];
  const keys = Object.keys(stats).map(Number).filter((k) => !isNaN(k));
  const maxK = keys.length ? Math.max(...keys) : null;
  return maxK != null ? stats[maxK] : (Object.values(stats).pop() ?? null);
}

/** 满级属性计算：base + add * (MAX_CHAR_LEVEL - 1) */
export function maxLevelValue(base: number, add: number): number {
  return base + add * (MAX_CHAR_LEVEL - 1);
}

export function iconUrl(i: string | null | undefined): string {
  return i ? `${CDN}/assets/hsr/skillicons/${i.replace('.png', '.webp')}` : '';
}

/** 忆灵 ID：优先从 memosprite.icon 解析（SpriteOutput/ServantIconTeam/11415B.png → 11415），回退 1+charId */
export function memospriteId(charId: string, data: CharacterData | null): string {
  const icon = data && data.memosprite && data.memosprite.icon;
  if (icon) {
    const m = icon.match(/(\d+)/);
    if (m) return m[1];
  }
  return charId ? '1' + charId : '';
}

export function skillIconUrl(sk: Skill, charId: string, data: CharacterData | null): string {
  const key = SKILL_ICON_KEY[sk.type] || (sk.type_name && SKILL_ICON_KEY_BY_NAME[sk.type_name]) || '';
  if (!key || !charId) return '';
  const id = (key === 'Servant' || key === 'ServantPassive') ? memospriteId(charId, data) : charId;
  if (!id) return '';
  return `${CDN}/assets/hsr/skillicons/SkillIcon_${id}_${key}.webp`;
}

/** 星魂图标：rank/_dependencies/textures/{charId}/{charId}_Rank_{num}.webp */
export function eidolonIconUrl(charId: string, rankNum: number | string): string {
  return `${CDN}/assets/hsr/rank/_dependencies/textures/${charId}/${charId}_Rank_${rankNum}.webp`;
}

/** 角色立绘（全身像）：avatardrawcard/{charId}.webp */
export function avatarDrawCardUrl(charId: string | number): string {
  return `${CDN}/assets/hsr/avatardrawcard/${charId}.webp`;
}

/** 物品名称解析：nameCache → itemDb（item_name 字段）→ '#id' 回退 */
export function itemName(id: string | number, nameCache: NameCache, itemDb: ItemDb): string {
  const key = String(id);
  return nameCache[key] || (itemDb[key] || {}).item_name || '#' + id;
}

/** 物品图标：itemfigures/{数字}.webp（从 item_figure_icon_path 解析） */
export function itemIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/(\d+)\.png$/);
  if (!m) return '';
  return `${CDN}/assets/hsr/itemfigures/${m[1]}.webp`;
}

/* ─── 目录页图标 URL（standalone CDN 数据源，复现卡片图片命名规律） ─── */

/** 角色头像：avatarshopicon/{charId}.webp */
export function avatarShopIconUrl(charId: string | number): string {
  return charId ? `${CDN}/assets/hsr/avatarshopicon/${charId}.webp` : '';
}

/** 属性图标：element/{damageType 小写}.webp */
export function elementIconUrl(damageType: string | null | undefined): string {
  return damageType ? `${CDN}/assets/hsr/element/${damageType.toLowerCase()}.webp` : '';
}

/** 命途图标：pathicon/{baseType 小写}.webp */
export function pathIconUrl(baseType: string | null | undefined): string {
  return baseType ? `${CDN}/assets/hsr/pathicon/${baseType.toLowerCase()}.webp` : '';
}

/** 光锥立绘：lightconemediumicon/{id}.webp */
export function lightconeIconUrl(id: string | number): string {
  return id ? `${CDN}/assets/hsr/lightconemediumicon/${id}.webp` : '';
}

/** 敌对图像：monstermiddleicon/{basename}.webp（从 SpriteOutput/MonsterFigure/Monster_xxx.png 取末段去扩展名） */
export function monsterIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const base = iconPath.split('/').pop()?.replace(/\.png$/i, '') || '';
  return base ? `${CDN}/assets/hsr/monstermiddleicon/${base}.webp` : '';
}

/** 从 rank 字符串解析稀有度数字（CombatPowerAvatarRarityType4 → 4，无法解析回退 5） */
export function parseRarity(rank: string | null | undefined): number {
  const m = (rank || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 5;
}

/* ─── 数据校验 ─── */

/** 角色数据完整性校验（fail-fast，避免渲染时抛出不可读的 TypeError） */
export function validateCharData(d: CharacterData | null | undefined): asserts d is CharacterData {
  if (!d || typeof d !== 'object') throw new NkError('角色数据为空或非对象', false);
  const missing: string[] = [];
  if (!d.name) missing.push('name');
  if (!d.stats) missing.push('stats');
  if (!d.skills) missing.push('skills');
  if (!d.damage_type) missing.push('damage_type');
  if (!d.base_type) missing.push('base_type');
  if (missing.length) throw new NkError(`角色数据缺少必要字段: ${missing.join(', ')}`, false);
}
