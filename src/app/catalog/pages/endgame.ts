/** 终局内容目录页配置（四模式合并，目录默认按玩法分 4 列：紧凑赛季行 + 列头） */
import { OFFICIAL_ICON_BASE } from '../../../lib/constants';
import { escHtml, stripAllTags } from '../../../lib/format';
import { spriteOutputToRel } from '../../../services/cdn/jsdelivr';

/**
 * 终局官方素材 URL（jsDelivr 加速自建 fork GitHub 源，基址统一收口 OFFICIAL_ICON_BASE，跟 main 分支最新）。
 * 白名单 = 语义闸门：仅放行「赛季主题/页签/横幅类」路径，排除开关图/场景背景等 UI 素材；
 * 全部前缀均实测在 StarRailTextures 仓库可命中：
 * - TabIcon/**            → tabicon/**（虚构 ChallengeThemeTabIcon / 末日 ChallengeBossTabIcon）
 * - ChallengePeak/**      → challengepeak/**（异相仲裁每期 ThemeIconPicPath）
 * - UI/ChallengeBoss/**   → ui/challengeboss/**（玩法级默认 QuestTabImg）
 * - DailyMission/Banner/** → dailymission/banner/**（赛季横幅 ChallengeThemeBanner/BossBanner/PeakPanelBanner）
 * - ChallengeTheme/**     → challengetheme/**（虚构主题素材 ThemeIcon/ThemePic/ThemeBg）
 * - ChallengeBoss/**      → challengeboss/**（末日主题图标 ChallengeBossIcon_30xx）
 * - Quest/TabIcon/**      → quest/tabicon/**（海报页签 BtnChallengeStoryAlternation/BtnChallengeBoss/BtnChallengePeak）
 * - Abyss/**              → abyss/**（忘却之庭场景背景 Abyss/UI3D_SceneBg，仅 Hero 背景用）
 * 未列入的（如忘却之庭 AbyssSwitch 共用开关图 / Quest 其他素材）返回空串不渲染；
 * 路径映射复用 cdn 层通用规则 spriteOutputToRel（目录段小写、文件名保留）。
 * 方案 A 转存 nanoka 后，将函数替换为 cdnUri('tabicon', ...) 即可，消费方无需改动。
 */
const ART_PREFIXES = [
  'TabIcon',
  'ChallengePeak',
  'UI/ChallengeBoss',
  'DailyMission/Banner',
  'ChallengeTheme',
  'ChallengeBoss',
  'Quest/TabIcon',
  'Abyss',
] as const;
/** 玩法级默认图标白名单（modeDefaultArtUrl / 模式筛选选项 icon 专用）：在 ART_PREFIXES 基础上
 *  放行忘却之庭专属/通用开关图 UI/Abyss/Process/TypeIcon（常驻关卡 W01/W02、赛季 Loop）——
 *  装饰素材函数（banner/poster/hero bg）保持原白名单不放行开关图 */
const TAB_ART_PREFIXES = [
  ...ART_PREFIXES,
  'UI/Abyss',
] as const;

/** 终局官方素材 URL（白名单语义闸门 + 目录段小写通用规则；白名单外返回空串不渲染） */
function endgameArtUrl(path: string | undefined, prefixes: readonly string[]): string {
  if (!path) return '';
  if (!prefixes.some((p) => path.startsWith(`SpriteOutput/${p}/`))) return '';
  return `${OFFICIAL_ICON_BASE}/${spriteOutputToRel(path)}`;
}

/** 赛季横幅 URL（arts.theme_banner：虚构/末日/忘却之庭每赛季宣传 BANNER，Hero 装饰） */
export function seasonBannerUrl(arts?: { theme_banner?: string } | null): string {
  return endgameArtUrl(arts?.theme_banner, ART_PREFIXES);
}

/** 赛季主题图标 URL（arts.theme_icon：虚构 ThemeIcon_20xx / 末日 ChallengeBossIcon_30xx） */
export function seasonThemeIconUrl(arts?: { theme_icon?: string } | null): string {
  return endgameArtUrl(arts?.theme_icon, ART_PREFIXES);
}

