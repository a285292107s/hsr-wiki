import { escHtml, monsterIconUrl } from '../../../lib/format';
import { loadLocalMonsterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

const MON_TYPE: Record<string, string> = {
  BOSS: '首领', ELITE: '精英', MINION: '喽啰',
};

export const monsterPage: CatalogPageConfig = {
  id: 'monster',
  title: '敌对物种',
  subtitle: 'HOSTILE SPECIES',
  searchPlaceholder: '搜索敌对物种...',
  gridClass: 'nk-cat-grid nk-mob-grid',
  cardClass: '',
  virtualImgRatio: 5 / 4,
  virtualMinColW: 130,
  virtualInfoH: 48,
  virtualMobileRowH: 73,
  async fetchData() {
    const list = await loadLocalMonsterList();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const type = info.type || '';
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/monster/${info.id}`,
        img: monsterIconUrl(info.icon),
        type,
        typeLabel: MON_TYPE[type] || '',
      });
    }
    return items;
  },
  buildFilters(data) {
    const types = [...new Set(data.map((c) => String(c.type || '')).filter(Boolean))];
    return [
      {
        key: 'type', label: '分类',
        options: [
          { val: '', label: '全部' },
          ...types.map((t) => ({ val: t, label: MON_TYPE[t] || t })),
        ],
      },
    ];
  },
  renderCard(item, i) {
    const typeKey = String(item.type || '');
    const typeLabel = String(item.typeLabel || '');
    return `<a class="nk-mob-card" data-type="${escHtml(typeKey)}" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <span class="nk-mob-card__fig">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </span>
      <span class="nk-mob-card__info">
        <span class="nk-mob-card__name">${escHtml(item.name)}</span>
        <span class="nk-mob-card__type">${escHtml(typeLabel || '未知')}</span>
      </span>
    </a>`;
  },
};