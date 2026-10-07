<script setup lang="ts">
import EndgameSummons from '../endgame/EndgameSummons.vue';
import EndgameBossGuide from '../endgame/EndgameBossGuide.vue';
import { pollutionLabel } from '../endgame/pollution';
import type { MazeBossGuide, MazeMonsterInfo } from '../../services/types';
import { ELEM, MON_RANK } from '../../lib/constants';
import { escHtml, elementIconUrl } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';

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
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
      : '';
  }).join('');
}

function monRank(rank?: string): string {
  return rank ? (MON_RANK[rank] || '') : '';
}

function resistText(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => `${ELEM[d] || d} ${Math.round(v * 100)}%`).join(' / ');
}

function resistRowHtml(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => {
    const src = elementIconUrl(d);
    if (!src) return '';
    const label = ELEM[d] || d;
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
    const label = `效果抵抗 ${pct}`;
    return `<span class="nk-egd-mon__resitem" title="${escHtml(label)}"><img class="nk-egd-mon__immicon" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="" aria-hidden="true" loading="lazy"><span class="nk-egd-mon__resval">${pct}</span></span>`;
  }).join('');
}

function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = monRank(m.rank);
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(`韧性 ${m.stance}`);
  if (m.speed) parts.push(`速度 ${m.speed}`);
  if (m.weak?.length) parts.push(`弱点：${m.weak.map((d) => ELEM[d] || d).join(' / ')}`);
  const rs = resistText(m);
  if (rs) parts.push(`抗性：${rs}`);
  return parts.join(' · ');
}
</script>

<template>
  <article class="nk-egd-mon" :title="monTitle(monster)">
    <!-- 立绘列（左）：monstermiddleicon 是 376×512 竖版全身像（透明底、Alpha 框紧贴上下边），
         故按原比例整幅铺满列宽，不做圆形裁切——圆形会把竖长立绘裁掉上下大半。
         甲级徽标骑在立绘列左上角。 -->
    <div class="nk-egd-mon__art">
      <span v-if="monRank(monster.rank)" class="nk-egd-mon__rank" :class="`nk-egd-mon__rank--${monster.rank}`">{{ monRank(monster.rank) }}</span>
      <router-link
        class="nk-egd-mon__figlink"
        :to="`/monster/${monster.tpl || monster.id}`"
        :title="`查看 ${monster.name} 详情`"
        :aria-label="`查看 ${monster.name} 详情`"
      >
        <img
          class="nk-egd-mon__img"
          :src="monster.icon ? cdnUri('monstermiddleicon', `${monster.icon}.webp`) : ''"
          :alt="monster.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
      </router-link>
    </div>
    <!-- 数据列（右）：名称 → 标签 → 弱点/抗性/效果抵抗 → 首领机制 → 技能 → 召唤物 -->
    <div class="nk-egd-mon__data">
      <div class="nk-egd-mon__meta">
        <span class="nk-egd-mon__name">{{ monster.name }}</span>
        <span class="nk-egd-mon__tags">
          <span v-if="polluted" class="nk-egd-pollchip" :data-level="polluted">{{ pollutionLabel({ level: polluted }) }}</span>
          <span v-if="monster.camp" class="nk-egd-mon__tag">{{ monster.camp }}</span>
          <span v-if="monster.stance" class="nk-egd-mon__tag">韧性 {{ monster.stance }}</span>
          <span v-if="monster.speed" class="nk-egd-mon__tag">速度 {{ monster.speed }}</span>
        </span>
      </div>
      <!-- 弱点/抗性行：有数据展示图标，无数据显式占位“无”（源数据空 = 游戏内无弱点/全 0% 抗性，
           如蕉研组本体等召唤型机制怪；避免误读为数据缺失） -->
      <div v-if="monster.name" class="nk-egd-mon__rows">
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">弱点</span>
          <span v-if="monster.weak?.length" class="nk-egd-mon__weak" v-html="elemRow(monster.weak)"></span>
          <span v-else class="nk-egd-mon__none">无</span>
        </div>
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">抗性</span>
          <span v-if="resistText(monster)" class="nk-egd-mon__resist" v-html="resistRowHtml(monster)"></span>
          <span v-else class="nk-egd-mon__none">无</span>
        </div>
        <div v-if="monster.debuff_resist?.length" class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">效果抵抗</span>
          <span class="nk-egd-mon__resist" v-html="debuffResistHtml(monster)"></span>
        </div>
      </div>
      <EndgameBossGuide v-if="guide" :guide="guide" />
      <div v-if="monster.skills?.length" class="nk-egd-mon__skills">
        <span v-for="s in monster.skills" :key="s.name" class="nk-egd-mon__skill" :title="s.tag ? `${s.name} · ${s.tag}` : s.name">{{ s.name }}</span>
      </div>
      <EndgameSummons :items="monster.summons || []" />
    </div>
  </article>
</template>
