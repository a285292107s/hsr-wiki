import { cdnUri } from '../../../services/cdn';
import { escHtml } from '../../../lib/html';
import { translate } from '../../i18n';
import { loadLocalAchievements, loadLocalAchievementSeries } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

/* 稀有度 / 显示状态的**展示文案只在词典里**（配置里存键）：卡片渲染是模板字符串（非组件），
   故用 `translate()`（非组件模块入口）——切语言走整页导航，无需响应式。 */
const RARITY_KEY: Record<string, string> = {
  Low: 'catalog.option.rarityLow',
  Mid: 'catalog.option.rarityMid',
  High: 'catalog.option.rarityHigh',
};

/** 显示状态 → 词典键（ShowType 值域：None 常显 / ShowAfterFinish / HiddenDesc）。
 *  注意：converter 将 None 归一为空串产出（见 tools/converter/converters/achievements.py 专测），
 *  而 CatalogPage 过滤把空 val 视为「不筛」（与「全部」同 val），故前端在 fetchData/buildFilters
 *  统一把空值归一为哨兵 'None'——否则「常显」与「全部」撞 val 双高亮且永远筛不出常显成就 */
const SHOW_KEY: Record<string, string> = {
  None: 'catalog.option.showNone',
  ShowAfterFinish: 'catalog.option.showAfterFinish',
  HiddenDesc: 'catalog.option.showHidden',
};

function renderAchievementCard(item: CatalogItem, index = 0): string {
  const rarity = String(item.rarity || '');
  const series = (item.series_name as string) || '';
  const img = (item.series_icon as string) || '';
  const hidden = item.show_type === 'HiddenDesc';
  const gemTitle = RARITY_KEY[rarity]
    ? translate('catalog.rarityGem', { rarity: translate(RARITY_KEY[rarity]) })
    : '';
  const gem = rarity
    ? `<span class="nk-ach-card__gem" role="img" aria-label="${gemTitle}" title="${gemTitle}"></span>`
    : '';
  const descText = hidden ? '？？？' : String(item.desc || '');
  const descTip = descText.replace(/\n+/g, ' ');
  const descHtml = hidden
    ? `<span class="nk-ach-card__redact">${escHtml(descText)}</span>`
    : escHtml(descText);
  return `<div class="nk-ach-card nk-ach-card--${rarity.toLowerCase() || 'none'}${hidden ? ' nk-ach-card--hidden' : ''}" data-id="${escHtml(String(item.id))}" data-name="${escHtml(item.name)}" data-rarity="${escHtml(rarity)}" data-series="${escHtml(String(item.series_id || ''))}" data-show-type="${escHtml(String(item.show_type || ''))}" style="--i:${index}">
      <div class="nk-ach-card__main">
        <div class="nk-ach-card__head">
          ${img ? `<img class="nk-ach-card__icon" src="${escHtml(img)}" alt="" loading="lazy">` : ''}
          <span class="nk-ach-card__no">${escHtml(String(item.id))}</span>
          ${gem}
        </div>
        <div class="nk-ach-card__title">${escHtml(item.name)}</div>
        <div class="nk-ach-card__desc" title="${escHtml(descTip)}">${descHtml}</div>
        <div class="nk-ach-card__meta">
          <span class="nk-ach-card__series">${escHtml(series) || translate('catalog.unknownSeries')}</span>
        </div>
      </div>
    </div>`;
}

export const achievementPage: CatalogPageConfig = {
  id: 'achievement',
  titleKey: 'nav.achievement',
  subtitle: 'ACHIEVEMENT INDEX',
  searchKey: 'catalog.achievement.search',
  gridClass: 'nk-cat-grid nk-ach-grid',
  cardClass: '.nk-ach-card',
  styles: [() => import('../../../../src/styles/achievement.css')],
  /* 虚拟网格刻度：卡是「无图纯文本」型，行高由文本块决定而不是由列宽 × 图比决定（virtualImgRatio 0）。
     刻度按实测内容高定（详见图例注释）：桌面上 `--nk-grid-min` 不得小于此处的 virtualMinColW，
     否则骨架网格与卡片网格列数不一致（加载完成会跳一档）。 */
  virtualMinColW: 276,
  virtualImgRatio: 0,
  virtualInfoH: 144,
  /* 手机档 1 列 + 横向行布局（与「敌方物种」目录同构，见 achievement.css 的 <768 块）：
     行高按「id 行 + 单行标题 + 3 行描述 + 系列行」的实测内容给定——描述 3 行推算 136.2px，
     单元格 154px（卡 144px）留 ~8px 余量。 */
  virtualMobileRowH: 160,
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
      if (sid && !seenSeries.has(sid)) {
        seenSeries.set(sid, String(it.series_name || `${translate('catalog.filter.series')} ${sid}`));
      }
    });
    if (seenSeries.size) {
      filters.push({
        key: 'series_id',
        labelKey: 'catalog.filter.series',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...[...seenSeries.entries()].map(([id, name]) => ({ val: String(id), label: name })),
        ],
      });
    }

    const rarities = [...new Set(items.map((it) => String(it.rarity)).filter(Boolean))];
    if (rarities.length) {
      filters.push({
        key: 'rarity',
        labelKey: 'catalog.filter.rarity',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...rarities.map((r) => (RARITY_KEY[r] ? { val: r, labelKey: RARITY_KEY[r] } : { val: r, label: r })),
        ],
      });
    }

    const shows = [...new Set(items.map((it) => String(it.show_type || 'None')))];
    if (shows.length) {
      filters.push({
        key: 'show_type',
        labelKey: 'catalog.filter.showType',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...shows.map((s) => (SHOW_KEY[s] ? { val: s, labelKey: SHOW_KEY[s] } : { val: s, label: s })),
        ],
      });
    }

    return filters;
  },
  renderCard: (item, i) => renderAchievementCard(item, i),
};
