<script setup lang="ts">
/**
 * 技能卡片（移植自原 character.js 的 renderSkillCard + bindPanels）
 * 原实现滑条交互依赖 data-tpl/data-lvs 属性 + DOM 重渲染，此处改为 Vue 响应式：
 *   lv 变化 → descHtml / 数据表激活行自动重算（加强 diff 模式下用新旧参数重渲染描述）
 * 子技能通过文件名自引用递归渲染（原结构：子卡片嵌套在父卡片 .nk-skill 内）
 */
import { computed, ref } from 'vue';
import type { CharacterData, Skill, SkillAnimEntry } from '../../services/types';
import {
  fmtDesc, fmtDescDiff, fmtToughness, hasParamDiff, hasTextDiff, paramEqual, skillIconUrl,
} from '../../lib/format';
import { TAG, TYPE } from '../../lib/constants';

const props = defineProps<{
  sk: Skill;
  charId: string;
  charData: CharacterData | null;
  /** 加强 diff 对比用的旧版技能（按重映射后的技能 ID 匹配） */
  oldSk?: Skill | null;
  /** 子技能的旧版映射表（透传给递归子卡片） */
  childOldById?: Record<string, Skill> | null;
  isDiffMode?: boolean;
  isChild?: boolean;
  childSkills?: Skill[];
  /** 父卡片的当前等级（子技能共用父级滑条） */
  parentLv?: number;
  /** 技能动画列表（米游社 Wiki 数据，仅父卡片传入） */
  animEntries?: SkillAnimEntry[] | null;
}>();

/* ─── 技能等级滑条（响应式替代原 data-tpl/data-lvs 方案） ─── */
const maxLv = computed(() => (props.sk.level ? Object.keys(props.sk.level).length : 1));
const defaultLv = computed(() =>
  props.sk.type === 'Normal' ? Math.min(6, maxLv.value) : Math.min(10, maxLv.value),
);
const lv = ref(defaultLv.value);

function onSlider(e: Event): void {
  lv.value = Number((e.target as HTMLInputElement).value);
}
/** 滑条填充百分比（驱动分段块状背景；单等级技能视为满级） */
const fillPct = computed(() =>
  maxLv.value <= 1 ? 100 : ((lv.value - 1) / (maxLv.value - 1)) * 100,
);
/** 生效等级：子技能跟随父卡片滑条（钳位到自身最大等级） */
const effLv = computed(() =>
  props.isChild ? Math.min(props.parentLv ?? 1, maxLv.value) : lv.value,
);

/* ─── 描述渲染（当前等级参数；diff 模式下新旧对比；空 desc 显示 "-" 占位，对齐原站） ─── */
const descHtml = computed(() => {
  if (!props.sk.desc) return '-';
  const lvData = props.sk.level ? props.sk.level[String(effLv.value)] : null;
  const params = lvData ? lvData.param_list : [];
  const old = props.oldSk || null;
  if (props.isDiffMode && old) {
    const oldLvData = old.level ? old.level[String(effLv.value)] : null;
    const oldParams = oldLvData ? oldLvData.param_list : [];
    return fmtDescDiff(props.sk.desc, params, old.desc, oldParams);
  }
  return fmtDesc(props.sk.desc, params);
});

/* ─── 数值对比：旧值红删除线 + 新值绿 ─── */
function diffValHtml(
  nv: number | string,
  ov: number | string | null | undefined,
  transform?: (v: number | string) => string,
): string {
  const n = transform ? transform(nv) : String(nv);
  if (ov === undefined || ov === null) return n;
  const o = transform ? transform(ov) : String(ov);
  if (o === n) return n;
  return `<span class="nk-d-c">${o}</span><span class="nk-d-n">${n}</span>`;
}

interface Metric {
  label: string;
  html: string;
}
const metrics = computed<Metric[]>(() => {
  const old = props.oldSk || null;
  const met: Metric[] = [];
  if (props.sk.sp_base != null) {
    met.push({ label: '能量', html: diffValHtml(props.sk.sp_base, old ? old.sp_base : null) });
  }
  const tough = fmtToughness(props.sk);
  if (tough) {
    met.push({ label: '韧性', html: diffValHtml(tough, old ? fmtToughness(old) : null) });
  }
  if (props.sk.bp_need != null) {
    const sp = -props.sk.bp_need;
    const oldSp = old && old.bp_need != null ? -old.bp_need : null;
    met.push({
      label: '战技点',
      html: diffValHtml(sp, oldSp, (v) => (Number(v) > 0 ? '+' + String(v) : String(v))),
    });
  }
  return met;
});

