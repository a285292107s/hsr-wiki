<script setup lang="ts">
import { computed } from 'vue';
import StageContent from './StageContent.vue';
import EndgameStarTierList from './EndgameStarTierList.vue';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl, starTierRows } from './renders';
import type { PeakLevelInfo } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 异相仲裁单关面板（由关卡子 tab 切换，一次只渲染一关）：关卡身份（关卡名）由激活的 tab 承担，
 *  面板头只留类别胶囊 + 敌方等级（该关独有、tab 上读不到的字段）；
 *  块序 = 赛季增益（裁决象限）→ 推荐属性 / 敌方配置（共享件 `StageContent`，敌方一律敌方详情卡，
 *  与末日幻影层看板同口径）→ 机制（词条名 + 效果说明，同一批 MazeBuff 的完整条目）→
 *  **星级奖励列表**（面板底部，一档一行：档位 + 该档挑战目标
 *  + 该档奖励；奖励载荷逐期恒定，故垫底，见 `docs/adr/0051` 补记）。
 *  星级奖励与挑战目标同块（同末日幻影看板口径，ADR 0051 补记）：挑战目标不再在面板里单独列一遍。
 *  「绝境」变体是独立的一档（`hard`）：自身数据只有等级 / 敌方 / 机制 / 目标 / 星数档，
 *  推荐属性与裁决象限增益在数据上挂主关，故整块沿用主关（面板单独看仍自洽）。
 *  **两种形态**：档内只有一张节点卡片时 = 全量面板（王棋无绝境变体那种情况，面板头补类别与等级）；
 *  档内多节点时（`EndgamePeakNodes`，王棋的两节点 / 骑士的三关）= `cardsAbove` 形态——上方节点卡片
 *  承担身份与推荐属性，本面板只留 敌方配置 → 机制 → 星级奖励（与末日幻影「节点卡片 + 单看板」同构）。
 *  污染等级不设面板级徽标（用户裁决）：只挂到被污染的那一只敌方卡上（绝境变体沿用本关名单）。 */
const props = defineProps<{
  /** 主关节点（绝境变体 tab 传的也是主关：变体内容在其 `hard` 上） */
  level: PeakLevelInfo;
  /** 当前 tab 是否为王棋「绝境」变体 */
  hard?: boolean;
  /** 增益体系名（异相仲裁 = 裁决象限；来自 `endgame_guide.json`，缺省回退「赛季增益」） */
  systemName?: string;
  /** 本关上方已有一行节点卡片（三关骑士合并档）：身份（关卡名 / 类别 / 等级）与推荐属性
   *  都由卡片承担，面板头与「推荐属性」行随之退场（与末日幻影层 / 星启看板同口径，ADR 0033 决策 11）。
   *  王棋关没有卡片行，保持全量面板。 */
  cardsAbove?: boolean;
}>();

/** 当前 tab 承载的场次：主关 = 节点本体，绝境变体 = 节点的 `hard`（两者都有敌方/机制/目标/星数档） */
type PeakStage = PeakLevelInfo | NonNullable<PeakLevelInfo['hard']>;
const stage = computed<PeakStage>(
  () => (props.hard && props.level.hard ? props.level.hard : props.level),
);
/** 推荐属性与裁决象限增益恒取主关（变体数据里没有这两项） */
const damage = computed(() => props.level.damage);
const buffs = computed(() => props.level.buffs || []);
const headLevel = computed(() => (props.hard ? props.level.hard?.level : props.level.level));

/** 星级奖励列表：档位由转换器按关卡序算好挂在本场上（切档行由前端按目标均分，同 `EndgameFloor`） */
const starTiers = computed(() => stage.value.star_rewards || []);
const tierRows = computed(() => starTierRows(stage.value.targets || [], starTiers.value));
</script>

<template>
  <section class="nk-egd-floor nk-egd-peak">
    <header v-if="!cardsAbove" class="nk-egd-floor__head">
      <span
        class="nk-egd-peak__kind"
        :class="hard ? 'nk-egd-peak__kind--hard' : `nk-egd-peak__kind--${level.kind}`"
      >
        {{ hard ? t('egd.peak.hard') : level.kind === 'king' ? t('egd.peak.king') : t('egd.peak.knight') }}
      </span>
      <span v-if="headLevel" class="nk-egd-floor__data">
        <span class="nk-egd-floor__dataitem">
          <span class="nk-egd-floor__dataval">{{ headLevel }}</span>
          <span class="nk-egd-floor__datalabel">{{ t('egd.label.level') }}</span>
        </span>
      </span>
    </header>

    <div class="nk-egd-peak__body nk-egd-children">

      <div v-if="buffs.length" class="nk-egd-floor__buffs">
        <!-- 异相仲裁赛季增益（裁决象限）：排在敌方配置之前。分区名＝h2、条目名＝h3
             （A1.2 判**文档序**层级递增 ≤1；两者互为兄弟是合法形态） -->
        <h2 class="nk-egd-floor__label nk-egd-peak__seclabel">{{ systemName || t('egm.sec.buffs') }}</h2>
        <div v-for="b in buffs" :key="b.id" class="nk-egd-floor__buff">
          <div class="nk-egd-floor__buffhead">
            <img v-if="b.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
            <h3 class="nk-egd-floor__buffname">{{ b.name }}</h3>
          </div>
          <p v-if="b.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(b)"></p>
        </div>
      </div>

      <!-- 推荐属性 / 敌方配置走共享件（敌方详情卡，与末日幻影层看板同一渲染口径）：
           异相仲裁没有卡片行时，推荐属性与「N 波 · M 敌」摘要由本面板显式传入；
           有卡片行时（三关骑士合并档）这两项归卡片，面板内不再复述 -->
      <StageContent
        :stage="stage"
        :damage="cardsAbove ? undefined : damage"
        :invasion="level.invasion"
        :show-count="!cardsAbove"
      />

      <!-- 机制（MazeBuff 关卡词条）：只随该档渲染（主关与绝境各一份）。名称沿用胶囊形，
           说明排在名称之后——与赛季增益同一张表，故描述同样走 fmtDesc（buffDescHtml）。 -->
      <div v-if="stage.tags?.length" class="nk-egd-floor__mechs">
        <h2 class="nk-egd-floor__label nk-egd-peak__seclabel">{{ t('egd.mechanic') }}</h2>
        <ul class="nk-egd-floor__tags">
          <li v-for="m in stage.tags" :key="m.id" class="nk-egd-peak__mech">
            <span class="nk-egd-peak__tag">{{ m.name }}</span>
            <p v-if="m.desc" class="nk-egd-peak__mechdesc" v-html="buffDescHtml(m)"></p>
          </li>
        </ul>
      </div>

      <!-- 面板底部奖励板：星级奖励列表（一档一行 = 档位徽章 + 该档挑战目标 + 该档奖励），
           与另外三模式的层看板同形；同块即该关的星级挑战要求，面板其它位置不再复述。
           垫底的理由同层看板：奖励载荷逐期恒定，首屏让给当期会变的增益与敌方配置。 -->
      <div v-if="starTiers.length" class="nk-egd-head">
        <EndgameStarTierList :rows="tierRows" />
      </div>

    </div>
  </section>
</template>
