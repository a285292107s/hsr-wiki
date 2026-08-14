/** 角色目录页配置 */
import { PATH } from '../../../lib/constants';
import { escHtml, avatarShopIconUrl, avatarRoundIconUrl, elementIconUrl, pathIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalCharacterList } from '../../../services/api';
import { getSavedTrailblazerGender, isTrailblazerId, trailblazerGenderOfId } from '../../../lib/trailblazer';
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
  subtitle: 'CHARACTER INDEX',
  searchPlaceholder: '搜索角色...',
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
    /* 双源 picture：手机（≤767px，与 catalog.css 手机断点一致）用 127px 圆头像压缩体积，
       桌面保持 avatarshopicon 半身立绘；浏览器仅加载匹配 media 的 source，无双下载 */
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
        <span>${PATH[path] || path}</span>
      </span>
    </span>
  </a>`;
  },
};
