<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import {
  TARGET_TYPE_LABEL, targetHtml, targetTypeIconHtml,
} from './renders';
import StageContent from './StageContent.vue';
import StageHead from './StageHead.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameTraitGroup from './EndgameTraitGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import { itemIconUrl } from '../../lib/format';
import { loadLocalItems } from '../../services/api';
import EnemyCard from '../components/EnemyCard.vue';
import type { LocalItemEntry, MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeTierceNode } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  /** 作为子 tab 面板渲染（末日幻影）：不渲染区块标题 */
  embedded?: boolean;
}>();

const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [])));

const tierceCountdown = computed<number>(() => props.data.tierce?.countdown || 0);
const tierceScore = computed<number | null>(() => props.data.tierce?.score ?? null);
const tierceTargets = computed(() => props.data.tierce?.targets || []);
const tierceMonsters = computed(() => props.data.tierce?.monsters || []);
/** 星启 3 节点，每个节点是一整场战斗（完整场次内容） */
const tierceNodes = computed<MazeTierceNode[]>(() => props.data.tierce?.nodes || []);

/** 节点 1/2 同源的常规末层层号（Tierce 的 DLCKKJFMJOB = 常规最高难度关，即最大层） */
const sameFloor = computed<number | null>(() => {
  const floors = (props.data.floor_details || []).map((f) => f.floor);
  return floors.length ? Math.max(...floors) : null;
});
/** 节点 1/2 的同源标注（这两个节点就是末层上下半场；节点 3 是星启附加关，不标） */
function nodeOrigin(idx: number): string {
  if (!sameFloor.value || idx > 2) return '';
  return `同第 ${sameFloor.value} 层`;
}
/** 节点标题走场次口径（节点编号只活在数据里，不上屏） */
function nodeLabel(nd: MazeTierceNode): string {
  return nd.idx === 1 ? '上半场' : nd.idx === 2 ? '下半场' : '星启附加关';
}
/** 该场次的赛季增益与首领特性：按 origin 取赛季级分场次字段（仅末日幻影产出） */
function nodeBuffs(nd: MazeTierceNode): MazeBuffInfo[] {
  return props.data.buff_groups?.[nd.origin] || [];
}
function nodeTraits(nd: MazeTierceNode): MazeBossTrait[] {
  return props.data.boss_traits?.[nd.origin] || [];
}

const itemMap = ref<Map<number, Pick<LocalItemEntry, 'name' | 'icon'>>>(new Map());
/** 星启通关奖励（EGEEJLHBALB：物品 id + 数量，经 items.json 映射名称/图标） */
const tierceRewards = computed(() => {
  const rs = props.data.tierce?.rewards || [];
  if (!rs.length) return [];
  const map = itemMap.value;
  return rs.map((r) => ({ id: r.id, num: r.num, ...(map.get(r.id) || { name: `#${r.id}`, icon: '' }) }));
});
watch(
  () => props.data.tierce,
  (t) => {
    if (!t) return;
    loadLocalItems()
      .then((list) => { itemMap.value = new Map(list.map((it) => [it.id, { name: it.name, icon: it.icon }])); })
      .catch(() => {});
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="data.tierce">
    <h2 v-if="!embedded" id="egd-tierce" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['tierce'] }}</span>星启模式 STARLIT</h2>
    <div class="nk-egd-tierce">
      <div v-if="tierceCountdown || tierceScore != null" class="nk-egd-tierce__stats">
        <div v-if="tierceCountdown" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceCountdown }}</span>
          <span class="nk-egd-tierce__label">回合限制 CYCLES</span>
        </div>
        <div v-if="tierceScore != null" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceScore.toLocaleString() }}</span>
          <span class="nk-egd-tierce__label">分数限制 SCORE</span>
        </div>
      </div>
      <div v-if="tierceTargets.length || tierceRewards.length" class="nk-egd-tierce__head">
        <div v-if="tierceTargets.length" class="nk-egd-tierce__col">
          <span class="nk-egd-tierce__headlabel">挑战目标</span>
          <ol class="nk-egd-tierce__targets">
            <li v-for="(t, i) in tierceTargets" :key="i" class="nk-egd-node">
              <span
                v-if="t.type && TARGET_TYPE_LABEL[t.type]"
                class="nk-egd-node__type"
                :title="TARGET_TYPE_LABEL[t.type]"
                v-html="targetTypeIconHtml(t.type)"
              ></span>
              <span class="nk-egd-node__text" v-html="targetHtml(t)"></span>
            </li>
          </ol>
        </div>
        <div v-if="tierceRewards.length" class="nk-egd-tierce__col nk-egd-reward">
          <div class="nk-egd-reward__head">
            <span class="nk-egd-tierce__headlabel">通关奖励</span>
            <span v-if="tierceScore" class="nk-egd-reward__goal">通关目标：获得 {{ tierceScore.toLocaleString() }} 分</span>
          </div>
          <div class="nk-egd-reward__items">
            <span v-for="r in tierceRewards" :key="r.id" class="nk-egd-reward__item">
              <img v-if="r.icon" class="nk-egd-reward__icon" :src="itemIconUrl(r.icon)" :alt="r.name" :title="r.name" loading="lazy" @error="($event.target as HTMLImageElement).classList.add('nk-img-error')">
              <span v-else class="nk-egd-reward__icon nk-egd-reward__icon--void">{{ String(r.id).slice(0, 2) }}</span>
              <span class="nk-egd-reward__name">{{ r.name }}</span>
              <span v-if="r.num" class="nk-egd-reward__num">×{{ r.num.toLocaleString() }}</span>
            </span>
          </div>
        </div>
      </div>
      <ol v-if="tierceNodes.length" class="nk-egd-tierce__nodes" aria-label="星启节点列表">
        <li v-for="nd in tierceNodes" :key="nd.idx" class="nk-egd-tierce__node">
          <header class="nk-egd-tierce__nodehead">
            <span class="nk-egd-tierce__nodelabel"><span class="nk-egd-tierce__nodezh">{{ nodeLabel(nd) }}</span></span>
            <span v-if="nodeOrigin(nd.idx)" class="nk-egd-tierce__nodefrom">{{ nodeOrigin(nd.idx) }}</span>
            <StageHead :stage="nd" />
            <span v-if="nd.level || nd.countdown" class="nk-egd-floor__data">
              <span v-if="nd.level" class="nk-egd-floor__dataitem">
                <span class="nk-egd-floor__dataval">{{ nd.level }}</span>
                <span class="nk-egd-floor__datalabel">等级</span>
              </span>
              <span v-if="nd.countdown" class="nk-egd-floor__dataitem">
                <span class="nk-egd-floor__dataval">{{ nd.countdown }}</span>
                <span class="nk-egd-floor__datalabel">回合</span>
              </span>
            </span>
          </header>
          <div class="nk-egd-tierce__nodebody nk-egd-children">
            <StageContent :stage="nd" :is-boss="true" headless />
            <div v-if="nodeBuffs(nd).length || nodeTraits(nd).length" class="nk-egd-lvl__effects">
              <EndgameBuffGroup
                v-if="nodeBuffs(nd).length"
                title="赛季增益"
                :items="nodeBuffs(nd)"
              />
              <EndgameTraitGroup
                v-if="nodeTraits(nd).length"
                title="首领特性"
                :items="nodeTraits(nd)"
              />
            </div>
            <EndgameFloorBuff :buff="nd.buff" />
          </div>
        </li>
      </ol>
      <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
        <EnemyCard v-for="m in tierceMonsters" :key="m.id" :monster="m" />
      </div>
    </div>
  </template>
</template>
