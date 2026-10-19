import type { CdnCategory } from './base';
import { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH, OFFICIAL_ICON_BASE } from '../../lib/constants';

export { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH };
export const JS_DELIVR_BASE = OFFICIAL_ICON_BASE;

export const JS_DELIVR_UI3D_BASE = JS_DELIVR_BASE.replace(/\/spriteoutput$/, '');

const PROFESSION_MAP: Record<string, string> = { priest: 'Pirest', elation: 'Joy' };
const PROFESSION_MAP_REV: Record<string, string> = Object.fromEntries(
  Object.entries(PROFESSION_MAP).map(([k, v]) => [v, k]),
);

export const JS_DELIVR_RULES: Partial<Record<CdnCategory, (file: string) => string | null>> = {
  avatarshopicon: (f) => `avatarshopicon/avatar/${f.replace(/\.webp$/i, '')}.png`,
  avatarroundicon: (f) => `avatarroundicon/avatar/${f.replace(/\.webp$/i, '')}.png`,
  avatardrawcard: (f) => `avatardrawcard/${f.replace(/\.webp$/i, '')}.png`,
  avatarcutinfigures: (f) => `avatarcutinfigures/${f.replace(/\.webp$/i, '')}.png`,
  lightconemaxfigures: (f) => `lightconemaxfigures/${f.replace(/\.webp$/i, '')}.png`,
  itemfigures: (f) => `itemfigures/${f.replace(/\.webp$/i, '')}.png`,
  bgpic: (f) => `bgpic/${f.replace(/\.webp$/i, '')}.png`,
  lightconemediumicon: (f) => `lightconemediumicon/${f.replace(/\.webp$/i, '')}.png`,
  achievement: (f) => `achievement/${f.replace(/\.webp$/i, '')}.png`,
  trace: (f) => `ui/avatar/icon/${f.replace(/\.webp$/i, '')}.png`,
  statusimmune: (f) => `ui/avatar/icon/${f.replace(/\.webp$/i, '')}.png`,
  monstermiddleicon: (f) => `monstermiddleicon/${f.replace(/\.webp$/i, '')}.png`,
  monsterfigure: (f) => `monsterfigure/${f.replace(/\.webp$/i, '')}.png`,
  relicfigures: (f) => {
    const base = f.replace(/\.webp$/i, '');
    return /^IconRelic(?:Body|Foot|Neck|Goods)$/.test(base) ? null : `relicfigures/${base}.png`;
  },
  element: (f) => {
    const k = f.replace(/\.webp$/i, '');
    return `icondamagetype/IconDamageType${k[0].toUpperCase()}${k.slice(1).toLowerCase()}.png`;
  },
  pathicon: (f) => {
    const k = f.replace(/\.webp$/i, '');
    const mapped = PROFESSION_MAP[k.toLowerCase()] || `${k[0].toUpperCase()}${k.slice(1)}`;
    return `professioniconmiddle/IconProfession${mapped}Middle.png`;
  },
  skillicons: (f) => {
    const base = f.replace(/\.webp$/i, '');
    const id = base.match(/\d+/)?.[0];
    if (!id) return null;
    const dir = /_Servant/.test(base) && Number(id) > 10000 ? String(Number(id) - 10000) : id;
    return `skillicons/avatar/${dir}/${base}.png`;
  },
  rank: (f) => `ui/ui3d/rank/_dependencies/textures/${f.replace(/\.webp$/i, '')}.png`,
};

export function spriteOutputToRel(path: string): string {
  const rel = path.replace(/^SpriteOutput\//i, '');
  const parts = rel.split('/');
  return [...parts.slice(0, -1).map((s) => s.toLowerCase()), parts[parts.length - 1]].join('/');
}

export function jsdelivrToNanokaFile(category: CdnCategory, url: string): string {
  const name = url.split('/').pop()?.replace(/\.png$/i, '') ?? '';
  if (!name) return '';
  switch (category) {
    case 'element':
      return `${name.replace(/^IconDamageType/, '').toLowerCase()}.webp`;
    case 'pathicon': {
      const k = name.replace(/^IconProfession/, '').replace(/Middle$/, '');
      const orig = PROFESSION_MAP_REV[k] || k;
      return `${orig.toLowerCase()}.webp`;
    }
    case 'rank': {
      const m = url.match(/(\d+)\/(\d+_Rank_\d+)\.png$/i);
      return m ? `${m[1]}/${m[2]}.webp` : `${name}.webp`;
    }
    default:
      return `${name}.webp`;
  }
}
