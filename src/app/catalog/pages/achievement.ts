/** 成就目录页配置（常规模式） */
import { cdnUri } from '../../../services/cdn';
import { escHtml } from '../../../lib/html';
import { loadLocalAchievements, loadLocalAchievementSeries } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

/** 稀有度 → 徽章文案（Rarity 值域：Low=铜 / Mid=银 / High=金） */
const RARITY_LABEL: Record<string, string> = { Low: '铜', Mid: '银', High: '金' };

/** 显示状态 → 筛选文案（ShowType 值域：None 常显 / ShowAfterFinish / HiddenDesc） */
const SHOW_LABEL: Record<string, string> = {
  '': '常显',
  ShowAfterFinish: '完成后显示',
  HiddenDesc: '隐藏描述',
};

function renderAchievementCard(item: CatalogItem, index = 0): string {
  const rarity = String(item.rarity || '');
  const series = (item.series_name as string) || '';
  const img = (item.series_icon as string) || '';
  const hidden = item.show_type === 'HiddenDesc';
  /* 稀有度徽章（金/银/铜，数据语义色 --ach-rarity-*） */
  const badge = rarity
    ? `<span class="nk-ach-card__badge" title="${RARITY_LABEL[rarity]}稀有度">${RARITY_LABEL[rarity]}</span>`
    : '';
  /* 隐藏描述成就：游戏内描述以「？？？」呈现，卡片同源标识 */
  const descText = hidden ? '？？？' : String(item.desc || '');
  /* 描述截断时 hover 提示全文（换行转空格，避免 title 换行渲染异常） */
  const descTip = descText.replace(/\n+/g, ' ');
  return `<div class="nk-ach-card nk-ach-card--${rarity.toLowerCase() || 'none'}${hidden ? ' nk-ach-card--hidden' : ''}" data-id="${escHtml(String(item.id))}" data-name="${escHtml(item.name)}" data-rarity="${escHtml(rarity)}" data-series="${escHtml(String(item.series_id || ''))}" data-show-type="${escHtml(String(item.show_type || ''))}" style="--i:${index}">
      <div class="nk-ach-card__head">
        ${img ? `<img class="nk-ach-card__icon" src="${escHtml(img)}" alt="${escHtml(series)}">` : ''}
        <div class="nk-ach-card__title">${escHtml(item.name)}</div>
        ${badge}
      </div>
      <div class="nk-ach-card__info">
        <div class="nk-ach-card__desc" title="${escHtml(descTip)}">${escHtml(descText)}</div>
        <div class="nk-ach-card__meta">
          <span class="nk-ach-card__series">${escHtml(series) || '未知系列'}</span>
          <span class="nk-ach-card__id">#${escHtml(String(item.id))}</span>
        </div>
      </div>
    </div>`;
}

export const achievementPage: CatalogPageConfig = {
  id: 'achievement',
  title: '成就',
  searchPlaceholder: '搜索成就标题或描述…',
  gridClass: 'nk-cat-grid nk-ach-grid',
  cardClass: '.nk-ach-card',
  /* 1869 条 > 400 阈值 → 虚拟网格；
     列宽 200（桌面 6 列，避免 8 列小卡密集）；头部条高度 = colW*0.26（桌面约 56px 匹配图标 40px），
     信息区 140px 容纳 5 行描述（字号 0.78rem）+ 元信息：
     单元格高度已固定为行高（use-virtual-grid），卡片 height:100% 等高填充，
     行高估算须 ≥ 卡片实际最大高度（head 57 + 5 行描述 97 + 元信息 27 ≈ 181px，桌面安全余量 23px） */
  virtualMinColW: 200,
  virtualImgRatio: 0.26,
  virtualInfoH: 140,
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
        /* 达成要求：正文完整展示（renderCard 读取） */
        desc: a.desc,
        /* 搜索增强：标题 + 描述（含参数展开后的文本） */
        searchText: `${a.title}\n${a.desc}`,
        rarity: a.rarity,
        series_id: a.series_id,
        series_name: s?.name ?? '',
        series_icon: s?.icon ? cdnUri('achievement', `${s.icon}.webp`) : '',
        show_type: a.show_type,
      };
    });
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];

    // 系列（保持成就数据内系列 Priority 升序）
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

    // 稀有度（金/银/铜）
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

    // 显示状态（常显 / 完成后显示 / 隐藏描述）
    const shows = [...new Set(items.map((it) => String(it.show_type || '')))];
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