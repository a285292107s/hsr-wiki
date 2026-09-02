<script setup lang="ts">
/**
 * 概览面板：角色档案（CV）+ 总属性加成 diff + TALENTS 附加能力 diff + 角色故事手风琴。
 * 一句话介绍位于 Hero 面板头部下方（CharHero）；基础属性已迁出至 00 属性区块（StatsPanel）。
 * 平铺布局下通过 sections 渲染区块子集（各区块可独立排列在页面序列中）。
 * openStory 状态由面板内部持有（加载期父模板整体卸载，切换角色自动重置）。
 */
import { computed, ref } from 'vue';
import { extraTerms } from './utils';
import { escHtml, fmtDesc, iconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { PROP_ICON, PROP_NAMES } from '../../lib/constants';
import { SECTION_IDX, hasBonusNodes, hasProfile, hasStories, hasTalentNodes } from './sections';
import type { CharacterData, SkillExtra, SkillTree } from '../../services/types';

type OverviewSection = 'profile' | 'bonuses' | 'talents' | 'stories';

const props = withDefaults(
  defineProps<{
    d: CharacterData;
    /** 渲染区块子集（平铺拆分布局用；默认全部） */
    sections?: OverviewSection[];
  }>(),
  { sections: () => ['profile', 'bonuses', 'talents', 'stories'] },
);

/* ─── 档案 / 故事 ─── */

interface ProfileRow { label: string; value: string }
const profileRows = computed<ProfileRow[]>(() => {
  const info = props.d.chara_info;
  if (!info) return [];
  const rows: ProfileRow[] = [];
  const va = info.va;
  if (va) {
    const defs: [string, string | null | undefined][] = [
      ['CV · 中文', va.chinese], ['CV · 日语', va.japanese],
      ['CV · 韩语', va.korean], ['CV · 英语', va.english],
    ];
    for (const [label, v] of defs) {
      if (v) rows.push({ label, value: v });
    }
  }
  return rows;
});

interface StoryEntry { key: string; idx: number; html: string }
const storyEntries = computed<StoryEntry[]>(() => {
  const info = props.d.chara_info;
  if (!info || !info.stories) return [];
  return Object.entries(info.stories)
    .filter(([, v]) => !!v)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, v]) => ({
      key,
      idx: Number(key) + 1,
      html: escHtml(v as string).replace(/\\n/g, '<br>'),
    }));
});
const openStory = ref<string | null>(null);
function toggleStory(key: string): void {
  openStory.value = openStory.value === key ? null : key;
}

/* ─── 总属性加成（行迹树聚合） ─── */

interface AttrBonus { name: string; v: string; icon: string }

/** 聚合行迹树全部节点的 status_add_list（同 property 求和） */
function aggregateBonuses(
  trees: Record<string, Record<string, SkillTree>> | undefined,
): Map<string, { name: string; sum: number }> {
  const agg = new Map<string, { name: string; sum: number }>();
  if (!trees) return agg;
  for (const tree of Object.values(trees)) {
    for (const node of Object.values(tree)) {
      if (!node.status_add_list) continue;
      for (const s of node.status_add_list) {
        const cur = agg.get(s.property_type);
        if (cur) cur.sum += s.value;
        else agg.set(s.property_type, { name: s.name, sum: s.value });
      }
    }
  }
  return agg;
}

/** 加成值格式化：速度为固定值，其余为百分比（保留 1 位小数） */
function fmtBonus(type: string, sum: number): string {
  if (type === 'SpeedDelta') return `+${Math.round(sum)}`;
  return `+${Math.round(sum * 1000) / 10}%`;
}

/** 总属性加成：行迹树属性节点汇总 */
const attrBonuses = computed<AttrBonus[]>(() => {
  const agg = aggregateBonuses(props.d.skill_trees);
  return [...agg.entries()].map(([type, b]) => {
    const key = PROP_ICON[type];
    return {
      name: PROP_NAMES[type] || (b.name && b.name !== '{}' ? b.name : type),
      v: fmtBonus(type, b.sum),
      icon: key ? cdnUri('trace', `Icon${key}.webp`) : '',
    };
  });
});

/* ─── TALENTS 附加能力 ─── */

interface Ability {
  /** 行迹点 ID（唯一标识：作渲染 key；缺失时回退 name） */
  pointId: number | null;
  name: string;
  icon: string;
  descHtml: string;
  idx: number;
  terms: SkillExtra[];
}
const abilities = computed<Ability[]>(() => {
  const dd = props.d;
  if (!dd.skill_trees) return [];
  const list: SkillTree[] = [];
  Object.values(dd.skill_trees).forEach((tree) => {
    const n = tree['1'] || tree[Object.keys(tree)[0]];
    if (n && n.point_name && n.point_desc) list.push(n);
  });
  return list.map((ab, idx) => {
    return {
      pointId: ab.point_id ?? null,
      name: ab.point_name as string,
      icon: ab.icon ? iconUrl(ab.icon) : '',
      descHtml: fmtDesc(ab.point_desc, ab.param_list || []),
      idx,
      terms: extraTerms(ab),
    };
  });
});
</script>

<template>
  <template v-if="props.sections.includes('profile') && hasProfile(props.d)">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.profile }}</span>PROFILE</h2>
    <div class="nk-profile">
      <div v-for="p in profileRows" :key="p.label" class="nk-profile__item">
        <span class="nk-profile__label">{{ p.label }}</span>
        <span class="nk-profile__val">{{ p.value }}</span>
      </div>
    </div>
  </template>
  <template v-if="props.sections.includes('bonuses') && hasBonusNodes(props.d)">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.bonuses }}</span>STAT BONUSES</h2>
    <div class="nk-bonus-grid">
      <div v-for="b in attrBonuses" :key="b.name" class="nk-bonus">
        <img v-if="b.icon" class="nk-bonus__icon" :src="b.icon" loading="lazy">
        <span class="nk-bonus__val">{{ b.v }}</span>
        <span class="nk-bonus__name">{{ b.name }}</span>
      </div>
    </div>
  </template>
  <template v-if="props.sections.includes('talents') && hasTalentNodes(props.d)">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.talents }}</span>TALENTS</h2>
    <div
      v-for="ab in abilities"
      :key="ab.pointId ?? ab.name"
      class="nk-ability"
    >
      <div class="nk-skill__title-row">
        <img v-if="ab.icon" class="nk-skill__icon" :src="ab.icon">
        <div class="nk-skill__title">
          <span class="nk-skill__name">{{ ab.name }}</span>
          <span class="nk-skill__tag">附加能力 {{ ab.idx + 1 }}</span>
        </div>
      </div>
      <div class="nk-skill__desc" v-html="ab.descHtml"></div>
      <div v-if="ab.terms.length" class="nk-skill__terms">
        <div v-for="t in ab.terms" :key="t.name" class="nk-term">
          <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
        </div>
      </div>
    </div>
  </template>
  <template v-if="props.sections.includes('stories') && hasStories(props.d)">
    <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.stories }}</span>STORIES</h2>
    <div class="nk-stories">
      <div
        v-for="s in storyEntries"
        :key="s.key"
        :class="['nk-story', { 'nk-story--open': openStory === s.key }]"
      >
        <button class="nk-story__head" type="button" @click="toggleStory(s.key)">
          <span class="nk-story__num">{{ String(s.idx).padStart(2, '0') }}</span>
          <span class="nk-story__label">角色档案 · {{ s.idx }}</span>
          <span class="nk-story__arrow"></span>
        </button>
        <div class="nk-story__clip">
          <div class="nk-story__inner">
            <div class="nk-story__text" v-html="s.html"></div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
