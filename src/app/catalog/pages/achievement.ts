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
  /* 稀有度菱形徽记（graphical 徽章，title/aria-label 承载语义；左缘色条由 CSS ::before 呈现，同族双表达） */
  const gemTitle = rarity ? `${RARITY_LABEL[rarity]}稀有度` : '';
  const gem = rarity
    ? `<span class="nk-ach-card__gem" role="img" aria-label="${gemTitle}" title="${gemTitle}"></span>`
    : '';
  /* 隐藏描述成就：描述区渲染为墨色涂抹条（视觉打码），悬停 title 揭示原文；
     涂抹条内保留「？？？」文本 → 屏幕阅读器与视觉语义一致，原文不泄入可访问性树 */
  const descText = hidden ? '？？？' : String(item.desc || '');
  /* 描述截断时 hover 提示全文（换行转空格，避免 title 换行渲染异常） */
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
  /* 档案式 masthead 副标（CatalogToolbar 复用；与角色页 CHARACTER INDEX 同语言） */
  subtitle: 'ACHIEVEMENT INDEX',
  searchPlaceholder: '搜索成就标题或描述…',
  gridClass: 'nk-cat-grid nk-ach-grid',
  cardClass: '.nk-ach-card',
  /* 成就目录专属样式（nk-ach-card 等），随路由并行加载 */
  styles: [() => import('../../../../src/styles/achievement.css')],
  /* 1869 条 > 400 阈值 → 虚拟网格；
     行高预算（rowH = colW*virtualImgRatio + virtualInfoH + 22，须 ≥ 卡片实际最大高度）：
     长条卡（≥768）：side 64 + main（head 17 + title 17 + desc 3 行 ×17.8 + meta 21 + pad 24）≈ 150px
     手机竖卡（<768）：head 23 + title 2 行 ×17 + desc 4 行 ×17.8 + gap 6 + meta 21 + pad 10 ≈ 169px
     virtualImgRatio=0 → 行高与列宽解耦，恒 = 174 + 22 = 196；
     桌面 colW 352-405 → 横卡 352-405 × 182（2:1 长条）✓；手机 colW ≈ 185 → 竖卡 ≈ 169 ✓ 余 13
     desc 限行与断点绑定：≥768 为 3 行、以下 4 行（改字号/行高须同步重算本预算） */
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
        /* 达成要求：正文完整展示（renderCard 读取） */
        desc: a.desc,
        /* 搜索增强：标题 + 描述（含参数展开后的文本） */
        searchText: `${a.title}\n${a.desc}`,
        rarity: a.rarity,
        series_id: a.series_id,
        series_name: s?.name ?? '',
        /* 底部小图标优先 icon_s（小尺寸专用），缺失回退 icon */
        series_icon: s?.icon_s
          ? cdnUri('achievement', `${s.icon_s}.webp`)
          : s?.icon
            ? cdnUri('achievement', `${s.icon}.webp`)
            : '',
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
