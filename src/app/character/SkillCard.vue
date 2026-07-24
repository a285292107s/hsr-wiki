<script setup lang="ts">
/**
 * 技能卡片（迁移自 character.js renderSkillCard + bindPanels）
 * 原脚本滑条交互依赖 data-tpl/data-lvs 属性 + DOM 重渲染，此处改为 Vue 响应式：
 *   lv 变化 → descHtml / 数据表激活行自动重算（加强 diff 模式下用新旧参数重渲染描述）
 * 子技能通过文件名自引用递归渲染（原结构：子卡片嵌套在父卡片 .nk-skill 内）
 */
import { computed, ref } from 'vue';
import type { CharacterData, Skill } from '../../services/types';
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

/* ─── 描述渲染（当前等级参数；diff 模式下新旧对比） ─── */
const descHtml = computed(() => {
  const lvData = props.sk.level ? props.sk.level[String(lv.value)] : null;
  const params = lvData ? lvData.param_list : [];
  const old = props.oldSk || null;
  if (props.isDiffMode && old) {
    const oldLvData = old.level ? old.level[String(lv.value)] : null;
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
const icon = computed(() =>
  !props.isChild ? skillIconUrl(props.sk, props.charId, props.charData) : '',
);

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
</script>

<template>
  <div
    :class="isChild ? 'nk-skill nk-skill--child' : 'nk-skill'"
    :data-status="status || undefined"
  >
    <span v-if="status" :class="`nk-diff-badge nk-diff-badge--${status}`">
      {{ status === 'changed' ? 'CHANGED' : 'NEW' }}
    </span>
    <div class="nk-skill__head">
      <img v-if="icon" class="nk-skill__icon" :src="icon">
      <div>
        <div class="nk-skill__name">{{ sk.name }}</div>
        <div class="nk-skill__type">
          {{ typeName }}<span v-if="tagLabel" class="nk-skill__tag">{{ tagLabel }}</span>
        </div>
      </div>
      <div v-if="maxLv > 1" class="nk-slider">
        <input type="range" min="1" :max="maxLv" :value="lv" @input="onSlider">
        <div class="nk-slider__val">Lv.{{ lv }}</div>
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
    <div v-if="table" class="nk-skill__table-wrap">
      <button
        class="nk-skill__table-btn"
        :class="{ open: tableOpen }"
        type="button"
        @click="tableOpen = !tableOpen"
      >
        <span class="arrow">▶</span> {{ tableOpen ? '收起数据表' : '技能数据表' }}
      </button>
      <table class="nk-table" :class="{ open: tableOpen }">
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
            :class="{ 'nk-table--active': row.lv === lv }"
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
    <!-- 子技能（同 type+type_name 分组的后续项，嵌套在父卡片内） -->
    <SkillCard
      v-for="c in childSkills || []"
      :key="c.id"
      :sk="c"
      :is-child="true"
      :old-sk="(childOldById && childOldById[String(c.id)]) || null"
      :child-old-by-id="childOldById"
      :is-diff-mode="isDiffMode"
      :char-id="charId"
      :char-data="charData"
    />
  </div>
</template>
