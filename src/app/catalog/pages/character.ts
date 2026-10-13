
import { elemLabel, pathLabel } from '../../../lib/enum-labels';
import { activeHref } from '../../../lib/i18n/active';
import { escHtml, avatarShopIconUrl, elementIconUrl, pathIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalCharacterList } from '../../../services/api';
import { getSavedTrailblazerGender, isTrailblazerId, trailblazerGenderOfId } from '../../../lib/trailblazer';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { STAR_SVG } from './shared';

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
          ...elems.map((e) => ({ val: e, label: elemLabel(e), icon: elemIconMap[e] })),
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
    /* 稀有度飘带内容 = `★N`（不是 `★`×N）：带身只有一条、宽度随卡等比缩放，
       5 个 `★` 在 116px 卡上会挤成噪点且必然越出带身；数字是无语言差异的通用符号，
       在 13 种语言下宽度几乎不变（`★` 与数字都取自 HUD 字体，见 `__stars-txt`）。 */
    const starLabel = `★${Number(item.rarity) || 5}`;
    const element = String(item.element || '');
    const path = String(item.path || '');
    const avatarItem = String(item.avatar || '');
    /* 单图源：`<picture>` 双源（手机 `<source media="(max-width:767px)">` 切圆头像）
       随手机档行式头像卡形态一并退场——卡现在是 3:4 立绘网格卡，128×128 的侧头像
       被拉进 3/4 框必然糊（桌面卡本来就是商店立绘 376×512）。 */
    const avatar = `<img src="${escHtml(avatarItem)}"${cdnImgFallbackAttr(avatarItem)} alt="${escHtml(item.name)}" loading="lazy">`;
    /* 卡名放宽为 2 行后仍可能被 clamp 省略（P1：名字是最长字段），故把全文挂到卡根 `title`
       上——触屏没有 hover，没有它就等于那段字永久读不到（e2e/layout-catalog.spec.ts:74-127
       与 e2e/layout-i18n-overflow.spec.ts 的「截断必须有复原手段」判据）。 */
    return `<a class="nk-idx-card" href="${escHtml(item.href)}" data-rarity="${escHtml(item.rarity)}" title="${escHtml(item.name)}" style="--i:${i}">
    <span class="nk-idx-card__portrait">
      ${avatar}
      <span class="nk-idx-card__stars" aria-hidden="true"><span class="nk-idx-card__stars-txt">${starLabel}</span></span>
    </span>
    <span class="nk-idx-card__body">
      <span class="nk-idx-card__name-row">
        <span class="nk-idx-card__name">${escHtml(item.name)}</span>
      </span>
      <span class="nk-idx-card__meta">
        <span class="nk-idx-card__tag">
          ${item.elemImg ? `<img class="nk-idx-card__icon" src="${escHtml(item.elemImg)}" alt="">` : ''}
          <span class="nk-idx-card__tag-text">${escHtml(elemLabel(element))}</span>
        </span>
        <span class="nk-idx-card__tag">
          ${item.pathImg ? `<img class="nk-idx-card__icon" src="${escHtml(item.pathImg)}" alt="">` : ''}
          <span class="nk-idx-card__tag-text">${escHtml(pathLabel(path))}</span>
        </span>
      </span>
    </span>
  </a>`;
  },
};
