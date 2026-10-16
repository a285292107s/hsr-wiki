<script setup lang="ts">
import { computed } from 'vue';
import EndgameSummons from '../endgame/EndgameSummons.vue';
import { elemLabel } from '../../lib/enum-labels';
import EndgameBossGuide from '../endgame/EndgameBossGuide.vue';
import { pollutionLabel } from '../endgame/pollution';
import type { MazeBossGuide, MazeMonsterInfo } from '../../services/types';

import { monsterRankKey } from '../../lib/enum-labels';
import { escHtml, elementIconUrl, fmtBigNumber } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;

/** 技能条目（`MazeMonsterInfo.skills` 的元素形态，带上游的战斗阶段门控） */
type MonsterSkill = NonNullable<MazeMonsterInfo['skills']>[number];
const props = defineProps<{
  monster: MazeMonsterInfo;
  /** 该敌方**实例**受「贪饕」污染时的污染等级（同场次 InvasionID，1–3）；未受污染不传。
   *  判据是实例 ID 命中（与转换器 `_polluted_index` 同源）——污染名单按实例登记，
   *  按模板匹配会把同模板的未污染实例一并标错。 */
  polluted?: number;
  /** 该敌方的首领机制（由赛季级 `boss_guides` 按 `monster.boss_guide` 指针取，见 EndgameBossGuide） */
  guide?: MazeBossGuide;
}>();

function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(elemLabel(d))}" title="${escHtml(elemLabel(d))}" loading="lazy">`
      : '';
  }).join('');
}

function monRank(rank?: string): string {
  return rank ? translate(monsterRankKey(rank)) : '';
}

function resistText(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => `${elemLabel(d)} ${Math.round(v * 100)}%`).join(' / ');
}

function resistRowHtml(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => {
    const src = elementIconUrl(d);
    if (!src) return '';
    const label = elemLabel(d);
    const pct = `${Math.round(v * 100)}%`;
    return `<span class="nk-egd-mon__resitem"><img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(label)}" title="${escHtml(label)} ${pct}" loading="lazy"><span class="nk-egd-mon__resval">${pct}</span></span>`;
  }).join('');
}

/** 效果抵抗行（`MonsterConfig.DebuffResist` × `MonsterStatusResistanceType`）：上游只有免疫图标、
 *  **没有任何文字名**，故每项只出「图标 + 百分比」——图标是纯白字形（透明底），故只作装饰
 *  （`alt=""` + `aria-hidden`），可读信息由行首标签「效果抵抗」与百分比承担，title 供鼠标查看。 */
function debuffResistHtml(m: MazeMonsterInfo): string {
  return (m.debuff_resist || []).map((d) => {
    const src = cdnUri('statusimmune', `${d.icon}.webp`);
    const pct = `${Math.round(d.value * 100)}%`;
    const label = t('card.effectRes', { v: pct });
    return `<span class="nk-egd-mon__resitem" title="${escHtml(label)}"><img class="nk-egd-mon__immicon" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="" aria-hidden="true" loading="lazy"><span class="nk-egd-mon__resval">${pct}</span></span>`;
  }).join('');
}

function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = monRank(m.rank);
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(t('card.value.stance', { v: m.stance }));
  if (m.speed) parts.push(t('card.value.speed', { v: m.speed }));
  if (m.weak?.length) parts.push(t('card.weak', { list: m.weak.map((d) => elemLabel(d)).join(' / ') }));
  const rs = resistText(m);
  if (rs) parts.push(t('card.resist', { list: rs }));
  return parts.join(' · ');
}

/** 技能的战斗阶段（`phase_list`，阶段号从 1 起）：只认正数——上游有 1 条记为 `[0]`，
 *  是外键哨兵不是阶段（会给它渲染出「阶段 0」）。空表 = 该技能无阶段门控。 */
function skillPhases(list?: number[]): number[] {
  return (list || []).filter((p) => p > 0);
}

/** 技能按时段分组：**只在真的跨 ≥2 个阶段时**拆行——实测 2289/2632 条怪物的技能只吃阶段 1，
 *  给它们加一个「阶段 1」小标题是空话（同「1 目标 1 档不逐目标标星」的判据）。
 *  **每行 = 该阶段可用技能的全集**（`PhaseList` 的字面含义）⇒ 全阶段技能会在多行各出现一次，
 *  这是刻意的：玩家要的是「进入阶段 N 会面对哪些技能」，少列会低估该阶段的威胁。
 *  无阶段门控的技能（空表 / 哨兵 0）恒落在 `phase: null` 的尾组，不因分组而消失。 */
const skillGroups = computed<{ phase: number | null; skills: MonsterSkill[] }[]>(() => {
  const skills = props.monster.skills || [];
  const phases = [...new Set(skills.flatMap((s) => skillPhases(s.phase_list)))]
    .sort((a, b) => a - b);
  if (phases.length < 2) return [{ phase: null, skills }];
  const groups: { phase: number | null; skills: MonsterSkill[] }[] = phases.map((p) => ({
    phase: p,
    skills: skills.filter((s) => skillPhases(s.phase_list).includes(p)),
  }));
  const rest = skills.filter((s) => !skillPhases(s.phase_list).length);
  if (rest.length) groups.push({ phase: null, skills: rest });
  return groups;
});
/** 是否走分组形态（任一组带阶段号）；否则保持原来的平铺 chip 行 */
const skillsGrouped = computed(() => skillGroups.value.some((g) => g.phase !== null));
</script>

