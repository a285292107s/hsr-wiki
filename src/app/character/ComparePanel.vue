<script setup lang="ts">
/**
 * 对比面板（Comparison Mode，术语见 CONTEXT.md）：基座角色的技能/星魂/行迹变化视图。
 * 由 CharacterView 按区块各挂一个实例（sections 限定渲染范围），
 * 仅展示 buildCompare 过滤出的真实变化条目，未变化条目不出卡。
 */
import { computed } from 'vue';
import CompareSkillCard from './CompareSkillCard.vue';
import { buildCompare } from '../../lib/compare';
import { fmtDesc, iconUrl, eidolonIconUrl } from '../../lib/format';
import { SECTION_IDX } from './sections';
import type { CharacterData } from '../../services/types';
import type { CompareResult, RankDiff, TreeDiff } from '../../lib/compare';

const props = withDefaults(
  defineProps<{
    /** 基座角色数据（对比的「原始」侧；强化包随其 enhanced 字段） */
    base: CharacterData | null;
    /** 当前强化键（对比对象；null 时面板无内容） */
    enhKey: string | null;
    charId: string;
    /** 渲染区块子集（skills / eidolons / talents） */
    sections?: string[];
  }>(),
  { sections: () => ['skills', 'eidolons', 'talents'] },
);

/** 对比结果（含真实变化过滤；无强化键/无增强包 → 空） */
const cmp = computed<CompareResult>(() =>
  props.enhKey ? buildCompare(props.base, props.enhKey) : { skills: [], ranks: [], trees: [], spChanged: false },
);

/* ─── 星魂变化卡（E 编号 + 名称 + 双段描述） ─── */

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

/* ─── 行迹变化卡（名称 + 双段描述；名称变化时名称栏双段） ─── */

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

/* ─── sp_need 变化提示（hero 区块联动展示） ─── */
const spNote = computed<string | null>(() => {
  if (!cmp.value.spChanged || !props.base) return null;
  const geed = props.base.enhanced?.[props.enhKey || '']?.sp_need ?? null;
  return `${props.base.sp_need ?? '—'} → ${geed ?? '—'}`;
});
</script>

<template>
  <!-- 技能变化 -->
  <template v-if="sections.includes('skills')">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.skills }}</span>SKILLS<span class="nk-cmp-count">变化 {{ cmp.skills.length }} 项</span></div>
    <div v-if="spNote" class="nk-cmp-spnote">终结技能量需求：{{ spNote }}</div>
    <template v-if="cmp.skills.length">
      <CompareSkillCard
        v-for="d in cmp.skills"
        :key="d.id"
        :diff="d"
        :char-id="charId"
        :char-data="base"
      />
    </template>
    <div v-else class="nk-cmp-empty">本区块无变化</div>
  </template>

  <!-- 星魂变化 -->
  <template v-if="sections.includes('eidolons')">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.eidolons }}</span>EIDOLONS<span class="nk-cmp-count">变化 {{ cmp.ranks.length }} 项</span></div>
    <template v-if="rankCards.length">
      <div
        v-for="c in rankCards"
        :key="c.num"
        class="nk-cmp-rank"
      >
        <span class="nk-cmp-badge">变化</span>
        <div class="nk-cmp-rank__head">
          <img class="nk-cmp-rank__icon" :src="c.img" :alt="c.name" loading="lazy">
          <div class="nk-cmp-rank__info">
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
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">原始</span>
          <div class="nk-cmp__orig" v-html="c.baseHtml"></div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">强化</span>
          <div class="nk-cmp__enh" v-html="c.enhHtml"></div>
        </div>
      </div>
    </template>
    <div v-else class="nk-cmp-empty">本区块无变化</div>
  </template>

  <!-- 行迹变化 -->
  <template v-if="sections.includes('talents')">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.talents }}</span>TALENTS<span class="nk-cmp-count">变化 {{ cmp.trees.length }} 项</span></div>
    <template v-if="treeCards.length">
        <div v-for="c in treeCards"
        :key="c.diff.anchor + '|' + c.diff.level"
        class="nk-cmp-tree"
      >
        <span class="nk-cmp-badge">变化</span>
        <div class="nk-skill__title-row">
          <img v-if="c.icon" class="nk-skill__icon" :src="c.icon">
          <div class="nk-skill__title">
            <span class="nk-skill__name">
              <template v-if="c.nameChanged">
                <span class="nk-cmp__orig-text">{{ c.baseName }}</span>
                <span class="nk-cmp__arrow">→</span>
                <span class="nk-cmp__enh-text">{{ c.name }}</span>
              </template>
              <template v-else>{{ c.name }}</template>
            </span>
            <span class="nk-skill__tag">附加能力<template v-if="c.levelLabel"> · {{ c.levelLabel }}</template></span>
          </div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">原始</span>
          <div class="nk-cmp__orig" v-html="c.baseHtml"></div>
        </div>
        <div class="nk-cmp-row">
          <span class="nk-cmp-tag">强化</span>
          <div class="nk-cmp__enh" v-html="c.enhHtml"></div>
        </div>
      </div>
    </template>
    <div v-else class="nk-cmp-empty">本区块无变化</div>
  </template>
</template>
