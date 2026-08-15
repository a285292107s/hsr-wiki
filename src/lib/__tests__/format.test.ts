/**
 * format.ts 纯函数单元测试
 * 内联 fixture 参照本地转换数据真实结构手工构造（测试不读取数据文件，运行时更不依赖）。
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { CDN, setUseOfficialPaths } from '../constants';
import { JS_DELIVR_BASE, JS_DELIVR_UI3D_BASE } from '../../services/cdn';
import { NkError } from '../errors';
import {
  escHtml, gameTagsToHtml, stripTags, stripAllTags, fmtVal, fmtDesc, fmtDescWithFormat, fmtDescMerged, fmtDescStar, fmtToughness,
  deepClone, getEnhancedKeys, buildEnhancedView, getRenderData,
  maxLevelStat, maxLevelValue, iconUrl, memospriteId, skillIconUrl, eidolonIconUrl,
  avatarDrawCardUrl, itemName, itemIconUrl, validateCharData,
} from '../format';
import type { CharacterData, ItemDb, NameCache, Skill } from '../../services/types';

// 本文件验证 legacy 模式（USE_OFFICIAL_PATHS=false）下的图标 URL 构造与 nanoka CDN 路径。
// 官方 StarRailTextures 路径模式的断言另起测试文件（或在本文件新开 describe 切换开关）。
beforeAll(() => {
  setUseOfficialPaths(false);
});

/* ─── fixture（最小化 CharacterData，结构对齐本地转换数据角色 JSON） ─── */

const sk = (over: Partial<Skill> = {}): Skill => ({
  id: 100501,
  name: '普通攻击',
  desc: '造成等同于攻击力 #1[i]% 的伤害',
  type: 'Normal',
  type_name: '普攻',
  ...over,
});

const baseChar = (): CharacterData => ({
  name: '测试角色',
  rarity: 'CombatPowerAvatarRarityType5',
  base_type: 'Mage',
  damage_type: 'Quantum',
  ranks: {},
  skills: { '100501': sk() },
  skill_trees: { point01: { '1': { point_name: '攻击强化', point_desc: '攻击力提高' } } },
  stats: {
    '0': { attack_base: 100, attack_add: 10, defence_base: 50, defence_add: 5, hp_base: 200, hp_add: 20, speed_base: 100, critical_chance: 0.05, critical_damage: 0.5 },
    '6': { attack_base: 150, attack_add: 12, defence_base: 80, defence_add: 6, hp_base: 300, hp_add: 24, speed_base: 105, critical_chance: 0.05, critical_damage: 0.5 },
  },
});

/* ─── HTML 安全 ─── */

