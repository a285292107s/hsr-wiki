/** 角色目录页配置 */
import { PATH } from '../../../lib/constants';
import { escHtml, avatarShopIconUrl, elementIconUrl, pathIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalCharacterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { STAR_SVG } from './shared';

/** 属性图标 URL 键（小写） → 中文名 */
const ELEM_NAMES: Record<string, string> = {
  fire: '火', ice: '冰', thunder: '雷', wind: '风',
  quantum: '量子', imaginary: '虚数', physical: '物理',
};

export const characterPage: CatalogPageConfig = {
  id: 'character',
  title: '角色图鉴',
  searchPlaceholder: '搜索角色...',
  gridClass: 'nk-cat-grid',
  cardClass: '.nk-cat-card',
  async fetchData() {
    const list = await loadLocalCharacterList();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const element = info.element.toLowerCase();
      const path = info.path.toLowerCase();
      const id = String(info.id);
      items.push({
        id,
        name: info.name,
        href: `/character/${id}`,
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
        key: 'path', label: '命途',
        options: [
          { val: '', label: '全部' },
          ...paths.map((p) => ({ val: p, label: PATH[p] || p, icon: pathIconMap[p] })),
        ],
      },
      {
        key: 'element', label: '属性',
        options: [
          { val: '', label: '全部' },
          ...elems.map((e) => ({ val: e, label: ELEM_NAMES[e] || e, icon: elemIconMap[e] })),
        ],
      },
      {
        key: 'rarity', label: '稀有度',
        options: [
          { val: '', label: '全部' },
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
    return `<a class="nk-cat-card" href="${escHtml(item.href)}" data-element="${escHtml(element)}" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-path="${escHtml(path)}" style="--i:${i}">
    <div class="nk-cat-card__img">
      <img class="avatar" src="${escHtml(item.avatar)}"${cdnImgFallbackAttr(String(item.avatar || ''))} alt="${escHtml(item.name)}" loading="lazy">
      <div class="nk-cat-card__icons">
        ${item.elemImg ? `<img class="nk-cat-card__elem" src="${escHtml(item.elemImg)}" alt="${ELEM_NAMES[element] || element}">` : ''}
        ${item.pathImg ? `<img class="nk-cat-card__path" src="${escHtml(item.pathImg)}" alt="${PATH[path] || path}">` : ''}
      </div>
      <div class="nk-cat-card__info">
        <span class="nk-cat-card__stars">${stars}</span>
        <span class="nk-cat-card__name">${escHtml(item.name)}</span>
      </div>
    </div>
  </a>`;
  },
};
