/** 终局内容目录页配置（4 页共享星际档案卡片工厂） */
import { ELEM } from '../../../lib/constants';
import { escHtml, stripAllTags, elementIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
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

/** 模式徽记（24×24 线性图标，与四模式领域色配套使用） */
const EMBLEMS: Record<string, string> = {
  // 忘却之庭 · 记忆之环（同心环 + 中心点，如记忆的回响）
  maze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
  // 虚构叙事 · 卷宗（对开书页）
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.2A2.2 2.2 0 0 1 6.2 4H12v16H6.2A2.2 2.2 0 0 1 4 17.8V6.2z"/><path d="M20 6.2A2.2 2.2 0 0 0 17.8 4H12v16h5.8a2.2 2.2 0 0 0 2.2-2.2V6.2z"/></svg>',
  // 末日幻影 · 湮灭星芒（四角星芒，灾厄降临）
  boss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z"/></svg>',
  // 异相仲裁 · 裁决天秤（衡量异象之平衡）
  peak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v17"/><path d="M8.5 20.5h7"/><path d="M4.5 6h15"/><path d="M6.4 6l-2.2 4a2.6 2.6 0 0 0 4.6 0L6.6 6"/><path d="M17.6 6l-2.2 4a2.6 2.6 0 0 0 4.6 0l-2.4-4"/></svg>',
};

/** 终局模式元信息（EndgameView 子导航 + 卡片徽记共用，单一事实来源） */
export interface EndgameMode {
  /** 对应目录页 id（data-mode） */
  key: string;
  label: string;
  en: string;
  path: string;
  /** 模式徽记（内联 SVG） */
  emblem: string;
}

export const ENDGAME_MODES: EndgameMode[] = [
  { key: 'maze', label: '忘却之庭', en: 'FORGOTTEN HALL', path: '/endgame/maze', emblem: EMBLEMS.maze },
  { key: 'story', label: '虚构叙事', en: 'PURE FICTION', path: '/endgame/story', emblem: EMBLEMS.story },
  { key: 'boss', label: '末日幻影', en: 'APOCALYPSE', path: '/endgame/boss', emblem: EMBLEMS.boss },
  { key: 'peak', label: '异相仲裁', en: 'ANOMALY', path: '/endgame/peak', emblem: EMBLEMS.peak },
];

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
 * 终局内容页工厂：4 页共享星际档案卡片与状态筛选。
 * Tab 导航由 EndgameView 布局组件承载（嵌套路由）。
 */
function makeEndgamePage(o: EndgamePageOpts): CatalogPageConfig {
  const mode = ENDGAME_MODES.find((m) => m.key === o.id);
  return {
    id: o.id,
    title: o.title,
    prefetch: (ctx) => prefetchEndgameAll(ctx.version),
    searchPlaceholder: '搜索赛季...',
    gridClass: 'nk-cat-grid nk-eg-grid',
    cardClass: '.nk-eg-card',
    async fetchData(ctx) {
      const db = await o.loadList(ctx.version);
      const items: CatalogItem[] = [];
      /** 赛季条目公共字段（排期日期 + 弱点/层数等聚合统计） */
      const toItem = (info: MazeListEntry, key: string, version: string): CatalogItem => ({
        id: `ID ${key}`,
        name: stripAllTags(info.zh),
        href: `${o.href}/${key}`,
        version,
        status: mazeStatus(info),
        dateRange: mazeDateRange(info),
        damageTypes: info.damage_types,
        floors: info.floors,
        stageNum: info.stage_num,
        countdown: info.countdown,
      });
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
            items.push(toItem(info, key, verLabel(ver, idx)));
          });
        }
      } else {
        // 无 version.json：直接按 ID 降序输出（story/boss，对齐原站 2026→2001 / 3020→3001）
        for (const [key, info] of Object.entries(db)) {
          if (!info || !info.zh) continue;
          items.push(toItem(info, key, ''));
        }
        items.sort((a, b) => Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, '')));
      }
      return items;
    },
    renderCard(item, i) {
      const st = String(item.status || '未知');
      const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
      const num = String(item.id).replace(/\D/g, '');
      const numCls = num.length >= 4 ? ' nk-eg-card__num--long' : '';
      // 元数据仅在实际存在时渲染：无日期/版本/统计时整体隐藏，避免"未知"噪音
      const ver = item.version && String(item.version) !== '未知'
        ? `<span class="nk-eg-card__ver">${escHtml(String(item.version))}</span>` : '';
      const date = item.dateRange ? `<span class="nk-eg-card__date">${escHtml(String(item.dateRange))}</span>` : '';
      const badge = st !== '未知' ? `<span class="nk-eg-card__status">${escHtml(st)}</span>` : '';
      // 弱点属性：CDN 元素图标（无则省略）；层数/回合上限聚合为 HUD 统计文本
      const dmg = Array.isArray(item.damageTypes) ? item.damageTypes as string[] : [];
      const elems = dmg.length
        ? `<span class="nk-eg-card__elems">${dmg.map((d) => {
            const src = elementIconUrl(d);
            return src
              ? `<img class="nk-eg-card__elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
              : '';
          }).join('')}</span>`
        : '';
      const floors = Number(item.floors) || 0;
      const countdown = Number(item.countdown) || 0;
      const stat = floors ? `${floors} 层${countdown ? ` · ${countdown} 回合` : ''}` : '';
      return `<a class="nk-eg-card nk-eg-card--${stCls}" href="${escHtml(item.href)}" data-mode="${escHtml(o.id)}" data-name="${escHtml(item.name)} ${escHtml(item.id)}" data-status="${escHtml(st)}" style="--i:${i}">
      <div class="nk-eg-card__plate">
        <span class="nk-eg-card__emblem">${mode?.emblem || ''}</span>
        <span class="nk-eg-card__num${numCls}">${escHtml(num)}</span>
      </div>
      <div class="nk-eg-card__body">
        <span class="nk-eg-card__name">${escHtml(item.name) || '未命名赛季'}</span>
        <div class="nk-eg-card__meta">${elems}${stat ? `<span class="nk-eg-card__stat">${escHtml(stat)}</span>` : ''}${ver}${date}${badge}</div>
      </div>
      <svg class="nk-eg-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
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
