import { OFFICIAL_ICON_BASE } from '../../../lib/constants';
import { activeHref } from '../../../lib/i18n/active';
import { translate } from '../../i18n';

const t = translate;
import { escHtml, stripAllTags } from '../../../lib/format';
import { spriteOutputToRel } from '../../../services/cdn/jsdelivr';

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

export function seasonPosterTabUrl(arts?: { poster_tab?: string } | null): string {
  return endgameArtUrl(arts?.poster_tab, ART_PREFIXES);
}

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

export type MazeStatus = 'live' | 'ended' | 'upcoming' | 'unknown';

export const SEASON_TZ_OFFSET = '+08:00';
const SEASON_TZ_MS = 8 * 3600 * 1000;
const BARE_SEASON_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

export function seasonTimeMs(s?: string): number | null {
  if (!s) return null;
  const raw = String(s).trim();
  if (!raw) return null;
  const m = BARE_SEASON_TIME.exec(raw);
  const iso = m
    ? `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}${SEASON_TZ_OFFSET}`
    : raw;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export function seasonDateParts(s?: string): string | null {
  if (!s) return null;
  const raw = String(s).trim();
  const m = BARE_SEASON_TIME.exec(raw);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  const t = seasonTimeMs(raw);
  if (t == null) return null;
  const d = new Date(t + SEASON_TZ_MS);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function mazeStatus(info: MazeListEntry): MazeStatus {
  const start = seasonTimeMs(info.live_begin) ?? seasonTimeMs(info.begin);
  const end = seasonTimeMs(info.live_end) ?? seasonTimeMs(info.end);
  const now = Date.now();
  if (start != null && now < start) return 'upcoming';
  if (end != null && now > end) return 'ended';
  if (start != null || end != null) return 'live';
  return 'unknown';
}

export function mazeDateRange(info: MazeListEntry): string {
  const start = seasonDateParts(info.live_begin) ?? seasonDateParts(info.begin);
  const end = seasonDateParts(info.live_end) ?? seasonDateParts(info.end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `– ${end}`;
  return '';
}

export const MAZE_STATUS_CLASS: Record<MazeStatus, string> = {
  live: 'live',
  ended: 'ended',
  upcoming: 'upcoming',
  unknown: 'unknown',
};

export function mazeStatusLabelKey(status: MazeStatus): string {
  return `endgame.status.${status}`;
}

export interface EndgameMode {
  key: string;
  labelKey: string;
  en: string;
  icon?: string;
}

export const ENDGAME_MODES: EndgameMode[] = [
  { key: 'maze', labelKey: 'catalog.option.modeMaze', en: 'FORGOTTEN HALL', icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png' },
  { key: 'story', labelKey: 'catalog.option.modeStory', en: 'PURE FICTION', icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png' },
  { key: 'boss', labelKey: 'catalog.option.modeBoss', en: 'APOCALYPSE', icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg3.png' },
  { key: 'peak', labelKey: 'catalog.option.modePeak', en: 'ANOMALY', icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg4.png' },
];

export function modeDefaultArtUrl(modeKey: string): string {
  const mode = ENDGAME_MODES.find((m) => m.key === modeKey);
  return mode?.icon ? endgameArtUrl(mode.icon, TAB_ART_PREFIXES) : '';
}

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
  titleKey: 'catalog.endgame.title',
  subtitle: 'ENDGAME',
  searchKey: 'catalog.endgame.search',
  gridClass: 'nk-cat-grid nk-eg-grid',
  skeleton: { variant: 'columns', rows: 10 },
  styles: [() => import('../../../../src/styles/endgame.css')],
  async fetchData() {
    const [maze, story, boss, peak] = await Promise.all([
      loadLocalMazeCatalog(), loadLocalStoryCatalog(), loadLocalBossCatalog(), loadLocalPeakCatalog(),
    ]);
    const items: CatalogItem[] = [];
    const collect = (mode: EndgameMode, db: MazeCatalogDb): void => {
      for (const [key, info] of Object.entries(db)) {
        if (!info || !info.zh) continue;
        items.push({
          id: `ID ${key}`,
          mode: mode.key,
          name: stripAllTags(info.zh),
          searchText: translate(mode.labelKey),
          href: activeHref(`/endgame/${mode.key}/${key}`),
          liveBegin: info.live_begin,
          liveEnd: info.live_end,
          status: mazeStatus(info),
          dateRange: mazeDateRange(info),
          permanent: info.permanent,
          test: info.test,
          buffs: info.buffs || [],
          monsters: info.monsters || [],
          finalMonsters: info.final_monsters || [],
          tierce: info.tierce,
          levels: info.levels,
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
    const raw = String(item.status || 'unknown');
    const st: MazeStatus = MAZE_STATUS_CLASS[raw as MazeStatus] ? (raw as MazeStatus) : 'unknown';
    const stCls = MAZE_STATUS_CLASS[st];
    const stText = translate(mazeStatusLabelKey(st));
    const no = String(item.id || '').replace(/^ID\s*/i, '');
    const noHtml = no ? `<span class="nk-eg-lrow__no">№ ${escHtml(no)}</span>` : '';
    const date = item.dateRange ? `<span class="nk-eg-lrow__date" title="${escHtml(String(item.dateRange))}">${escHtml(String(item.dateRange))}</span>` : '';
    const badge = st !== 'unknown'
      ? `<span class="nk-eg-lrow__status" data-status="${stCls}"><span class="nk-eg-lrow__dot"></span>${escHtml(stText)}</span>` : '';
    const name = String(item.name || translate('common.unknown'));
    const idStr = String(item.id || '');
    const pollInfo = item.pollution as { count?: number; levels?: number[] } | undefined;
    const pollLevels = (pollInfo?.levels || []).join(' / ');
    const poll = pollInfo?.count
      ? `<span class="nk-eg-lrow__poll" title="${escHtml(t('egd.pollutionTitle', { n: pollInfo.count, levels: pollLevels }))}">${escHtml(t('nav.voracity'))}</span>`
      : '';
    const meta = (badge || date) ? `<span class="nk-eg-lrow__meta">${badge}${date}</span>` : '';
    const iconSrc = modeDefaultArtUrl(String(item.mode || ''));
    const iconHtml = iconSrc
      ? `<span class="nk-eg-lrow__fig"><img class="nk-eg-lrow__icon" src="${escHtml(iconSrc)}" alt="" loading="lazy"></span>` : '';
    return `<a class="nk-eg-lrow nk-eg-lrow--${stCls}" href="${escHtml(String(item.href || ''))}" data-mode="${escHtml(String(item.mode || ''))}" data-name="${escHtml(name)} ${escHtml(idStr)}" data-status="${escHtml(st)}" style="--i:${i}">
      ${iconHtml}
      <span class="nk-eg-lrow__main">
        <span class="nk-eg-lrow__head">${noHtml}<span class="nk-eg-lrow__name" title="${escHtml(name)}">${escHtml(name)}</span>${poll}</span>
        ${meta}
      </span>
    </a>`;
  },
  renderColumns(items, renderCard) {
    let html = '';
    for (const m of ENDGAME_MODES) {
      const col = items.filter((it) => it.mode === m.key);
      if (!col.length) continue;
      const modeLabel = translate(m.labelKey);
      html += `<section class="nk-eg-col" data-mode="${m.key}">
        <h2 class="nk-eg-col__head">
          <span class="nk-eg-col__meta">
            <span class="nk-eg-col__name">${escHtml(modeLabel)}</span>
            <span class="nk-eg-col__en">${escHtml(m.en)}</span>
          </span>
          <a class="nk-guide-link" href="${escHtml(activeHref(`/endgame/${m.key}`))}" aria-label="${escHtml(translate('catalog.modeGuideAria', { name: modeLabel }))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19"/></svg>${escHtml(translate('egd.guideLabel'))}</a>
        </h2>
        <div class="nk-eg-col__list">${col.map((it, ci) => renderCard(it, ci)).join('')}</div>
      </section>`;
    }
    return html;
  },
};
