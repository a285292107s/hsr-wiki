<script setup lang="ts">
import { computed } from 'vue';
import CompareSkillCard from './CompareSkillCard.vue';
import { buildCompare } from '../../lib/compare';
import { fmtDesc, iconUrl, iconImgAttrs, eidolonIconUrl } from '../../lib/format';
import { SECTION_IDX } from './sections';
import type { CharacterData } from '../../services/types';
import type { CompareResult, RankDiff, TreeDiff } from '../../lib/compare';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 文案统一走词典（脚本内不易用 useI18n；见 i18n.ts 的 translate） */


const props = withDefaults(
  defineProps<{
    /** 基座角色数据（对比的「原始」侧；强化包随其 enhanced 字段） */
    base: CharacterData | null;
    /** 当前强化键（对比对象；null 时面板无内容） */
    enhKey: string | null;
    charId: string;
    sections?: string[];
  }>(),
  { sections: () => ['skills', 'eidolons', 'talents'] },
);

const cmp = computed<CompareResult>(() =>
  props.enhKey ? buildCompare(props.base, props.enhKey) : { skills: [], ranks: [], trees: [], spChanged: false },
);

interface RankCard {
  diff: RankDiff;
  num: string;
  name: string;
  img: string;
  baseHtml: string;
  enhHtml: string;
  /** 名称是否变化（数据上星魂名不变，字段对比已覆盖；占位防呆） */
  nameChanged: boolean;
}
const rankCards = computed<RankCard[]>(() =>
  cmp.value.ranks.map((d) => ({
    diff: d,
    num: d.key,
    name: d.enh.name,
    img: eidolonIconUrl(props.charId, d.key),
    baseHtml: fmtDesc(d.base.desc, d.base.param_list || []),
    enhHtml: fmtDesc(d.enh.desc, d.enh.param_list || []),
    nameChanged: d.base.name !== d.enh.name,
  })),
);

interface TreeCard {
  diff: TreeDiff;
  name: string;
  baseName: string;
  icon: string;
  baseHtml: string;
  enhHtml: string;
  nameChanged: boolean;
  /** 行迹节点多等级时显示等级徽章（绝大多数为 Lv.1） */
  levelLabel: string;
}
const treeCards = computed<TreeCard[]>(() =>
  cmp.value.trees.map((d) => ({
    diff: d,
    name: d.enh.point_name || d.base.point_name || d.anchor,
    baseName: d.base.point_name || d.anchor,
    icon: (d.base.icon || d.enh.icon) ? iconUrl(d.base.icon || d.enh.icon || '') : '',
    baseHtml: fmtDesc(d.base.point_desc, d.base.param_list || []),
    enhHtml: fmtDesc(d.enh.point_desc, d.enh.param_list || []),
    nameChanged: d.base.point_name !== d.enh.point_name,
    levelLabel: d.level === '1' ? '' : `Lv.${d.level}`,
  })),
);

const spNote = computed<string | null>(() => {
  if (!cmp.value.spChanged || !props.base) return null;
  const geed = props.base.enhanced?.[props.enhKey || '']?.sp_need ?? null;
  return `${props.base.sp_need ?? '—'} → ${geed ?? '—'}`;
});
</script>

<template>
  <template v-if="sections.includes('skills')">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.skills }}</span>SKILLS<span class="nk-cmp-count">{{ t('cmp.changedCount', { n: cmp.skills.length }) }}</span></h2>
    <div v-if="spNote" class="nk-cmp-spnote">{{ t('cmp.spNote', { v: spNote }) }}</div>
    <template v-if="cmp.skills.length">
      <CompareSkillCard
        v-for="d in cmp.skills"
        :key="d.id"
        :diff="d"
        :char-id="charId"
        :char-data="base"
      />
    </template>
    <div v-else class="nk-cmp-empty">{{ t('cmp.noChange') }}</div>
  </template>

  <template v-if="sections.includes('eidolons')">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.eidolons }}</span>EIDOLONS<span class="nk-cmp-count">{{ t('cmp.changedCount', { n: cmp.ranks.length }) }}</span></h2>
    <template v-if="rankCards.length">
      <div
        v-for="c in rankCards"
        :key="c.num"
        class="nk-cmp-rank"
      >
        <span class="nk-cmp-badge">{{ t('cmp.changed') }}</span>
        <div class="nk-cmp-rank__head">
          <img class="nk-cmp-rank__icon" :src="c.img" :alt="c.name" loading="lazy">
          <div class="nk-cmp-rank__meta">
            <span class="nk-cmp-rank__num">E{{ c.num }}</span>
            <span class="nk-cmp-rank__name">
              <template v-if="c.nameChanged">
                <span class="nk-cmp__orig-text">{{ c.diff.base.name }}</span>
                <span class="nk-cmp__arrow">→</span>
                <span class="nk-cmp__enh-text">{{ c.name }}</span>
              </template>
              <template v-else>{{ c.name }}</template>
            </span>
          </div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">{{ t('char.state.original') }}</span>
          <div class="nk-cmp__orig" v-html="c.baseHtml"></div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">{{ t('cmp.enhanced') }}</span>
          <div class="nk-cmp__enh" v-html="c.enhHtml"></div>
        </div>
      </div>
    </template>
    <div v-else class="nk-cmp-empty">{{ t('cmp.noChange') }}</div>
  </template>

  <template v-if="sections.includes('talents')">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.talents }}</span>TALENTS<span class="nk-cmp-count">{{ t('cmp.changedCount', { n: cmp.trees.length }) }}</span></h2>
    <template v-if="treeCards.length">
      <div
        v-for="c in treeCards"
        :key="c.diff.anchor + '|' + c.diff.level"
        class="nk-cmp-tree"
      >
        <span class="nk-cmp-badge">{{ t('cmp.changed') }}</span>
        <div class="nk-skill__title-row">
          <img v-if="c.icon" class="nk-skill__icon" v-bind="iconImgAttrs(c.icon)" alt="">
          <div class="nk-skill__title">
            <span class="nk-skill__name">
              <template v-if="c.nameChanged">
                <span class="nk-cmp__orig-text">{{ c.baseName }}</span>
                <span class="nk-cmp__arrow">→</span>
                <span class="nk-cmp__enh-text">{{ c.name }}</span>
              </template>
              <template v-else>{{ c.name }}</template>
            </span>
            <span class="nk-skill__tag">{{ t('cmp.talentsTag') }}<template v-if="c.levelLabel"> · {{ c.levelLabel }}</template></span>
          </div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">{{ t('char.state.original') }}</span>
          <div class="nk-cmp__orig" v-html="c.baseHtml"></div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">{{ t('cmp.enhanced') }}</span>
          <div class="nk-cmp__enh" v-html="c.enhHtml"></div>
        </div>
      </div>
    </template>
    <div v-else class="nk-cmp-empty">{{ t('cmp.noChange') }}</div>
  </template>
</template>