<template>
  <article class="nk-egd-mon" :title="monTitle(monster)">
    <!-- 立绘列（左）：monstermiddleicon 是 376×512 竖版全身像（透明底、Alpha 框紧贴上下边），
         故按原比例整幅铺满列宽，不做圆形裁切——圆形会把竖长立绘裁掉上下大半。
         甲级徽标骑在立绘列左上角；**关卡内 HP 紧贴立绘下方**（用户裁决，ADR 0055）；
         污染徽标挂在立绘列内、HP 之后（用户裁决，不与右侧数据标签抢位）。 -->
    <div class="nk-egd-mon__art">
      <span v-if="monRank(monster.rank)" class="nk-egd-mon__rank" :class="`nk-egd-mon__rank--${monster.rank}`">{{ monRank(monster.rank) }}</span>
      <router-link
        class="nk-egd-mon__figlink"
        :to="`/monster/${monster.tpl || monster.id}`"
        :title="t('card.viewDetail', { name: monster.name })"
        :aria-label="t('card.viewDetail', { name: monster.name })"
      >
        <img
          class="nk-egd-mon__img"
          :src="monster.icon ? cdnUri('monstermiddleicon', `${monster.icon}.webp`) : ''"
          :alt="monster.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
      </router-link>
      <!-- 关卡内 HP：转换器已按该关卡的等级 / 难度组 / 精英组算好单值（ADR 0055），
           前端只按站点语言选数制呈现；缺键（无等级语境）即不显示，不显示 0 -->
      <span v-if="monster.hp != null" class="nk-egd-mon__hp">
        <span class="nk-egd-mon__hp-label">{{ t('catalog.sig.hp') }}</span>
        <span class="nk-egd-mon__hp-val">{{ fmtBigNumber(monster.hp) }}</span>
      </span>
      <span v-if="polluted" class="nk-egd-pollchip" :data-level="polluted">{{ pollutionLabel({ level: polluted }) }}</span>
    </div>
    <!-- 数据列（右）：名称 → 标签 → 弱点/抗性/效果抵抗 → 首领机制 → 技能 → 召唤物 -->
    <div class="nk-egd-mon__data">
      <div class="nk-egd-mon__meta">
        <span class="nk-egd-mon__name">{{ monster.name }}</span>
        <span class="nk-egd-mon__tags">
          <span v-if="monster.camp" class="nk-egd-mon__tag">{{ monster.camp }}</span>
          <span v-if="monster.stance" class="nk-egd-mon__tag">{{ t('card.value.stance', { v: monster.stance }) }}</span>
          <span v-if="monster.speed" class="nk-egd-mon__tag">{{ t('card.value.speed', { v: monster.speed }) }}</span>
        </span>
      </div>
      <!-- 弱点/抗性行：有数据展示图标，无数据显式占位“无”（源数据空 = 游戏内无弱点/全 0% 抗性，
           如蕉研组本体等召唤型机制怪；避免误读为数据缺失） -->
      <div v-if="monster.name" class="nk-egd-mon__rows">
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('catalog.filter.weak') }}</span>
          <span v-if="monster.weak?.length" class="nk-egd-mon__weak" v-html="elemRow(monster.weak)"></span>
          <span v-else class="nk-egd-mon__none">{{ t('common.none') }}</span>
        </div>
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('catalog.sig.resist') }}</span>
          <span v-if="resistText(monster)" class="nk-egd-mon__resist" v-html="resistRowHtml(monster)"></span>
          <span v-else class="nk-egd-mon__none">{{ t('common.none') }}</span>
        </div>
        <div v-if="monster.debuff_resist?.length" class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('card.effectResLabel') }}</span>
          <span class="nk-egd-mon__resist" v-html="debuffResistHtml(monster)"></span>
        </div>
      </div>
      <EndgameBossGuide v-if="guide" :guide="guide" />
      <div
        v-if="monster.skills?.length"
        class="nk-egd-mon__skills"
        :class="{ 'nk-egd-mon__skills--grouped': skillsGrouped }"
      >
        <!-- 跨 ≥2 个阶段时逐阶段拆行（阶段号文案取词典 `mob.stage`，与图鉴页阶段机制同键）；
             其余情况只有一个无名组，`display: contents` 让它对布局透明 ⇒ 与原来的平铺完全一致 -->
        <div v-for="g in skillGroups" :key="g.phase ?? 'rest'" class="nk-egd-mon__skillgroup">
          <span v-if="g.phase !== null" class="nk-egd-mon__skillphase">{{ t('mob.stage', { n: g.phase }) }}</span>
          <span
            v-for="s in g.skills"
            :key="s.name"
            class="nk-egd-mon__skill"
            :title="s.tag ? `${s.name} · ${s.tag}` : s.name"
          >{{ s.name }}</span>
        </div>
      </div>
      <EndgameSummons :items="monster.summons || []" />
    </div>
  </article>
</template>
