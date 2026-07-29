/** 遗器目录页配置 */
import { escHtml, itemIconUrl } from '../../../lib/format';
import { loadLocalRelicSets } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

export const relicPage: CatalogPageConfig = {
  id: 'relic',
  title: '遗器',
  searchPlaceholder: '搜索遗器...',
  gridClass: 'nk-cat-grid nk-relic-grid',
  cardClass: '.nk-relic-card',
  async fetchData() {
    const list = await loadLocalRelicSets();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const reqNums = Array.isArray(info.require_num) ? info.require_num : [];
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/relic/${info.id}`,
        img: itemIconUrl(info.icon),
        set_type: reqNums.includes(4) ? '4' : '2',
      });
    }
    // 默认按 ID 降序：新遗器（ID 大）排在前面
    items.sort((a, b) => Number(b.id) - Number(a.id));
    return items;
  },
  filters: [
    {
      key: 'set_type', label: '套装类型',
      options: [
        { val: '', label: '全部' },
        { val: '4', label: '4件套 · 隧洞' },
        { val: '2', label: '2件套 · 位面' },
      ],
    },
  ],
  renderCard(item, i) {
    return `<a class="nk-relic-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <div class="nk-relic-card__img">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </div>
      <div class="nk-relic-card__info">
        <span class="nk-relic-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};
