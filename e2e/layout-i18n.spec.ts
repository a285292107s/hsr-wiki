/**
 * 布局验收：多语言（URL 前缀 + 语言包），契约见 ADR 0052 决策 2 / 5。
 *
 * 三条不变量（都是「数据 / 结构来源」级，与断点无关 ⇒ `@viewport-independent`）：
 *   ① 非缺省语言前缀（`/en/...`）必须取该语言的语言包渲染正文，且 `<html lang>` 同步；
 *   ② 站内链接必须保留语言前缀（router history base 生效，导航不落回缺省语言）；
 *   ③ 语言选择器整页重载后前缀、`lang`、正文三者一致。
 *
 * 期望值一律从 `public/data/i18n/<语言>/**.json` 派生（`readJsonIn`），不在断言里写死译名——
 * 上游文本会随版本变，硬编码译名等于把数据缺陷伪装成断言失败。
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJsonIn } from './helpers';
import { characterBlurb } from '../src/lib/character-blurb';

interface CharRow { id: number; name: string }
interface CharDetail { chara_info?: { stories?: Record<string, string | null> } }

/** 读 UI 词典（`src/lib/i18n/messages/`，非 public 数据，故直接读文件）。 */
const msgs = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, 'utf8')) as Record<string, string>;

/** 角色简介的派生口径与前端同源（`src/lib/character-blurb.ts`），避免 e2e 复述一遍规则。 */
const heroDescOf = (locale: string, id: number): string => {
  const d = readJsonIn<CharDetail>(locale, `public/data/cn/characters/${id}.json`);
  return characterBlurb(d.chara_info?.stories);
};

const charName = (locale: string, id: number): string => {
  const row = readJsonIn<CharRow[]>(locale, 'public/data/cn/characters.json');
  const hit = row.find((c) => c.id === id);
  if (!hit) throw new Error(`语言包 ${locale} 缺少角色 ${id}`);
  return hit.name;
};

