/** 敌对物种目录页配置 */
import { escHtml, monsterIconUrl } from '../../../lib/format';
import { loadLocalMonsterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

export const monsterPage: CatalogPageConfig = {
  id: 'monster',
  title: '敌对物种',
  searchPlaceholder: '搜索敌对物种...',
  gridClass: 'nk-cat-grid nk-mob-grid',
  cardClass: '.nk-mob-card',
  async fetchData() {
    const list = await loadLocalMonsterList();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/monster/${info.id}`,
        img: monsterIconUrl(info.icon),
      });
    }
    return items;
  },
  filters: [],
  renderCard(item, i) {
    return `<a class="nk-mob-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <div class="nk-mob-card__img">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </div>
      <div class="nk-mob-card__info">
        <span class="nk-mob-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};
