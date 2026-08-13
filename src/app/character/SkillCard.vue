<script setup lang="ts">
/**
 * 技能卡片（移植自原 character.js 的 renderSkillCard + bindPanels）
 * 原实现滑条交互依赖 data-tpl/data-lvs 属性 + DOM 重渲染，此处改为 Vue 响应式：
 *   lv 变化 → descHtml / 数据表激活行自动重算
 * 子技能通过文件名自引用递归渲染（原结构：子卡片嵌套在父卡片 .nk-skill 内）
 */
import { computed, ref } from 'vue';
import type { CharacterData, Skill, SkillAnimEntry } from '../../services/types';
import {
  fmtDesc, fmtToughness, skillIconUrl, iconUrl,
} from '../../lib/format';
import { ELEM, TYPE } from '../../lib/constants';

const props = defineProps<{
  sk: Skill;
  charId: string;
  charData: CharacterData | null;
  isChild?: boolean;
  childSkills?: Skill[];
  /** 父卡片的当前等级（子技能共用父级滑条） */
  parentLv?: number;
  /** 技能动画列表（米游社 Wiki 数据，仅父卡片传入） */
  animEntries?: SkillAnimEntry[] | null;
  /** 强化角标（强化模式下被强化技能 ID 集合；原始模式为 null） */
  enhMark?: { skillIds: Set<number>; rankIds: Set<number> } | null;
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

/* ─── 描述渲染（当前等级参数；空 desc 显示 "-" 占位，对齐原站） ─── */
const descHtml = computed(() => {
  if (!props.sk.desc) return '-';
  const lvData = props.sk.level ? props.sk.level[String(effLv.value)] : null;
  const params = lvData ? lvData.param_list : [];
  return fmtDesc(props.sk.desc, params);
});

interface Metric {
  label: string;
  html: string;
}
const metrics = computed<Metric[]>(() => {
  const met: Metric[] = [];
  if (props.sk.sp_base != null) {
    met.push({ label: '能量', html: String(props.sk.sp_base) });
  }
  // 技能级能量需求（终结技/忆灵终结技；与 sp_base 的回复量互补）
  if (props.sk.sp_need != null) {
    met.push({ label: '能量需求', html: String(props.sk.sp_need) });
  }
  // 削韧：优先官方直出字段（属性 + 显示值），缺失时回退 show_stance_list 换算
  const stType = props.sk.stance_damage_type;
  const stDisp = props.sk.stance_damage_display;
  if (stType && stDisp != null) {
    met.push({
      label: '削韧',
      html: `${ELEM[stType] || stType} ${stDisp ?? ''}`.trim(),
    });
  } else {
    const tough = fmtToughness(props.sk);
    if (tough) {
      met.push({ label: '韧性', html: tough });
    }
  }
  if (props.sk.bp_need != null) {
    const sp = -props.sk.bp_need;
    met.push({
      label: '战技点',
      html: (sp > 0 ? '+' : '') + String(sp),
    });
  }
  return met;
});

/* ─── 技能资源消耗条件（SkillNeed，随当前等级参数渲染） ─── */
const needHtml = computed(() => {
  const raw = props.sk.skill_need;
  if (!raw) return '';
  const lvData = props.sk.level ? props.sk.level[String(effLv.value)] : null;
  return fmtDesc(raw, (lvData && lvData.param_list) || []);
});

/* ─── 强化关联（rated_rank_id → 星魂 E 编号；rated_skill_tree_id → 行迹名） ─── */
/* 用户可见文案「强化来源」，与强化模式角标「强化」区分（前者=被什么强化，后者=处于加强形态） */
interface RatedLink {
  kind: 'rank' | 'tree';
  num: string;
  name: string;
  icon: string;
  /** 强化描述 HTML（fmtDesc 渲染，含参数高亮） */
  descHtml: string;
}
const ratedLinks = computed<RatedLink[]>(() => {
  const links: RatedLink[] = [];
  const data = props.charData;
  if (!data) return links;
  // 星魂：ranks 对象按 E 编号为键，匹配 rated_rank_id（如 130806 → E6）
  const rankIds = props.sk.rated_rank_id || [];
  if (rankIds.length && data.ranks) {
    for (const [num, rk] of Object.entries(data.ranks)) {
      if (rankIds.includes(rk.id)) {
        links.push({
          kind: 'rank', num: 'E' + num, name: rk.name,
          icon: rk.icon,
          descHtml: fmtDesc(rk.desc, rk.param_list),
        });
      }
    }
  }
  // 行迹：point_id → point_name/point_desc 反查；上游数据旧角色缺前缀（如 1005101 vs point_id 11005101），补位容错
  const treeIds = props.sk.rated_skill_tree_id || [];
  if (treeIds.length && data.skill_trees) {
    const byId = new Map<number, { name: string; desc: string; params: number[]; icon: string }>();
    for (const tree of Object.values(data.skill_trees)) {
      for (const node of Object.values(tree)) {
        if (node.point_id && node.point_name) {
          byId.set(node.point_id, {
            name: node.point_name,
            desc: node.point_desc || '',
            params: node.param_list || [],
            icon: node.icon || '',
          });
        }
      }
    }
    for (const pid of treeIds) {
      const hit = byId.get(pid) ?? byId.get(Number('1' + String(pid)));
      if (hit) {
        links.push({
          kind: 'tree', num: String(pid), name: hit.name,
          icon: hit.icon,
          descHtml: fmtDesc(hit.desc, hit.params),
        });
      }
    }
  }
  return links;
});

/* ─── 强化来源折叠状态（默认收纳，点击展开全部条目，随卡片重建重置） ─── */
/* 惰性渲染：内容在首次展开后才挂载并常驻（DOM 瘦身——折叠态不渲染内部条目） */
const linksOpen = ref(false);
const linksEverOpened = ref(false);
function toggleLinks(): void {
  linksOpen.value = !linksOpen.value;
  if (linksOpen.value) linksEverOpened.value = true;
}

/* ─── 强化角标（强化模式下标记被强化技能） ─── */
const isEnhanced = computed(() =>
  !!(props.enhMark && props.enhMark.skillIds.has(props.sk.id)),
);

/* ─── 官方技能最高等级（max_level；缺失时回退 level 表长度） ─── */
const officialMaxLv = computed(() => props.sk.max_level ?? maxLv.value);

/* ─── 头部信息 ─── */
const typeName = computed(() => props.sk.type_name || TYPE[props.sk.type ?? ''] || '');
/** 技能标签：官方 SkillTag 中文文本（如「单攻」「召唤」），空则不显示 */
const tagLabel = computed(() => props.sk.tag || '');
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

/* ─── 可折叠技能数据（A/B/C 参数列） ─── */
interface TableRow {
  lv: number;
  cells: (number | string)[];
}
const table = computed<{ cols: string[]; rows: TableRow[] } | null>(() => {
  const lvl = props.sk.level;
  if (!lvl) return null;
  const levels = Object.keys(lvl).map(Number).sort((a, b) => a - b);
  if (levels.length <= 1) return null;
  const maxParams = Math.max(...levels.map((l) => (lvl[l].param_list || []).length));
  if (maxParams === 0) return null;
  const cols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, maxParams).split('');
  const rows = levels.map((l) => {
    const pl = lvl[l].param_list || [];
    return { lv: l, cells: cols.map((_, i) => (pl[i] != null ? pl[i] : '')) };
  });
  return { cols, rows };
});
const tableOpen = ref(false);
/* 惰性渲染：表格内容首次展开后才挂载并常驻（DOM 瘦身——折叠态不渲染 15 行数据表） */
const tableEverOpened = ref(false);
function toggleTable(): void {
  tableOpen.value = !tableOpen.value;
  if (tableOpen.value) tableEverOpened.value = true;
}