describe('escHtml', () => {
  it('转义全部危险字符', () => {
    expect(escHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
  it('null/undefined 返回空串，数字正常转字符串', () => {
    expect(escHtml(null)).toBe('');
    expect(escHtml(undefined)).toBe('');
    expect(escHtml(0)).toBe('0');
  });
});

describe('stripTags', () => {
  it('{SPACE} → 空格，{NICKNAME} → 开拓者', () => {
    expect(stripTags('A{SPACE}B')).toBe('A B');
    expect(stripTags('{NICKNAME}你好')).toBe('开拓者你好');
  });
  it('剥离全部游戏标签（color/unbreak/u/b）', () => {
    expect(stripTags('<color=#F29E38>弱点</color>')).toBe('弱点');
    expect(stripTags('<unbreak>不断</unbreak>')).toBe('不断');
    expect(stripTags('<b>加粗</b>')).toBe('加粗');
    expect(stripTags('<u>下划线</u>')).toBe('下划线');
  });
  it('剥离 {RUBY_E#...} 注音标签', () => {
    expect(stripTags('{RUBY_E#汉字}kanji')).toBe('kanji');
  });
  it('{F#}/{M#} 提取文本，{TEXTJOIN#id} 移除', () => {
    expect(stripTags('{F#少女}{M#少年}')).toBe('少女少年');
    expect(stripTags('位于{TEXTJOIN#87}的场地')).toBe('位于的场地');
  });
  it('空输入返回空串', () => {
    expect(stripTags(null)).toBe('');
    expect(stripTags('')).toBe('');
  });
});

describe('gameTagsToHtml', () => {
  it('<color=#hex> 转 span style color（6/8 位 hex）', () => {
    expect(gameTagsToHtml('<color=#f29e38ff>追加攻击</color>')).toBe('<span style="color:#f29e38ff">追加攻击</span>');
    expect(gameTagsToHtml('<color=#F29E38>弱点</color>')).toBe('<span style="color:#F29E38">弱点</span>');
  });
  it('非法 color 值剥离标签保留文本', () => {
    expect(gameTagsToHtml('<color=red>文本</color>')).toBe('文本');
    expect(gameTagsToHtml('<color=#12345>文本</color>')).toBe('文本');
  });
  it('<unbreak> 转 span.nowrap', () => {
    expect(gameTagsToHtml('<unbreak>30%</unbreak>')).toBe('<span class="nowrap">30%</span>');
    expect(gameTagsToHtml('BCI<unbreak>-34</unbreak>型灰质')).toBe('BCI<span class="nowrap">-34</span>型灰质');
  });
  it('保留 <u> 标签', () => {
    expect(gameTagsToHtml('对<u>弱点击破状态</u>下的目标')).toBe('对<u>弱点击破状态</u>下的目标');
  });
  it('剥离未知标签（b/i/size 等）', () => {
    expect(gameTagsToHtml('<b>加粗</b>')).toBe('加粗');
    expect(gameTagsToHtml('<i>斜体</i>')).toBe('斜体');
    expect(gameTagsToHtml('<size=20>字号</size>')).toBe('字号');
  });
  it('{NICKNAME} → 开拓者，{F#}/{M#} 提取文本', () => {
    expect(gameTagsToHtml('{NICKNAME}的基础速度提高')).toBe('开拓者的基础速度提高');
    expect(gameTagsToHtml('{F#老姐}{M#老哥}')).toBe('老姐老哥');
  });
  it('{TEXTJOIN#id} 移除，{RUBY_E#} 移除，{SPACE} → &nbsp;', () => {
    expect(gameTagsToHtml('位于{TEXTJOIN#87}的场地')).toBe('位于的场地');
    expect(gameTagsToHtml('{RUBY_E#汉字}kanji')).toBe('kanji');
    expect(gameTagsToHtml('A{SPACE}B')).toBe('A&nbsp;B');
  });
  it('空输入返回空串', () => {
    expect(gameTagsToHtml(null)).toBe('');
    expect(gameTagsToHtml('')).toBe('');
  });
});

describe('stripAllTags', () => {
  it('剥离全部 HTML 标签', () => {
    expect(stripAllTags('<span style="color:red"><strong>文本</strong></span>')).toBe('文本');
    expect(stripAllTags(null)).toBe('');
  });
});

/* ─── 数值格式化 ─── */

describe('fmtVal', () => {
  it('i 标签取整', () => {
    expect(fmtVal(0.499, 'i', false)).toBe('0');
    expect(fmtVal(49.7, 'i', false)).toBe('50');
  });
  it('fN 标签保留 N 位小数', () => {
    expect(fmtVal(0.1234, 'f1', false)).toBe('0.1');
    expect(fmtVal(1.236, 'f2', false)).toBe('1.24');
  });
  it('isPct 乘 100', () => {
    expect(fmtVal(0.5, 'i', true)).toBe('50');
    expect(fmtVal(0.1234, 'f1', true)).toBe('12.3');
  });
  it('null 返回 ?', () => {
    expect(fmtVal(null, 'i', false)).toBe('?');
    expect(fmtVal(undefined, 'f1', false)).toBe('?');
  });
  it('裸参数（无 tag 无 %）原样显示，不四舍五入', () => {
    expect(fmtVal(0.12, '', false)).toBe('0.12');
    expect(fmtVal(3, '', false)).toBe('3');
  });
});

describe('fmtDesc', () => {
  it('替换 #N[tag]% 占位符（百分比整数）', () => {
    expect(fmtDesc('造成 #1[i]% 的伤害', [0.5])).toBe('造成 <span class="hl">50%</span> 的伤害');
  });
  it('替换 #N[fN] 占位符（非百分比小数）', () => {
    expect(fmtDesc('持续 #2[f1] 回合', [1, 0.123])).toBe('持续 <span class="hl">0.1</span> 回合');
  });
  it('替换裸 #N 占位符', () => {
    expect(fmtDesc('获得 #1 层', [3])).toBe('获得 <span class="hl">3</span> 层');
  });
  it('裸 #N 占位符：比率参数原样显示（货币战争光锥描述，防 round 错显 0）', () => {
    expect(fmtDesc('独立伤害增幅提高#1。', [0.12])).toBe('独立伤害增幅提高<span class="hl">0.12</span>。');
  });
  it('fmtDescWithFormat：ParamFormat [i]% 注入裸 #N（0.12 → 12%）', () => {
    expect(fmtDescWithFormat('独立伤害增幅提高#1。', [0.12], '[i]%'))
      .toBe('独立伤害增幅提高<span class="hl">12%</span>。');
    // 已带 tag 的占位符不双写
    expect(fmtDescWithFormat('持续 #2[f1] 回合，伤害 #1[i]%', [0.5, 0.123], '[i]%'))
      .toBe('持续 <span class="hl">0.1</span> 回合，伤害 <span class="hl">50%</span>');
    // 无模板回退 fmtDesc 原样
    expect(fmtDescWithFormat('获得 #1 层', [3], '')).toBe('获得 <span class="hl">3</span> 层');
  });
  it('换行符转 <br>', () => {
    expect(fmtDesc('第一行\n第二行')).toBe('第一行<br>第二行');
  });
  it('渲染 <unbreak> 为 nowrap span', () => {
    expect(fmtDesc('提高<unbreak>30%</unbreak>')).toBe('提高<span class="nowrap">30%</span>');
  });
  it('渲染 <color> 为着色 span，<u> 保留', () => {
    expect(fmtDesc('<color=#f29e38ff>追加攻击</color>')).toBe('<span style="color:#f29e38ff">追加攻击</span>');
    expect(fmtDesc('触发<u>追加攻击</u>')).toBe('触发<u>追加攻击</u>');
  });
  it('{F#}/{M#} 提取文本，{NICKNAME} 替换', () => {
    expect(fmtDesc('{F#她}{M#他}的防御提高 #1[i]%', [0.2])).toBe('她他的防御提高 <span class="hl">20%</span>');
    expect(fmtDesc('{NICKNAME}的速度提高')).toBe('开拓者的速度提高');
  });
  it('空描述返回空串', () => {
    expect(fmtDesc(null)).toBe('');
    expect(fmtDesc('')).toBe('');
  });
});

describe('fmtToughness', () => {
  it('show_stance_list /3 保留 2 位并映射标签', () => {
    expect(fmtToughness(sk({ show_stance_list: [30, 15, 0] }))).toBe('单攻: 10 / 群攻: 5');
  });
  it('无 show_stance_list 返回空串', () => {
    expect(fmtToughness(sk())).toBe('');
  });
});

/* ─── 强化模式视图构建 ─── */

describe('deepClone / getEnhancedKeys', () => {
  it('深拷贝互不影响', () => {
    const o = { a: { b: 1 } };
    const c = deepClone(o);
    c.a.b = 2;
    expect(o.a.b).toBe(1);
  });
  it('无加强返回空数组', () => {
    expect(getEnhancedKeys(null)).toEqual([]);
    expect(getEnhancedKeys(baseChar())).toEqual([]);
  });
  it('返回加强键', () => {
    const d = baseChar();
    d.enhanced = { '1': {} };
    expect(getEnhancedKeys(d)).toEqual(['1']);
  });
});

describe('buildEnhancedView / getRenderData', () => {
  it('强化视图覆盖 skills，未提供字段保留 base', () => {
    const d = baseChar();
    const enhSkill = sk({ id: 1100501, name: '强化普攻', desc: '加强后 #1[i]%' });
    d.enhanced = { '1': { skills: { '1100501': enhSkill } } };
    const view = buildEnhancedView(d, '1');
    expect(view.skills['1100501'].name).toBe('强化普攻');
    expect(view.ranks).toEqual(d.ranks); // 未覆盖
    expect(view.name).toBe(d.name);
    // 深拷贝隔离
    view.skills['1100501'].name = '改';
    expect(d.enhanced!['1'].skills!['1100501'].name).toBe('强化普攻');
  });
  it('无对应强化键 → 原样返回', () => {
    const d = baseChar();
    expect(buildEnhancedView(d, '9')).toBe(d);
  });
  it('sp_need 覆盖（非 null 时）', () => {
    const d = baseChar();
    d.enhanced = { '1': { sp_need: 140 } };
    expect(buildEnhancedView(d, '1').sp_need).toBe(140);
    d.enhanced = { '1': { sp_need: null } };
    expect(buildEnhancedView(d, '1').sp_need).toBe(d.sp_need);
  });
  it('getRenderData：强化模式返回强化视图；原始/无效键返回 base', () => {
    const d = baseChar();
    d.enhanced = { '1': { skills: { '1100501': sk({ id: 1100501 }) } } };
    const r1 = getRenderData(d, '1');
    expect(r1!.skills['1100501']).toBeDefined();
    expect(getRenderData(d, null)).toBe(d);
    expect(getRenderData(d, '9')).toBe(d); // 不存在的键
    expect(getRenderData(null, '1')).toBeNull();
  });
});

/* ─── 属性 / 图标 URL ─── */

describe('maxLevelStat / maxLevelValue', () => {
  it('优先取 stats["6"]', () => {
    const d = baseChar();
    expect(maxLevelStat(d.stats)).toBe(d.stats['6']);
  });
  it('无 6 时取数字键最大值', () => {
    const stats = { '0': baseChar().stats['0'], '3': baseChar().stats['6'] };
    expect(maxLevelStat(stats)).toBe(stats['3']);
  });
  it('无数字键时回退最后一个值', () => {
    const s = baseChar().stats['0'];
    expect(maxLevelStat({ x: s })).toBe(s);
    expect(maxLevelStat(null)).toBeNull();
  });
  it('满级 = base + add * 79', () => {
    expect(maxLevelValue(100, 10)).toBe(890);
  });
});

describe('URL 构建', () => {
  it('iconUrl：png → webp', () => {
    expect(iconUrl('abc.png')).toBe(`${CDN}/assets/hsr/skillicons/abc.webp`);
    expect(iconUrl(null)).toBe('');
  });
  it('memospriteId：优先解析 icon 数字，回退 1+charId', () => {
    const d = baseChar();
    d.memosprite = { icon: 'SpriteOutput/ServantIconTeam/11415B.png' };
    expect(memospriteId('1415', d)).toBe('11415');
    expect(memospriteId('1005', null)).toBe('11005');
  });
  it('skillIconUrl：按类型键拼接；Servant 用忆灵 ID；缺失类型回退映射', () => {
    const jd = (id: string, key: string) => `${JS_DELIVR_BASE}/skillicons/avatar/${id}/SkillIcon_${id}_${key}.png`;
    expect(skillIconUrl(sk({ type: 'Normal' }), '1005', null)).toBe(jd('1005', 'Normal'));
    expect(skillIconUrl(sk({ type: 'BPSkill' }), '1005', null)).toBe(jd('1005', 'BP'));
    const d = baseChar();
    d.memosprite = { icon: 'SpriteOutput/ServantIconTeam/11415B.png' };
    // 忆灵技能：文件名用忆灵 ID（11415），仓库目录用角色 ID（1415 = 忆灵 ID - 10000）
    expect(skillIconUrl(sk({ type: 'Servant' }), '1415', d))
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1415/SkillIcon_11415_Servant.png`);
    // Assist CDN 无独立图标资产，回退终结技图标
    expect(skillIconUrl(sk({ type: 'Assist', type_name: '助战技' }), '1005', null)).toBe(jd('1005', 'Ultra'));
    // MazeNormal（秘技普攻）与普攻共用图标
    expect(skillIconUrl(sk({ type: 'MazeNormal', type_name: '' }), '1508', null)).toBe(jd('1508', 'Normal'));
    // ElationDamage（欢愉技）对应 CDN 键名 Elation
    expect(skillIconUrl(sk({ type: 'ElationDamage', type_name: '欢愉技' }), '1501', null)).toBe(jd('1501', 'Elation'));
    // type 为 null 的天赋技能回退 type_name 反查
    expect(skillIconUrl(sk({ type: null as unknown as string, type_name: '天赋' }), '1508', null)).toBe(jd('1508', 'Passive'));
  });
  it('skillIconUrl：忆灵技图标后缀按 ID 映射（CDN 命名不统一）', () => {
    // 目录统一按角色 ID（忆灵 ID - 10000），文件名保留忆灵 ID
    const jd = (dir: string, fileId: string, key: string) => `${JS_DELIVR_BASE}/skillicons/avatar/${dir}/SkillIcon_${fileId}_${key}.png`;
    const mk = (icon: string) => { const d = baseChar(); d.memosprite = { icon }; return d; };
    // 11402 → Servant01
    expect(skillIconUrl(sk({ type: 'Servant' }), '1402', mk('SpriteOutput/ServantIconTeam/11402B.png'))).toBe(jd('1402', '11402', 'Servant01'));
    // 11413 → Servant03
    expect(skillIconUrl(sk({ type: 'Servant' }), '1413', mk('SpriteOutput/ServantIconTeam/11413B.png'))).toBe(jd('1413', '11413', 'Servant03'));
    // 11415 → 无后缀（默认）
    expect(skillIconUrl(sk({ type: 'Servant' }), '1415', mk('SpriteOutput/ServantIconTeam/11415B.png'))).toBe(jd('1415', '11415', 'Servant'));
    // ServantPassive 不受后缀映射影响
    expect(skillIconUrl(sk({ type: 'ServantPassive' }), '1413', mk('SpriteOutput/ServantIconTeam/11413B.png'))).toBe(jd('1413', '11413', 'ServantPassive'));
  });
  it('skillIconUrl：开拓者偶数变体回退奇数 ID 图标', () => {
    const jd = (id: string, key: string) => `${JS_DELIVR_BASE}/skillicons/avatar/${id}/SkillIcon_${id}_${key}.png`;
    expect(skillIconUrl(sk({ type: 'Normal' }), '8002', null)).toBe(jd('8001', 'Normal'));
    expect(skillIconUrl(sk({ type: 'BPSkill' }), '8004', null)).toBe(jd('8003', 'BP'));
    expect(skillIconUrl(sk({ type: 'Ultra' }), '8006', null)).toBe(jd('8005', 'Ultra'));
    expect(skillIconUrl(sk({ type: 'Maze' }), '8008', null)).toBe(jd('8007', 'Maze'));
    // 奇数 ID 不受影响
    expect(skillIconUrl(sk({ type: 'Normal' }), '8001', null)).toBe(jd('8001', 'Normal'));
  });
  it('skillIconUrl：sk.icon 字段优先（源数据事实源，覆盖变体图标命名）', () => {
    const jd = (id: string, file: string) => `${JS_DELIVR_BASE}/skillicons/avatar/${id}/${file}.png`;
    // 官方相对路径（converter --official-icon-paths 输出）→ 直拼分类路径
    expect(skillIconUrl(sk({ type: 'Ultra', icon: 'skillicons/avatar/1510/SkillIcon_1510_Normal02.png' }), '1510', null))
      .toBe(jd('1510', 'SkillIcon_1510_Normal02'));
    // 旧短路径（icon/ 开头）→ 提取文件名走分类规则
    expect(skillIconUrl(sk({ type: 'Assist', icon: 'icon/skill/Avatar/1510/SkillIcon_1510_AssisSkill01.png' }), '1510', null))
      .toBe(jd('1510', 'SkillIcon_1510_AssisSkill01'));
    // 大世界攻击（type=Maze）源图标复用普攻图标
    expect(skillIconUrl(sk({ type: 'Maze', icon: 'icon/skill/Avatar/1510/SkillIcon_1510_Normal.png' }), '1510', null))
      .toBe(jd('1510', 'SkillIcon_1510_Normal'));
    // 空串回退 type 推断
    expect(skillIconUrl(sk({ type: 'Ultra', icon: '' }), '1510', null)).toBe(jd('1510', 'SkillIcon_1510_Ultra'));
  });
  it('skillIconUrl（官方路径模式）：sk.icon 官方相对路径直拼，旧短路径回退文件名提取', () => {
    setUseOfficialPaths(true);
    try {
      expect(skillIconUrl(sk({ type: 'Ultra', icon: 'skillicons/avatar/1510/SkillIcon_1510_BP02.png' }), '1510', null))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1510/SkillIcon_1510_BP02.png`);
      // 旧短路径（icon/ 开头）→ 提取文件名走分类规则（jsDelivr 首选）
      expect(skillIconUrl(sk({ type: 'Assist', icon: 'icon/skill/Avatar/1510/SkillIcon_1510_AssisSkill02.png' }), '1510', null))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1510/SkillIcon_1510_AssisSkill02.png`);
    } finally {
      setUseOfficialPaths(false);
    }
  });
  it('skillIconUrl（官方路径模式）：忆灵技能目录按角色 ID（忆灵 ID - 10000）', () => {
    setUseOfficialPaths(true);
    try {
      const mk = (icon: string) => { const d = baseChar(); d.memosprite = { icon }; return d; };
      // 忆灵技：文件名忆灵 ID + 后缀映射，目录角色 ID
      expect(skillIconUrl(sk({ type: 'Servant' }), '1402', mk('SpriteOutput/ServantIconTeam/11402B.png')))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1402/SkillIcon_11402_Servant01.png`);
      // 忆灵天赋
      expect(skillIconUrl(sk({ type: 'ServantPassive' }), '1413', mk('SpriteOutput/ServantIconTeam/11413B.png')))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1413/SkillIcon_11413_ServantPassive.png`);
      // 开拓者特例：18007 → 8007
      expect(skillIconUrl(sk({ type: 'Servant' }), '8007', mk('SpriteOutput/ServantIconTeam/18007B.png')))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/8007/SkillIcon_18007_Servant01.png`);
      // 普通角色不受影响
      expect(skillIconUrl(sk({ type: 'Normal' }), '1005', null))
        .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1005/SkillIcon_1005_Normal.png`);
    } finally {
      setUseOfficialPaths(false);
    }
  });
  it('eidolonIconUrl / avatarDrawCardUrl', () => {
    // rank 分类已注册 jsDelivr 规则：官方 ui/ui3d/rank 源首选 + nanoka 回退（E1-6 全量）
    expect(eidolonIconUrl('1005', 1)).toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1005/1005_Rank_1.png`);
    expect(avatarDrawCardUrl('1005')).toBe(`${JS_DELIVR_BASE}/avatardrawcard/1005.png`);
  });
});

