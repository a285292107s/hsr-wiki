
import { pathLabel } from '../../../lib/enum-labels';
import { activeHref } from '../../../lib/i18n/active';
import { escHtml, avatarShopIconUrl, avatarRoundIconUrl, elementIconUrl, pathIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalCharacterList } from '../../../services/api';
import { getSavedTrailblazerGender, isTrailblazerId, trailblazerGenderOfId } from '../../../lib/trailblazer';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { STAR_SVG } from './shared';

const ELEM_NAMES: Record<string, string> = {
  fire: 'Fire', ice: 'Ice', thunder: 'Thunder', wind: 'Wind',
  quantum: 'Quantum', imaginary: 'Imaginary', physical: 'Physical',
};

export const characterPage: CatalogPageConfig = {
  id: 'character',
  titleKey: 'catalog.character.title',
  subtitle: 'CHARACTER INDEX',
  searchKey: 'catalog.character.search',
  gridClass: 'nk-idx-grid',
  async fetchData() {
    const list = await loadLocalCharacterList();
    // 开拓者按设置形态过滤（8xxx 奇数=男、偶数=女），仅展示对应性别
    const gender = getSavedTrailblazerGender();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      if (isTrailblazerId(info.id) && trailblazerGenderOfId(info.id) !== gender) continue;
      const element = info.element.toLowerCase();
      const path = info.path.toLowerCase();
      const id = String(info.id);
      items.push({
        id,
        name: info.name,
        href: activeHref(`/character/${id}`),
        avatar: avatarShopIconUrl(id),
        elemImg: elementIconUrl(element),
        pathImg: pathIconUrl(path),
        element,
        path,
        rarity: info.rarity,
      });
    }
    items.sort((a, b) => {
      const aTrailblazer = Number(a.id) >= 8000;
      const bTrailblazer = Number(b.id) >= 8000;
      if (aTrailblazer !== bTrailblazer) return aTrailblazer ? 1 : -1;
      return Number(b.id) - Number(a.id);
    });
    return items;
  },
  buildFilters(data) {
    const pathIconMap: Record<string, string> = {};
    const elemIconMap: Record<string, string> = {};
    data.forEach((c) => {
      if (c.path && c.pathImg) pathIconMap[String(c.path)] = String(c.pathImg);
      if (c.element && c.elemImg) elemIconMap[String(c.element)] = String(c.elemImg);
    });
    const paths = [...new Set(data.map((c) => String(c.path || '')).filter(Boolean))];
    const elems = [...new Set(data.map((c) => String(c.element || '')).filter(Boolean))];
    return [
      {
        key: 'path', labelKey: 'catalog.filter.path',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...paths.map((p) => ({ val: p, label: pathLabel(p), icon: pathIconMap[p] })),
        ],
      },
      {
        key: 'element', labelKey: 'catalog.filter.element',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...elems.map((e) => ({ val: e, label: ELEM_NAMES[e] || e, icon: elemIconMap[e] })),
        ],
      },
      {
        key: 'rarity', labelKey: 'catalog.filter.rarity',
        options: [
          { val: '', labelKey: 'catalog.all' },
          { val: '5', label: STAR_SVG + '5' },
          { val: '4', label: STAR_SVG + '4' },
        ],
      },
    ];
  },
  renderCard(item, i) {
    const stars = '★'.repeat(Number(item.rarity) || 5);
    const element = String(item.element || '');
    const path = String(item.path || '');
    const avatarItem = String(item.avatar || '');
    const roundSrc = avatarRoundIconUrl(String(item.id));
    const avatar = roundSrc
      ? `<picture><source media="(max-width: 767px)" srcset="${escHtml(roundSrc)}"><img src="${escHtml(avatarItem)}"${cdnImgFallbackAttr(avatarItem)} alt="${escHtml(item.name)}" loading="lazy"></picture>`
      : `<img src="${escHtml(avatarItem)}"${cdnImgFallbackAttr(avatarItem)} alt="${escHtml(item.name)}" loading="lazy">`;
    return `<a class="nk-idx-card" href="${escHtml(item.href)}" data-rarity="${escHtml(item.rarity)}" style="--i:${i}">
    <span class="nk-idx-card__portrait">
      ${avatar}
    </span>
    <span class="nk-idx-card__body">
      <span class="nk-idx-card__name-row">
        <span class="nk-idx-card__name">${escHtml(item.name)}</span>
        <span class="nk-idx-card__stars" aria-hidden="true">${stars}</span>
      </span>
      <span class="nk-idx-card__meta">
        ${item.elemImg ? `<img class="nk-idx-card__icon" src="${escHtml(item.elemImg)}" alt="">` : ''}
        <span>${ELEM_NAMES[element] || element}</span>
        <span class="nk-idx-card__sep">·</span>
        ${item.pathImg ? `<img class="nk-idx-card__icon" src="${escHtml(item.pathImg)}" alt="">` : ''}
        <span>${pathLabel(path)}</span>
      </span>
    </span>
  </a>`;
  },
};
