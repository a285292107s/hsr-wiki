import { cdnUri } from '../../../services/cdn';
import { escHtml } from '../../../lib/html';
import { loadLocalAchievements, loadLocalAchievementSeries } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

const RARITY_LABEL: Record<string, string> = { Low: '铜', Mid: '银', High: '金' };

/** 显示状态 → 筛选文案（ShowType 值域：None 常显 / ShowAfterFinish / HiddenDesc）。
 *  注意：converter 将 None 归一为空串产出（见 tools/converter/converters/achievements.py 专测），
 *  而 CatalogPage 过滤把空 val 视为「不筛」（与「全部」同 val），故前端在 fetchData/buildFilters
 *  统一把空值归一为哨兵 'None'——否则「常显」与「全部」撞 val 双高亮且永远筛不出常显成就 */
const SHOW_LABEL: Record<string, string> = {
  None: '常显',
  ShowAfterFinish: '完成后显示',
  HiddenDesc: '隐藏描述',
};

function renderAchievementCard(item: CatalogItem, index = 0): string {
  const rarity = String(item.rarity || '');
  const series = (item.series_name as string) || '';
  const img = (item.series_icon as string) || '';
  const hidden = item.show_type === 'HiddenDesc';
  const gemTitle = rarity ? `${RARITY_LABEL[rarity]}稀有度` : '';
  const gem = rarity
    ? `<span class="nk-ach-card__gem" role="img" aria-label="${gemTitle}" title="${gemTitle}"></span>`
    : '';
  const descText = hidden ? '？？？' : String(item.desc || '');
  const descTip = descText.replace(/\n+/g, ' ');
  const descHtml = hidden
    ? `<span class="nk-ach-card__redact">${escHtml(descText)}</span>`
    : escHtml(descText);
  return `<div class="nk-ach-card nk-ach-card--${rarity.toLowerCase() || 'none'}${hidden ? ' nk-ach-card--hidden' : ''}" data-id="${escHtml(String(item.id))}" data-name="${escHtml(item.name)}" data-rarity="${escHtml(rarity)}" data-series="${escHtml(String(item.series_id || ''))}" data-show-type="${escHtml(String(item.show_type || ''))}" style="--i:${index}">
      <div class="nk-ach-card__side">
        ${img ? `<img class="nk-ach-card__icon" src="${escHtml(img)}" alt="" loading="lazy">` : ''}
      </div>
      <div class="nk-ach-card__main">
        <div class="nk-ach-card__head">
          <span class="nk-ach-card__no">${escHtml(String(item.id))}</span>
          ${gem}
        </div>
        <div class="nk-ach-card__title">${escHtml(item.name)}</div>
        <div class="nk-ach-card__desc" title="${escHtml(descTip)}">${descHtml}</div>
        <div class="nk-ach-card__meta">
          ${img ? `<img class="nk-ach-card__series-icon" src="${escHtml(img)}" alt="" loading="lazy">` : ''}
          <span class="nk-ach-card__series">${escHtml(series) || '未知系列'}</span>
        </div>
      </div>
    </div>`;
}

export const achievementPage: CatalogPageConfig = {
  id: 'achievement',
  title: '成就',
  subtitle: 'ACHIEVEMENT INDEX',
  searchPlaceholder: '搜索成就标题或描述…',
  gridClass: 'nk-cat-grid nk-ach-grid',
  cardClass: '.nk-ach-card',
  styles: [() => import('../../../../src/styles/achievement.css')],
  virtualMinColW: 320,
  virtualImgRatio: 0,
  virtualInfoH: 174,
  async fetchData() {
    const [achievements, series] = await Promise.all([
      loadLocalAchievements(),
      loadLocalAchievementSeries(),
    ]);
    const seriesById = new Map(series.map((s) => [s.id, s]));
    return achievements.map((a) => {
      const s = seriesById.get(a.series_id);
      return {
        id: String(a.id),
        name: a.title,
        desc: a.desc,
        searchText: `${a.title}\n${a.desc}`,
        rarity: a.rarity,
        series_id: a.series_id,
        series_name: s?.name ?? '',
        series_icon: s?.icon_s
          ? cdnUri('achievement', `${s.icon_s}.webp`)
          : s?.icon
            ? cdnUri('achievement', `${s.icon}.webp`)
            : '',
        show_type: a.show_type || 'None',
      };
    });
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];

    const seenSeries = new Map<number, string>();
    items.forEach((it) => {
      const sid = Number(it.series_id);
      if (sid && !seenSeries.has(sid)) seenSeries.set(sid, String(it.series_name || `系列 ${sid}`));
    });
    if (seenSeries.size) {
      filters.push({
        key: 'series_id',
        label: '系列',
        options: [
          { val: '', label: '全部' },
          ...[...seenSeries.entries()].map(([id, name]) => ({ val: String(id), label: name })),
        ],
      });
    }

    const rarities = [...new Set(items.map((it) => String(it.rarity)).filter(Boolean))];
    if (rarities.length) {
      filters.push({
        key: 'rarity',
        label: '稀有度',
        options: [
          { val: '', label: '全部' },
          ...rarities.map((r) => ({ val: r, label: RARITY_LABEL[r] ?? r })),
        ],
      });
    }

    const shows = [...new Set(items.map((it) => String(it.show_type || 'None')))];
    if (shows.length) {
      filters.push({
        key: 'show_type',
        label: '显示状态',
        options: [
          { val: '', label: '全部' },
          ...shows.map((s) => ({ val: s, label: SHOW_LABEL[s] ?? s })),
        ],
      });
    }

    return filters;
  },
  renderCard: (item, i) => renderAchievementCard(item, i),
};
