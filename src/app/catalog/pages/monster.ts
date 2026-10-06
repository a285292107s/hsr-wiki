import { ELEM } from '../../../lib/constants';
import { elementIconUrl, escHtml, monsterIconUrl } from '../../../lib/format';
import { groupMonsterFamilies } from '../../../lib/monster-family';
import { loadLocalMonsterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

const MON_TYPE: Record<string, string> = {
  BOSS: '首领', ELITE: '精英', MINION: '喽啰',
};

/** 弱点元素固定 7 项（不按数据现取：某属性当批无弱点怪时选项会消失，筛选栏会跳） */
const WEAK_ELEMS = ['Physical', 'Fire', 'Ice', 'Thunder', 'Wind', 'Quantum', 'Imaginary'];

export const monsterPage: CatalogPageConfig = {
  id: 'monster',
  title: '敌对物种',
  subtitle: 'HOSTILE SPECIES',
  searchPlaceholder: '搜索敌对物种、弱点或阵营...',
  gridClass: 'nk-cat-grid nk-mob-grid',
  cardClass: '',
  virtualImgRatio: 5 / 4,
  virtualMinColW: 130,
  virtualInfoH: 70,
  virtualMobileRowH: 82,
  async fetchData() {
    const list = await loadLocalMonsterList();
    const rows = list.filter((info) => info.name);
    /* 同族（同名 + 同卡面图标）里的序号：632 条里 392 条有同族兄弟，卡面完全一样，
       没有序号时用户不知道「这张是 4 档中的第几档」，也不知道还有 3 张同款。 */
    const variantOf = new Map<string, { index: number; count: number }>();
    for (const bucket of groupMonsterFamilies(rows).values()) {
      bucket.forEach((row, i) => variantOf.set(String(row.id), { index: i + 1, count: bucket.length }));
    }
    const items: CatalogItem[] = [];
    for (const info of rows) {
      const type = info.type || '';
      const weak = info.weak || [];
      const camp = info.camp || '';
      const weakNames = weak.map((e) => ELEM[e] || e);
      const variant = variantOf.get(String(info.id));
      const variantCount = variant?.count ?? 1;
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/monster/${info.id}`,
        img: monsterIconUrl(info.icon),
        type,
        typeLabel: MON_TYPE[type] || '',
        weak,
        weakNames,
        camp,
        variantIndex: variant?.index ?? 1,
        variantCount,
        /* 检索域：弱点属性名与阵营（默认只搜名称，「冰弱点的怪」是最高频诉求却搜不出来）；
           与卡面可复原文本同源，供空态/截断断言回溯 */
        searchText: [...weakNames, camp].filter(Boolean).join(' '),
      });
    }
    return items;
  },
  buildFilters(data) {
    const types = [...new Set(data.map((c) => String(c.type || '')).filter(Boolean))];
    const camps = [...new Set(data.map((c) => String(c.camp || '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    return [
      {
        key: 'type', label: '分类',
        options: [
          { val: '', label: '全部' },
          ...types.map((t) => ({ val: t, label: MON_TYPE[t] || t })),
        ],
      },
      {
        key: 'weak', label: '弱点',
        options: [
          { val: '', label: '全部' },
          ...WEAK_ELEMS.map((e) => ({ val: e, label: ELEM[e] || e, icon: elementIconUrl(e) })),
        ],
      },
      {
        key: 'camp', label: '阵营',
        options: [
          { val: '', label: '全部' },
          ...camps.map((c) => ({ val: c, label: c })),
        ],
      },
    ];
  },
  renderCard(item, i) {
    const typeKey = String(item.type || '');
    const typeLabel = String(item.typeLabel || '');
    const weakNames = (item.weakNames as string[] | undefined) ?? [];
    const weakKeys = (item.weak as string[] | undefined) ?? [];
    const camp = String(item.camp || '');
    const variantCount = Number(item.variantCount) || 1;
    const variantIndex = Number(item.variantIndex) || 1;
    const variantText = variantCount > 1 ? `变体 ${variantIndex}/${variantCount}` : '';
    const weakHtml = weakKeys.length
      ? weakKeys.map((e, k) => `<img src="${escHtml(elementIconUrl(e))}" alt="${escHtml(weakNames[k] || e)}" loading="lazy">`).join('')
      : `<span class="nk-mob-card__none">无弱点</span>`;
    /* 卡级 title：一是触屏/截断时那几行文本的永久复原手段（`layout-catalog` 断言：任何被
       nowrap+ellipsis 截掉的叶子自身或 5 层祖先要有含该文本的 title/aria-label），
       二是「这只怪弱什么、哪来的、第几档」在一处说全。 */
    const title = [
      item.name,
      weakNames.length ? `弱点 ${weakNames.join('/')}` : '无弱点',
      typeLabel,
      camp,
      variantText,
    ].filter(Boolean).join(' · ');
    return `<a class="nk-mob-card" data-type="${escHtml(typeKey)}" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" title="${escHtml(title)}" style="--i:${i}">
      <span class="nk-mob-card__fig">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </span>
      <span class="nk-mob-card__info">
        <span class="nk-mob-card__name">${escHtml(item.name)}</span>
        <span class="nk-mob-card__weak">${weakHtml}${camp ? `<span class="nk-mob-card__camp">${escHtml(camp)}</span>` : ''}</span>
        <span class="nk-mob-card__meta">
          <span class="nk-mob-card__type">${escHtml(typeLabel || '未知')}</span>
          ${variantText ? `<span class="nk-mob-card__var">${escHtml(variantText)}</span>` : ''}
        </span>
      </span>
    </a>`;
  },
};