/** 海报页签按钮图 URL（arts.poster_tab：虚构/末日/仲裁 Btn* 扁长按钮 260×92，相邻赛季导航完整比例展示） */
export function seasonPosterTabUrl(arts?: { poster_tab?: string } | null): string {
  return endgameArtUrl(arts?.poster_tab, ART_PREFIXES);
}

/**
 * 赛季 Hero 背景 URL（按模式取唯一大图：maze=background 场景背景 2048×1024 /
 * story=theme_bg 海报背景 2048×1152 / peak=handbook_banner 图鉴横幅 1103×737；
 * boss 无大图字段返回空串保持透明底）。低透明度铺底，保证文字对比度。
 */
export function seasonHeroBgUrl(arts?: { background?: string; theme_bg?: string; handbook_banner?: string } | null): string {
  return endgameArtUrl(arts?.background, ART_PREFIXES)
    || endgameArtUrl(arts?.theme_bg, ART_PREFIXES)
    || endgameArtUrl(arts?.handbook_banner, ART_PREFIXES);
}
import {
  loadLocalMazeCatalog, loadLocalStoryCatalog, loadLocalBossCatalog, loadLocalPeakCatalog,
} from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import type { MazeCatalogDb, MazeListEntry } from '../../../services/types';

/** 赛季状态：依据 begin/end 日期推导；无日期信息时返回"未知"（与原站一致） */
export function mazeStatus(info: MazeListEntry): string {
  const parse = (s: string | undefined): number | null => {
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  };
  const start = parse(info.live_begin) ?? parse(info.begin);
  const end = parse(info.live_end) ?? parse(info.end);
  const now = Date.now();
  if (start != null && now < start) return '未开始';
  if (end != null && now > end) return '已结束';
  if (start != null || end != null) return '进行中';
  return '未知';
}