describe('itemName / itemIconUrl', () => {
  const nameCache: NameCache = { '100': '缓存名' };
  const itemDb: ItemDb = { '200': { item_name: '物品名', item_sub_type: 'Material', rarity: 'Rare' } };
  it('优先级：nameCache > itemDb > #id', () => {
    expect(itemName('100', nameCache, itemDb)).toBe('缓存名');
    expect(itemName('200', nameCache, itemDb)).toBe('物品名');
    expect(itemName(999, nameCache, itemDb)).toBe('#999');
  });
  it('itemIconUrl：解析末尾数字 png', () => {
    expect(itemIconUrl('ItemIcon/12345.png')).toBe(`${JS_DELIVR_BASE}/itemfigures/12345.png`);
    expect(itemIconUrl('abc.png')).toBe('');
    expect(itemIconUrl(null)).toBe('');
  });
});

/* ─── CW 技能描述：跨星级合并 / 单星级取值 ─── */

describe('fmtDescMerged / fmtDescStar', () => {
  const desc = '造成 #1[i]% 伤害，并回复 #2[i] 点能量';
  // 真实语义：有 % 尾缀的参数为比率（0.2 → 20%），无尾缀为绝对值
  const sets = [[0.2, 30], [0.4, 60], [0.4, 90]];
  it('fmtDescMerged：各星级值斜杠分隔，全相同仅单值', () => {
    expect(fmtDescMerged(desc, sets)).toContain('20/40/40%');
    expect(fmtDescMerged(desc, sets)).toContain('30/60/90');
    expect(fmtDescMerged(desc, [[0.5], [0.5]])).toContain('50%');
  });
  it('fmtDescStar：只替换指定星级参数', () => {
    expect(fmtDescStar(desc, sets, 0)).toBe('造成 <span class="hl">20%</span> 伤害，并回复 <span class="hl">30</span> 点能量');
    expect(fmtDescStar(desc, sets, 2)).toContain('40%');
  });
  it('fmtDescStar：下标越界 / 参数缺失回退 ? 占位', () => {
    expect(fmtDescStar(desc, sets, 9)).toContain('?%');
    expect(fmtDescStar(desc, [], 0)).toContain('?%');
    expect(fmtDescStar(null, sets, 0)).toBe('');
  });
});

/* ─── 数据校验 ─── */

describe('validateCharData', () => {
  it('完整数据通过', () => {
    expect(() => validateCharData(baseChar())).not.toThrow();
  });
  it('null 抛出非运营错误', () => {
    expect(() => validateCharData(null)).toThrowError(NkError);
    try {
      validateCharData(null);
    } catch (e) {
      expect((e as NkError).operational).toBe(false);
    }
  });
  it('缺失字段列出名称', () => {
    const bad = { ...baseChar(), name: '', stats: null } as unknown as CharacterData;
    expect(() => validateCharData(bad)).toThrowError(/name.*stats|stats.*name/);
  });
});
