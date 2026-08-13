/** 敌对物种目录页配置 */
import { escHtml, monsterIconUrl } from '../../../lib/format';
import { loadLocalMonsterList } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

/** 怪物分类（converter monsters.py _monster_type 推导的粗粒度类型）→ 中文名 */
const MON_TYPE: Record<string, string> = {
  BOSS: '首领', ELITE: '精英', MINION: '喽啰',
};

export const monsterPage: CatalogPageConfig = {
  id: 'monster',
  title: '敌对物种',
  subtitle: 'HOSTILE SPECIES',
  searchPlaceholder: '搜索敌对物种...',
  gridClass: 'nk-cat-grid nk-mob-grid',
  /** 关闭 3D 倾斜（档案式卡片，hover 仅立绘缩放 + 名称强调） */
  cardClass: '',
  /** 图窗比例 4:5（纵深档案感）；引擎 virtualImgRatio 为高宽比，与 CSS aspect-ratio 4:5 的高宽比语义相反 */
  virtualImgRatio: 5 / 4,
  /** 列宽与 .nk-mob-grid 的 --nk-grid-min: 140px 对齐（放宽至 140 增加留白呼吸） */
  virtualMinColW: 140,
  /** 信息条两行（名称 + 分类元信息）+ 顶部留白 */
  virtualInfoH: 48,
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