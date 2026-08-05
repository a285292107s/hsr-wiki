<script setup lang="ts">
/**
 * 配装面板：推荐光锥 / 推荐队伍 / 遗器主副词条 + 套装（描述异步加载）。
 * 套装描述加载 watch baseData（base 数据）而非渲染视图 d —— 加强切换不重复请求。
 */
import { computed, ref, watch } from 'vue';
import { loadLocalRelicSet } from '../../services/api';
import { fmtDesc, itemName } from '../../lib/format';
import { CDN, PROP_NAMES, SLOT_ICONS, SLOT_NAMES } from '../../lib/constants';
import type { CharacterData, ItemDb, NameCache, RelicSetData } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  /** base 数据（char.data；套装描述异步加载的触发源，加强切换不变） */
  baseData: CharacterData | null;
  charId: string;
  nameCache: NameCache;
  itemDb: ItemDb;
}>();

/* ─── 光锥 / 队伍 ─── */

const cones = computed(() =>
  (props.d.lightcones || []).map((id, i) => ({
    id,
    rank: i + 1,
    name: itemName(id, props.nameCache, props.itemDb),
    img: `${CDN}/assets/hsr/lightconemediumicon/${id}.webp`,
  })),
);

interface TeamSlot {
  mid: number;
  name: string;
  img: string;
  backups: { id: number; name: string; img: string }[];
}
const teams = computed<{ teamId: number; members: TeamSlot[] }[]>(() => {
  const dd = props.d;
  if (!dd.teams || !dd.teams.length) return [];
  return dd.teams.map((team) => {
    const raw = team as unknown as Record<string, unknown>;
    const members = (team.member_list || []).map((mid, i) => {
      const backups = (raw[`backup_list${i + 1}`] as number[] | undefined) || [];
      return {
        mid,
        name: itemName(mid, props.nameCache, props.itemDb),
        img: `${CDN}/assets/hsr/avatarroundicon/${mid}.webp`,
        backups: backups.slice(0, 4).map((b) => ({
          id: b,
          name: itemName(b, props.nameCache, props.itemDb),
          img: `${CDN}/assets/hsr/avatarroundicon/${b}.webp`,
        })),
      };
    });
    return { teamId: team.team_id, members };
  });
});

/* ─── 遗器 ─── */

const relic = computed(() => props.d.relics || null);
const relicMainStats = computed(() => (relic.value && relic.value.property_list) || []);
const relicSubs = computed(() =>
  ((relic.value && relic.value.sub_affix_property_list) || []).map((p) => PROP_NAMES[p] || p),
);
const setIdList = computed<{ id: number; pc: number }[]>(() => {
  const arr: { id: number; pc: number }[] = [];
  const r = relic.value;
  if (r) {
    (r.set4_id_list || []).forEach((id) => arr.push({ id, pc: 4 }));
    (r.set2_id_list || []).forEach((id) => arr.push({ id, pc: 2 }));
  }
  return arr;
});
const hasRelicSection = computed(() =>
  relicMainStats.value.length > 0 || relicSubs.value.length > 0 || setIdList.value.length > 0,
);
const buildsEmpty = computed(() =>
  !cones.value.length && !teams.value.length && !hasRelicSection.value,
);

/* ─── 遗器套装描述异步加载（base data 变化时触发；加强切换不重复） ─── */
const relicSets = ref<Record<string, RelicSetData | null>>({});
watch(
  () => props.baseData,
  (data) => {
    relicSets.value = {};
    const r = data && data.relics;
    if (!r) return;
    const ids: { id: number; pc: number }[] = [];
    (r.set4_id_list || []).forEach((id) => ids.push({ id, pc: 4 }));
    (r.set2_id_list || []).forEach((id) => ids.push({ id, pc: 2 }));
    ids.forEach((s) => {
      void loadLocalRelicSet(s.id).then((rs) => {
        relicSets.value = { ...relicSets.value, [String(s.id)]: rs };
      });
    });
  },
  { immediate: true }, // 面板在数据就绪后才挂载，需立即执行一次
);