/* ─── 内联 diff 状态（CHANGED / NEW） ─── */
const status = computed<'changed' | 'added' | null>(() => {
  if (!props.isDiffMode) return null;
  const old = props.oldSk || null;
  if (!old) return 'added';
  const lvData = props.sk.level ? props.sk.level[String(defaultLv.value)] : null;
  const params = lvData ? lvData.param_list : [];
  const oldLvData = old.level ? old.level[String(defaultLv.value)] : null;
  const oldParams = oldLvData ? oldLvData.param_list : [];
  const numChanged =
    hasParamDiff(params, oldParams) ||
    !paramEqual(props.sk.sp_base, old.sp_base) ||
    !paramEqual(props.sk.bp_need, old.bp_need);
  const textChanged = hasTextDiff(props.sk.desc, old.desc);
  return numChanged || textChanged ? 'changed' : null;
});

/* ─── 头部信息 ─── */
const typeName = computed(() => props.sk.type_name || TYPE[props.sk.type] || '');
const tagLabel = computed(() => (props.sk.tag && TAG[props.sk.tag]) || '');
const icon = computed(() => skillIconUrl(props.sk, props.charId, props.charData));
/** 技能类型键（用于 data-type 色彩映射） */
const typeKey = computed(() => props.sk.type || '');