/* ─── 技能预览（米游社 Wiki animated webp/gif，默认收纳、点开加载） ─── */
/* clip 整体惰性挂载：首次展开后才渲染并常驻（避免折叠态下残留空轨道容器）；
 * everOpened 同时驱动 img 挂载（避免重复解码大体积动画） */
const animOpen = ref(false);   // 折叠状态（默认收纳）
const everOpened = ref(false); // 首次展开即挂载 clip + img，此后收起/展开不再卸载
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

/** 按索引分发动画给子技能：child[ci] → anim[ci + 1]
 * computed 缓存：避免每次父级渲染产生新数组引用导致子卡无谓更新 */
const childAnimMap = computed<Record<number, SkillAnimEntry[] | null>>(() => {
  const entries = props.animEntries;
  const children = props.childSkills;
  if (!entries || !children?.length) return {};
  const map: Record<number, SkillAnimEntry[] | null> = {};
  children.forEach((_, ci) => {
    const a = entries[ci + 1];
    if (a) map[ci] = [a];
  });
  return map;
});

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
  >
    <span v-if="isEnhanced" class="nk-skill__enh-badge">强化</span>
    <div v-if="!isChild" class="nk-skill__head">
      <span class="nk-skill__type-dot" :title="typeName"></span>
      <div class="nk-skill__slider">
        <span class="nk-slider__val">Lv.{{ lv }}<template v-if="officialMaxLv > 1">/{{ officialMaxLv }}</template></span>
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
      <!-- 技能资源消耗条件（如「#5点【新蕊】」→ 渲染为数值） -->
      <div v-if="needHtml" class="nk-skill__need">
        <span class="nk-skill__need-label">消耗</span>
        <span class="nk-skill__need-val" v-html="needHtml"></span>
      </div>
      <div v-if="metrics.length" class="nk-skill__metrics">
        <dl v-for="m in metrics" :key="m.label" class="nk-skill__metric">
          <dt>{{ m.label }}</dt><dd v-html="m.html"></dd>
        </dl>
      </div>
      <!-- 强化来源：受哪些星魂 / 行迹加成（折叠式，默认收纳，展开全部展示） -->
      <div v-if="ratedLinks.length" class="nk-skill__links">
        <button
          class="nk-skill__links-btn"
          :class="{ open: linksOpen }"
          :aria-expanded="linksOpen"
          type="button"
          @click="toggleLinks"
        >
          <span class="arrow">▶</span> {{ linksOpen ? '收起强化来源' : '强化来源' }}
        </button>
        <!-- 惰性渲染：clip 轨道常驻（保持 grid-rows 折叠动画），内容首次展开后才挂载 -->
        <div class="nk-links-clip" :class="{ open: linksOpen }">
          <div v-if="linksEverOpened" class="nk-links-inner">
            <div
              v-for="l in ratedLinks"
              :key="l.kind + l.num"
              class="nk-skill__link-item"
              :class="`nk-skill__link-item--${l.kind}`"
            >
              <div class="nk-skill__link-item-head">
                <img
                  class="nk-skill__link-item-icon"
                  :src="iconUrl(l.icon)"
                  :alt="l.name"
                >
                <span class="nk-skill__link-item-name">{{ l.name }}</span>
              </div>
              <div class="nk-skill__link-item-desc" v-html="l.descHtml"></div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="terms.length" class="nk-skill__terms">
        <div v-for="t in terms" :key="t.name" class="nk-term">
          <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
        </div>
      </div>
      <!-- 技能预览（默认收纳，点开加载动画；clip 惰性挂载，参见 script 注释） -->
      <div v-if="myAnims.length" class="nk-skill__anim">
        <button
          class="nk-skill__anim-toggle"
          :class="{ open: animOpen }"
          :aria-expanded="animOpen"
          type="button"
          @click="toggleAnim"
        >
          <span class="arrow">▶</span> 技能预览
        </button>
        <!-- 惰性渲染：clip 轨道常驻（保持 grid-rows 折叠动画），内容首次展开后才挂载 -->
        <div class="nk-skill__anim-clip" :class="{ open: animOpen }">
          <div v-if="everOpened" class="nk-skill__anim-inner">
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
                v-if="curAnim"
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
        :aria-expanded="tableOpen"
        type="button"
        @click="toggleTable"
      >
        <span class="arrow">▶</span> {{ tableOpen ? '收起数据' : '技能数据' }}
      </button>
      <!-- 惰性渲染：clip 轨道常驻（保持 grid-rows 折叠动画），表格内容首次展开后才挂载 -->
      <div class="nk-table-clip" :class="{ open: tableOpen }">
        <div v-if="tableEverOpened" class="nk-table-inner">
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
                <td v-for="(cell, i) in row.cells" :key="i">{{ cell }}</td>
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
      :char-id="charId"
      :char-data="charData"
      :enh-mark="enhMark"
      :anim-entries="childAnimMap[ci] || null"
    />
  </div>
</template>
