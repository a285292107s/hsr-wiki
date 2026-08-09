/** 终局内容目录页配置（四模式合并单页：模式身份为筛选选项，卡片徽记同源） */
import { ELEM, MON_RANK } from '../../../lib/constants';
import { OFFICIAL_ICON_BASE } from '../../../lib/constants';
import { escHtml, stripAllTags } from '../../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../../services/cdn';
import { spriteOutputToRel } from '../../../services/cdn/jsdelivr';

/**
 * 终局官方素材 URL（jsDelivr 加速 GitHub 源，基址统一收口 OFFICIAL_ICON_BASE，固定 commit 防漂移）。
 * 白名单 = 语义闸门：仅放行「赛季主题/页签/横幅类」路径，排除开关图/场景背景等 UI 素材；
 * 全部前缀经 tools/check-endgame-icons.mjs 实测在 StarRailTextures 仓库可命中：
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

/** 终局官方素材 URL（白名单语义闸门 + 目录段小写通用规则；白名单外返回空串不渲染） */
function endgameArtUrl(path: string | undefined): string {
  if (!path) return '';
  if (!ART_PREFIXES.some((p) => path.startsWith(`SpriteOutput/${p}/`))) return '';
  return `${OFFICIAL_ICON_BASE}/${spriteOutputToRel(path)}`;
}

/** 赛季/玩法图标 URL（tab = 赛季专属图标；default 兜底由 seasonArtUrl 处理） */
export function tabIconUrl(arts?: { tab?: string } | null): string {
  return endgameArtUrl(arts?.tab);
}

/** 赛季横幅 URL（arts.theme_banner：虚构/末日/忘却之庭每赛季宣传 BANNER，Hero 装饰） */
export function seasonBannerUrl(arts?: { theme_banner?: string } | null): string {
  return endgameArtUrl(arts?.theme_banner);
}

/** 赛季主题图标 URL（arts.theme_icon：虚构 ThemeIcon_20xx / 末日 ChallengeBossIcon_30xx） */
export function seasonThemeIconUrl(arts?: { theme_icon?: string } | null): string {
  return endgameArtUrl(arts?.theme_icon);
}

/** 海报页签按钮图 URL（arts.poster_tab：虚构/末日/仲裁 Btn* 扁长按钮 260×92，相邻赛季导航完整比例展示） */
export function seasonPosterTabUrl(arts?: { poster_tab?: string } | null): string {
  return endgameArtUrl(arts?.poster_tab);
}

/**
 * 赛季 Hero 背景 URL（按模式取唯一大图：maze=background 场景背景 2048×1024 /
 * story=theme_bg 海报背景 2048×1152 / peak=handbook_banner 图鉴横幅 1103×737；
 * boss 无大图字段返回空串保持透明底）。低透明度铺底，保证文字对比度。
 */
export function seasonHeroBgUrl(arts?: { background?: string; theme_bg?: string; handbook_banner?: string } | null): string {
  return endgameArtUrl(arts?.background)
    || endgameArtUrl(arts?.theme_bg)
    || endgameArtUrl(arts?.handbook_banner);
}

/** 赛季图标 URL：优先赛季专属图标（arts.tab），缺失时回退玩法级默认图标
 *  （arts.default，converter 自 ChallengeGeneralConfig 注入；空串由调用方降级徽记） */
export function seasonArtUrl(arts?: { tab?: string; default?: string } | null): string {
  return tabIconUrl(arts) || tabIconUrl({ tab: arts?.default || '' });
}
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
} from '../../../services/api';
import type { CatalogFilter, CatalogItem, CatalogPageConfig } from '../types';
import type { MazeListDb, MazeListEntry, MazeBuffInfo, MazeMonsterInfo } from '../../../services/types';

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

/** 状态 → CSS 修饰类 */
const MAZE_STATUS_CLASS: Record<string, string> = {
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
}

export const ENDGAME_MODES: EndgameMode[] = [
  { key: 'maze', label: '忘却之庭', en: 'FORGOTTEN HALL', emblem: EMBLEMS.maze },
  { key: 'story', label: '虚构叙事', en: 'PURE FICTION', emblem: EMBLEMS.story },
  { key: 'boss', label: '末日幻影', en: 'APOCALYPSE', emblem: EMBLEMS.boss },
  { key: 'peak', label: '异相仲裁', en: 'ANOMALY', emblem: EMBLEMS.peak },
];

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
 * 卡片共享星际档案布局，--eg-color 经 data-mode 映射（领域层 --eg-* 令牌）。
 */
