import { translate } from '../../i18n';
import { escHtml, itemIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalItems, RARITY_NUM_TO_KEY } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

const ITEM_RARITY_MAP: Record<string, { stars: number; label: string; color: string }> = {
  SuperRare: { stars: 5, label: '5★', color: 'var(--gold-400)' },
  VeryRare: { stars: 4, label: '4★', color: 'var(--rarity-4)' },
  Rare: { stars: 3, label: '3★', color: 'var(--rarity-3)' },
  NotNormal: { stars: 2, label: '2★', color: 'var(--rarity-2)' },
  Normal: { stars: 1, label: '1★', color: 'var(--rarity-1)' },
};

/* 物品类别展示名只在词典里（官方无对应词条 ⇒ 词典值是人工撰写，见 tools/fill-ui-messages.py）。
   未登记的枚举回退枚举值本身而不是显示原始词典键——词典缺键时界面仍可读。 */
function labelOfDict(prefix: string, value: string): string {
  const key = `${prefix}.${value}`;
  const got = translate(key);
  return got === key ? value : got;
}
const itemTypeLabel = (v: string): string => labelOfDict('itemType', v);
/** 主类别的 Material / Virtual 与 sub-type 同名同义 ⇒ 复用 itemType.* 键（同一事实只一处） */
const MAIN_TYPE_KEY: Record<string, string> = {
  Material: 'itemType.Material', Virtual: 'itemType.Virtual',
  Usable: 'itemMainType.Usable', Mission: 'itemMainType.Mission',
};
const mainTypeLabel = (mt: string): string => {
  const k = MAIN_TYPE_KEY[mt];
  return k ? translate(k) : mt;
};

const ITEM_TYPE_PREFERRED = [
  'Material', 'Virtual', 'Food', 'Book', 'Gift', 'Mission',
  'AvatarExp', 'EquipmentExp', 'RelicExp', 'Formula',
];

const MAIN_TYPE_ORDER = ['Material', 'Virtual', 'Usable', 'Mission'];

const ITEM_NO_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/>'
  + '<path d="M3.27 6.96 12 12.01l8.73-5.05"/>'
  + '<path d="M12 22.08V12"/></svg>';

