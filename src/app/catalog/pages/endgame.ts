/** 终局内容目录页配置（4 页共享时间线卡片工厂） */
import { escHtml, stripAllTags } from '../../../lib/format';
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList,
  loadLocalPeakList, prefetchEndgameAll,
} from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import type { MazeListDb, MazeListEntry, MazeVersionMap } from '../../../services/types';

/** 赛季状态：依据 begin/end 日期推导；无日期信息时返回"未知"（与原站一致） */
function mazeStatus(info: MazeListEntry): string {
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

/** 格式化日期区间（YYYY.MM.DD – MM.DD） */
function mazeDateRange(info: MazeListEntry): string {
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
  return '';
}

/** 状态 → CSS 修饰类 */
const MAZE_STATUS_CLASS: Record<string, string> = {
  '进行中': 'live',
  '已结束': 'ended',
  '未开始': 'upcoming',
  '未知': 'unknown',
};

/** 版本标签：数字版本原样输出；特殊键（unknown/static）转为中文 */
function verLabel(ver: string, idx: number): string {
  if (ver === 'unknown') return '未知';
  if (ver === 'static') return '常驻';
  return `${ver} v${idx + 1}`;
}

interface EndgamePageOpts {
  id: string;
  title: string;
  /** 本页路由（用于卡片详情链接前缀） */
  href: string;
  loadList: (ver: string) => Promise<MazeListDb>;
  /** 可选版本映射；无则按 ID 降序直接输出（story/boss） */
  loadVersions?: (ver: string) => Promise<MazeVersionMap>;
}

/**
 * 终局内容页工厂：4 页共享时间线卡片与状态筛选。
 * Tab 导航由 EndgameView 布局组件承载（嵌套路由）。
 */
function makeEndgamePage(o: EndgamePageOpts): CatalogPageConfig {
  return {
    id: o.id,
    title: o.title,
    prefetch: (ctx) => prefetchEndgameAll(ctx.version),
    searchPlaceholder: '搜索赛季...',
    gridClass: 'nk-cat-grid nk-season-grid',
    cardClass: '.nk-season-card',
    async fetchData(ctx) {
      const db = await o.loadList(ctx.version);
      const items: CatalogItem[] = [];
      if (o.loadVersions) {
        // 有 version.json：按版本映射输出（maze/peak），同赛季取最近归属版本
        const verMap = await o.loadVersions(ctx.version);
        const seen = new Set<string>();
        for (const [ver, ids] of Object.entries(verMap)) {
          (ids || []).forEach((mid, idx) => {
            const key = String(mid);
            if (seen.has(key)) return;
            seen.add(key);
            const info = db[key];
            if (!info || !info.zh) return;
            items.push({
              id: `ID ${key}`,
              name: stripAllTags(info.zh),
              href: `${o.href}/${key}`,
              version: verLabel(ver, idx),
              status: mazeStatus(info),
              dateRange: mazeDateRange(info),
            });
          });
        }
      } else {
        // 无 version.json：直接按 ID 降序输出（story/boss，对齐原站 2026→2001 / 3020→3001）
        for (const [key, info] of Object.entries(db)) {
          if (!info || !info.zh) continue;
          items.push({
            id: `ID ${key}`,
            name: stripAllTags(info.zh),
            href: `${o.href}/${key}`,
            version: '',
            status: mazeStatus(info),
            dateRange: mazeDateRange(info),
          });
        }
        items.sort((a, b) => Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, '')));
      }
      return items;
    },
    renderCard(item, i) {
      const st = String(item.status || '未知');
      const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
      const dateRange = item.dateRange ? String(item.dateRange) : '';
      const num = String(item.id).replace(/\D/g, '');
      const numCls = num.length >= 3 ? ' nk-season-card__num--long' : '';
      return `<a class="nk-season-card nk-season-card--${stCls}" href="${escHtml(item.href)}" data-name="${escHtml(item.name)} ${escHtml(item.id)}" data-status="${escHtml(st)}" style="--i:${i}">
      <div class="nk-season-card__node"></div>
      <span class="nk-season-card__num${numCls}">${escHtml(num)}</span>
      <div class="nk-season-card__body">
        <div class="nk-season-card__top">
          <span class="nk-season-card__name">${escHtml(item.name) || '未命名赛季'}</span>
          ${st !== '未知' ? `<span class="nk-season-card__status">${escHtml(st)}</span>` : ''}
        </div>
        <div class="nk-season-card__meta">
          <span class="nk-season-card__ver${item.version && item.version !== '未知' ? '' : ' nk-season-card__ver--unknown'}">${escHtml(item.version || '未知')}</span>
          ${dateRange ? `<span class="nk-season-card__date">${escHtml(dateRange)}</span>` : ''}
        </div>
      </div>
      <svg class="nk-season-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </a>`;
    },
  };
}

export const mazePage = makeEndgamePage({
  id: 'maze', title: '终局内容 · 忘却之庭', href: '/endgame/maze',
  loadList: loadLocalMazeList,
});

export const storyPage = makeEndgamePage({
  id: 'story', title: '终局内容 · 虚构叙事', href: '/endgame/story',
  loadList: loadLocalStoryList,
});

export const bossPage = makeEndgamePage({
  id: 'boss', title: '终局内容 · 末日幻影', href: '/endgame/boss',
  loadList: loadLocalBossList,
});

export const peakPage = makeEndgamePage({
  id: 'peak', title: '终局内容 · 异相仲裁', href: '/endgame/peak',
  loadList: loadLocalPeakList,
});
