/** 光锥目录页配置 */
import { PATH } from '../../../lib/constants';
import { escHtml, lightconeIconUrl, pathIconUrl } from '../../../lib/format';
import { loadLocalLightCones } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { STAR_SVG } from './shared';

export const lightconePage: CatalogPageConfig = {
  id: 'lightcone',
  title: '光锥',
  searchPlaceholder: '搜索光锥...',
  gridClass: 'nk-cat-grid nk-lc-grid',
  cardClass: '.nk-lc-card',
  async fetchData() {
    const list = await loadLocalLightCones();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const path = (info.path || '').toLowerCase();
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/lightcone/${info.id}`,
        img: lightconeIconUrl(String(info.id)),
        pathImg: pathIconUrl(path),
        path,
        rarity: info.rarity,
      });
    }
    // 排序：id 降序（新光锥在前），黑塔商店特殊光锥（id ≥ 24000）排在尾部
    items.sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      const aHerta = aId >= 24000 ? 1 : 0;
      const bHerta = bId >= 24000 ? 1 : 0;
      if (aHerta !== bHerta) return aHerta - bHerta;
      return bId - aId;
    });
    return items;
  },
  buildFilters(data) {
    const pathIconMap: Record<string, string> = {};
    data.forEach((c) => {
      if (c.path && c.pathImg) pathIconMap[String(c.path)] = String(c.pathImg);
    });
    const paths = [...new Set(data.map((c) => String(c.path || '')).filter(Boolean))];
    return [
      {
        key: 'rarity', label: '稀有度',
        options: [
          { val: '', label: '全部' },
          { val: '5', label: STAR_SVG + '5' },
          { val: '4', label: STAR_SVG + '4' },
          { val: '3', label: STAR_SVG + '3' },
        ],
      },
      {
        key: 'path', label: '命途',
        options: [
          { val: '', label: '全部' },
          ...paths.map((p) => ({ val: p, label: PATH[p] || p, icon: pathIconMap[p] })),
        ],
      },
    ];
  },
  renderCard(item, i) {
    const stars = '★'.repeat(Number(item.rarity) || 5);
    const path = String(item.path || '');
    return `<a class="nk-lc-card" href="${escHtml(item.href)}" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-path="${escHtml(path)}" style="--i:${i}">
      <div class="nk-lc-card__img">
        <img class="lc-avatar" src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
        <div class="nk-sk nk-sk--shimmer nk-lc-card__shimmer" aria-hidden="true"></div>
        <div class="nk-lc-card__sheen-wrap" aria-hidden="true"></div>
        ${item.pathImg ? `<div class="nk-lc-card__badge"><img src="${escHtml(item.pathImg)}" alt="${PATH[path] || path}"></div>` : ''}
        <div class="nk-lc-card__info">
          <span class="nk-lc-card__stars">${stars}</span>
          <span class="nk-lc-card__name">${escHtml(item.name)}</span>
        </div>
      </div>
    </a>`;
  },
};