export const itemPage: CatalogPageConfig = {
  id: 'item',
  titleKey: 'nav.item',
  subtitle: 'ITEMS',
  searchKey: 'catalog.item.search',
  gridClass: 'nk-cat-grid nk-item-grid',
  cardClass: '.nk-item-card',
  virtualMinColW: 110,
  virtualImgRatio: 1,
  async fetchData() {
    const list = await loadLocalItems();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      items.push({
        id: String(info.id),
        name: info.name,
        subType: info.sub_type || '',
        mainType: info.main_type || '',
        rarity: RARITY_NUM_TO_KEY[info.rarity] || 'Normal',
        icon: itemIconUrl(info.figure_icon),
        /* 物品描述此前**既不显示也不可检索**：2606 条里 1609 条有 `desc`（中位 23 字，99% ≤80 字）、
           2058 条有 `bg_desc`（背景故事），而 10 列 × 127px 的图标栅格放不下它们、卡片也不是链接。
           `searchText` 按成就页的同口径把描述纳入检索域（含背景故事，让「记得描述、记不住名字」
           的查法能命中）；`descTip` 是卡片的悬停提示（优先功能描述，无则退到背景故事）。
           **两个字段都要显式带过来**：`renderCard` 只拿到这里构造的对象，漏带就会静默失效。 */
        searchText: `${info.desc || ''}\n${info.bg_desc || ''}`,
        descTip: String(info.desc || info.bg_desc || ''),
      });
    }
    const rarityOrder: Record<string, number> = { SuperRare: 0, VeryRare: 1, Rare: 2, NotNormal: 3, Normal: 4 };
    items.sort((a, b) => (rarityOrder[String(a.rarity)] ?? 5) - (rarityOrder[String(b.rarity)] ?? 5));
    return items;
  },
  buildFilters(data) {
    const seen = new Set<string>();
    const subTypes: string[] = [];
    for (const item of data) {
      const st = String(item.subType || '');
      if (st && !seen.has(st)) {
        seen.add(st);
        subTypes.push(st);
      }
    }
    subTypes.sort((a, b) => {
      const ia = ITEM_TYPE_PREFERRED.indexOf(a);
      const ib = ITEM_TYPE_PREFERRED.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    const mainOf = new Map<string, string>();
    for (const it of data) {
      const st = String(it.subType || '');
      if (st && !mainOf.has(st)) mainOf.set(st, String(it.mainType || ''));
    }
    const groupOrder = (t: string) => {
      const i = MAIN_TYPE_ORDER.indexOf(mainOf.get(t) ?? '');
      return i === -1 ? MAIN_TYPE_ORDER.length : i;
    };
    const grouped = [...subTypes];
    grouped.sort((a, b) => {
      const ga = groupOrder(a);
      const gb = groupOrder(b);
      if (ga !== gb) return ga - gb;
      const ia = ITEM_TYPE_PREFERRED.indexOf(a);
      const ib = ITEM_TYPE_PREFERRED.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    const groupCount = new Map<string, number>();
    for (const st of grouped) {
      const mt = mainOf.get(st) ?? '';
      groupCount.set(mt, (groupCount.get(mt) || 0) + 1);
    }
    const subTypeOptions = [
      { val: '', labelKey: 'catalog.all' },
      ...grouped.map((st) => {
        const mt = mainOf.get(st) ?? '';
        return {
          val: st,
          label: itemTypeLabel(st),
          group: `${mainTypeLabel(mt)} · ${groupCount.get(mt)}`,
        };
      }),
    ];
    return [
      {
        key: 'rarity', labelKey: 'catalog.filter.rarity',
        options: [
          { val: '', labelKey: 'catalog.all' },
          { val: 'SuperRare', label: '5★' },
          { val: 'VeryRare', label: '4★' },
          { val: 'Rare', label: '3★' },
          { val: 'NotNormal', label: '2★' },
        ],
      },
      { key: 'subType', labelKey: 'catalog.filter.type', options: subTypeOptions },
    ];
  },
  renderCard(item, i) {
    const r = ITEM_RARITY_MAP[String(item.rarity)] || ITEM_RARITY_MAP.Normal;
    const subType = String(item.subType || '');
    const typeName = itemTypeLabel(subType);
    const hasIcon = Boolean(item.icon);
    /* 描述（`descTip`：功能描述优先，无则背景故事）挂在卡根上：栅格里放不下正文，但悬停可读。
       卡上还有名字自己的 title（第 13 轮，长名被截断时可复原），两者作用域不同、互不冲突。 */
    const descTip = String(item.descTip || '').replace(/\s+/g, ' ').trim();
    const tipAttr = descTip ? ` title="${escHtml(descTip)}"` : '';
    const pic = hasIcon
      ? `<img class="nk-item-card__pic" src="${escHtml(item.icon)}"${cdnImgFallbackAttr(String(item.icon))} alt="${escHtml(item.name)}" loading="lazy" onerror="this.classList.add('is-broken')">`
      : '';
    return `<div class="nk-item-card" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-sub-type="${escHtml(subType)}" style="--i:${i};--rarity-color:${r.color}"${tipAttr}>
      <div class="nk-item-card__img">
        ${pic}
        <div class="nk-item-card__noimg" aria-hidden="true">${ITEM_NO_ICON_SVG}</div>
      </div>
      <div class="nk-item-card__info">
        <span class="nk-item-card__name" title="${escHtml(item.name)}">${escHtml(item.name)}</span>
        <span class="nk-item-card__meta">${typeName} · ${r.label}</span>
      </div>
    </div>`;
  },
};
