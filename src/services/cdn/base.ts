
export type CdnSource = 'official' | 'nanoka' | 'local';

export type CdnCategory =
  | 'avatarshopicon'
  | 'skillicons'
  | 'avatardrawcard'
  | 'avatarcutinfigures'
  | 'lightconemaxfigures'
  | 'bgpic'
  | 'itemfigures'
  | 'element'
  | 'pathicon'
  | 'lightconemediumicon'
  | 'monstermiddleicon'
  | 'monsterfigure'
  | 'relicfigures'
  | 'rank'
  | 'trace'
  | 'avatarroundicon'
  | 'gridfight-equipment'
  | 'gridfight-icon'
  | 'gridfight-asset'
  | 'gridfight-affix'
  | 'achievement'
  | 'bufficon'
  | 'tutorialpic'
  | 'statusimmune';

export interface CdnCategorySpec {
  nanoka: string;
  official?: string;
  local?: string;
  localFiles?: RegExp;
  jdPrimary?: boolean;
}

export const NANOKA_HUD = '/assets/hsr';

export const LOCAL_ICONS_BASE = '/data/assets/icons';

export const OFFICIAL_BASE = '';

export const CDN_CATEGORIES: Record<CdnCategory, CdnCategorySpec> = {
  avatarshopicon: { nanoka: 'avatarshopicon', local: 'avatarshopicon' },
  skillicons: { nanoka: 'skillicons', local: 'skillicons' },
  avatardrawcard: { nanoka: 'avatardrawcard', local: 'avatardrawcard' },
  avatarcutinfigures: { nanoka: 'avatarcutinfigures', local: 'avatarcutinfigures' },
  lightconemaxfigures: { nanoka: 'lightconemaxfigures', local: 'lightconemaxfigures' },
  itemfigures: { nanoka: 'itemfigures', local: 'itemfigures' },
  bgpic: { nanoka: 'bgpic', local: 'bgpic' },
  element: { nanoka: 'element', local: 'element' },
  pathicon: { nanoka: 'pathicon', local: 'pathicon' },
  trace: { nanoka: 'trace', local: 'trace', jdPrimary: true },
  lightconemediumicon: { nanoka: 'lightconemediumicon', local: 'lightconemediumicon' },
  monstermiddleicon: { nanoka: 'monstermiddleicon', local: 'monstermiddleicon' },
  monsterfigure: { nanoka: 'monsterfigure', local: 'monsterfigure' },
  relicfigures: { nanoka: 'relicfigures', local: 'relicfigures', localFiles: /^IconRelic(?:Body|Foot|Neck|Goods)\.webp$/ },
  rank: { nanoka: 'rank/_dependencies/textures', local: 'rank' },
  avatarroundicon: { nanoka: 'avatarroundicon', local: 'avatarroundicon' },
  'gridfight-equipment': { nanoka: 'gridfight/equipment', local: 'gridfight-equipment' },
  'gridfight-icon': { nanoka: 'gridfight/icon', local: 'gridfight-icon' },
  'gridfight-affix': { nanoka: 'gridfight/battleicon/bufficon', local: 'gridfight-affix' },
  'gridfight-asset': { nanoka: 'gridfight', local: 'gridfight-asset' },
  achievement: { nanoka: 'achievement', local: 'achievement' },
  bufficon: { nanoka: 'bufficon', local: 'bufficon' },
  tutorialpic: {
    nanoka: 'tutorialpic',
    local: 'tutorialpic',
    localFiles: /^TutorialPic\/TutorialPage_1050(?:101|201|202)\.webp$/,
  },
  statusimmune: { nanoka: 'trace', local: 'statusimmune', jdPrimary: true },
};
