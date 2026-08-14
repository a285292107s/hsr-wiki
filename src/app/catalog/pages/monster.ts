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
  /** 列宽与 .nk-mob-grid 的 --nk-grid-min 对齐（130 紧凑档，骨架屏列数同源防 CLS）
      委约：130 是 1024 断点（侧栏 88→148 使内容区窄 60px）保持 6 列的最低门槛，
      高于此值 1023 六列 / 1024 回退五列；改装需验算 1024: floor(852+10)/(min+10) ≥ 6 */
  virtualMinColW: 130,
  /** 信息条两行（名称 + 分类元信息）+ 顶部留白 */
  virtualInfoH: 48,
  /** 手机断点单列行式（与 catalog.css max-width:767px 行式列表对齐）：
     行高 = 行式卡实际高度 63px + cell 底部 GAP 10px = 73 */
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