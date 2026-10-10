import { escHtml, itemIconUrl } from '../../../lib/format';
import { activeHref } from '../../../lib/i18n/active';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalRelicSets } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { translate } from '../../i18n';

/** 模板与脚本统一走词典 */
const t = translate;

export const relicPage: CatalogPageConfig = {
  id: 'relic',
  titleKey: 'catalog.relic.title',
  subtitle: 'RELICS',
  searchKey: 'catalog.relic.search',
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
        href: activeHref(`/relic/${info.id}`),
        img: itemIconUrl(info.icon),
        set_type: setType,
        set_tag: t('relic.setPieces', { n: setType === '4' ? 4 : 2 }),
      });
    }
    items.sort((a, b) => Number(b.id) - Number(a.id));
    return items;
  },
  filters: [
    {
      key: 'set_type', labelKey: 'catalog.filter.setType',
      options: [
        { val: '', labelKey: 'catalog.all' },
        { val: '4', labelKey: 'catalog.option.set4Cavern' },
        { val: '2', labelKey: 'catalog.option.set2Planar' },
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
