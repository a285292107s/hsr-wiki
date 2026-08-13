<script setup lang="ts">
/**
 * 敌对物种详情页（档案式：立绘 Hero + 编辑式档案区块）
 * 结构：Hero（全身立绘 + 名称/分类/阵营/韧性/编号）→ 图鉴记录 / 弱点与抗性 / 基础数值 / 技能
 * 数据：converter 输出 monsters/{id}.json（按 ID 按需加载，不走单例）
 */
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { ELEM, MON_RANK, SITE_NAME } from '../../lib/constants';
import {
  elementIconUrl, escHtml, fmtDesc, monsterFigureUrl, monsterIconUrl,
} from '../../lib/format';
import { loadLocalMonsterDetail } from '../../services/api';
import type { MonsterDetail, MonsterSkillDetail } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import '../../styles/monster-detail.css';

const route = useRoute();
const app = useAppStore();

/** 页面级加载编排：loading/error + 加载代竞态 + 延迟骨架屏（失败 toast 由视图补充） */
const { data, error, showSkeleton, run: load, retry } = usePageData<MonsterDetail>(() =>
  loadLocalMonsterDetail(String(route.params.id)),
);
/** 失败 toast（与 usePageData 解耦：错误写入 error 后触发，重试成功自动清空不重复弹） */
watch(error, (e) => {
  if (e) app.toast('error', `加载失败: ${e}`);
});
onMounted(() => {
  void load();
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== String(data.value?.id)) void load();
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
/** 分类中文（Rank → 中文，未知分类不渲染） */
const rankLabel = computed(() => (d.value ? MON_RANK[d.value.rank] || '' : ''));

/** 元素弱点标签（flat 图标 + 名称） */
function elemTag(elem: string): string {
  const name = ELEM[elem] || elem;
  return `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(elem))}" alt="" loading="lazy">${escHtml(name)}</span>`;
}
const weakHtml = computed(() => (d.value?.weak ?? []).map(elemTag).join(''));
/** 伤害抗性标签（元素 + 抗性百分比） */
const resistHtml = computed(() =>
  Object.entries(d.value?.resist ?? {})
    .map(([k, v]) => `<span class="nk-mob-tag"><img src="${escHtml(elementIconUrl(k))}" alt="" loading="lazy">${escHtml(ELEM[k] || k)} ${Math.round(v * 100)}%</span>`)
    .join(''));
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
/** 技能元信息行：元素 + 类型 + 攻击类型（v-html 拼接，等宽档案元信息） */
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
  return parts.join('<span class="nk-mob-skill__sep">/</span>');
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
      <!-- Hero：立绘 + 档案信息区 -->
      <div class="nk-mob-hero">
        <div class="nk-mob-hero__figure">
          <img :src="figureUrl" :alt="d.name" loading="eager">
        </div>
        <div class="nk-mob-hero__info">
          <div class="nk-mob-hero__meta">
            <span v-if="rankLabel">{{ rankLabel }}</span>
            <span v-if="d.camp">{{ d.camp }}</span>
            <span v-if="d.stance">韧性 {{ d.stance }}</span>
            <span class="nk-mob-hero__no">{{ d.id }}</span>
          </div>
          <h1 class="nk-mob-hero__name">{{ d.name }}</h1>
        </div>
      </div>

      <!-- 档案内容区 -->
      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 图鉴记录 -->
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">图鉴记录</h2>
              <span class="nk-mob-sec__en">DOSSIER</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <p class="nk-mob-sec__body nk-mob-intro" v-html="introHtml"></p>
          </section>

          <!-- 弱点与抗性 -->
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">弱点与抗性</h2>
              <span class="nk-mob-sec__en">VULNERABILITY</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-resist">
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">韧性弱点</span>
                <span v-if="weakHtml" class="nk-mob-resist__tags" v-html="weakHtml"></span>
                <span v-else class="nk-mob-empty">无弱点信息</span>
              </div>
              <div class="nk-mob-resist__row">
                <span class="nk-mob-resist__label">伤害抗性</span>
                <span v-if="resistHtml" class="nk-mob-resist__tags" v-html="resistHtml"></span>
                <span v-else class="nk-mob-empty">无抗性信息</span>
              </div>
            </div>
          </section>

          <!-- 基础数值 -->
          <section class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">基础数值</h2>
              <span class="nk-mob-sec__en">STATS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <dl class="nk-mob-stats">
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">HP 生命</dt>
                <dd class="nk-mob-stat__val" data-prop="hp">{{ d.stats.hp }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">ATK 攻击</dt>
                <dd class="nk-mob-stat__val" data-prop="atk">{{ d.stats.atk }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">DEF 防御</dt>
                <dd class="nk-mob-stat__val" data-prop="def">{{ d.stats.def }}</dd>
              </div>
              <div class="nk-mob-stat">
                <dt class="nk-mob-stat__label">SPD 速度</dt>
                <dd class="nk-mob-stat__val" data-prop="spd">{{ d.stats.speed }}</dd>
              </div>
              <div v-if="d.stance" class="nk-mob-stat nk-mob-stat--stance">
                <dt class="nk-mob-stat__label">韧性</dt>
                <dd class="nk-mob-stat__val">{{ d.stance }}</dd>
              </div>
            </dl>
          </section>

          <!-- 技能 -->
          <section v-if="d.skills.length" class="nk-mob-sec">
            <header class="nk-mob-sec__head">
              <h2 class="nk-mob-sec__title">技能</h2>
              <span class="nk-mob-sec__en">SKILLS</span>
              <span class="nk-mob-sec__rule" aria-hidden="true"></span>
            </header>
            <div class="nk-mob-skills">
              <article v-for="s in d.skills" :key="s.id" class="nk-mob-skill">
                <header class="nk-mob-skill__head">
                  <span class="nk-mob-skill__name">{{ s.name }}</span>
                  <span v-if="s.tag" class="nk-mob-skill__tag">{{ s.tag }}</span>
                </header>
                <div v-if="skillMeta(s)" class="nk-mob-skill__meta" v-html="skillMeta(s)"></div>
                <div v-if="skillHtml(s)" class="nk-mob-skill__desc" v-html="skillHtml(s)"></div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>