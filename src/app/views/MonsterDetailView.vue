<script setup lang="ts">
/**
 * 敌对物种详情页
 * 结构：Hero（全身立绘 + 名称/分类/阵营/韧性徽章）→ 图鉴介绍 / 弱点抗性 / 基础属性 / 技能
 * 数据：converter 输出 monsters/{id}.json（按 ID 按需加载，不走单例）
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { ELEM, MON_RANK, SITE_NAME } from '../../lib/constants';
import {
  elementIconUrl, escHtml, fmtDesc, monsterFigureUrl, monsterIconUrl,
} from '../../lib/format';
import { loadLocalMonsterDetail } from '../../services/api';
import type { MonsterDetail, MonsterSkillDetail } from '../../services/types';
import '../../styles/monster-detail.css';

const route = useRoute();
const app = useAppStore();

const data = ref<MonsterDetail | null>(null);
const error = ref('');
const loading = ref(true);
/** 延迟显示骨架：加载超 150ms 才展示，避免快速切换时闪烁 */
const showSkeleton = ref(false);
const SKELETON_DELAY = 150;
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;
watch(loading, (l) => {
  if (l) {
    if (skeletonTimer !== null) clearTimeout(skeletonTimer);
    skeletonTimer = setTimeout(() => { showSkeleton.value = true; }, SKELETON_DELAY);
  } else {
    if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
    showSkeleton.value = false;
  }
}, { immediate: true });

async function load(id: string): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    data.value = await loadLocalMonsterDetail(id);
  } catch (e) {
    data.value = null;
    error.value = e instanceof Error ? e.message : '未知错误';
    app.toast('error', `加载失败: ${error.value}`);
  } finally {
    loading.value = false;
  }
}
function retry(): void {
  void load(String(route.params.id || ''));
}

onMounted(() => {
  void load(String(route.params.id || ''));
});
watch(
  () => route.params.id,
  (id) => {
    if (id) void load(String(id));
  },
);

/* ─── 派生视图 ─── */

const d = computed(() => data.value);
/** 动态页标题 */
watch(d, (data) => {
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});
/** Hero 立绘：全身立绘优先，无立绘回退中图标 */
const figureUrl = computed(() => {
  if (!d.value) return '';
  return monsterFigureUrl(d.value.figure) || monsterIconUrl(d.value.icon);
});
/** 分类徽章（Rank → 中文，未知分类不渲染） */
const rankLabel = computed(() => (d.value ? MON_RANK[d.value.rank] || '' : ''));

/** 韧性弱点 chips（元素图标 + 名称） */
function weakChip(elem: string): string {
  const name = ELEM[elem] || elem;
  return `<span class="nk-mob-chip nk-mob-chip--elem"><img src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)}</span>`;
}
/** 伤害抗性 chips（元素图标 + 名称 + 抗性百分比） */
function resistChip(elem: string, v: number): string {
  const name = ELEM[elem] || elem;
  return `<span class="nk-mob-chip nk-mob-chip--elem"><img src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)} ${Math.round(v * 100)}%</span>`;
}
const weakHtml = computed(() => (d.value?.weak ?? []).map(weakChip).join(''));
const resistHtml = computed(() =>
  Object.entries(d.value?.resist ?? {}).map(([k, v]) => resistChip(k, v)).join(''));
/** 图鉴介绍：富文本 + 换行渲染（fmtDesc 处理 \n → <br>） */
const introHtml = computed(() => {
  if (!d.value) return '';
  const t = fmtDesc(d.value.intro, []);
  return t || '<span class="nk-mob-empty">暂无图鉴介绍</span>';
});
/** 技能描述（#N[i] 参数替换 + 富文本） */
function skillHtml(s: MonsterSkillDetail): string {
  return fmtDesc(s.desc, s.param_list);
}
/** 技能元信息：元素徽章 + 类型描述（v-html 拼接） */
function skillMeta(s: MonsterSkillDetail): string {
  const parts: string[] = [];
  if (s.damage_type) {
    const name = ELEM[s.damage_type] || s.damage_type;
    parts.push(
      `<span class="nk-mob-skill__elem"><img src="${escHtml(elementIconUrl(s.damage_type))}" alt="${escHtml(name)}" title="${escHtml(name)}" loading="lazy">${escHtml(name)}</span>`,
    );
  }
  if (s.type_desc) {
    parts.push(`<span class="nk-mob-skill__type">${escHtml(s.type_desc)}</span>`);
  }
  return parts.join('');
}
</script>

