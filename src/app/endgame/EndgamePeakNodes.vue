<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgamePeak from './EndgamePeak.vue';
import type { PeakNodeEntry } from './levels';
import type { MazeStageDetail } from '../../services/types';

import { translate } from '../i18n';

/** 异相仲裁的**节点合并档**（ADR 0043 补记七/八）：一档 = 一行节点卡片 + 单关面板。
 *  - 王棋档：节点一 = 普通王棋、节点二 = 绝境王棋（两个节点都指向主关，绝境靠 `hard` 取那一场）；
 *  - 骑士档：节点一/二/三 = 三关骑士试炼（官方关名）。
 *  形态照末日幻影星启模式的「节点卡片 + 单看板」：卡片兼作子切换与身份位（节点号/关名 + 末波首领图 +
 *  推荐属性 + 等级逐档同屏可比），面板一次只渲染选中那一档（敌方配置 → 机制 → 星级奖励）。 */
const props = defineProps<{
  /** 该档的节点（源序；王棋档最多 2 个、骑士档 3 个） */
  nodes: PeakNodeEntry[];
  /** 卡片行（tablist）的无障碍名 = 所在关卡档的名字（王棋 / 骑士试炼） */
  tabsLabel: string;
  /** 增益体系名（透传给面板；骑士档无裁决象限增益，缺省即不渲染该块） */
  systemName?: string;
}>();

/** 卡片 = 节点身份：绝境节点的推荐属性挂主关（数据事实），末波首领与等级取它自己那一场 */
const cards = computed(() => props.nodes.map((n) => {
  const hard = n.hard ? n.level.hard : null;
  const stage = (hard
    ? { damage: n.level.damage, monsters: hard.monsters, invasion: n.level.invasion }
    : n.level) as MazeStageDetail;
  return {
    key: n.key,
    label: n.label,
    stage,
    level: (hard ? hard.level : n.level.level) || 0,
    // 绝境节点带危险标识（红色三角警告图标，无障碍名 = 官方变体名「绝境」）：
    // 卡片文案是「绝境难度」，图标只作视觉标记
    danger: n.hard ? translate('egd.peak.hard') : '',
  };
}));

/** 当前节点：切档 / 切赛季后旧 key 可能不存在 → 回退第一个 */
const activeKey = ref('');
watch(cards, (list) => {
  if (!list.some((c) => c.key === activeKey.value)) activeKey.value = list[0]?.key || '';
}, { immediate: true });

const activeNode = computed<PeakNodeEntry | null>(
  () => props.nodes.find((n) => n.key === activeKey.value) || null,
);

function selectNode(key: string): void {
  activeKey.value = key;
}
</script>

<template>
  <div class="nk-egd-lvl">
    <EndgameNodeCards
      v-if="cards.length > 1"
      :items="cards"
      :active="activeKey"
      id-prefix="egd-peak-node-tab"
      :tabs-label="tabsLabel"
      panel-id="egd-peak-board"
      @select="selectNode"
    />
    <div
      v-if="activeNode"
      id="egd-peak-board"
      role="tabpanel"
      :aria-labelledby="cards.length > 1 ? `egd-peak-node-tab-${activeKey}` : undefined"
    >
      <EndgamePeak
        :level="activeNode.level"
        :hard="activeNode.hard"
        :cards-above="cards.length > 1"
        :system-name="props.systemName"
      />
    </div>
  </div>
</template>