function setIcon(data: RelicSetData | null | undefined): string {
  if (data && data.icon) {
    const iconId = data.icon.split('/').pop()!.replace('.png', '');
    return `${CDN}/assets/hsr/itemfigures/${iconId}.webp`;
  }
  return '';
}
function setName(id: number, data: RelicSetData | null | undefined): string {
  return (data && data.name) || itemName(id, props.nameCache, props.itemDb);
}
function setDescHtml(pc: number, data: RelicSetData | null | undefined): string {
  const info = data && data.require_num && data.require_num[String(pc)];
  return info && info.desc ? fmtDesc(info.desc, info.param_list || []) : '';
}
</script>

<template>
  <template v-if="cones.length">
    <div class="nk-title">LIGHT CONES</div>
    <div class="nk-build__cones">
      <div v-for="c in cones" :key="c.id" class="nk-build__cone">
        <img :src="c.img">
        <div>
          <div class="nk-build__cone-name">{{ c.name }}</div>
          <div class="nk-build__cone-rank">REC. {{ c.rank }}</div>
        </div>
      </div>
    </div>
  </template>
  <template v-if="teams.length">
    <div class="nk-title">TEAMS</div>
    <div class="nk-build__teams">
      <div v-for="t in teams" :key="t.teamId" class="nk-build__team">
        <div class="nk-build__team-slot nk-build__team-slot--main">
          <img :src="`${CDN}/assets/hsr/avatarroundicon/${charId}.webp`" title="当前角色">
        </div>
        <span class="nk-build__team-plus">+</span>
        <template v-for="(m, i) in t.members" :key="m.mid">
          <div class="nk-build__team-slot">
            <img :src="m.img" :title="m.name">
            <div v-if="m.backups.length" class="nk-build__team-alt">
              <img v-for="b in m.backups" :key="b.id" :src="b.img" :title="b.name">
            </div>
          </div>
          <span v-if="i < t.members.length - 1" class="nk-build__team-plus">+</span>
        </template>
      </div>
    </div>
  </template>
  <template v-if="hasRelicSection">
    <div class="nk-title">RELICS</div>
    <div class="nk-build__relics">
      <!-- 主词条槽位卡片 -->
      <div v-if="relicMainStats.length" class="nk-relic-slots">
        <div
          v-for="p in relicMainStats"
          :key="p.relic_type + p.property_type"
          class="nk-relic-slot"
        >
          <img class="nk-relic-slot__icon" :src="`${CDN}/assets/hsr/relicfigures/${SLOT_ICONS[p.relic_type] || 'IconRelicBody'}.webp`">
          <span class="nk-relic-slot__stat">{{ PROP_NAMES[p.property_type] || p.property_type }}</span>
          <span class="nk-relic-slot__slot">{{ SLOT_NAMES[p.relic_type] || p.relic_type }}</span>
        </div>
      </div>
      <!-- 推荐副词条卡片 -->
      <div v-if="relicSubs.length" class="nk-relic-sub">
        <span class="nk-relic-sub__label">推荐副词条</span>
        <div class="nk-relic-sub__list">
          <span v-for="s in relicSubs" :key="s" class="nk-relic-sub__chip">{{ s }}</span>
        </div>
      </div>
      <div v-if="setIdList.length" class="nk-build__sets">
        <div v-for="s in setIdList" :key="`${s.id}-${s.pc}`" class="nk-build__set">
          <div class="nk-build__set-head">
            <img :src="setIcon(relicSets[s.id]) || undefined">
            <div>
              <div class="nk-build__set-badge">{{ s.pc }}PC</div>
              <div class="nk-build__set-name">{{ setName(s.id, relicSets[s.id]) }}</div>
            </div>
          </div>
          <div class="nk-build__set-desc" v-html="setDescHtml(s.pc, relicSets[s.id])"></div>
        </div>
      </div>
    </div>
  </template>
  <p v-if="buildsEmpty" style="color: var(--text3)">暂无配装数据</p>
</template>
