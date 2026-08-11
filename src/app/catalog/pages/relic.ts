/** 遗器目录页配置 */
import { escHtml, itemIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalRelicSets } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

export const relicPage: CatalogPageConfig = {
  id: 'relic',
  title: '遗器图鉴',
  searchPlaceholder: '搜索遗器...',
  gridClass: 'nk-cat-grid nk-relic-grid',
  cardClass: '.nk-relic-card',
  async fetchData() {
    const list = await loadLocalRelicSets();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const reqNums = Array.isArray(info.require_num) ? info.require_num : [];
      const setType = reqNums.includes(4) ? '4' : '2';
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/relic/${info.id}`,
        img: itemIconUrl(info.icon),
        set_type: setType,
        // 遗器独有语义标签：隧洞套装（4 件套）/ 位面饰品（2 件套）
        set_tag: setType === '4' ? '4件套' : '2件套',
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
    const tag = typeof item.set_tag === 'string' ? item.set_tag : '';
    return `<a class="nk-relic-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" data-set="${escHtml(String(item.set_type))}" style="--i:${i}">
      <div class="nk-relic-card__plate">
        <img class="nk-relic-card__img" src="${escHtml(item.img)}"${cdnImgFallbackAttr(String(item.img || ''))} alt="${escHtml(item.name)}" loading="lazy">
        ${tag ? `<span class="nk-relic-card__tag">${escHtml(tag)}</span>` : ''}
      </div>
      <div class="nk-relic-card__info">
        <span class="nk-relic-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};
