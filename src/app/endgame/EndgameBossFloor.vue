<script setup lang="ts">
import { computed } from 'vue';
import StageContent from './StageContent.vue';
import StageHead from './StageHead.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameTraitGroup from './EndgameTraitGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import EndgameTargets from './EndgameTargets.vue';
import { floorPollution, halfLabel, pollutionLabel } from './pollution';
import type {
  MazeBossTrait, MazeBuffInfo, MazeFloorDetail, MazeListEntry, MazeStageDetail,
} from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  floor: MazeFloorDetail;
}>();

type HalfKey = 'stage1' | 'stage2';

interface FloorNode {
  idx: number;
  half: HalfKey;
  stage: MazeStageDetail;
}

/** 一层只有上下半场两场战斗（ADR 0031）：敌方取实际战斗数据（EventIDList1/2 波次），
 *  星启附加关归星启子 tab，不在层内出现。 */
const nodes = computed<FloorNode[]>(() => {
  const out: FloorNode[] = [];
  (['stage1', 'stage2'] as const).forEach((half, pi) => {
    const stage = props.floor[half];
    if (stage && (stage.monsters?.length || stage.damage?.length)) {
      out.push({ idx: pi + 1, half, stage });
    }
  });
  return out;
});

const pollution = computed(() => floorPollution(props.floor));

function nodeBuffs(n: FloorNode): MazeBuffInfo[] {
  return props.data.buff_groups?.[n.half] || [];
}

function nodeTraits(n: FloorNode): MazeBossTrait[] {
  return props.data.boss_traits?.[n.half] || [];
}
</script>

<template>
  <div class="nk-egd-lvl">
    <header class="nk-egd-lvl__head">
      <h2 class="nk-egd-lvl__title">第 {{ floor.floor }} 层</h2>
      <span v-if="floor.name" class="nk-egd-lvl__name">{{ floor.name }}</span>
      <span v-if="pollution.length" class="nk-egd-lvl__poll">
        <span
          v-for="(p, pi) in pollution"
          :key="pi"
          class="nk-egd-pollchip"
          :data-level="p.invasion.level"
        >{{ pollutionLabel(p.invasion) }}<span class="nk-egd-pollchip__half">{{ halfLabel(p.half) }}</span></span>
      </span>
      <span v-if="floor.level || floor.countdown" class="nk-egd-floor__data">
        <span v-if="floor.level" class="nk-egd-floor__dataitem">
          <span class="nk-egd-floor__dataval">{{ floor.level }}</span>
          <span class="nk-egd-floor__datalabel">等级</span>
        </span>
        <span v-if="floor.countdown" class="nk-egd-floor__dataitem">
          <span class="nk-egd-floor__dataval">{{ floor.countdown }}</span>
          <span class="nk-egd-floor__datalabel">回合</span>
        </span>
      </span>
    </header>

    <section v-for="n in nodes" :key="n.half" class="nk-egd-lvl__node">
      <header class="nk-egd-lvl__nodehead">
        <StageHead :label="halfLabel(n.half)" :stage="n.stage" />
      </header>
      <StageContent :stage="n.stage" :is-boss="true" headless />
      <div v-if="nodeBuffs(n).length || nodeTraits(n).length" class="nk-egd-lvl__effects">
        <EndgameBuffGroup
          v-if="nodeBuffs(n).length"
          title="赛季增益"
          :label="halfLabel(n.half)"
          :items="nodeBuffs(n)"
        />
        <EndgameTraitGroup
          v-if="nodeTraits(n).length"
          title="首领特性"
          :label="halfLabel(n.half)"
          :items="nodeTraits(n)"
        />
      </div>
    </section>

    <EndgameFloorBuff :buff="floor.buff" />

    <EndgameTargets :items="floor.targets || []" />
  </div>
</template>