/* ─── 词条（extra 按 name 去重） ─── */
const terms = computed(() => {
  const extra = props.sk.extra;
  if (!extra) return [];
  const seen = new Set<string>();
  return Object.values(extra).filter((t) => {
    if (!t || seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
});

/* ─── 可折叠技能数据表（A/B/C 参数列 + diff 单元格） ─── */
interface TableCell {
  diff: 'changed' | 'old-only' | null;
  ov: number | string | null;
  nv: number | string;
}
interface TableRow {
  lv: number;
  cells: TableCell[];
}
const table = computed<{ cols: string[]; rows: TableRow[] } | null>(() => {
  const lvl = props.sk.level;
  if (!lvl) return null;
  const levels = Object.keys(lvl).map(Number).sort((a, b) => a - b);
  if (levels.length <= 1) return null;
  const maxParams = Math.max(...levels.map((l) => (lvl[l].param_list || []).length));
  if (maxParams === 0) return null;
  const cols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, maxParams).split('');
  const old = props.oldSk || null;
  const oldLevels = old && old.level ? old.level : null;
  const rows = levels.map((l) => {
    const pl = lvl[l].param_list || [];
    const opl = oldLevels && oldLevels[l] ? oldLevels[l].param_list || [] : null;
    const cells = cols.map((_, i) => {
      const nv = pl[i] != null ? pl[i] : '';
      if (opl && opl[i] != null && String(opl[i]) !== String(nv)) {
        return nv === ''
          ? { diff: 'old-only' as const, ov: opl[i], nv: '' }
          : { diff: 'changed' as const, ov: opl[i], nv };
      }
      return { diff: null, ov: null, nv };
    });
    return { lv: l, cells };
  });
  return { cols, rows };
});
const tableOpen = ref(false);

/* ─── 技能预览（米游社 Wiki animated webp/gif，默认收纳、点开加载） ─── */
const animOpen = ref(false);   // 折叠状态（默认收纳）
const everOpened = ref(false); // 一旦展开即保留 img（避免重复解码大体积动画）
const animIdx = ref(0);
const imgDone = ref(false);

/** GIF 走 OSS 实时 webp 转换（带宽优化）；webp 直连 */
function animSrc(entry: SkillAnimEntry): string {
  return entry.url.endsWith('.gif')
    ? `${entry.url}?x-oss-process=image%2Fformat%2Cwebp`
    : entry.url;
}

/** 本技能自身分得的动画：
 *  · 父卡且组内仅 1 个技能 → 拿全部（多段动画用 tab 切换）
 *  · 父卡且组内多个技能 → 只拿首条（其余按索引分发给子技能）
 *  · 子卡 → 父卡已按索引切好传入（单个）
 */
const myAnims = computed<SkillAnimEntry[]>(() => {
  const entries = props.animEntries;
  if (!entries || !entries.length) return [];
  const hasChildren = (props.childSkills?.length ?? 0) > 0;
  return hasChildren ? entries.slice(0, 1) : entries;
});

/** 按索引分发动画给子技能：child[ci] → anim[ci + 1] */
function animForChild(ci: number): SkillAnimEntry[] | null {
  const entries = props.animEntries;
  if (!entries) return null;
  const a = entries[ci + 1];
  return a ? [a] : null;
}

const curAnim = computed(() =>
  myAnims.value[animIdx.value] ? animSrc(myAnims.value[animIdx.value]) : '',
);
function toggleAnim(): void {
  animOpen.value = !animOpen.value;
  if (animOpen.value) everOpened.value = true;
}
function selectAnim(i: number): void {
  if (i === animIdx.value) return;
  animIdx.value = i;
  imgDone.value = false;
}
function onImgLoad(): void { imgDone.value = true; }
</script>

<template>
  <div
    :class="isChild ? 'nk-skill nk-skill--child' : 'nk-skill'"
    :data-type="typeKey"
    :data-status="status || undefined"
  >
    <span v-if="status" :class="`nk-diff-badge nk-diff-badge--${status}`">
      {{ status === 'changed' ? 'CHANGED' : 'NEW' }}
    </span>
    <div v-if="!isChild" class="nk-skill__head">
      <span class="nk-skill__type-dot" :title="typeName"></span>
      <div class="nk-skill__slider">
        <span class="nk-slider__val">Lv.{{ lv }}</span>
        <input type="range" :min="maxLv <= 1 ? 0 : 1" :max="maxLv" :value="lv" :disabled="maxLv <= 1" :style="{ '--fill': fillPct + '%' }" @input="onSlider">
      </div>
    </div>
    <div class="nk-skill__body">
      <div class="nk-skill__title-row">
        <img v-if="icon" class="nk-skill__icon" :src="icon">
        <div class="nk-skill__title">
          <span class="nk-skill__name">{{ sk.name }}</span>
          <span class="nk-skill__meta">
            <span class="nk-skill__type">{{ typeName }}</span>
            <span v-if="tagLabel" class="nk-skill__tag">{{ tagLabel }}</span>
          </span>
        </div>
      </div>
      <div class="nk-skill__desc" v-html="descHtml"></div>
      <div v-if="metrics.length" class="nk-skill__metrics">
        <span v-for="m in metrics" :key="m.label" class="nk-skill__metric">
          <dt>{{ m.label }}</dt><dd v-html="m.html"></dd>
        </span>
      </div>
      <div v-if="terms.length" class="nk-skill__terms">
        <div v-for="t in terms" :key="t.name" class="nk-term">
          <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
        </div>
      </div>
      <!-- 技能预览（默认收纳，点开加载动画） -->
      <div v-if="myAnims.length" class="nk-skill__anim">
        <button
          class="nk-skill__anim-toggle"
          :class="{ open: animOpen }"
          type="button"
          @click="toggleAnim"
        >
          <span class="arrow">▶</span> 技能预览
        </button>
        <div class="nk-skill__anim-clip" :class="{ open: animOpen }">
          <div class="nk-skill__anim-inner">
            <div v-if="myAnims.length > 1" class="nk-skill__anim-tabs">
              <button
                v-for="(a, i) in myAnims"
                :key="i"
                type="button"
                class="nk-skill__anim-tab"
                :class="{ active: i === animIdx }"
                @click="selectAnim(i)"
              >{{ a.title || `${i + 1}` }}</button>
            </div>
            <div class="nk-skill__anim-stage" :class="{ loaded: imgDone }">
              <img
                v-if="everOpened && curAnim"
                class="nk-skill__anim-img"
                :src="curAnim"
                :alt="`${sk.name} 技能预览`"
                loading="lazy"
                @load="onImgLoad"
              >
              <div v-if="animOpen && !imgDone" class="nk-skill__anim-ph"><span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="table" class="nk-skill__table-wrap">
      <button
        class="nk-skill__table-btn"
        :class="{ open: tableOpen }"
        type="button"
        @click="tableOpen = !tableOpen"
      >
        <span class="arrow">▶</span> {{ tableOpen ? '收起数据表' : '技能数据表' }}
      </button>
      <div class="nk-table-clip" :class="{ open: tableOpen }">
        <div class="nk-table-inner">
          <table class="nk-table">
            <thead>
              <tr>
                <th>#</th>
                <th v-for="c in table.cols" :key="c">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in table.rows"
                :key="row.lv"
                :class="{ 'nk-table--active': row.lv === effLv }"
                :data-lv="row.lv"
              >
                <td>Lv.{{ row.lv }}</td>
                <td v-for="(cell, i) in row.cells" :key="i">
                  <template v-if="cell.diff === 'changed'">
                    <span class="nk-d-c">{{ cell.ov }}</span><span class="nk-d-n">{{ cell.nv }}</span>
                  </template>
                  <template v-else-if="cell.diff === 'old-only'">
                    <span class="nk-d-c">{{ cell.ov }}</span>
                  </template>
                  <template v-else>{{ cell.nv }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- 子技能（同 type+type_name 分组的后续项，嵌套在父卡片内；动画按索引分发） -->
    <SkillCard
      v-for="(c, ci) in childSkills || []"
      :key="c.id"
      :sk="c"
      :is-child="true"
      :parent-lv="lv"
      :old-sk="(childOldById && childOldById[String(c.id)]) || null"
      :child-old-by-id="childOldById"
      :is-diff-mode="isDiffMode"
      :char-id="charId"
      :char-data="charData"
      :anim-entries="animForChild(ci)"
    />
  </div>
</template>
