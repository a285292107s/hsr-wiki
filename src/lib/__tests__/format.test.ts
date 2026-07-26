/**
 * format.ts 纯函数单元测试
 * 内联 fixture 参照 cdn-samples 真实数据结构手工构造（测试不读取样本文件，运行时更不依赖）。
 */
import { describe, it, expect } from 'vitest';
import { CDN } from '../constants';
import { NkError } from '../errors';
import {
  escHtml, stripTags, stripAllTags, fmtVal, fmtDesc, fmtToughness,
  paramEqual, hasParamDiff, hasTextDiff, wordDiff, renderWordDiffHtml, fmtDescDiff,
  deepClone, getEnhancedKeys, buildEnhancedView, buildEnhancedOld, getRenderData,
  maxLevelStat, maxLevelValue, iconUrl, memospriteId, skillIconUrl, eidolonIconUrl,
  avatarDrawCardUrl, itemName, itemIconUrl, validateCharData,
} from '../format';
import type { CharacterData, ItemDb, NameCache, Skill } from '../../services/types';

/* ─── fixture（最小化 CharacterData，结构对齐 cdn-samples/local-character-1508.json） ─── */

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
  it('<color> 转 span+strong 后被最终清洗规则剥离（与原实现行为一致）', () => {
    // 原 data.js stripTags 同款正则链：color 先转 span，再被 <(?!\/?u>)[^>]+> 清掉
    expect(stripTags('<color=#F29E38>弱点</color>')).toBe('弱点');
  });
  it('剥离 <unbreak> 与其他未知标签，保留 <u>', () => {
    expect(stripTags('<unbreak>不断</unbreak>')).toBe('不断');
    expect(stripTags('<b>加粗</b>')).toBe('加粗');
    expect(stripTags('<u>下划线</u>')).toBe('<u>下划线</u>');
  });
  it('剥离 {RUBY_E#...} 注音标签', () => {
    expect(stripTags('{RUBY_E#汉字}kanji')).toBe('kanji');
  });
  it('空输入返回空串', () => {
    expect(stripTags(null)).toBe('');
    expect(stripTags('')).toBe('');
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
  it('oldParams 不同 → 旧值 nk-d-c（带%）+ 新值 nk-d-n', () => {
    expect(fmtDesc('#1[i]%', [0.6], [0.5])).toBe('<span class="hl nk-d-c">50%</span><span class="hl nk-d-n">60</span>');
  });
  it('oldParams 相同 → 不高亮 diff', () => {
    expect(fmtDesc('#1[i]%', [0.5], [0.5])).toBe('<span class="hl">50%</span>');
  });
  it('oldParams 缺失对应项 → 普通渲染', () => {
    expect(fmtDesc('#1[i]%', [0.5], [])).toBe('<span class="hl">50%</span>');
  });
  it('换行符转 <br>', () => {
    expect(fmtDesc('第一行\n第二行')).toBe('第一行<br>第二行');
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

/* ─── Diff 工具 ─── */

describe('paramEqual / hasParamDiff', () => {
  it('浮点误差容忍 1e-9', () => {
    expect(paramEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(paramEqual(0.1, 0.2)).toBe(false);
  });
  it('null 处理', () => {
    expect(paramEqual(null, null)).toBe(true);
    expect(paramEqual(null, 1)).toBe(false);
    expect(paramEqual(1, null)).toBe(false);
  });
  it('长度不同视为有差异', () => {
    expect(hasParamDiff([1], [1, 2])).toBe(true);
    expect(hasParamDiff([1, 2], [1, 2])).toBe(false);
    expect(hasParamDiff([1, 3], [1, 2])).toBe(true);
  });
});

describe('hasTextDiff', () => {
  it('空白归一化后相同 → 无差异', () => {
    expect(hasTextDiff('a  b', 'a b')).toBe(false);
  });
  it('剥离被移除类标签后比较', () => {
    expect(hasTextDiff('<b>a</b>', 'a')).toBe(false);
    expect(hasTextDiff('a', 'b')).toBe(true);
  });
});

describe('wordDiff / renderWordDiffHtml', () => {
  it('英文按词 diff', () => {
    const ops = wordDiff('AB', 'AC');
    expect(ops).toEqual([
      { type: 'remove', text: 'AB' },
      { type: 'add', text: 'AC' },
    ]);
  });
  it('中文按字符 diff', () => {
    const ops = wordDiff('你好世界', '你好中国');
    const cat = (t: string) => ops.filter((o) => o.type === t).map((o) => o.text).join('');
    expect(cat('equal')).toBe('你好');
    expect(cat('remove')).toBe('世界');
    expect(cat('add')).toBe('中国');
  });
  it('空输入', () => {
    expect(wordDiff('', '')).toEqual([]);
    expect(wordDiff('', 'a b')).toEqual([
      { type: 'add', text: 'a' },
      { type: 'add', text: 'b' },
    ]);
  });
  it('渲染 HTML：equal 原样 / add / remove', () => {
    expect(renderWordDiffHtml([
      { type: 'equal', text: '保持' },
      { type: 'remove', text: '旧' },
      { type: 'add', text: '新' },
    ])).toBe('保持<span class="diff-removed">旧</span><span class="diff-added">新</span>');
  });
});

describe('fmtDescDiff', () => {
  it('仅参数变化、模板相同 → 参数级高亮', () => {
    const html = fmtDescDiff('造成 #1[i]% 伤害', [0.6], '造成 #1[i]% 伤害', [0.5]);
    expect(html).toContain('nk-d-c">50%');
    expect(html).toContain('nk-d-n">60');
  });
  it('模板文本变化 → 词级 diff', () => {
    const html = fmtDescDiff('攻击提高 #1[i]%', [0.5], '防御提高 #1[i]%', [0.5]);
    expect(html).toContain('diff-added">攻');
    expect(html).toContain('diff-removed">防');
    expect(html).toContain('提高 50%');
  });
  it('无旧数据 → 普通渲染', () => {
    expect(fmtDescDiff('造成 #1[i]% 伤害', [0.5], null, null)).toBe('造成 <span class="hl">50%</span> 伤害');
  });
  it('空描述返回空串', () => {
    expect(fmtDescDiff('', [1], 'x', [1])).toBe('');
  });
});

/* ─── 加强模式视图构建 ─── */

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

describe('buildEnhancedView / buildEnhancedOld / getRenderData', () => {
  it('加强视图覆盖 skills，未提供字段保留 base', () => {
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
  it('无对应加强键 → 原样返回', () => {
    const d = baseChar();
    expect(buildEnhancedView(d, '9')).toBe(d);
  });
  it('加强前视图重映射技能 ID（enhKey + baseId）', () => {
    const d = baseChar();
    const old = buildEnhancedOld(d, '1');
    expect(old.skills['1100501']).toBeDefined();
    expect(old.skills['1100501'].id).toBe(1100501);
    expect(old.skills['100501']).toBeUndefined();
    // 原对象不被修改
    expect(d.skills['100501'].id).toBe(100501);
  });
  it('getRenderData：加强模式返回 d + oldD；原始模式 oldD=null', () => {
    const d = baseChar();
    d.enhanced = { '1': { skills: { '1100501': sk({ id: 1100501 }) } } };
    const r1 = getRenderData(d, '1');
    expect(r1.d!.skills['1100501']).toBeDefined();
    expect(r1.oldD!.skills['1100501'].desc).toBe(d.skills['100501'].desc);
    const r2 = getRenderData(d, null);
    expect(r2.d).toBe(d);
    expect(r2.oldD).toBeNull();
    const r3 = getRenderData(d, '9'); // 不存在的键
    expect(r3.d).toBe(d);
    expect(r3.oldD).toBeNull();
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
    expect(skillIconUrl(sk({ type: 'Normal' }), '1005', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1005_Normal.webp`);
    expect(skillIconUrl(sk({ type: 'BPSkill' }), '1005', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1005_BP.webp`);
    const d = baseChar();
    d.memosprite = { icon: 'SpriteOutput/ServantIconTeam/11415B.png' };
    expect(skillIconUrl(sk({ type: 'Servant' }), '1415', d)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_11415_Servant.webp`);
    // Assist CDN 无独立图标资产，回退终结技图标
    expect(skillIconUrl(sk({ type: 'Assist', type_name: '助战技' }), '1005', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1005_Ultra.webp`);
    // MazeNormal（秘技普攻）与普攻共用图标
    expect(skillIconUrl(sk({ type: 'MazeNormal', type_name: '' }), '1508', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1508_Normal.webp`);
    // ElationDamage（欢愉技）对应 CDN 键名 Elation
    expect(skillIconUrl(sk({ type: 'ElationDamage', type_name: '欢愉技' }), '1501', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1501_Elation.webp`);
    // type 为 null 的天赋技能回退 type_name 反查
    expect(skillIconUrl(sk({ type: null as unknown as string, type_name: '天赋' }), '1508', null)).toBe(`${CDN}/assets/hsr/skillicons/SkillIcon_1508_Passive.webp`);
  });
  it('eidolonIconUrl / avatarDrawCardUrl', () => {
    expect(eidolonIconUrl('1005', 1)).toBe(`${CDN}/assets/hsr/rank/_dependencies/textures/1005/1005_Rank_1.webp`);
    expect(avatarDrawCardUrl('1005')).toBe(`${CDN}/assets/hsr/avatardrawcard/1005.webp`);
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
    expect(itemIconUrl('ItemIcon/12345.png')).toBe(`${CDN}/assets/hsr/itemfigures/12345.webp`);
    expect(itemIconUrl('abc.png')).toBe('');
    expect(itemIconUrl(null)).toBe('');
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
