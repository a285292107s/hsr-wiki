import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForSettled } from './helpers';
import { dictOf } from './locales-smoke.shared';
import { navEntryReachable, noUnknownOverflow } from './layout.shared';

const dict = dictOf('cn');

const SECTIONS = [
  ['overview', 'formula.sec.overview'],
  ['break', 'formula.sec.break'],
  ['elation', 'formula.sec.elation'],
  ['true', 'formula.sec.true'],
  ['growth', 'formula.sec.growth'],
  ['heal', 'formula.sec.heal'],
  ['speed', 'formula.sec.speed'],
  ['extra', 'formula.sec.extra'],
  ['calc', 'formula.sec.calc'],
] as const;

const ZONES = ['base', 'modifier', 'crit', 'defense', 'resist', 'special', 'toughness'] as const;

const CALC_ROLES = [
  'stat', 'multiplier', 'bonus', 'vuln', 'reduce', 'weak',
  'crit-rate', 'crit-dmg', 'def-reduction', 'def-penetration', 'res-base', 'res-penetration',
] as const;

test.describe('布局验收：战斗公式页（/formula）', () => {
  test('/formula：hero、九区块导航（吸顶不塌陷）、七节点链路、乘区流水、详情切换、新链路不画图、入口可达、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/formula');
    await waitForSettled(page);

    await expect(page.locator('#nk-formula-app')).toHaveClass(/nk-formula/);
    await expect(page.locator('.nk-formula-hero__title')).toHaveText(dict['nav.formula']);

    const buttons = page.locator('.nk-formula-secnav .nk-secnav__btn');
    await expect(buttons, '区块导航恰好 9 项').toHaveCount(SECTIONS.length);
    for (const [i, [id, key]] of SECTIONS.entries()) {
      const button = buttons.nth(i);
      await expect(button).toHaveAttribute('data-sec', id);
      await expect(button, `第 ${i + 1} 个区块按钮应显示词典 ${key}`).toContainText(dict[key]);
      const section = page.locator(`section.nk-formula-sec[data-sec="${id}"]`);
      await expect(section, `缺少区块 #formula-${id}`).toHaveCount(1);
      await expect(page.locator(`#formula-${id}`)).toHaveCount(1);
      await expect(section.locator('.nk-formula-sec__title'), `区块 ${id} 的编号必须是两位序号`)
        .toContainText(String(i + 1).padStart(2, '0'));
    }

    const navBox = await page.locator('.nk-formula-secnav').boundingBox();
    expect(navBox, '分区导航必须占位').not.toBeNull();
    expect(Math.round(navBox!.height), '分区导航不得被压塌（≥44px）').toBeGreaterThanOrEqual(44);
    const btnBox = await buttons.first().boundingBox();
    expect(Math.round(btnBox!.height), '导航按钮触控高度 ≥44px').toBeGreaterThanOrEqual(44);

    const nodes = page.locator('.nk-formula-chain__node');
    await expect(nodes, '乘区链路恰好 7 个节点（6 乘区 + 韧性）').toHaveCount(ZONES.length);
    expect(
      await nodes.evaluateAll((els) => els.map((el) => el.getAttribute('data-zone'))),
      '链路节点顺序必须是 base → modifier → crit → defense → resist → special → toughness',
    ).toEqual([...ZONES]);

    const toughness = page.locator('.nk-formula-chain__node[data-zone="toughness"]');
    await expect(toughness).toContainText(dict['formula.chain.toughness']);
    await expect(toughness).toHaveAttribute('aria-pressed', 'false');
    const total = page.locator('#formula-overview .nk-formula-flow__row--total .nk-formula-flow__run');
    const totalBefore = (await total.innerText()).trim();
    await toughness.click();
    await expect(toughness, '点韧性节点必须切换破韧状态').toHaveAttribute('aria-pressed', 'true');
    const totalAfter = (await total.innerText()).trim();
    expect(totalAfter, '破韧后总伤害必须变化').not.toBe(totalBefore);
    await toughness.click();
    await expect(toughness).toHaveAttribute('aria-pressed', 'false');

    const detailFormula = page.locator('.nk-formula-detail__formula');
    const detailName = page.locator('.nk-formula-detail__name');
    await page.locator('.nk-formula-chain__node[data-zone="base"]').click();
    await expect(detailFormula, '点基础伤害区后详情显示该乘区公式').toContainText(dict['formula.zoneFormula.base']);
    const baseText = (await detailFormula.innerText()).trim();
    await page.locator('.nk-formula-chain__node[data-zone="defense"]').click();
    await expect(page.locator('.nk-formula-chain__node[data-zone="defense"]'))
      .toHaveClass(/nk-formula-chain__node--on/);
    await expect(detailName).toContainText(dict['formula.zone.def']);
    await expect(detailFormula, '点防御区后详情公式必须换成防御区公式').toContainText(dict['formula.zoneFormula.def']);
    expect((await detailFormula.innerText()).trim(), '切换乘区后详情公式文本必须变化').not.toBe(baseText);

    const flow = page.locator('#formula-overview .nk-formula-flow');
    await expect(flow, '乘区流水必须取代旧账本').toHaveCount(1);
    await expect(page.locator('#formula-overview .nk-formula-ledger'), '旧账本类名必须归零').toHaveCount(0);
    const flowRows = flow.locator('.nk-formula-flow__row[data-step]');
    await expect(flowRows, '流水 = 基础伤害 + 六乘区（含韧性）').toHaveCount(7);
    expect(
      await flowRows.evaluateAll((els) => els.map((el) => el.getAttribute('data-zone'))),
      '流水顺序必须固定：base → modifier → crit → defense → resist → special → toughness',
    ).toEqual(['base', 'modifier', 'crit', 'defense', 'resist', 'special', 'toughness']);
    expect(
      await flowRows.evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-step')))),
      'data-step 必须是 1..7',
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const stepFactors = await flowRows.evaluateAll((els) =>
      els
        .filter((el) => el.getAttribute('data-zone') !== 'base')
        .map((el) => ({
          factor: (el.querySelector('.nk-formula-flow__factor')?.textContent ?? '').trim(),
          delta: (el.querySelector('.nk-formula-flow__delta')?.textContent ?? '').trim(),
        })),
    );
    expect(stepFactors.length, '流水必须有 6 个乘步').toBe(6);
    expect(stepFactors.filter((row) => !row.factor.startsWith('×')), '乘步必须写成 ×N').toEqual([]);
    expect(stepFactors.filter((row) => row.delta === ''), '每步必须给出增减绝对值').toEqual([]);

    const flowLast = (await flowRows.last().locator('.nk-formula-flow__run').innerText()).trim();
    const cardTotal = (await page.locator('#formula-overview .nk-formula-flow__row--total .nk-formula-flow__run').innerText()).trim();
    expect(Number(flowLast.replace(/[^\d.-]/g, '')), '流水末值必须等于 01 显示的最终伤害（±0.1）')
      .toBeGreaterThanOrEqual(Number(cardTotal.replace(/[^\d.-]/g, '')) - 0.1);
    expect(Number(flowLast.replace(/[^\d.-]/g, '')), '流水末值必须等于 01 显示的最终伤害（±0.1）')
      .toBeLessThanOrEqual(Number(cardTotal.replace(/[^\d.-]/g, '')) + 0.1);
    await expect(page.locator('.nk-formula-share__row'), '相对贡献条必须已删除').toHaveCount(0);

    await expect(
      page.locator('#formula-overview .nk-formula-subzones'),
      '伤害修饰区等式条必须已删除（与流水乘步行、详情公式重复读数）',
    ).toHaveCount(0);

    const detail = page.locator('#formula-overview .nk-formula-detail');
    const formulaSize = await detail.locator('.nk-formula-detail__formula')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    const nameSize = await detail.locator('.nk-formula-detail__name')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(formulaSize, '页面讲的是公式：乘区公式字号必须大于乘区名').toBeGreaterThan(nameSize);

    await expect(
      page.locator('#formula-break [data-chart], #formula-elation [data-chart], #formula-true [data-chart]'),
      '02/03/04 三条新链路刻意不画图',
    ).toHaveCount(0);
    await expect(page.locator('#formula-break .nk-formula-flow')).toHaveCount(1);
    await expect(page.locator('#formula-break .nk-formula-flow__row[data-step]'), '普通击破流水 10 行').toHaveCount(10);
    await expect(page.locator('#formula-elation .nk-formula-flow__row[data-step]'), '欢愉流水 11 行').toHaveCount(11);

    const breakTerms = page.locator('#formula-break .nk-formula-eq').first().locator('.nk-formula-eq__term');
    await expect(breakTerms, '普通击破的等式项数必须与流水乘步数一致（10）').toHaveCount(10);
    await expect(page.locator('#formula-elation .nk-formula-eq').first().locator('.nk-formula-eq__term'),
      '欢愉的等式项数必须与流水乘步数一致（11）').toHaveCount(11);

    await expect(
      page.locator('#formula-break .nk-formula-brief .nk-formula-point'),
      '击破机制要点必须给出 3 条（削韧 / 韧性减伤 / 延后与恢复）',
    ).toHaveCount(3);
    await expect(
      page.locator('#formula-break .nk-formula-chain-block').nth(1).locator('.nk-formula-point'),
      '超击破必须给出触发条件与计算口径 2 条',
    ).toHaveCount(2);
    const superTerms = page.locator('#formula-break .nk-formula-chain-block').nth(1).locator('.nk-formula-eq__term');
    await expect(superTerms, '超击破等式必须 8 项：从「击破基数 ÷ 10」起算，不含属性倍率与长度系数').toHaveCount(8);
    await expect(superTerms.first(), '超击破基数必须写明 ÷ 10').toContainText('10');

    const effectRows = page.locator('#formula-break .nk-formula-effects__row');
    await expect(effectRows, '击破效果必须覆盖 7 个属性各一行').toHaveCount(7);
    expect(
      await effectRows.evaluateAll((els) => els.map((el) => el.getAttribute('data-effect'))),
      '击破效果行序必须是 物理 → 火 → 雷 → 风 → 冰 → 量子 → 虚数',
    ).toEqual(['Physical', 'Fire', 'Thunder', 'Wind', 'Ice', 'Quantum', 'Imaginary']);
    await expect(
      page.locator('#formula-break .nk-formula-effects__row[data-effect="Physical"] .nk-formula-effects__value'),
      '裂伤必须写明「生命上限比例」与「击破基数 × 2 × 长度系数」取较小值',
    ).toContainText('min');

    expect(await navEntryReachable(page, '/formula'), '/formula 入口必须可达（底栏或「更多」抽屉）').toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/formula：共享参数驱动 01 流水、页面无图表残留、计算器 12 个数值控件与开关', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/formula');
    await waitForSettled(page);

    await expect(page.locator('#nk-formula-app [data-chart]'), '图表随伤害乘区区块一并移除').toHaveCount(0);

    const bonus = page.locator('#formula-calc input[data-role="bonus"]');
    await expect(bonus, '增伤必须可调').toHaveCount(1);
    await bonus.fill('300');
    await bonus.blur();
    const overviewFactor = await page
      .locator('#formula-overview .nk-formula-flow__row[data-zone="modifier"] .nk-formula-flow__factor')
      .innerText();
    expect(overviewFactor.trim(), '09 与 01 共享参数：流水增伤步系数必须跟着变').toBe('×4');

    await expect(page.locator('#formula-heal [data-chart]'), '治疗/护盾不画图（纯线性，读数是唯一需求）').toHaveCount(0);
    await expect(page.locator('#formula-heal input[data-role="heal-base"]')).toHaveCount(1);
    await expect(page.locator('#formula-heal input[data-role="shield-base"]')).toHaveCount(1);
    await expect(page.locator('#formula-heal .nk-formula-heal__value')).toHaveText(/\d/);
    await expect(page.locator('#formula-heal .nk-formula-shield__value')).toHaveText(/\d/);

    await expect(page.locator('#formula-speed [data-chart]'), '速度不画图（阈值表已给全部答案）').toHaveCount(0);
    await expect(page.locator('#formula-speed .nk-formula-thresholds__row'), '速度阈值表 = 4 + 3 行').toHaveCount(7);
    const speedTurns = (await page.locator('#formula-speed .nk-formula-speed__turns').innerText()).trim();
    expect(Number(speedTurns), '每轮行动次数必须是整数').toBe(Math.round(Number(speedTurns)));
    const needText = (await page.locator('#formula-speed [data-role="need-speed"]').innerText()).trim();
    expect(Number(needText.replace(/[^\d.]/g, '')), '反解速度必须是数值').toBeGreaterThan(0);

    await expect(page.locator('#formula-growth [data-chart]'), '02 不画图（数字已在属性卡/技能读数里）').toHaveCount(0);
    await expect(page.locator('#formula-growth .nk-formula-trace__row'), '行迹对比条保留 3 档').toHaveCount(3);
    await expect(page.locator('#formula-growth [data-role="skill"]')).toHaveCount(1);
    await expect(page.locator('#formula-growth [data-role="skill-multiplier"]')).toHaveText(/%$/);

    await expect(page.locator('#formula-extra .nk-formula-break__value')).toHaveText(/\d/);
    await expect(page.locator('#formula-extra .nk-formula-card'), '08 只保留破韧与命中两张卡').toHaveCount(2);
    await expect(page.locator('#formula-extra [data-role="hit-reverse"]')).toHaveCount(1);

    const calcInputs = page.locator('#formula-calc input[type=number][data-role]');
    const calcRoles = await calcInputs.evaluateAll((els) => els.map((el) => el.getAttribute('data-role')));
    expect(calcRoles, '09 全部数值控件必须是数字输入框（不再有滑杆）').toContain('stat');
    expect(
      [...new Set(calcRoles.filter((role) => (CALC_ROLES as readonly (string | null)[]).includes(role)))].sort(),
      '计算器 12 个 data-role 必须齐全（按我方/敌方分组，不再要求扁平顺序）',
    ).toEqual([...CALC_ROLES].sort());
    const playerRoles = await page.locator('#formula-calc .nk-formula-calc__group--player input[data-role]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-role')));
    expect(playerRoles, '我方组必须是攻击方等级/面板攻击力/技能倍率/增伤/暴击/减防/穿透').toEqual([
      'attacker-level', 'stat', 'multiplier', 'bonus', 'crit-rate', 'crit-dmg',
      'def-reduction', 'def-penetration', 'res-penetration',
    ]);
    const enemyRoles = await page.locator('#formula-calc .nk-formula-calc__group--enemy input[data-role]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-role')));
    expect(enemyRoles, '敌方组必须是受击方等级/易伤/减伤/虚弱/原始抗性').toEqual([
      'defender-level', 'vuln', 'reduce', 'weak', 'res-base',
    ]);
    await expect(page.locator('#formula-calc input[type=range]'), '09 不得再出现滑杆').toHaveCount(0);
    await expect(page.locator('#formula-calc [data-role="attacker-level"]'), '攻击方等级必须可调').toHaveCount(1);
    await expect(page.locator('#formula-calc [data-role="attacker-level"]')).toHaveAttribute('max', '80');
    await expect(page.locator('#formula-calc [data-role="defender-level"]'), '受击方等级必须可调').toHaveCount(1);
    await expect(page.locator('#formula-calc [data-role="defender-level"]')).toHaveAttribute('max', '100');
    await expect(page.locator('#formula-calc .nk-formula-calc__group'), '我方/敌方两组').toHaveCount(2);
    await expect(page.locator('#formula-calc .nk-formula-calc__group-title').first())
      .toHaveText(dict['formula.calc.groupPlayer']);
    await expect(page.locator('#formula-calc .nk-formula-calc__group-title').last())
      .toHaveText(dict['formula.calc.groupEnemy']);
    await expect(page.locator('#formula-calc button[data-role="broken"]')).toHaveCount(1);
    await expect(page.locator('#formula-calc button[data-role="swarm"]')).toHaveCount(1);
    await expect(page.locator('#formula-calc button[data-role="res-preset"]'), '09 抗性预设 4 档').toHaveCount(4);
    await expect(page.locator('#formula-calc .nk-formula-calc__result')).toHaveText(/\d/);
    await expect(page.locator('#formula-calc .nk-formula-ledger'), '旧账本类名必须归零').toHaveCount(0);
    const calcFlowRows = page.locator('#formula-calc .nk-formula-flow__row[data-step]');
    await expect(calcFlowRows, '09 流水 = 基础伤害 + 六乘区（含韧性，修掉算不平）').toHaveCount(7);
    expect(
      await calcFlowRows.evaluateAll((els) => els.map((el) => el.getAttribute('data-zone'))),
      '09 流水顺序必须与 01 一致',
    ).toEqual(['base', 'modifier', 'crit', 'defense', 'resist', 'special', 'toughness']);
    const calcFlowLast = (await calcFlowRows.last().locator('.nk-formula-flow__run').innerText()).trim();
    const calcTotal = (await page.locator('.nk-formula-calc__result').innerText()).trim();
    const calcFlowNumber = Number(calcFlowLast.replace(/[^\d.-]/g, ''));
    const calcTotalNumber = Number(calcTotal.replace(/[^\d.-]/g, ''));
    expect(Math.abs(calcFlowNumber - calcTotalNumber), '09 流水末值必须与期望伤害一致（±0.1）')
      .toBeLessThanOrEqual(0.1);

    const calcBefore = (await page.locator('.nk-formula-calc__result').innerText()).trim();
    await page.locator('#formula-calc button[data-role="broken"]').click();
    await expect(page.locator('.nk-formula-calc__result'), '破韧后期望伤害必须变化').not.toHaveText(calcBefore);
    await expect(
      page.locator('#formula-calc .nk-formula-flow__row[data-zone="toughness"] .nk-formula-flow__factor'),
      '破韧后流水末步必须变成 ×1',
    ).toHaveText('×1');
    await expect(page.locator('#formula-calc [data-role="toughness-factor"]'), '破韧后韧性提示必须是 ×1（不能常显 ×0.9）')
      .toHaveText('×1');
    await page.locator('#formula-calc button[data-role="broken"]').click();
    await expect(page.locator('#formula-calc [data-role="toughness-factor"]')).toHaveText('×0.9');

    const swarmCompare = (await page.locator('#formula-calc [data-role="swarm-compare"]').innerText()).trim();
    const swarmPair = swarmCompare.match(/×[\d.]+/g) ?? [];
    expect(swarmPair.length, '扑满开关必须同时给出正常/扑满两条防御区数值').toBe(2);
    expect(swarmPair[0], '正常线型与扑满线型的防御区必须不同').not.toBe(swarmPair[1]);
    const defZoneBefore = (await page.locator('#formula-calc .nk-formula-flow__row[data-zone="defense"] .nk-formula-flow__factor').innerText()).trim();
    await page.locator('#formula-calc button[data-role="swarm"]').click();
    const defZoneAfter = (await page.locator('#formula-calc .nk-formula-flow__row[data-zone="defense"] .nk-formula-flow__factor').innerText()).trim();
    expect(defZoneAfter, '扑满开启后防御区系数必须变化').not.toBe(defZoneBefore);
    await page.locator('#formula-calc button[data-role="swarm"]').click();

    const totalBeforeLevel = (await page.locator('.nk-formula-calc__result').innerText()).trim();
    const attackerInput = page.locator('#formula-calc input[data-role="attacker-level"]');
    await attackerInput.fill('60');
    await attackerInput.blur();
    await expect(page.locator('.nk-formula-calc__result'), '改攻击方等级后期望伤害必须变化').not.toHaveText(totalBeforeLevel);
    await expect(page.locator('#formula-calc [data-role="swarm-compare"]'), '扑满对照必须随等级实时重算')
      .not.toHaveText(swarmCompare);
    await attackerInput.fill('80');
    await attackerInput.blur();
    await expect(page.locator('.nk-formula-calc__result')).toHaveText(totalBeforeLevel);

    const defenderInput = page.locator('#formula-calc input[data-role="defender-level"]');
    const defenderBefore = await defenderInput.inputValue();
    await defenderInput.fill('95');
    await defenderInput.blur();
    await expect(page.locator('.nk-formula-calc__result'), '改受击方等级后期望伤害必须变化').not.toHaveText(totalBeforeLevel);
    await defenderInput.fill(defenderBefore);
    await defenderInput.blur();
    await expect(page.locator('.nk-formula-calc__result')).toHaveText(totalBeforeLevel);

    const critDmgInput = page.locator('#formula-calc input[data-role="crit-dmg"]');
    await critDmgInput.fill('128.4');
    await expect(critDmgInput, '非 step 值必须被原样接受（输入框精度优于滑杆）').toHaveValue('128.4');
    await expect(page.locator('.nk-formula-calc__result')).not.toHaveText(totalBeforeLevel);
    await critDmgInput.blur();
    await expect(critDmgInput, '失焦后仍保留 128.4').toHaveValue('128.4');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/formula：02 击破（含超击破）/ 03 欢愉 / 04 真实伤害 三条新链路', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/formula');
    await waitForSettled(page);

    const toNumber = (value: string): number => Number(value.replace(/[^\d.-]/g, ''));

    const breakRows = page.locator('#formula-break .nk-formula-flow').first().locator('.nk-formula-flow__row[data-step]');
    await expect(breakRows, '普通击破流水 10 行').toHaveCount(10);
    expect(
      await breakRows.evaluateAll((els) => els.map((el) => el.getAttribute('data-zone'))),
      '击破流水顺序固定',
    ).toEqual(['breakBase', 'elementBreak', 'breakEffect', 'toughnessLength', 'breakBonus', 'vuln', 'defense', 'resist', 'reduce', 'toughness']);
    const breakLast = (await breakRows.last().locator('.nk-formula-flow__run').innerText()).trim();
    const breakTotal = (await page.locator('#formula-break [data-role="break-total"]').innerText()).trim();
    expect(Math.abs(toNumber(breakLast) - toNumber(breakTotal)), '击破流水末值必须等于击破伤害读数').toBeLessThanOrEqual(0.1);

    await expect(page.locator('#formula-break [data-role="break-element"]'), '7 个击破属性').toHaveCount(7);
    await expect(page.locator('#formula-break [data-role="break-toughness"]'), '5 档韧性条').toHaveCount(5);
    const breakBefore = (await page.locator('#formula-break [data-role="break-total"]').innerText()).trim();
    await page.locator('#formula-break [data-role="break-element"][data-value="Wind"]').click();
    await expect(page.locator('#formula-break [data-role="break-total"]'), '换攻击方属性后击破伤害必须变化').not.toHaveText(breakBefore);
    await page.locator('#formula-break [data-role="break-element"][data-value="Physical"]').click();

    const lengthBefore = (await page.locator('#formula-break [data-role="break-length"]').innerText()).trim();
    await page.locator('#formula-break [data-role="break-toughness"][data-value="360"]').click();
    await expect(page.locator('#formula-break [data-role="break-length"]'), '韧性条越长长度系数越大').not.toHaveText(lengthBefore);
    await page.locator('#formula-break [data-role="break-toughness"][data-value="60"]').click();

    const superSwitch = page.locator('#formula-break button[data-role="super-break"]');
    await expect(superSwitch).toHaveAttribute('aria-checked', 'false');
    await superSwitch.click();
    await expect(superSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#formula-break .nk-formula-flow'), '开启超击破后出现第二份流水').toHaveCount(2);
    const superRows = page.locator('#formula-break .nk-formula-flow').nth(1).locator('.nk-formula-flow__row[data-step]');
    await expect(superRows, '超击破流水 10 行').toHaveCount(10);
    await expect(superRows.last().locator('.nk-formula-flow__factor'), '超击破韧性区必须 ×1').toHaveText('×1');
    const superLast = (await superRows.last().locator('.nk-formula-flow__run').innerText()).trim();
    const superTotal = (await page.locator('#formula-break [data-role="super-break-total"]').innerText()).trim();
    expect(Math.abs(toNumber(superLast) - toNumber(superTotal)), '超击破流水末值必须等于超击破伤害读数').toBeLessThanOrEqual(0.1);
    await superSwitch.click();

    const elationRows = page.locator('#formula-elation .nk-formula-flow__row[data-step]');
    await expect(elationRows, '欢愉流水 11 行').toHaveCount(11);
    const elationLast = (await elationRows.last().locator('.nk-formula-flow__run').innerText()).trim();
    const elationTotal = (await page.locator('#formula-elation [data-role="elation-total"]').innerText()).trim();
    expect(Math.abs(toNumber(elationLast) - toNumber(elationTotal)), '欢愉流水末值必须等于暴击伤害读数').toBeLessThanOrEqual(0.1);
    await expect(page.locator('#formula-elation [data-role="elation-expected"]')).toHaveText(/\d/);
    await expect(page.locator('#formula-elation [data-role="elation-not-included"]'), '必须显式列出不参与的乘区')
      .toContainText(dict['formula.elation.notIncluded']);

    const elationBeforeBonus = (await page.locator('#formula-elation [data-role="elation-total"]').innerText()).trim();
    const bonusField = page.locator('#formula-calc input[data-role="bonus"]');
    await bonusField.fill('250');
    await bonusField.blur();
    await expect(page.locator('#formula-elation [data-role="elation-total"]'), '欢愉伤害不吃增伤区').toHaveText(elationBeforeBonus);

    await expect(page.locator('#formula-true .nk-formula-rules__item'), '真实伤害 5 条规则').toHaveCount(5);
    const trueOriginal = page.locator('#formula-true input[data-role="true-original"]');
    const trueRatio = page.locator('#formula-true input[data-role="true-ratio"]');
    await trueOriginal.fill('2000');
    await trueOriginal.blur();
    await trueRatio.fill('50');
    await trueRatio.blur();
    await expect(page.locator('#formula-true [data-role="true-added"]'), '附加 = 原伤害 × 比例').toHaveText(/1,000/);
    await expect(page.locator('#formula-true [data-role="true-total"]'), '总计 = 原伤害 × (1 + 比例)').toHaveText(/3,000/);
    await expect(page.locator('#formula-true [data-role="true-gain"]')).toHaveText('+50%');
    const bonusGain = (await page.locator('#formula-true [data-role="true-bonus-gain"]').innerText()).trim();
    const trueGain = (await page.locator('#formula-true [data-role="true-true-gain"]').innerText()).trim();
    expect(bonusGain, '两条路线并排且数值不同').not.toBe(trueGain);
    expect(toNumber(bonusGain), '增伤路线的收益必须低于同比例的真实伤害').toBeLessThan(toNumber(trueGain));

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/formula：390×844 触控目标 ≥44px、计算器结果置顶吸顶、分区导航吸顶', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/formula');
    await waitForSettled(page);

    const small = await page.locator('#nk-formula-app').evaluate((root) => {
      const targets = [
        ...root.querySelectorAll(
          'input[type=range], input[type=number], select, .nk-formula-number__step, .nk-formula-tab, .nk-formula-chip, .nk-formula-switch, .nk-formula-secnav .nk-secnav__btn',
        ),
      ];
      return targets
        .map((el) => {
          const box = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), cls: String(el.className), h: Math.round(box.height) };
        })
        .filter((item) => item.h > 0 && item.h < 44)
        .slice(0, 8);
    });
    expect(small, '移动端可点目标必须 ≥44px').toEqual([]);

    const order = await page.locator('#formula-calc .nk-formula-calc__output').evaluate((el) => {
      const controls = el.parentElement!.querySelector('.nk-formula-calc__group')!;
      return {
        order: getComputedStyle(el).order,
        position: getComputedStyle(el).position,
        outputTop: Math.round(el.getBoundingClientRect().top),
        controlsTop: Math.round(controls.getBoundingClientRect().top),
      };
    });
    expect(order.order, '<1024 时结果区必须 order:-1').toBe('-1');
    expect(order.outputTop, '<1024 时结果区必须显示在控件之前').toBeLessThan(order.controlsTop);
    expect(order.position, '结果区必须吸顶').toBe('sticky');

    await page.evaluate(() => document.getElementById('formula-calc')?.scrollIntoView());
    await page.waitForTimeout(600);
    const nav = await page.locator('.nk-formula-secnav').evaluate((el) => {
      const box = el.getBoundingClientRect();
      return { top: Math.round(box.top), height: Math.round(box.height), position: getComputedStyle(el).position };
    });
    expect(nav.position, '分区导航必须 sticky').toBe('sticky');
    expect(nav.height, '吸顶后导航不得塌陷').toBeGreaterThanOrEqual(44);
    expect(Math.abs(nav.top), '吸顶后导航必须贴在滚动容器顶部').toBeLessThanOrEqual(6);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
