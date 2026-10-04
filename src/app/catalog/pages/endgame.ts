import { OFFICIAL_ICON_BASE } from '../../../lib/constants';
import { escHtml, stripAllTags } from '../../../lib/format';
import { spriteOutputToRel } from '../../../services/cdn/jsdelivr';

// 终局官方素材 URL（jsDelivr 加速自建 fork GitHub 源，基址统一收口 OFFICIAL_ICON_BASE，跟 main 分支最新）。
// 白名单 = 语义闸门：仅放行「赛季主题/页签/横幅类」路径，排除开关图/场景背景等 UI 素材；
// 全部前缀均实测在 StarRailTextures 仓库可命中：
// - TabIcon/** → tabicon/**（虚构 ChallengeThemeTabIcon / 末日 ChallengeBossTabIcon）
// - ChallengePeak/** → challengepeak/**（异相仲裁每期 ThemeIconPicPath）
// - UI/ChallengeBoss/** → ui/challengeboss/**（玩法级默认 QuestTabImg）
// - DailyMission/Banner/** → dailymission/banner/**（赛季横幅 ChallengeThemeBanner/BossBanner/PeakPanelBanner）
// - ChallengeTheme/** → challengetheme/**（虚构主题素材 ThemeIcon/ThemePic/ThemeBg）
// - ChallengeBoss/** → challengeboss/**（末日主题图标 ChallengeBossIcon_30xx）
// - Quest/TabIcon/** → quest/tabicon/**（海报页签 BtnChallengeStoryAlternation/BtnChallengeBoss/BtnChallengePeak）
// - Abyss/** → abyss/**（忘却之庭场景背景 Abyss/UI3D_SceneBg，仅 Hero 背景用）
// 未列入的（如忘却之庭 AbyssSwitch 共用开关图 / Quest 其他素材）返回空串不渲染；
const ART_PREFIXES = [
  'TabIcon',
  'ChallengePeak',
  'UI/ChallengeBoss',
  'DailyMission/Banner',
  'ChallengeTheme',
  'ChallengeBoss',
  'Quest/TabIcon',
  'Abyss',
] as const;
/** 玩法级默认图标白名单（modeDefaultArtUrl / 模式筛选选项 icon 专用）：在 ART_PREFIXES 基础上
 *  放行忘却之庭专属/通用开关图 UI/Abyss/Process/TypeIcon（常驻关卡 W01/W02、赛季 Loop）——
 *  装饰素材函数（banner/poster/hero bg）保持原白名单不放行开关图 */
const TAB_ART_PREFIXES = [
  ...ART_PREFIXES,
  'UI/Abyss',
] as const;

function endgameArtUrl(path: string | undefined, prefixes: readonly string[]): string {
  if (!path) return '';
  if (!prefixes.some((p) => path.startsWith(`SpriteOutput/${p}/`))) return '';
  return `${OFFICIAL_ICON_BASE}/${spriteOutputToRel(path)}`;
}

export function seasonBannerUrl(arts?: { theme_banner?: string } | null): string {
  return endgameArtUrl(arts?.theme_banner, ART_PREFIXES);
}

export function seasonThemeIconUrl(arts?: { theme_icon?: string } | null): string {
  return endgameArtUrl(arts?.theme_icon, ART_PREFIXES);
}

export function seasonPosterTabUrl(arts?: { poster_tab?: string } | null): string {
  return endgameArtUrl(arts?.poster_tab, ART_PREFIXES);
}

// 赛季 Hero 背景 URL（按模式取唯一大图：maze=background 场景背景 2048×1024 /
// story=theme_bg 海报背景 2048×1152 / peak=handbook_banner 图鉴横幅 1103×737；
// boss 无大图字段返回空串保持透明底）。低透明度铺底，保证文字对比度。
export function seasonHeroBgUrl(arts?: { background?: string; theme_bg?: string; handbook_banner?: string } | null): string {
  return endgameArtUrl(arts?.background, ART_PREFIXES)
    || endgameArtUrl(arts?.theme_bg, ART_PREFIXES)
    || endgameArtUrl(arts?.handbook_banner, ART_PREFIXES);
}
import {
  loadLocalMazeCatalog, loadLocalStoryCatalog, loadLocalBossCatalog, loadLocalPeakCatalog,
} from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import type { MazeCatalogDb, MazeListEntry } from '../../../services/types';