export const endgamePage: CatalogPageConfig = {
  id: 'endgame',
  title: '终局内容',
  searchPlaceholder: '搜索赛季...',
  gridClass: 'nk-cat-grid nk-eg-grid',
  cardClass: '.nk-eg-card',
  async fetchData() {
    const [maze, story, boss, peak] = await Promise.all([
      loadLocalMazeList(), loadLocalStoryList(), loadLocalBossList(), loadLocalPeakList(),
    ]);
    const items: CatalogItem[] = [];
    /** 赛季条目公共字段（模式身份 + 排期日期 + 弱点/层数统计 + 增益/敌方/逐层弱点） */
    const collect = (mode: EndgameMode, db: MazeListDb): void => {
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
          damageTypes: info.damage_types,
          floors: info.floors,
          stageNum: info.stage_num,
          countdown: info.countdown,
          buffs: info.buffs || [],
          monsters: info.monsters || [],
          /** 卡片敌方：最终层（最高层）代表阵容优先，回退全赛季（converter final_monsters） */
          finalMonsters: info.final_monsters || [],
          floorDamage: info.floor_damage || [],
          tierce: info.tierce,
          levels: info.levels,
          /** 赛季海报/页签图（tab = 赛季专属、default = 玩法级默认，经 seasonArtUrl 依次解析） */
          arts: info.arts,
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
  buildFilters(data) {
    const filters: CatalogFilter[] = [];
    // 模式（单选）：四模式身份 + 全部
    filters.push({
      key: 'mode',
      label: '模式',
      options: [
        { val: '', label: '全部' },
        ...ENDGAME_MODES.map((m) => ({ val: m.key, label: m.label })),
      ],
    });
    // 状态筛选：仅含日期数据的赛季才有状态值
    const statusSet = [...new Set(data.map((d) => String(d.status || '')).filter(Boolean))];
    if (statusSet.length) {
      filters.push({
        key: 'status',
        label: '状态',
        options: [
          { val: '', label: '全部' },
          ...statusSet.map((s) => ({ val: s, label: s })),
        ],
      });
    }
    // 推荐属性筛选：基于逐层数据（上下半场合并；缺失时回退全赛季去重属性）
    const dmgSet = new Set<string>();
    for (const d of data) {
      const fd = (d.floorDamage as { stage1?: string[]; stage2?: string[] }[] | undefined) || [];
      if (fd.length) {
        for (const f of fd) {
          for (const t of [...(f.stage1 || []), ...(f.stage2 || [])]) dmgSet.add(t);
        }
      } else {
        for (const t of (d.damageTypes as string[] | undefined) || []) dmgSet.add(t);
      }
    }
    if (dmgSet.size) {
      filters.push({
        key: 'damageTypes',
        label: '推荐属性',
        options: [
          { val: '', label: '全部' },
          ...[...dmgSet].map((d) => ({ val: d, label: ELEM[d] || d })),
        ],
      });
    }
    return filters;
  },
  renderCard(item, i) {
    const st = String(item.status || '未知');
    const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
    const mode = ENDGAME_MODES.find((m) => m.key === item.mode);
    const date = item.dateRange ? `<span class="nk-eg-card__date">${escHtml(String(item.dateRange))}</span>` : '';
    const badge = st !== '未知' ? `<span class="nk-eg-card__status">${escHtml(st)}</span>` : '';

    // 铭牌徽标：星启模式赛季 / 异相仲裁关卡组成
    // （FINAL 最终层标识已移除：层数统计为模式内恒值冗余——maze 10/12 层、story 4 层、boss 4 层，可由模式推断）
    // 赛季图标（seasonArtUrl：赛季专属优先，玩法级默认兜底；有可用图标时经 --has-art
    // 隐藏默认 SVG 徽记——保留占位维持布局，不透明底板遮挡加载间隙；加载失败经
    // onerror 隐藏自身并移除修饰类，露出徽记兜底）
    const artSrc = seasonArtUrl(item.arts as { tab?: string; default?: string } | undefined);
    const hasArt = Boolean(artSrc);
    const artHtml = hasArt
      ? `<img class="nk-eg-card__art" src="${escHtml(artSrc)}" alt="" onerror="this.style.display='none';this.closest('.nk-eg-card').classList.remove('nk-eg-card--has-art')">`
      : '';

    const tierce = item.tierce as { damage_types?: string[]; countdown?: number } | undefined;
    const levels = item.levels as { kind?: string }[] | undefined;
    let tierHtml = '';
    if (tierce) {
      tierHtml = '<span class="nk-eg-card__tier">✦ 星启</span>';
    } else if (levels?.length) {
      // 异相仲裁：每期 3 骑士试炼 + 1 王棋最终关（官方术语）
      const knights = levels.filter((l) => l.kind === 'knight').length;
      const hasKing = levels.some((l) => l.kind === 'king');
      tierHtml = `<span class="nk-eg-card__tier">✦ 骑士×${knights}${hasKing ? ' · 王棋' : ''}</span>`;
    }

    // 赛季增益（文本胶囊，最多 3 个）
    const buffs = Array.isArray(item.buffs)
      ? (item.buffs as MazeBuffInfo[]).slice(0, 3) : [];
    const buffHtml = buffs.length
      ? `<div class="nk-eg-card__row"><span class="nk-eg-card__label">增益</span>`
        + `<span class="nk-eg-card__buffs">${buffs.map((b) => `<span class="nk-eg-card__buff">${escHtml(b.name)}</span>`).join('')}</span></div>`
      : '';

    // 敌方：MonsterMiddleIcon CDN 头像（最多 4 个 + 溢出计数；title 附分类与弱点）。
    // 优先展示最终层代表阵容（Boss + 精英护卫），数据缺失时回退全赛季收集
    const rawMons = Array.isArray(item.finalMonsters) && (item.finalMonsters as MazeMonsterInfo[]).length
      ? (item.finalMonsters as MazeMonsterInfo[])
      : Array.isArray(item.monsters) ? (item.monsters as MazeMonsterInfo[]) : [];
    const mons = rawMons;
    const monHtml = mons.length
      ? `<div class="nk-eg-card__row"><span class="nk-eg-card__label">敌方</span>`
        + `<span class="nk-eg-card__monsters">${mons.slice(0, 4).map((m) => {
            const src = m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : '';
            if (!src) return '';
            const rank = m.rank ? (MON_RANK[m.rank] || '') : '';
            const weak = m.weak?.length ? `弱点：${m.weak.map((d) => ELEM[d] || d).join(' / ')}` : '';
            const resist = m.resist && Object.keys(m.resist).length
              ? `抗性：${Object.entries(m.resist).map(([d, v]) => `${ELEM[d] || d} ${Math.round(v * 100)}%`).join(' / ')}` : '';
            const title = [m.name, rank, m.camp, weak, resist].filter(Boolean).join(' · ');
            return `<img class="nk-eg-card__mon" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(m.name)}" title="${escHtml(title)}" loading="lazy">`;
          }).join('')}${mons.length > 4 ? `<span class="nk-eg-card__more">+${mons.length - 4}</span>` : ''}</span></div>`
      : '';

    return `<a class="nk-eg-card nk-eg-card--${stCls}${hasArt ? ' nk-eg-card--has-art' : ''}" href="${escHtml(item.href)}" data-mode="${escHtml(String(item.mode || ''))}" data-name="${escHtml(item.name)} ${escHtml(item.id)}" data-status="${escHtml(st)}" style="--i:${i}">
      <div class="nk-eg-card__plate">
        <span class="nk-eg-card__emblem">${mode?.emblem || ''}</span>
        ${artHtml}
      </div>
      <div class="nk-eg-card__body">
        <div class="nk-eg-card__head">
          <span class="nk-eg-card__name">${escHtml(item.name) || '未命名赛季'}</span>
          ${tierHtml}
          ${badge}
        </div>
        ${date ? `<div class="nk-eg-card__daterow">${date}</div>` : ''}
        ${buffHtml}
        ${monHtml}
      </div>
    </a>`;
  },
};