test.describe('布局验收：多语言', () => {
  test('/en/character/1001：英文前缀取英文语言包，html[lang]=en-US，中文正文不出现', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const en = charName('en', 1001);
    const cn = charName('cn', 1001);
    expect(en, '英文语言包里 1001 的译名应不同于中文').not.toBe(cn);

    await page.goto('/en/character/1001');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    await expect(page.locator('.nk-hero__name')).toContainText(en);
    await expect(page.locator('.nk-hero__name')).not.toContainText(cn);
    await expect(page.locator('.nk-hero--char')).toBeVisible();
    assertNoErrors();
  });

  test('/en/character：站内链接保留语言前缀（导航与目录卡都不落回缺省语言）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    await page.goto('/en/character');
    // 侧栏链接由 router history base 自动带前缀：DOM 里的 href 必须是 /en/...
    await expect(page.locator('.ui-sidebar a[href="/en/lightcone"]')).toHaveCount(1);
    // 目录卡是模板字符串拼的 <a href>（非 RouterLink）⇒ 前缀只能由 activeHref 补上；
    // 虚拟网格只渲染可见行，故断言「当前渲染出的每一张卡」而不是某一张具体卡。
    // 必须先等首卡渲染：`goto` 后立即取样会与数据加载赛跑（曾因此在慢启动下假失败）。
    await expect(page.locator('a.nk-idx-card').first()).toBeVisible();
    const cardHrefs = await page.locator('a.nk-idx-card').evaluateAll(
      (els) => els.map((e) => e.getAttribute('href') ?? ''),
    );
    expect(cardHrefs.length, '目录卡应至少渲染出一张').toBeGreaterThan(0);
    expect(cardHrefs.every((h) => h.startsWith('/en/character/')), `卡片 href 未带前缀：${cardHrefs.slice(0, 3)}`).toBe(true);

    await page.locator('.ui-sidebar a[href="/en/lightcone"]').click();
    await expect(page).toHaveURL(/\/en\/lightcone$/);
    await expect(page.locator('.ui-sidebar a[href="/en/character"]')).toHaveCount(1);
  });

  test('/en/character：壳层文案走词典（侧栏主标英文），缺省语言仍为中文', { tag: ['@viewport-independent'] }, async ({ page }) => {
    await page.goto('/en/character');
    await expect(page.locator('.ui-sidebar a[href="/en/character"] .ui-sidebar-link__cn')).toHaveText('Characters');
    await expect(page.locator('.ui-sidebar a[href="/en/character"] .ui-sidebar-link__en')).toHaveText('CHARACTERS');
    // 反向钉住 cn 源：词典改造不得把缺省语言文案改坏
    await page.goto('/character');
    await expect(page.locator('.ui-sidebar a[href="/character"] .ui-sidebar-link__cn')).toHaveText('角色');
  });

  test('/en/character/1001：hero 简介随语言（前端从角色档案首行派生，非转换器组合的中文）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = heroDescOf('en', 1001);
    const cn = heroDescOf('cn', 1001);
    expect(en, '英文档案首行应不同于中文').not.toBe(cn);

    await page.goto('/en/character/1001');
    await expect(page.locator('.nk-hero__desc')).toContainText(en);
    await expect(page.locator('.nk-hero__desc')).not.toContainText(cn);
  });

  test('/en/achievement：成就描述随语言（模板 + TEXTJOIN + 参数在语言包内按语言组合）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    interface AchRow { id: number; desc: string; show_type?: string }
    const en = readJsonIn<AchRow[]>('en', 'public/data/cn/achievements.json');
    const cn = readJsonIn<AchRow[]>('cn', 'public/data/cn/achievements.json');
    expect(en.length, '语言包应覆盖全部成就').toBe(cn.length);
    const diff = en.filter((a, i) => a.desc !== cn[i]!.desc).length;
    expect(diff, '英文成就描述应整体不同于中文（组合器按语言现算）').toBe(en.length);

    await page.goto('/en/achievement');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
    // 虚拟网格只渲染可见行 ⇒ 取「当前渲染出的第一张非隐藏卡」，用它的 data-id 反查语言包期望值
    const card = page.locator('.nk-ach-card:not(.nk-ach-card--hidden)').first();
    const id = await card.getAttribute('data-id');
    const row = en.find((a) => String(a.id) === id);
    expect(row, `卡片 ${id} 应能在英文语言包里找到`).toBeTruthy();
    await expect(card.locator('.nk-ach-card__desc')).toHaveText(row!.desc);
  });

  test('/en/relic/N：部位名与属性名取官方词条（不是前端中文枚举表）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    interface Piece { type: string; type_name: string; sub_affix_group: number }
    interface RelicRow { id: number; pieces: Piece[] }
    interface SubAffix { group_id: number; property: string }
    interface PropRow { id: string; name: string }

    const relics = readJsonIn<RelicRow[]>('en', 'public/data/cn/relics.json');
    const relic = relics.find((r) => r.pieces?.[0]?.sub_affix_group != null);
    expect(relic, '应能取到带副词条组的遗器').toBeTruthy();
    const piece = relic!.pieces[0]!;
    expect(piece.type_name, '部位名应为英文（官方 Head/Hands/…）').toMatch(/^[A-Za-z ]+$/);

    const propsEn = readJsonIn<PropRow[]>('en', 'public/data/cn/properties.json');
    const propsCn = readJsonIn<PropRow[]>('cn', 'public/data/cn/properties.json');
    const subs = readJsonIn<SubAffix[]>('en', 'public/data/cn/relic_sub_affixes.json');
    const sub = subs.find((a) => a.group_id === piece.sub_affix_group);
    expect(sub, '应能取到该组的副词条').toBeTruthy();
    const enLabel = propsEn.find((p) => p.id === sub!.property)?.name;
    const cnLabel = propsCn.find((p) => p.id === sub!.property)?.name;
    expect(enLabel, `属性 ${sub!.property} 应有英文词条名`).toBeTruthy();

    await page.goto(`/en/relic/${relic!.id}`);
    await expect(page.locator('.nk-relic-hero-piece__slot').first()).toHaveText(piece.type_name);
    const names = await page.locator('.nk-relic-subcell__name').allTextContents();
    expect(names, '副属性名应出现官方英文词条名').toContain(enLabel!);
    expect(names, '不得出现中文词条名').not.toContain(cnLabel!);
  });

  test('/en/character + /en/：筛选器与页脚走词典（界面骨架随语言切换）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    await page.goto('/en/character');
    await expect(page.locator('a.nk-idx-card').first()).toBeVisible();
    const labels = (await page.locator('.nk-cat-select__label').allTextContents()).map((s) => s.trim());
    expect(labels, '筛选器名应取英文词典值').toContain(en['catalog.filter.path']!);
    expect(labels, '不得残留中文筛选器名').not.toContain(cn['catalog.filter.path']!);
    // 默认选项「全部」只在展开菜单后渲染（未选中筛选项时 `.nk-cat-select__val` 不渲染）
    await page.locator('.nk-cat-select__btn').first().click();
    await expect(page.locator('.nk-cat-select__opt').first()).toHaveText(en['catalog.all']!);
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 5 } });

    await page.goto('/en/');
    await expect(page.locator('.nk-hub-footer__motto').first()).toHaveText(en['ui.footerMotto']!);
    await expect(page.locator('.nk-hub-footer__motto').first()).not.toHaveText(cn['ui.footerMotto']!);
  });

  test('/en/：页面标题、document.title、组合标题与赛季状态徽标都走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');

    // 目录页 h1（含右侧拉丁副标）+ 浏览器标题
    await page.goto('/en/character');
    await expect(page.locator('.nk-cat-title')).toContainText(en['catalog.character.title']!);
    await expect(page).toHaveTitle(new RegExp(en['catalog.character.title']!));

    // 组合标题：货币战争 · 羁绊图鉴（模式名与图鉴名各自取词典键）
    await page.goto('/en/currency/trait');
    await expect(page.locator('.nk-cat-title'))
      .toContainText(`${en['catalog.currencyWar']} · ${en['nav.cwTrait']}`);

    // 赛季状态徽标（内部状态是枚举，文案走词典；不得出现中文状态词）
    await page.goto('/en/endgame');
    await expect(page.locator('.nk-eg-lrow').first()).toBeVisible();
    const badges = (await page.locator('.nk-eg-lrow__status').allTextContents()).map((s) => s.trim());
    expect(badges.length, '终局目录应至少有一个带状态的赛季行').toBeGreaterThan(0);
    const allowed = new Set([
      en['endgame.status.live'], en['endgame.status.ended'], en['endgame.status.upcoming'],
    ]);
    expect(badges.every((b) => allowed.has(b)), `状态徽标应取英文词典值：${badges.slice(0, 3)}`).toBe(true);
  });

  test('/en/：搜索框占位与怪物分类标签走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    await page.goto('/en/character');
    await expect(page.locator('.nk-cat-search input')).toHaveAttribute('placeholder', en['catalog.character.search']!);
    await page.goto('/en/monster');
    await expect(page.locator('.nk-cat-search input')).toHaveAttribute('placeholder', en['catalog.monster.search']!);
    const rankText = await page.locator('.nk-mob-card').first().textContent();
    expect(rankText, '敌方目录卡不应出现中文分类名').not.toContain('普通');
  });

  test('/en/currency/role：筛选名与卡面充能标签走词典（枚举 → 键）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    await page.goto('/en/currency/role');
    // 货币角色卡是自有模板（非通用目录卡）⇒ 等筛选栏出现即代表数据已就位
    await expect(page.locator('.nk-cat-select__label').first()).toBeVisible();

    const labels = (await page.locator('.nk-cat-select__label').allTextContents()).map((s) => s.trim());
    expect(labels, '位置筛选名应取英文词典值').toContain(en['catalog.filter.position']!);
    expect(labels, '不得残留中文筛选名').not.toContain(cn['catalog.filter.position']!);

    // 卡面充能标签 = 模板（catalog.chargeChip）+ 各充能类型词典值
    const chargeNames = [
      'catalog.charge.speed', 'catalog.charge.specialEnergy', 'catalog.charge.ultEnergy',
      'catalog.charge.maxHp', 'catalog.charge.sp',
    ].map((k) => en[k]!);
    const parts = (await page.locator('.nk-crole-card__charge').allTextContents())
      .flatMap((s) => s.split('·').map((x) => x.trim()))
      .filter(Boolean);
    expect(parts.length, '应至少渲染出一个充能标签').toBeGreaterThan(0);
    expect(parts.every((p) => chargeNames.includes(p)), `充能标签应取英文词典值：${parts.slice(0, 3)}`).toBe(true);
  });

  test('/en/currency/trait 与 /en/monster/N：详情页标签走词典（羁绊层品质 + 变体差分）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 羁绊详情：层品质标签 = 模板 {name}品质 + 品质词典值（或「基础」）；id 从产物取（不写死）
    const traitsDb = readJsonIn<{ traits: { id: number; layers?: { quality?: string }[] }[] }>(
      'en', 'public/data/cn/currency/traits.json',
    );
    const trait = traitsDb.traits.find((t) => (t.layers || []).some((l) => l?.quality));
    expect(trait, '应能取到带品质层的羁绊').toBeTruthy();
    await page.goto(`/en/currency/trait/${trait!.id}`);
    await expect(page.locator('.nk-ctrait-layer__quality').first()).toBeVisible();
    const qualities = (await page.locator('.nk-ctrait-layer__quality').allTextContents()).map((s) => s.trim());
    const names = ['catalog.quality.silver', 'catalog.quality.gold', 'catalog.quality.multicolor',
      'catalog.quality.unique', 'catalog.qualityBase'].map((k) => en[k]!);
    const expectQ = new Set(names.map((n) => en['catalog.qualityLabel']!.replace('{name}', n)));
    expect(qualities.every((q) => expectQ.has(q)), `层品质应是英文词典组合：${qualities.slice(0, 2)}`).toBe(true);
    expect(qualities.join('')).not.toContain(cn['catalog.qualityBase']!);

    // 怪物详情：变体差分行使用词典模板与签名词典值
    const detail = readJsonIn<{ id: number }[]>('en', 'public/data/cn/monsters.json');
    await page.goto(`/en/monster/${detail[0]!.id}`);
    const diff = await page.locator('.nk-mob-variant__diff, [data-variant-diff]').allTextContents();
    if (diff.length) {
      const prefix = en['catalog.variantDiff']!.split('{list}')[0]!.trim();
      expect(diff.every((d) => d.trim().startsWith(prefix)), `差分标签应取英文模板：${diff[0]}`).toBe(true);
    }
  });

  test('/en/item：物品类别（主类别分组 + 子类别选项）走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    await page.goto('/en/item');
    await expect(page.locator('.nk-cat-search input')).toHaveAttribute('placeholder', en['catalog.item.search']!);
    // 筛选器在数据就位后才渲染（占位符早于它出现）⇒ 直接等筛选器（物品卡类名与通用目录卡不同）
    await expect(page.locator('.nk-cat-select__label').first()).toBeVisible({ timeout: 20000 });

    // 找到标签为「Type」的筛选器并展开
    const selects = page.locator('.nk-cat-select');
    const count = await selects.count();
    let idx = -1;
    for (let i = 0; i < count; i++) {
      const label = (await selects.nth(i).locator('.nk-cat-select__label').textContent())?.trim();
      if (label === en['catalog.filter.type']) { idx = i; break; }
    }
    expect(idx, 'item 目录应有「Type」筛选器').toBeGreaterThanOrEqual(0);
    await selects.nth(idx).locator('.nk-cat-select__btn').click();

    const enTypes = new Set(Object.entries(en)
      .filter(([k]) => k.startsWith('itemType.') || k.startsWith('itemMainType.'))
      .map(([, v]) => v));
    const cnTypes = new Set(Object.entries(cn)
      .filter(([k]) => k.startsWith('itemType.') || k.startsWith('itemMainType.'))
      .map(([, v]) => v));

    const options = (await page.locator('.nk-cat-select__opt').allTextContents()).map((s) => s.trim());
    const groups = (await page.locator('.nk-cat-select__group').allTextContents()).map((s) => s.trim());
    expect(options.length, '类型筛选应有选项').toBeGreaterThan(0);
    const bad = options.filter((o) => !enTypes.has(o));
    expect(bad, `选项应是英文类别词典值（含「All」）：${bad.slice(0, 3)}`).not.toContain(undefined);
    expect(options.filter((o) => cnTypes.has(o)), '不得出现中文类别').toEqual([]);
    expect(groups.length, '应有主类别分组名').toBeGreaterThan(0);
    expect(groups.every((g) => [...enTypes].some((t) => g.startsWith(t))), `分组名应取英文词典值：${groups.slice(0, 2)}`).toBe(true);
  });

  test('/en/currency/role/N：属性名与分组名走词典（官方 prop_name 缺失时的兜底）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const rolesDb = readJsonIn<{ roles: { id: number }[] }>('en', 'public/data/cn/currency/role.json');
    const id = rolesDb.roles[0]?.id;
    expect(id, '应能取到一个货币角色 id').toBeTruthy();
    await page.goto(`/en/currency/role/${id}`);
    // 成长矩阵（属性名 + 分组标题）与技能分组标题都不得残留中文
    await expect(page.locator('.nk-crole-gm').first()).toBeVisible();
    const texts = await page.evaluate(() => {
      /* 只取本轮本地化的三类元素：属性名 / 矩阵分组标题（colspan 行）/ 技能分组标题。
         视图里其它静态标签仍可能是中文（属后续批次），故不整块取文本。 */
      const sels = [
        '.nk-crole-layer__pname',
        '.nk-crole-gm tr td[colspan]',
        '.nk-crole-skillgroup__title',
      ];
      return sels.flatMap((s) => [...document.querySelectorAll(s)].map((el) => el.textContent || ''));
    });
    expect(texts.length, '这三类元素应至少渲染出一批').toBeGreaterThan(0);
    const cjk = texts.join(' ').match(/[\u4e00-\u9fff]+/g) ?? [];
    expect(cjk, `属性名/分组名不应残留中文：${cjk.slice(0, 6)}`).toEqual([]);
  });

  test('/en/character/1001：元素与命途名取官方数据令牌（不是前端手写表）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    interface Row { id: string; name: string }
    interface Detail { damage_type: string; base_type: string }
    const en = msgs('en');
    const elems = readJsonIn<Row[]>('en', 'public/data/cn/elements.json');
    const paths = readJsonIn<Row[]>('en', 'public/data/cn/paths.json');
    const detail = readJsonIn<Detail>('en', 'public/data/cn/characters/1001.json');
    const elemName = elems.find((e) => e.id === detail.damage_type)?.name;
    const pathName = paths.find((p) => p.id === detail.base_type)?.name;
    expect(elemName, '元素应有官方英文名').toBeTruthy();
    expect(pathName, '命途应有官方英文名').toBeTruthy();
    expect(elemName).not.toMatch(/[\u4e00-\u9fff]/);
    expect(pathName).not.toMatch(/[\u4e00-\u9fff]/);

    await page.goto('/en/character/1001');
    const hero = page.locator('.nk-hero');
    await expect(hero).toContainText(elemName!);
    await expect(hero).toContainText(pathName!);

    // 技能类型分组注记走词典（`skillTypeLabel`）：不得残留中文，且必须命中某个技能类型词条值
    const typeNames = ['skillType.Normal', 'skillType.BPSkill', 'skillType.Ultra', 'skillType.Passive',
      'skillType.Maze', 'skillType.Servant', 'skillType.ServantPassive'].map((k) => en[k]!);
    // 技能类型注记渲染在技能索引条上（SectionIndex → nk-idxstrip__no）
    const notes = await page.locator('.nk-idxstrip__no').allTextContents();
    const joined = notes.join(' ');
    expect(notes.length, '技能分组应有类型注记').toBeGreaterThan(0);
    expect(typeNames.some((n) => joined.includes(n)), `类型注记应取英文词典值：${notes.slice(0, 2)}`).toBe(true);
    expect(joined, '类型注记不应残留中文').not.toMatch(/[\u4e00-\u9fff]/);
  });

  test('/en/monster/N：详情页节标题与数值标签走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    const detail = readJsonIn<{ id: number }[]>('en', 'public/data/cn/monsters.json');
    await page.goto(`/en/monster/${detail[0]!.id}`);
    await expect(page.locator('.nk-mob-sec__title').first()).toBeVisible();

    const secs = (await page.locator('.nk-mob-sec__title').allTextContents()).map((s) => s.trim());
    expect(secs, '节标题应取英文词典值').toContain(en['mob.sec.weakness']!);
    expect(secs, '不得残留中文节标题').not.toContain(cn['mob.sec.weakness']!);

    const stats = (await page.locator('.nk-mob-stat__label').allTextContents()).map((s) => s.trim());
    expect(stats.length, '战斗数值区应有标签').toBeGreaterThan(0);
    const keys = ['mob.stat.hp', 'mob.stat.atk', 'mob.stat.def', 'mob.stat.spd', 'mob.stat.stance'];
    expect(stats.every((s) => keys.some((k) => en[k] === s)), `数值标签应取英文词典值：${stats}`).toBe(true);
  });

  test('/en/currency/role/N：区块标题 / 导航 / 推荐优先级样式都随语言', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    const rolesDb = readJsonIn<{ roles: { id: number }[] }>('en', 'public/data/cn/currency/role.json');
    const id = rolesDb.roles[0]?.id;
    await page.goto(`/en/currency/role/${id}`);
    await expect(page.locator('.nk-crole-section__title').first()).toBeVisible();

    const secs = (await page.locator('.nk-crole-section__title').allTextContents()).map((s) => s.trim());
    const enSecs = ['cwRole.sec.growth', 'cwRole.sec.skills', 'cwRole.sec.ranks', 'cwRole.sec.cones',
      'cwRole.sec.equips'].map((k) => en[k]!);
    const cnSecs = ['cwRole.sec.growth', 'cwRole.sec.skills', 'cwRole.sec.ranks', 'cwRole.sec.cones',
      'cwRole.sec.equips'].map((k) => cn[k]!);
    expect(secs.some((s) => enSecs.includes(s)), `区块标题应取英文词典值：${secs}`).toBe(true);
    expect(secs.some((s) => cnSecs.includes(s)), '不得残留中文区块标题').toBe(false);

    // 侧栏区块导航同理
    const nav = (await page.locator('.nk-secnav a, .nk-secnav button').allTextContents()).map((s) => s.trim());
    expect(nav.some((s) => enSecs.includes(s)), `区块导航应取英文词典值：${nav}`).toBe(true);

    // 推荐优先级：样式类按**枚举**判定（曾按中文文案判定，多语言下恒为 is-second）
    const prios = page.locator('.nk-crole-rec__prio');
    if (await prios.count()) {
      await expect(prios.first()).toHaveText(en['cwRole.priorityFirst']!);
      await expect(prios.first()).toHaveClass(/is-first/);
    }
  });

  test('/en/endgame/<mode> 与 /en/voracity：区块标题与结构口径表走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 终局玩法页：区块标题（保留拉丁后缀）+ 结构口径行标签
    await page.goto('/en/endgame/maze');
    await expect(page.locator('.nk-title').first()).toBeVisible();
    const titles = (await page.locator('.nk-title').allTextContents()).map((s) => s.replace(/\s+/g, ' ').trim());
    expect(titles.some((s) => s.includes(en['egm.sec.rules']!)), `区块标题应含英文词典值：${titles}`).toBe(true);
    expect(titles.some((s) => s.includes(cn['egm.sec.rules']!)), '不得残留中文区块标题').toBe(false);

    const labels = (await page.locator('.nk-egm__fact dt, .nk-egm__k').allTextContents()).map((s) => s.trim());
    if (labels.length) {
      const enKeys = ['egm.stat.floors', 'egm.stat.halfs', 'egm.stat.levels', 'egm.stat.knights', 'egm.stat.kings',
        'egm.stat.targets', 'egm.stat.countdown', 'egm.stat.scoreCap', 'egm.stat.tierce'].map((k) => en[k]!);
      expect(labels.every((l) => enKeys.includes(l)), `结构口径标签应取英文词典值：${labels}`).toBe(true);
    }

    // 贪饕污染专题页：区块标题 + 导航
    await page.goto('/en/voracity');
    await expect(page.locator('.nk-title').first()).toBeVisible();
    const vorTitles = (await page.locator('.nk-title').allTextContents()).map((s) => s.replace(/\s+/g, ' ').trim());
    expect(vorTitles.some((s) => s.includes(en['vor.sec.overview']!)), `专题页标题应含英文词典值：${vorTitles}`).toBe(true);
    expect(vorTitles.some((s) => s.includes(cn['vor.sec.overview']!)), '不得残留中文专题页标题').toBe(false);
  });

  test('/en/endgame/maze：赛季名随语言包切语言（字段名 zh 但值是令牌）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    /* 坑位：maze.json 的赛季名落在名为 `zh` 的字段里，值是 `$t:` 令牌 ⇒ 取数层按语言解析。
       断言从同一份结构层按不同语言解析派生期望值，钉住「不要据字段名判断语言」。 */
    const raw = readFileSync('public/data/cn/maze.json', 'utf8');
    expect(raw, '结构层赛季名应是令牌').toContain('$t:');
    type MazeDb = Record<string, { zh?: string }>;
    const enName = readJsonIn<MazeDb>('en', 'public/data/cn/maze.json')['100']?.zh ?? '';
    const cnName = readJsonIn<MazeDb>('cn', 'public/data/cn/maze.json')['100']?.zh ?? '';
    expect(enName, '英文解析应得到英文赛季名').toBeTruthy();
    expect(enName).not.toBe(cnName);
    expect(enName).not.toMatch(/[\u4e00-\u9fff]/);

    await page.goto('/en/endgame/maze');
    await expect(page.getByText(enName, { exact: false }).first()).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body, '英文页不应出现中文赛季名').not.toContain(cnName);
  });

  test('/en/lightcone/N 与 /en/：光锥详情与首页文案走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 光锥详情：区块标题 + 属性标签 + 叠影模板
    const cones = readJsonIn<{ id: number }[]>('en', 'public/data/cn/light_cones.json');
    await page.goto(`/en/lightcone/${cones[0]!.id}`);
    await expect(page.locator('.nk-title').first()).toBeVisible();
    const titles = (await page.locator('.nk-title').allTextContents()).map((s) => s.replace(/\s+/g, ' ').trim());
    expect(titles.some((s) => s.includes(en['lc.sec.skill']!)), `光锥区块标题应含英文词典值：${titles}`).toBe(true);
    expect(titles.some((s) => s.includes(cn['lc.sec.ascension']!)), '不得残留中文区块标题').toBe(false);

    const statLabels = (await page.locator('.nk-hero__stat-label').allTextContents()).map((s) => s.trim());
    const statKeys = ['common.stat.hp', 'common.stat.atk', 'common.stat.def'].map((k) => en[k]!);
    const statCn = ['common.stat.hp', 'common.stat.atk', 'common.stat.def'].map((k) => cn[k]!);
    expect(statLabels.length, '光锥应有满级属性标签').toBeGreaterThan(0);
    expect(statLabels.every((s) => statKeys.includes(s)), `属性标签应取英文词典值：${statLabels}`).toBe(true);
    expect(statLabels.some((s) => statCn.includes(s)), '不得残留中文属性标签').toBe(false);

    const rankLabels = (await page.locator('.nk-lc-rank-label').allTextContents()).map((s) => s.trim());
    if (rankLabels.length) {
      const prefix = en['lc.superimpose']!.split('{n}')[0]!;
      expect(rankLabels.every((s) => s.startsWith(prefix)), `叠影标签应取英文模板：${rankLabels[0]}`).toBe(true);
    }

    // 首页：品牌文案
    await page.goto('/en/');
    await expect(page.locator('.nk-hub-brand__tagline')).toHaveText(en['home.tagline']!);
    const home = await page.locator('#nk-home-app').innerText();
    expect(home, '首页不应残留中文品牌文案').not.toContain(cn['home.tagline']!);
  });

  test('/en/character/1001 /relic/N：区块导航、属性面板与遗器表走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 角色页：侧栏区块导航 + 属性面板标签
    await page.goto('/en/character/1001');
    await expect(page.locator('.nk-secnav').first()).toBeVisible();
    const nav = (await page.locator('.nk-secnav a, .nk-secnav button').allTextContents()).map((s) => s.trim());
    const navKeys = ['char.sec.stats', 'char.sec.talents', 'char.sec.eidolons', 'char.sec.bonuses',
      'char.sec.teams', 'char.sec.stories', 'char.sec.profile'].map((k) => en[k]!);
    const navCn = ['char.sec.stats', 'char.sec.talents', 'char.sec.eidolons'].map((k) => cn[k]!);
    /* 导航项文本带区块序号前缀（如 `00 Type`）⇒ 用包含匹配 */
    expect(nav.some((s) => navKeys.some((k) => s.includes(k))), `区块导航应取英文词典值：${nav.slice(0, 4)}`).toBe(true);
    expect(nav.some((s) => navCn.some((k) => s.includes(k))), '不得残留中文区块导航').toBe(false);

    const statCards = (await page.locator('.nk-stats__label, .nk-stat__label').allTextContents()).map((s) => s.trim());
    if (statCards.length) {
      const enStats = ['common.stat.hp', 'common.stat.atk', 'common.stat.def', 'catalog.charge.speed',
        'prop.CriticalChanceBase', 'prop.CriticalDamageBase', 'stat.taunt', 'stat.energyCap'].map((k) => en[k]!);
      expect(statCards.some((s) => enStats.includes(s)), `属性面板标签应取英文词典值：${statCards.slice(0, 4)}`).toBe(true);
      expect(statCards).not.toContain(cn['common.stat.atk']!);
    }

    // 遗器页：部位/计数/套装
    const relics = readJsonIn<{ id: number }[]>('en', 'public/data/cn/relics.json');
    await page.goto(`/en/relic/${relics[0]!.id}`);
    await expect(page.locator('.nk-relic-count').first()).toBeVisible();
    const counts = (await page.locator('.nk-relic-count').allTextContents()).map((s) => s.trim());
    const countPrefix = en['relic.pieceCount']!.split('{n}')[1]!.trim();
    expect(counts.every((s) => s.endsWith(countPrefix)), `件数应取英文词典值：${counts}`).toBe(true);
    await expect(page.locator('.nk-relic-affix-table__prop-h')).toHaveText(en['relic.affixCol']!);
  });

  test('/en/monster/N：口径说明与阶段名走词典（阶段序号不重复）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    const list = readJsonIn<{ id: number; guide_phases?: { name: string }[] }[]>('en', 'public/data/cn/monsters.json');
    const withPhases = list.find((m) => (m.guide_phases || []).length);
    const target = withPhases ?? list[0]!;
    await page.goto(`/en/monster/${target.id}`);
    await expect(page.locator('.nk-mob-stat-note').first()).toBeVisible();

    // 口径说明：整段由词典拼出（不得残留中文，且必须命中英文词典片段）
    const note = (await page.locator('.nk-mob-stat-note').first().innerText()).replace(/\s+/g, ' ');
    expect(note, '口径说明不得残留中文').not.toMatch(/[\u4e00-\u9fff]/);
    expect(note, `口径说明应含英文词典值 ${en['mob.statNoteBase']}`).toContain(en['mob.statNoteBase']!);
    expect(note).not.toContain(cn['mob.statNoteTail']!);

    // 阶段机制：编号由独立标记位给出 ⇒ 名字里不应再带「标签 + 数字 + 冒号」前缀
    if (withPhases) {
      const names = (await page.locator('.nk-mob-guide__name').allTextContents()).map((s) => s.trim());
      expect(names.length, '该怪物应有阶段名').toBeGreaterThan(0);
      const dupe = names.filter((n) => /^\S{1,12}\s*\d{1,2}\s*[：:]/.test(n));
      expect(dupe, `阶段名不应重复序号前缀：${dupe.slice(0, 2)}`).toEqual([]);
    }
  });

  test('/en/voracity：同形词说明段走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    await page.goto('/en/voracity');
    await expect(page.locator('.nk-title').first()).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body, `说明段应取英文词典值：${en['vor.disambigNote']!.slice(0, 24)}`)
      .toContain(en['vor.disambigNote']!.slice(0, 24));
  });

  test('/en/currency 与 /en/endgame/N：枢纽页与赛季页文案走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 货币战争枢纽页：标题 + 标语 + 空态/新增标题
    await page.goto('/en/currency');
    await expect(page.locator('.nk-hub-brand__tagline')).toHaveText(en['cwHub.tagline']!);
    await expect(page.locator('.nk-hub-brand__title')).toHaveText(en['catalog.currencyWar']!);
    const cw = await page.locator('#nk-home-app, .nk-cw-hub, body').first().innerText();
    expect(cw, '枢纽页不得残留中文标语').not.toContain(cn['cwHub.tagline']!);

    // 赛季页：加载/错误/空态与相邻赛季导航
    await page.goto('/en/endgame/maze');
    await expect(page.locator('.nk-title').first()).toBeVisible();
    const nav = (await page.locator('.nk-egd-nav__dir').allTextContents()).map((s) => s.trim());
    if (nav.length) {
      const allowed = [en['egd.prevSeason']!, en['egd.nextSeason']!];
      expect(nav.every((s) => allowed.includes(s)), `相邻赛季文案应取词典：${nav}`).toBe(true);
    }
    const body = await page.locator('body').innerText();
    expect(body, '赛季页不得残留中文占位').not.toContain(cn['egd.empty.stages']!);
  });

  test('/en/404 与 /en/settings：错误页与主题色名走词典', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');

    // 404：标题/描述/返回按钮
    await page.goto('/en/definitely-not-a-real-path');
    await expect(page.locator('.nk-notfound__title')).toHaveText(en['notfound.title']!);
    await expect(page.locator('.nk-notfound__desc')).toHaveText(en['notfound.desc']!);
    const nf = await page.locator('.nk-notfound').innerText();
    expect(nf, '404 页不得残留中文').not.toContain(cn['notfound.desc']!);

    // 设置页：主题色名（强调色列表）
    await page.goto('/en/settings');
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
    const set = await page.locator('body').innerText();
    expect(set, '主题色名应取英文词典值').toContain(en['theme.accent.terracotta']!);
    expect(set, '主题色名不得残留中文').not.toContain(cn['theme.accent.terracotta']!);
  });

  test('/en/endgame/maze/N：终局组件文案走词典（层级 tab、规则标签、奖励区）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const en = msgs('en');
    const cn = msgs('cn');
    const maze = readJsonIn<Record<string, { floor_details?: unknown[] }>>('en', 'public/data/cn/maze.json');
    const id = Object.entries(maze).find(([, v]) => (v.floor_details || []).length >= 2)?.[0];
    expect(id, '应能取到含多层的赛季').toBeTruthy();

    await page.goto(`/en/endgame/maze/${id}`);
    await expect(page.locator('.nk-egd-tabs').first()).toBeVisible();

    // 层级 tab：`{n} 层` 走词典；星启模式用既有权
    const tabs = (await page.locator('.nk-egd-tabs [role="tab"]').allTextContents()).map((s) => s.trim());
    const floorPrefix = en['egd.floorLabel']!.split('{n}')[0]!;
    expect(tabs.some((s) => s.includes(floorPrefix)), `层级 tab 应取英文词典值：${tabs.slice(0, 3)}`).toBe(true);
    expect(tabs.some((s) => s.includes(cn['egd.floorLabel']!.split('{n}')[0]!)), '不得残留中文层级 tab').toBe(false);

    // 英雄区「玩法说明」链接与页面整体无中文层级文案
    const body = await page.locator('body').innerText();
    expect(body, '英雄区标签应取英文词典值').toContain(en['egd.guideLabel']!);
    expect(body, '不得残留中文层级文案').not.toContain(cn['egd.floorLabel']!.split('{n}')[0]!);
  });

  test('/en/achievement：{NICKNAME} 占位符按语言展开（不是中文「开拓者」）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    /* 坑位：converter 曾无条件把 {NICKNAME} 换成中文「开拓者」⇒ 9 种语言包出现 568 处中文。
       现在按该语言的文本表取值；期望值从语言包直接派生。 */
    const pack = JSON.parse(readFileSync('public/data/i18n/en/achievements.json', 'utf8')) as Record<string, string>;
    const cnPack = JSON.parse(readFileSync('public/data/i18n/cn/achievements.json', 'utf8')) as Record<string, string>;
    const withName = Object.entries(pack).filter(([, v]) => /Trailblazer/.test(v));
    expect(withName.length, '英文语言包应有多条含 Trailblazer 的描述').toBeGreaterThan(0);
    const leaked = Object.values(pack).filter((v) => v.includes('开拓者'));
    expect(leaked, `英文语言包不得残留中文「开拓者」：${leaked.slice(0, 1)}`).toEqual([]);
    expect(Object.values(cnPack).some((v) => v.includes('开拓者')), '中文语言包应保留「开拓者」').toBe(true);

    await page.goto('/en/achievement');
    await expect(page.locator('.nk-ach-card, .nk-cat-search input').first()).toBeVisible({ timeout: 20000 });
    const body = await page.locator('body').innerText();
    expect(body, '英文页不得出现中文「开拓者」').not.toContain('开拓者');
  });

  test('/en/character/1014：技能动画标题随语言解析（令牌而非中文原文）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    /* 坑位：抓取产物 skill_animations.json 的 title 曾是 wiki 中文小标题，而前端用
       `a.title === sk.name` 把动画挂到技能上、并在切换器里显示它 ⇒ 非中文语言下既挂错技能又露中文。
       现在标题命中官方技能名时写名称令牌，随语言包解析（同分组包由抓取脚本同时产出）。 */
    const anims = readJsonIn<Record<string, Record<string, { title?: string }[]>>>(
      'en', 'public/data/cn/skill_animations.json',
    );
    const titled = Object.values(anims['1014'] || {}).flat().filter((a) => a?.title);
    expect(titled.length, '1014 应有带标题的动画').toBeGreaterThan(0);
    expect(titled.every((a) => !/[\u4e00-\u9fff]/.test(a.title!)), '英文解析后不应含汉字').toBe(true);

    // 该分组语言包必须存在（否则运行期解析不到令牌，界面直接显示 `$t:…`）
    for (const lang of ['en', 'de']) {
      const pack = readJsonIn<Record<string, string>>(lang, 'public/data/cn/skill_animations.json');
      expect(Object.keys(pack).length, `${lang} 分组包应有键`).toBeGreaterThan(0);
    }

    // 运行期页面不得出现未解析的令牌
    await page.goto('/en/character/1014');
    await expect(page.locator('.nk-skill').first()).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body, '页面不得出现未解析的 $t: 令牌').not.toContain('$t:');
    expect(body, '技能区不得残留中文动画标题').not.toMatch(/风王结界|解放的金色王权/);
  });

  test('meta description 随语言（搜索/分享摘要不再恒为中文）', { tag: ['@viewport-independent'] }, async ({ page }) => {
    /* 坑位：`index.html` 的 `<meta name="description">` 是静态缺省语言文案 ⇒ /en/、/jp/ 等
       外层可见摘要全是中文（JS 用户由 bootstrap 改写）。 */
    const en = msgs('en');
    const cn = msgs('cn');
    await page.goto('/en/');
    const enMeta = await page.locator('meta[name="description"]').getAttribute('content');
    expect(enMeta, '英文页 description 应取英文词典值').toBe(en['meta.description']!);
    expect(enMeta, '英文页 description 不得残留中文').not.toContain(cn['meta.description']!);

    await page.goto('/settings');
    const cnMeta = await page.locator('meta[name="description"]').getAttribute('content');
    expect(cnMeta, '缺省语言页 description 应与静态 HTML 一致').toBe(cn['meta.description']!);
  });

  test('/en/character/1001：页内普通内链不得丢语言前缀', { tag: ['@viewport-independent'] }, async ({ page }) => {
    /* 坑位：目录卡与模板里的普通 `<a :href>` 不走路由 history base，写死 `/lightcone/23001`
       这类内链在非缺省语言下点一下就会静默跳回缺省语言（本轮实测漏点：推荐光锥卡）。 */
    await page.goto('/en/character/1001');
    const card = page.locator('.nk-lc-card').first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.click();
    await page.waitForURL(/lightcone\//, { timeout: 20000 });
    expect(new URL(page.url()).pathname.startsWith('/en/'), `应留在 /en/ 前缀下，实际 ${page.url()}`).toBe(true);
    await expect(page.locator('.nk-lc-hero, .nk-hero').first()).toBeVisible({ timeout: 20000 });
  });

  test('/settings：语言选择器切到日本語 → 前缀 / lang / 正文三者一致', { tag: ['@viewport-independent'] }, async ({ page }) => {
    const jp = charName('jp', 1004);
    const cn = charName('cn', 1004);
    expect(jp, '日文语言包里 1004 的译名应不同于中文').not.toBe(cn);

    await page.goto('/settings');
    await page.getByRole('listbox', { name: '界面语言' }).getByRole('button', { name: /日本語/ }).click();
    await expect(page).toHaveURL(/\/jp\/settings$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja-JP');

    await page.goto('/jp/character/1004');
    await expect(page.locator('.nk-hero__name')).toContainText(jp);
    await expect(page.locator('.nk-hero__name')).not.toContainText(cn);
  });
});