export function mazeStatus(info: MazeListEntry): string {
  const parse = (s: string | undefined): number | null => {
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  };
  const start = parse(info.live_begin) ?? parse(info.begin);
  const end = parse(info.live_end) ?? parse(info.end);
  const now = Date.now();
  if (start != null && now < start) return '未开始';
  if (end != null && now > end) return '已结束';
  if (start != null || end != null) return '进行中';
  return '未知';
}

export function mazeDateRange(info: MazeListEntry): string {
  const fmt = (s: string | undefined): string | null => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const start = fmt(info.live_begin) ?? fmt(info.begin);
  const end = fmt(info.live_end) ?? fmt(info.end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `– ${end}`;
  return '';
}

export const MAZE_STATUS_CLASS: Record<string, string> = {
  '进行中': 'live',
  '已结束': 'ended',
  '未开始': 'upcoming',
  '未知': 'unknown',
};

const EMBLEMS: Record<string, string> = {
  maze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.2A2.2 2.2 0 0 1 6.2 4H12v16H6.2A2.2 2.2 0 0 1 4 17.8V6.2z"/><path d="M20 6.2A2.2 2.2 0 0 0 17.8 4H12v16h5.8a2.2 2.2 0 0 0 2.2-2.2V6.2z"/></svg>',
  boss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z"/></svg>',
  peak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v17"/><path d="M8.5 20.5h7"/><path d="M4.5 6h15"/><path d="M6.4 6l-2.2 4a2.6 2.6 0 0 0 4.6 0L6.6 6"/><path d="M17.6 6l-2.2 4a2.6 2.6 0 0 0 4.6 0l-2.4-4"/></svg>',
};

export interface EndgameMode {
  key: string;
  label: string;
  en: string;
  emblem: string;
  /** 玩法入口图（SpriteOutput 路径：ChallangeGeneralConfig TabImgPath 三模 + 仲裁人工延展
   *  Img4；筛选选项 icon 消费，经 endgameArtUrl + UI/ChallengeBoss 白名单解析） */
  icon?: string;
}

export const ENDGAME_MODES: EndgameMode[] = [
  { key: 'maze', label: '忘却之庭', en: 'FORGOTTEN HALL', emblem: EMBLEMS.maze, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png' },
  { key: 'story', label: '虚构叙事', en: 'PURE FICTION', emblem: EMBLEMS.story, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png' },
  { key: 'boss', label: '末日幻影', en: 'APOCALYPSE', emblem: EMBLEMS.boss, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg3.png' },
  { key: 'peak', label: '异相仲裁', en: 'ANOMALY', emblem: EMBLEMS.peak, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg4.png' },
];

// 玩法级默认图标 URL（模式统一用玩法入口默认图：抛弃每季 `arts.tab` 页签图——
// 4 类玩法图标恒定，不随新赛季迭代而漂移，规避 jsDelivr fork 冻结后的新赛季破图残留）。
// 数据源 = ENDGAME_MODES[].icon（模式筛选选项 icon 同源，单一事实来源；peak 为人工延展 Img4）。
// 经 endgameArtUrl + TAB_ART_PREFIXES 白名单解析；空串由调用方降级徽记。
export function modeDefaultArtUrl(modeKey: string): string {
  const mode = ENDGAME_MODES.find((m) => m.key === modeKey);
  return mode?.icon ? endgameArtUrl(mode.icon, TAB_ART_PREFIXES) : '';
}

// 排序键 = 首个已知端点（live_begin 优先、回退 live_end：新赛季排期可能只有单边日期）；
// 同日平局开始端在前（当天开始的赛季新于当天结束的）；两端皆无者按编号降序沉底。
// 镜像副本：tools/gen-ai-endpoints.mjs endgamePages 的 all.sort。
export function bySeasonDesc(a: CatalogItem, b: CatalogItem): number {
  const ka = seasonSortKey(a);
  const kb = seasonSortKey(b);
  if (ka.date && kb.date && ka.date !== kb.date) return ka.date < kb.date ? 1 : -1;
  if (ka.date && kb.date) {
    if (ka.isBegin !== kb.isBegin) return ka.isBegin ? -1 : 1;
  } else if (ka.date) {
    return -1;
  } else if (kb.date) {
    return 1;
  }
  return Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, ''));
}

function seasonSortKey(item: CatalogItem): { date: string; isBegin: boolean } {
  const begin = String(item.liveBegin || '');
  if (begin) return { date: begin, isBegin: true };
  return { date: String(item.liveEnd || ''), isBegin: false };
}

export const endgamePage: CatalogPageConfig = {
  id: 'endgame',
  title: '终局内容',
  searchPlaceholder: '搜索赛季...',
  gridClass: 'nk-cat-grid nk-eg-grid',
  cardClass: '.nk-eg-card',
  styles: [() => import('../../../../src/styles/endgame.css')],
  async fetchData() {
    const [maze, story, boss, peak] = await Promise.all([
      loadLocalMazeCatalog(), loadLocalStoryCatalog(), loadLocalBossCatalog(), loadLocalPeakCatalog(),
    ]);
    const items: CatalogItem[] = [];
    // 数据源为 *.catalog.json 轻量条目：仅含目录卡字段，大幅削减目录首载体积（详情页仍走全量）。
    const collect = (mode: EndgameMode, db: MazeCatalogDb): void => {
      for (const [key, info] of Object.entries(db)) {
        if (!info || !info.zh) continue;
        items.push({
          id: `ID ${key}`,
          mode: mode.key,
          name: stripAllTags(info.zh),
          searchText: mode.label,
          href: `/endgame/${mode.key}/${key}`,
          liveBegin: info.live_begin,
          liveEnd: info.live_end,
          status: mazeStatus(info),
          dateRange: mazeDateRange(info),
          permanent: info.permanent,
          test: info.test,
          buffs: info.buffs || [],
          monsters: info.monsters || [],
          /** 卡片敌方：最终层（最高层）代表阵容优先，回退全赛季（converter final_monsters） */
          finalMonsters: info.final_monsters || [],
          tierce: info.tierce,
          levels: info.levels,
          /** 赛季级污染汇总（ADR 0026）：卡片「含污染」标记的唯一判据 */
          pollution: info.pollution,
        });
      }
    };
    for (const m of ENDGAME_MODES) {
      const db = m.key === 'maze' ? maze : m.key === 'story' ? story : m.key === 'boss' ? boss : peak;
      collect(m, db);
    }
    items.sort(bySeasonDesc);
    return items;
  },
  renderCard(item, i) {
    const st = String(item.status || '未知');
    const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
    const no = String(item.id || '').replace(/^ID\s*/i, '');
    const noHtml = no ? `<span class="nk-eg-lrow__no">№ ${escHtml(no)}</span>` : '';
    const date = item.dateRange ? `<span class="nk-eg-lrow__date">${escHtml(String(item.dateRange))}</span>` : '';
    const badge = st !== '未知'
      ? `<span class="nk-eg-lrow__status"><span class="nk-eg-lrow__dot"></span>${escHtml(st)}</span>` : '';
    const name = String(item.name || '未命名赛季');
    const idStr = String(item.id || '');
    const pollInfo = item.pollution as { count?: number; levels?: number[] } | undefined;
    const pollLevels = (pollInfo?.levels || []).join(' / ');
    const poll = pollInfo?.count
      ? `<span class="nk-eg-lrow__poll" title="${escHtml(`本季 ${pollInfo.count} 处污染关卡 · 等级 ${pollLevels}`)}">含污染</span>`
      : '';
    const meta = (badge || date || poll) ? `<span class="nk-eg-lrow__meta">${badge}${poll}${date}</span>` : '';
    const iconSrc = modeDefaultArtUrl(String(item.mode || ''));
    const iconHtml = iconSrc
      ? `<span class="nk-eg-lrow__fig"><img class="nk-eg-lrow__icon" src="${escHtml(iconSrc)}" alt="" loading="lazy"></span>` : '';
    return `<a class="nk-eg-lrow nk-eg-lrow--${stCls}" href="${escHtml(String(item.href || ''))}" data-mode="${escHtml(String(item.mode || ''))}" data-name="${escHtml(name)} ${escHtml(idStr)}" data-status="${escHtml(st)}" style="--i:${i}">
      ${iconHtml}
      <span class="nk-eg-lrow__main">
        <span class="nk-eg-lrow__head">${noHtml}<span class="nk-eg-lrow__name">${escHtml(name)}</span></span>
        ${meta}
      </span>
    </a>`;
  },
  renderColumns(items, renderCard) {
    let html = '';
    for (const m of ENDGAME_MODES) {
      const col = items.filter((it) => it.mode === m.key);
      if (!col.length) continue;
      html += `<section class="nk-eg-col" data-mode="${m.key}">
        <h2 class="nk-eg-col__head">
          <span class="nk-eg-col__name">${escHtml(m.label)}</span>
          <span class="nk-eg-col__en">${escHtml(m.en)}</span>
          <span class="nk-eg-col__count">${col.length}</span>
        </h2>
        <div class="nk-eg-col__list">${col.map((it, ci) => renderCard(it, ci)).join('')}</div>
      </section>`;
    }
    return html;
  },
};
