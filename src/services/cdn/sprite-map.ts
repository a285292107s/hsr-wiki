/**
 * SpriteOutput 路径 → 导出分类/本地相对路径 的 TS 读取端（ADR 0070）。
 *
 * 唯一真源是 `config/sprite-map.json`——与 `tools/ingest-icons.py`、`tools/check-icon-coverage.mjs`
 * 共用同一份路由表。**改映射只改那个 JSON，不要在这里手写第二套规则。**
 *
 * 用法：
 *   spriteLocalRel('SpriteOutput/GridFight/Equipment/350101.png')
 *     → { category: 'gridfight-equipment', file: '350101.webp' }
 *   isCdnBacked('uiart')  // 该分类是否设计上走 CDN
 */
import spriteMap from '../../../config/sprite-map.json';

export interface SpriteRoute {
  first: string;
  sub?: string;
  category?: string;
  categories?: string[];
  local: string;
}

export interface SpriteResolved {
  /** 导出分类（对应 public/data/assets/icons/<category>/） */
  category: string;
  /** 分类内相对路径（含 .webp） */
  file: string;
}

const PROFESSION_MAP: Record<string, string> = { priest: 'Pirest', elation: 'Joy' };
const PROFESSION_MAP_REV: Record<string, string> = Object.fromEntries(
  Object.entries(PROFESSION_MAP).map(([k, v]) => [v, k]),
);

const ROUTES = spriteMap.routes as SpriteRoute[];

function matchRoute(route: SpriteRoute, segsLower: string[]): boolean {
  if (segsLower[0] !== route.first) return false;
  if (!route.sub) return true;
  const sub = route.sub.toLowerCase().split('/');
  return segsLower.slice(1, 1 + sub.length).join('/') === sub.join('/');
}

function localRel(route: SpriteRoute, segs: string[], leaf: string): string {
  switch (route.local) {
    case 'leaf':
      return leaf;
    case 'leafLower':
      return leaf.toLowerCase();
    case 'afterFirst':
      return segs.slice(1).join('/');
    case 'afterFirstLower':
      return [...segs.slice(1, -1).map((s) => s.toLowerCase()), leaf].join('/');
    case 'afterSub':
      return segs.slice(1 + (route.sub ? route.sub.split('/').length : 0)).join('/');
    case 'fullExact':
      return segs.join('/');
    case 'lowerDirs':
      return [...segs.slice(0, -1).map((s) => s.toLowerCase()), leaf].join('/');
    case 'element': {
      const k = leaf.replace(/^IconDamageType/, '');
      return k.charAt(0).toLowerCase() + k.slice(1);
    }
    case 'pathicon': {
      const k = leaf.replace(/^IconProfession/, '').replace(/Middle$/, '');
      return (PROFESSION_MAP_REV[k] || k).toLowerCase();
    }
    default:
      return leaf;
  }
}

/**
 * 把一条 `SpriteOutput/...` 路径（或已去掉前缀的相对路径）换算成导出分类 + 文件。
 * 未命中任何具名路由时走 `fallback`（当前 = uiart 透传）。
 */
export function spriteLocalRel(path: string): SpriteResolved | null {
  if (!path) return null;
  const rel = path.replace(/^SpriteOutput\//i, '');
  const raw = rel.split('/').filter(Boolean);
  if (raw.length < 2) return null;
  const segs = [...raw.slice(0, -1), raw[raw.length - 1].replace(/\.[^.]+$/, '')];
  const segsLower = segs.map((s) => s.toLowerCase());
  const leaf = segs[segs.length - 1];

  for (const route of ROUTES) {
    if (!matchRoute(route, segsLower)) continue;
    const category = route.categories ? route.categories[0] : route.category!;
    return { category, file: `${localRel(route, segs, leaf)}.webp` };
  }
  const fb = spriteMap.fallback;
  return { category: fb.category, file: `${localRel(fb as SpriteRoute, segs, leaf)}.webp` };
}

/** 该分类的 `cdnBacked` 标记（设计上走 CDN，不参与本地缺导出统计）。 */
export function isCdnBacked(category: string): boolean {
  return Boolean((spriteMap.categories as Record<string, { cdnBacked?: boolean }>)[category]?.cdnBacked);
}

/** 全部分类名单（与 CDN_CATEGORIES 对齐用）。 */
export const SPRITE_MAP_CATEGORIES: readonly string[] = Object.keys(spriteMap.categories);