/** 格式化日期区间（YYYY.MM.DD – MM.DD） */
export function mazeDateRange(info: MazeListEntry): string {
  const fmt = (s: string | undefined): string | null => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const start = fmt(info.live_begin) ?? fmt(info.begin);
  const end = fmt(info.live_end) ?? fmt(info.end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  return '';
}

/** 状态 → CSS 修饰类（目录页卡片与详情页 Hero 共用） */
export const MAZE_STATUS_CLASS: Record<string, string> = {
  '进行中': 'live',
  '已结束': 'ended',
  '未开始': 'upcoming',
  '未知': 'unknown',
};

/** 模式徽记（24×24 线性图标，与四模式领域色配套使用） */
const EMBLEMS: Record<string, string> = {
  // 忘却之庭 · 记忆之环（同心环 + 中心点，如记忆的回响）
  maze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
  // 虚构叙事 · 卷宗（对开书页）
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.2A2.2 2.2 0 0 1 6.2 4H12v16H6.2A2.2 2.2 0 0 1 4 17.8V6.2z"/><path d="M20 6.2A2.2 2.2 0 0 0 17.8 4H12v16h5.8a2.2 2.2 0 0 0 2.2-2.2V6.2z"/></svg>',
  // 末日幻影 · 湮灭星芒（四角星芒，灾厄降临）
  boss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z"/></svg>',
  // 异相仲裁 · 裁决天秤（衡量异象之平衡）
  peak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v17"/><path d="M8.5 20.5h7"/><path d="M4.5 6h15"/><path d="M6.4 6l-2.2 4a2.6 2.6 0 0 0 4.6 0L6.6 6"/><path d="M17.6 6l-2.2 4a2.6 2.6 0 0 0 4.6 0l-2.4-4"/></svg>',
};

/** 终局模式元信息（模式筛选选项 + 卡片徽记共用，单一事实来源） */
export interface EndgameMode {
  /** 模式键（data-mode / 筛选值） */
  key: string;
  label: string;
  en: string;
  /** 模式徽记（内联 SVG） */
  emblem: string;
  /** 玩法入口图（SpriteOutput 路径：ChallangeGeneralConfig TabImgPath 三模 + 仲裁人工延展
   *  Img4；筛选选项 icon 消费，经 endgameArtUrl + UI/ChallengeBoss 白名单解析） */
  icon?: string;
}

export const ENDGAME_MODES: EndgameMode[] = [
  { key: 'maze', label: '忘却之庭', en: 'FORGOTTEN HALL', emblem: EMBLEMS.maze, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png' },
  { key: 'story', label: '虚构叙事', en: 'PURE FICTION', emblem: EMBLEMS.story, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png' },
  { key: 'boss', label: '末日幻影', en: 'APOCALYPSE', emblem: EMBLEMS.boss, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg3.png' },
  { key: 'peak', label: '异相仲裁', en: 'ANOMALY', emblem: EMBLEMS.peak, icon: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg4.png' },
];

/** 玩法级默认图标 URL（模式统一用玩法入口默认图：抛弃每季 `arts.tab` 页签图——
 *  4 类玩法图标恒定，不随新赛季迭代而漂移，规避 jsDelivr fork 冻结后的新赛季破图残留）。
 *  数据源 = ENDGAME_MODES[].icon（模式筛选选项 icon 同源，单一事实来源；peak 为人工延展 Img4）。
 *  经 endgameArtUrl + TAB_ART_PREFIXES 白名单解析；空串由调用方降级徽记。
 *  目录卡（renderCard 赛季图标）与详情页 Hero 铭牌共用。 */
export function modeDefaultArtUrl(modeKey: string): string {
  const mode = ENDGAME_MODES.find((m) => m.key === modeKey);
  return mode?.icon ? endgameArtUrl(mode.icon, TAB_ART_PREFIXES) : '';
}

/** 赛季排序：排期开始时间降序（最新赛季在前）；无排期按 ID 降序垫底 */
function bySeasonDesc(a: CatalogItem, b: CatalogItem): number {
  const ta = String(a.liveBegin || '');
  const tb = String(b.liveBegin || '');
  if (ta && tb && ta !== tb) return ta < tb ? 1 : -1;
  if (ta) return -1;
  if (tb) return 1;
  return Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, ''));
}

/**
 * 终局内容单页：四模式数据合并，模式身份经筛选面板切换（原 Tab 子导航移除）。
 * 卡片共享星际档案布局，统一主色（--primary），模式身份由筛选面板与赛季图标承载。
 */
export const endgamePage: CatalogPageConfig = {
  id: 'endgame',
  title: '终局内容',
  searchPlaceholder: '搜索赛季...',
  gridClass: 'nk-cat-grid nk-eg-grid',
  cardClass: '.nk-eg-card',
  /* 终局目录专属样式（nk-eg-card 等），随路由并行加载 */
  styles: [() => import('../../../../src/styles/endgame.css')],
  async fetchData() {
    const [maze, story, boss, peak] = await Promise.all([
      loadLocalMazeCatalog(), loadLocalStoryCatalog(), loadLocalBossCatalog(), loadLocalPeakCatalog(),
    ]);
    const items: CatalogItem[] = [];
    /** 赛季条目公共字段（模式身份 + 排期日期 + 主力弱点 + 增益/敌方/星启/关卡组成）。
     *  数据源为 *.catalog.json 轻量条目：仅含目录卡字段，大幅削减目录首载体积（详情页仍走全量）。 */
    const collect = (mode: EndgameMode, db: MazeCatalogDb): void => {
      for (const [key, info] of Object.entries(db)) {
        if (!info || !info.zh) continue;
        items.push({
          id: `ID ${key}`,
          mode: mode.key,
          name: stripAllTags(info.zh),
          /** 搜索面：模式名并入（如搜"虚构"命中虚构叙事赛季） */
          searchText: mode.label,
          href: `/endgame/${mode.key}/${key}`,
          liveBegin: info.live_begin,
          status: mazeStatus(info),
          dateRange: mazeDateRange(info),
          /** 常驻关卡（无赛季轮回的长期关卡：永屹之城遗秘 / 天艟求仙迷航录） */
          permanent: info.permanent,
          /** 测试期（beta/CBT 试炼翻版：琥珀恩赐/霜痕旧梦/永冬试炼轮换） */
          test: info.test,
          buffs: info.buffs || [],
          monsters: info.monsters || [],
          /** 卡片敌方：最终层（最高层）代表阵容优先，回退全赛季（converter final_monsters） */
          finalMonsters: info.final_monsters || [],
          tierce: info.tierce,
          levels: info.levels,
        });
      }
    };
    for (const m of ENDGAME_MODES) {
      const db = m.key === 'maze' ? maze : m.key === 'story' ? story : m.key === 'boss' ? boss : peak;
      collect(m, db);
    }
    items.sort(bySeasonDesc);
    return items;
  },
  /* 终局目录：4 列按玩法分组 + 紧凑赛季行（图标 + 编号/名称/状态/日期）。
   * 每行图标 = 玩法级默认图标（modeDefaultArtUrl＝模式筛选项同款 ChallengeBossQuestTabImg1-4，
   * 唯一玩法级图标源 ChallengeGeneralConfig.TabImgPath），列内同玩法共用一枚。
   * 渲染为轻量 img（v-html 无法绑 @error，失败由全局 CDN 委托 data-cdn-down 隐藏）。 */
  renderCard(item, i) {
    const st = String(item.status || '未知');
    const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
    const no = String(item.id || '').replace(/^ID\s*/i, '');
    const noHtml = no ? `<span class="nk-eg-lrow__no">№ ${escHtml(no)}</span>` : '';
    const date = item.dateRange ? `<span class="nk-eg-lrow__date">${escHtml(String(item.dateRange))}</span>` : '';
    // 状态徽标：色点 + 文字（不单靠颜色传达，无障碍硬标准）——色点经 --st-color 映射
    const badge = st !== '未知'
      ? `<span class="nk-eg-lrow__status"><span class="nk-eg-lrow__dot"></span>${escHtml(st)}</span>` : '';
    const name = String(item.name || '未命名赛季');
    const idStr = String(item.id || '');
    const meta = (badge || date) ? `<span class="nk-eg-lrow__meta">${badge}${date}</span>` : '';
    const iconSrc = modeDefaultArtUrl(String(item.mode || ''));
    const iconHtml = iconSrc
      ? `<span class="nk-eg-lrow__fig"><img class="nk-eg-lrow__icon" src="${escHtml(iconSrc)}" alt="" loading="lazy"></span>` : '';
    return `<a class="nk-eg-lrow nk-eg-lrow--${stCls}" href="${escHtml(String(item.href || ''))}" data-mode="${escHtml(String(item.mode || ''))}" data-name="${escHtml(name)} ${escHtml(idStr)}" data-status="${escHtml(st)}" style="--i:${i}">
      ${iconHtml}
      <span class="nk-eg-lrow__main">
        <span class="nk-eg-lrow__head">${noHtml}<span class="nk-eg-lrow__name">${escHtml(name)}</span></span>
        ${meta}
      </span>
    </a>`;
  },
  /* 4 列按玩法分组：每列一个玩法（ENDGAME_MODES 顺序），列内最新上活动在前（fetchData 已按排期降序）。
   * 列头：中文名 + 英文名 + 赛季数量（玩法徽记已移除，身份由行内图标 + 模式色承载）；
   * 列体为紧凑赛季行列表。始终生效（搜索后仍按玩法分组）。 */
  renderColumns(items, renderCard) {
    let html = '';
    for (const m of ENDGAME_MODES) {
      const col = items.filter((it) => it.mode === m.key);
      if (!col.length) continue;
      html += `<section class="nk-eg-col" data-mode="${m.key}">
        <h2 class="nk-eg-col__head">
          <span class="nk-eg-col__name">${escHtml(m.label)}</span>
          <span class="nk-eg-col__en">${escHtml(m.en)}</span>
          <span class="nk-eg-col__count">${col.length}</span>
        </h2>
        <div class="nk-eg-col__list">${col.map((it, ci) => renderCard(it, ci)).join('')}</div>
      </section>`;
    }
    return html;
  },
};
