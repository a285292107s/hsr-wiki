
import { elemLabel } from '../../../lib/enum-labels';
import { elementIconUrl, escHtml, monsterIconUrl } from '../../../lib/format';
import { activeHref } from '../../../lib/i18n/active';
import { groupMonsterFamilies } from '../../../lib/monster-family';
import { labelText } from '../../../lib/label-translator';
import { loadLocalMonsterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { translate } from '../../i18n';

const t = translate;

const RANK_KEY: Record<string, string> = {
  BOSS: 'monster.rank.boss',
  ELITE: 'monster.rank.elite',
  MINION: 'monster.rank.minion',
};

const rankLabel = (rank: string): string => (RANK_KEY[rank] ? labelText(RANK_KEY[rank]) : rank);

const WEAK_ELEMS = ['Physical', 'Fire', 'Ice', 'Thunder', 'Wind', 'Quantum', 'Imaginary'];

export const monsterPage: CatalogPageConfig = {
  id: 'monster',
  titleKey: 'catalog.monster.title',
  subtitle: 'HOSTILE SPECIES',
  searchKey: 'catalog.monster.search',
  gridClass: 'nk-cat-grid nk-mob-grid',
  virtualImgRatio: 5 / 4,
  virtualMinColW: 130,
  virtualInfoH: 70,
  virtualMobileRowH: 82,
  async fetchData() {
    const list = await loadLocalMonsterList();
    const rows = list.filter((info) => info.name);
    const variantOf = new Map<string, { index: number; count: number }>();
    for (const bucket of groupMonsterFamilies(rows).values()) {
      bucket.forEach((row, i) => variantOf.set(String(row.id), { index: i + 1, count: bucket.length }));
    }
    const items: CatalogItem[] = [];
    for (const info of rows) {
      const type = info.type || '';
      const weak = info.weak || [];
      const camp = info.camp || '';
      const weakNames = weak.map((e) => elemLabel(e));
      const variant = variantOf.get(String(info.id));
      const variantCount = variant?.count ?? 1;
      items.push({
        id: String(info.id),
        name: info.name,
        href: activeHref(`/monster/${info.id}`),
        img: monsterIconUrl(info.icon),
        type,
        typeLabel: rankLabel(type),
        weak,
        weakNames,
        camp,
        variantIndex: variant?.index ?? 1,
        variantCount,
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
        key: 'type', labelKey: 'catalog.filter.category',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...types.map((t) => ({ val: t, label: rankLabel(t) })),
        ],
      },
      {
        key: 'weak', labelKey: 'catalog.filter.weak',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...WEAK_ELEMS.map((e) => ({ val: e, label: elemLabel(e), icon: elementIconUrl(e) })),
        ],
      },
      {
        key: 'camp', labelKey: 'catalog.filter.camp',
        options: [
          { val: '', labelKey: 'catalog.all' },
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
    const variantText = variantCount > 1
    ? t('mob.badge.variant', { i: variantIndex, n: variantCount })
    : '';
    const weakHtml = weakKeys.length
      ? weakKeys.map((e, k) => `<img src="${escHtml(elementIconUrl(e))}" alt="${escHtml(weakNames[k] || e)}" loading="lazy">`).join('')
      : `<span class="nk-mob-card__none">${escHtml(t('mob.noWeak'))}</span>`;
    const title = [
      item.name,
      weakNames.length ? t('mob.card.weak', { list: weakNames.join('/') }) : t('mob.noWeak'),
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
          <span class="nk-mob-card__type">${escHtml(typeLabel || t('common.unknown'))}</span>
          ${variantText ? `<span class="nk-mob-card__var">${escHtml(variantText)}</span>` : ''}
        </span>
      </span>
    </a>`;
  },
};
