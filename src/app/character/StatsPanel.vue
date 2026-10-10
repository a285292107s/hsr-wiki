<script setup lang="ts">
/**
 * 00 属性面板：角色基础属性 —— 「规格铭牌」 + 等级滑条。
 *
 * 版式按**成长行为**把 8 项分成两层：面板三项（生命 / 攻击 / 防御，随等级线性成长，带「每级 +N」注记）
 * 与参数五项（速度 / 暴击率 / 暴击伤害 / 嘲讽 / 能量上限，全档恒定——实测 98 只角色跨 7 档零漂移）。
 * 滑条因此只驱动面板层：拖动时三层取值跟着走，参数层原地不动——区块的结构本身就是它的交互说明书。
 *
 * 上一版是 8 行等高表格（行首 `00-N` 索引 + 行底发丝线 + 名称与取值之间的引导线），一屏 16 条同权重线
 * 把区块读成账本，且索引与章标的 `00` 重复；现版标签与取值就近成对（上下相邻，共用同一条左轴），
 * 区块内只留 1 条结构性发丝线（两层分界），身份色每项只出现一次（左槽色标），层级由字号 / 字重 / 色阶建立。
 *
 * 等级口径见 `charStageForLevel`：每档的 Base/Add 是该档自己的曲线，相邻档 Base 递进 8×Add（突破立刻加面板），
 * 故按「该等级可突破到的最高档位」取值并在滑条读数里标出档位，避免与未突破的旧值混淆。
 *
 * 术语与图标均出自子仓库 AvatarPropertyConfig：PropertyName → TextMap 官方名称；
 * IconPath → SpriteOutput/UI/Avatar/Icon/Icon*.png，经 cdnUri trace 分类解析为 jsDelivr 路径。
 */
import { computed, ref } from 'vue';
import { cdnUri } from '../../services/cdn';
import { charStageForLevel, fmtStatValue, levelStatValue, maxLevelStat } from '../../lib/format';
import { CHAR_STAGE_LEVEL_CAPS, MAX_CHAR_LEVEL } from '../../lib/constants';
import { SECTION_IDX } from './sections';
import type { CharacterData } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 文案统一走词典（脚本内不易用 useI18n；见 i18n.ts 的 translate） */


const props = defineProps<{ d: CharacterData }>();

/** k = 属性键，供 data-prop 消费领域层 --prop-* 身份色（character-hero.css） */
interface Stat {
  v: number | string;
  l: string;
  icon: string;
  k: string;
  /** 每级成长值；只有随等级线性成长的面板三项有（参数五项全档恒定，无此项） */
  add?: number;
}
interface StatTier { id: 'panel' | 'param'; items: Stat[] }

/**
 * 嘲讽无官方图标资产（已核实：AvatarPropertyConfig 无 Aggro 条目、IconPath 全量扫描无引用；
 * StarRailTextures 仓库 ui/avatar/icon/IconAggro.png 404），以白色线性风格 SVG 顶替。
 * 形是**准星环 + 四向内刻线**（被瞄准 = 嘲讽的机制：敌方被强制攻击自己），且走实心填充——
 * 官方图标族全是实心剪影，旧版那枚 1.8px 描边「盾牌 + 上箭头」在 15px 下既最糊、又与防御力的盾撞形、
 * 语义还误读成「升级」。
 */
const TRACE_TAUNT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#fff' fill-rule='evenodd' d='M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8zm0 3.4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z'/><path fill='#fff' d='M11.1 0.4h1.8v3.4h-1.8zM11.1 20.2h1.8v3.4h-1.8zM0.4 11.1h3.4v1.8H0.4zM20.2 11.1h3.4v1.8h-3.4z'/></svg>");

/** 等级滑条：默认满级（与区块原有「满级面板」语义一致，也保证首屏 / 预渲染快照值与改版前逐字相同） */
const level = ref(MAX_CHAR_LEVEL);
const stageCount = computed(() => Object.keys(props.d.stats ?? {}).length);
/** 档位阶梯只对「7 档 = 上限 20…80」成立；档位数不是 7 时停用滑条，只展示满级档（宁缺不假） */
const sliderEnabled = computed(() => stageCount.value === CHAR_STAGE_LEVEL_CAPS.length + 1);
const stage = computed(() => charStageForLevel(level.value, stageCount.value));
/** 滑条填充百分比（与技能卡 / 光锥页同一套 range 原语口径） */
const fillPct = computed(() => ((level.value - 1) / Math.max(MAX_CHAR_LEVEL - 1, 1)) * 100);

function onSlider(e: Event): void {
  level.value = Number((e.target as HTMLInputElement).value);
}

