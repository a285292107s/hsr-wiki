<script setup lang="ts">
/**
 * 敌方完整信息卡（星启 / 末日幻影纯 Boss 战共用）：
 * 头像 + 分类徽章 + 阵营/韧性标签 + 弱点/抗性行 + 图鉴介绍 + 技能胶囊。
 * 样式位于 endgame-detail.css（.nk-egd-mon 系，随终局详情路由懒加载）。
 */
import type { MazeMonsterInfo } from '../../services/types';
import { ELEM, MON_RANK } from '../../lib/constants';
import { escHtml, elementIconUrl, fmtDesc } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';

/** 图鉴介绍：fmtDesc 处理字面 \n → <br>（与敌对物种详情页同源；数据源为字面 \n 非真实换行，pre-line 不生效） */
function introHtml(m: MazeMonsterInfo): string {
  return fmtDesc(m.intro, []);
}

defineProps<{ monster: MazeMonsterInfo }>();

/** 元素图标行 */
function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
      : '';
  }).join('');
}

/** 敌方分类中文（未知分类返回空 → 不渲染徽章） */
function monRank(rank?: string): string {
  return rank ? (MON_RANK[rank] || '') : '';
}

/** 伤害抗性文本：`火 20% / 冰 60%`（属性 → ELEM 中文；用于 title 提示） */
function resistText(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => `${ELEM[d] || d} ${Math.round(v * 100)}%`).join(' / ');
}

/** 伤害抗性图标行：属性图标 + 百分比（与弱点行同款元素图标） */
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

/** 敌方悬浮提示：名称 · 分类 · 阵营 · 韧性 · 弱点 · 抗性 */
function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = monRank(m.rank);
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(`韧性 ${m.stance}`);
  if (m.weak?.length) parts.push(`弱点：${m.weak.map((d) => ELEM[d] || d).join(' / ')}`);
  const rs = resistText(m);
  if (rs) parts.push(`抗性：${rs}`);
  return parts.join(' · ');
}
</script>

<template>
  <article class="nk-egd-mon" :title="monTitle(monster)">
    <div class="nk-egd-mon__head">
      <div class="nk-egd-mon__figure">
        <span v-if="monRank(monster.rank)" class="nk-egd-mon__rank" :class="`nk-egd-mon__rank--${monster.rank}`">{{ monRank(monster.rank) }}</span>
        <img
          class="nk-egd-mon__img"
          :src="monster.icon ? cdnUri('monstermiddleicon', `${monster.icon}.webp`) : ''"
          :alt="monster.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
      </div>
      <div class="nk-egd-mon__meta">
        <span class="nk-egd-mon__name">{{ monster.name }}</span>
        <span class="nk-egd-mon__tags">
          <span v-if="monster.camp" class="nk-egd-mon__tag">{{ monster.camp }}</span>
          <span v-if="monster.stance" class="nk-egd-mon__tag">韧性 {{ monster.stance }}</span>
        </span>
      </div>
    </div>
    <div v-if="monster.weak?.length || resistText(monster)" class="nk-egd-mon__rows">
      <div v-if="monster.weak?.length" class="nk-egd-mon__row">
        <span class="nk-egd-mon__label">弱点</span>
        <span class="nk-egd-mon__weak" v-html="elemRow(monster.weak)"></span>
      </div>
      <div v-if="resistText(monster)" class="nk-egd-mon__row">
        <span class="nk-egd-mon__label">抗性</span>
        <span class="nk-egd-mon__resist" v-html="resistRowHtml(monster)"></span>
      </div>
    </div>
    <p v-if="monster.intro" class="nk-egd-mon__intro" v-html="introHtml(monster)"></p>
    <div v-if="monster.skills?.length" class="nk-egd-mon__skills">
      <span v-for="s in monster.skills" :key="s.name" class="nk-egd-mon__skill" :title="s.tag ? `${s.name} · ${s.tag}` : s.name">{{ s.name }}</span>
    </div>
  </article>
</template>