<template>
  <div class="nk-mob-page">
    <!-- 骨架屏（延迟出现） -->
    <div v-if="showSkeleton" class="nk-mob-skeleton" aria-hidden="true">
      <div class="nk-mob-skeleton__hero"></div>
      <div class="nk-mob-skeleton__body">
        <div class="nk-mob-skeleton__line"></div>
        <div class="nk-mob-skeleton__line"></div>
      </div>
    </div>

    <!-- 错误重试 -->
    <div v-else-if="error" class="nk-mob-error">
      <div class="nk-mob-error__text">{{ error }}</div>
      <button class="nk-mob-error__retry" @click="retry">重试</button>
    </div>

    <template v-else-if="d">
      <!-- Hero -->
      <div class="nk-mob-hero">
        <div class="nk-mob-hero__figure">
          <img :src="figureUrl" :alt="d.name" loading="eager">
        </div>
        <div class="nk-mob-hero__info">
          <h1 class="nk-mob-hero__name">{{ d.name }}</h1>
          <div class="nk-mob-hero__meta">
            <span v-if="rankLabel" class="nk-mob-chip nk-mob-chip--rank">{{ rankLabel }}</span>
            <span v-if="d.camp" class="nk-mob-chip">{{ d.camp }}</span>
            <span v-if="d.stance" class="nk-mob-chip nk-mob-chip--stance">韧性 {{ d.stance }}</span>
          </div>
        </div>
      </div>

      <!-- 内容面板 -->
      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 图鉴介绍 -->
          <div class="nk-title">OVERVIEW</div>
          <div class="nk-card nk-mob-intro" v-html="introHtml"></div>

          <!-- 弱点 / 抗性 -->
          <div class="nk-title">WEAKNESS</div>
          <div class="nk-card nk-mob-resist">
            <div class="nk-mob-resist__row">
              <span class="nk-mob-resist__label">韧性弱点</span>
              <span v-if="weakHtml" class="nk-mob-resist__chips" v-html="weakHtml"></span>
              <span v-else class="nk-mob-empty">无弱点信息</span>
            </div>
            <div class="nk-mob-resist__row">
              <span class="nk-mob-resist__label">伤害抗性</span>
              <span v-if="resistHtml" class="nk-mob-resist__chips" v-html="resistHtml"></span>
              <span v-else class="nk-mob-empty">无抗性信息</span>
            </div>
          </div>

          <!-- 基础属性 -->
          <div class="nk-title">STATS</div>
          <div class="nk-card nk-mob-stats">
            <div class="nk-mob-stat">
              <span class="nk-mob-stat__label">HP</span>
              <span class="nk-mob-stat__val" data-prop="hp">{{ d.stats.hp }}</span>
            </div>
            <div class="nk-mob-stat">
              <span class="nk-mob-stat__label">ATK</span>
              <span class="nk-mob-stat__val" data-prop="atk">{{ d.stats.atk }}</span>
            </div>
            <div class="nk-mob-stat">
              <span class="nk-mob-stat__label">DEF</span>
              <span class="nk-mob-stat__val" data-prop="def">{{ d.stats.def }}</span>
            </div>
            <div class="nk-mob-stat">
              <span class="nk-mob-stat__label">SPD</span>
              <span class="nk-mob-stat__val" data-prop="spd">{{ d.stats.speed }}</span>
            </div>
            <div v-if="d.stance" class="nk-mob-stat nk-mob-stat--stance">
              <span class="nk-mob-stat__label">韧性</span>
              <span class="nk-mob-stat__val">{{ d.stance }}</span>
            </div>
          </div>

          <!-- 技能 -->
          <template v-if="d.skills.length">
            <div class="nk-title">SKILLS</div>
            <div class="nk-mob-skills">
              <div v-for="s in d.skills" :key="s.id" class="nk-card nk-mob-skill">
                <div class="nk-mob-skill__head">
                  <span class="nk-mob-skill__name">{{ s.name }}</span>
                  <span v-if="s.tag" class="nk-mob-chip nk-mob-chip--tag">{{ s.tag }}</span>
                </div>
                <div v-if="skillMeta(s)" class="nk-mob-skill__meta" v-html="skillMeta(s)"></div>
                <div v-if="skillHtml(s)" class="nk-mob-skill__desc" v-html="skillHtml(s)"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