const tiers = computed<StatTier[]>(() => {
  const stats = props.d.stats;
  const maxStat = maxLevelStat(stats);
  if (!stats || !maxStat) return [];
  // 面板层按当前档位与当前等级取值；档位缺失（理论上不会）或滑条停用时回退满级档
  const cur = (sliderEnabled.value && stats[String(stage.value)]) || maxStat;
  const lv = sliderEnabled.value ? level.value : MAX_CHAR_LEVEL;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const mk = (v: number | string, l: string, k: string, icon: string, add?: number): Stat => ({ v, l, k, icon, add });
  const grow = (base: number, add: number) => Math.round(levelStatValue(base, add, lv));
  return [
    {
      id: 'panel',
      items: [
        mk(grow(cur.hp_base, cur.hp_add), t('common.stat.hp'), 'hp', cdnUri('trace', 'IconMaxHP.webp'), cur.hp_add),
        mk(grow(cur.attack_base, cur.attack_add), t('common.stat.atk'), 'atk', cdnUri('trace', 'IconAttack.webp'), cur.attack_add),
        mk(grow(cur.defence_base, cur.defence_add), t('common.stat.def'), 'def', cdnUri('trace', 'IconDefence.webp'), cur.defence_add),
      ],
    },
    {
      id: 'param',
      items: [
        mk(maxStat.speed_base, t('catalog.charge.speed'), 'spd', cdnUri('trace', 'IconSpeed.webp')),
        mk(fmtPct(maxStat.critical_chance), t('prop.CriticalChanceBase'), 'crit-rate', cdnUri('trace', 'IconCriticalChance.webp')),
        mk(fmtPct(maxStat.critical_damage), t('prop.CriticalDamageBase'), 'crit-dmg', cdnUri('trace', 'IconCriticalDamage.webp')),
        mk(maxStat.base_aggro ?? 0, t('stat.taunt'), 'taunt', TRACE_TAUNT_SVG),
        // 遐蝶（1407）是全量 98 只里唯一没有 `sp_need` 的：此处不能回退成 0——「能量上限 0」是**假数据**；
        // 占位符 `—` 才是「该字段确实为空」的诚实表达（`fmtStatValue` 对已格式化字符串原样输出）。
        mk(props.d.sp_need ?? '—', t('stat.energyCap'), 'energy', cdnUri('trace', 'IconEnergyLimit.webp')),
      ],
    },
  ];
});

/** 每级成长值：converter 输出为 1~3 位小数（3.3 / 4.125 / 7.128），去浮点噪声后原样展示 */
function fmtAdd(n: number): string {
  return String(Number(n.toFixed(3)));
}
</script>

<template>
  <section class="nk-stats">
    <h2 class="nk-title">
      <span class="nk-title__idx">{{ SECTION_IDX.stats }}</span>BASE STATS
    </h2>
    <!-- 等级滑条：range 原语复用技能卡那一套（`.nk-skill__slider` + `.nk-slider__val`，本路由已加载
         skill-card.css，全站唯一可达的 range 原语；不复制样式、也不裸重置 outline——焦点环走全局规则）。 -->
    <div v-if="sliderEnabled" class="nk-stats__level">
      <div class="nk-skill__slider">
        <span class="nk-slider__val nk-stats__level-val">Lv.{{ level }}/{{ MAX_CHAR_LEVEL }}</span>
        <span class="nk-stats__level-stage">{{ t('stat.stage', { n: stage }) }}</span>
        <input
          type="range"
          min="1"
          :max="MAX_CHAR_LEVEL"
          :value="level"
          :aria-label="t('stat.levelAria')"
          :aria-valuetext="t('stat.levelValue', { level, stage })"
          :style="{ '--fill': fillPct + '%' }"
          @input="onSlider"
        >
      </div>
    </div>
    <dl
      v-for="tier in tiers"
      :key="tier.id"
      class="nk-stats__tier"
      :class="`nk-stats__tier--${tier.id}`"
    >
      <div v-for="st in tier.items" :key="st.l" class="nk-stats__stat" :data-prop="st.k">
        <dt class="nk-stats__term">
          <span class="nk-stats__mark" aria-hidden="true"></span>
          <img class="nk-stats__icon" :src="st.icon" alt="" aria-hidden="true">
          <span class="nk-stats__label">{{ st.l }}</span>
        </dt>
        <dd class="nk-stats__readout">
          <span class="nk-stats__val">{{ fmtStatValue(st.v) }}</span>
          <span v-if="st.add" class="nk-stats__add">{{ t('stat.perLevel', { v: fmtAdd(st.add) }) }}</span>
        </dd>
      </div>
    </dl>
    <!-- 注记文案受列宽约束：≥768 它占面板层尾随两列，768 档该槽仅 238px ⇒ 必须 ≤20 字（22 字实测 258.5px
         会折成两行并留下「成。」这样的孤字行）。故压到 19 字，单行留 15px 余量。 -->
    <p class="nk-stats__note">{{ t('stat.note') }}</p>
  </section>
</template>
