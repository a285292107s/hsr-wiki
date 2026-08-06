<script setup lang="ts">
/**
 * 配装面板：推荐光锥 / 推荐队伍 / 遗器主副词条 + 套装（描述异步加载）。
 * 套装描述加载 watch baseData（base 数据）而非渲染视图 d —— 加强切换不重复请求。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadLocalLightCones, loadLocalRelicSet } from '../../services/api';
import { fmtDesc, itemName, pathIconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { PROP_NAMES, SLOT_ICONS, SLOT_NAMES } from '../../lib/constants';
import { SECTION_IDX } from './sections';
import type { CharacterData, ItemDb, NameCache, RelicSetData } from '../../services/types';

type BuildSection = 'cones' | 'teams' | 'relics';

const props = withDefaults(
  defineProps<{
    d: CharacterData;
    /** base 数据（char.data；套装描述异步加载的触发源，加强切换不变） */
    baseData: CharacterData | null;
    charId: string;
    nameCache: NameCache;
    itemDb: ItemDb;
    /** 渲染区块子集（平铺拆分布局用；默认全部） */
    sections?: BuildSection[];
  }>(),
  { sections: () => ['cones', 'teams', 'relics'] },
);

/* ─── 光锥 / 队伍 ─── */

/** 光锥元数据（id → rarity/path，来自共享单例 light_cones.json；推荐卡片星级/命途徽章用） */
const lcMeta = ref<Record<string, { rarity: number; path: string }>>({});
onMounted(() => {
  void loadLocalLightCones()
    .then((list) => {
      const map: Record<string, { rarity: number; path: string }> = {};
      for (const it of list) map[String(it.id)] = { rarity: it.rarity, path: it.path || '' };
      lcMeta.value = map;
    })
    .catch(() => { /* 元数据缺失时回退默认星级/无徽章，不阻塞 */ });
});

const cones = computed(() =>
  (props.d.lightcones || []).map((id, i) => {
    const meta = lcMeta.value[String(id)];
    const rarity = meta ? meta.rarity : 5;
    const path = meta ? meta.path : '';
    return {
      id,
      rank: i + 1,
      name: itemName(id, props.nameCache, props.itemDb),
      img: cdnUri('lightconemediumicon', `${id}.webp`),
      rarity,
      stars: '★'.repeat(rarity),
      path,
      pathImg: path ? pathIconUrl(path) : '',
      href: `/lightcone/${id}`,
    };
  }),
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
        img: cdnUri('avatarroundicon', `${mid}.webp`),
        backups: backups.slice(0, 4).map((b) => ({
          id: b,
          name: itemName(b, props.nameCache, props.itemDb),
          img: cdnUri('avatarroundicon', `${b}.webp`),
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

/* ─── 遗器套装描述异步加载（base data 变化时触发；加强切换不重复） ───
 * 代际保护：角色快速切换时，迟到的旧套装响应直接丢弃，避免混入/覆盖新角色数据。 */
const relicSets = ref<Record<string, RelicSetData | null>>({});
let relicGen = 0;
watch(
  () => props.baseData,
  (data) => {
    // 平铺拆分布局下本实例可能不渲染遗器块（如 cones+teams 实例）：跳过加载
    if (!props.sections.includes('relics')) return;
    const gen = ++relicGen;
    relicSets.value = {};
    const r = data && data.relics;
    if (!r) return;
    const ids: { id: number; pc: number }[] = [];
    (r.set4_id_list || []).forEach((id) => ids.push({ id, pc: 4 }));
    (r.set2_id_list || []).forEach((id) => ids.push({ id, pc: 2 }));
    void Promise.all(
      ids.map(async (s) => {
        try {
          return [String(s.id), await loadLocalRelicSet(s.id)] as const;
        } catch {
          // 加载失败静默：名称回退 itemName，描述留空，不阻塞页面
          return [String(s.id), null] as const;
        }
      }),
    ).then((entries) => {
      if (gen !== relicGen) return; // 已被更新的加载取代
      relicSets.value = Object.fromEntries(entries);
    });
  },
  { immediate: true }, // 面板在数据就绪后才挂载，需立即执行一次
);
// 卸载后飞行中的响应一律过期（写入已销毁组件的 ref 无意义）
onBeforeUnmount(() => {
  relicGen++;
});

function setIcon(data: RelicSetData | null | undefined): string {
  if (data && data.icon) {
    const iconId = data.icon.split('/').pop()!.replace('.png', '');
    return cdnUri('itemfigures', `${iconId}.webp`);
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
  <template v-if="props.sections.includes('cones') && cones.length">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.cones }}</span>LIGHT CONES</div>
    <!-- 推荐光锥卡片：复用图鉴 nk-lc-card 视觉（3:4 相框立绘 + 星级光晕 + 命途徽章 + 扫光），另加 REC. 序号徽章 -->
    <div class="nk-build__cones">
      <a
        v-for="c in cones"
        :key="c.id"
        class="nk-lc-card"
        :href="c.href"
        :data-rarity="c.rarity"
        :title="c.name"
      >
        <div class="nk-lc-card__img">
          <img class="lc-avatar" :src="c.img" :alt="c.name" loading="lazy">
          <span class="nk-lc-mini__rec">REC. {{ c.rank }}</span>
          <div v-if="c.pathImg" class="nk-lc-card__badge">
            <img :src="c.pathImg" :alt="c.path">
          </div>
          <div class="nk-lc-card__sheen-wrap" aria-hidden="true"></div>
          <div class="nk-lc-card__info">
            <span class="nk-lc-card__stars">{{ c.stars }}</span>
            <span class="nk-lc-card__name">{{ c.name }}</span>
          </div>
        </div>
      </a>
    </div>
  </template>
  <template v-if="props.sections.includes('teams') && teams.length">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.teams }}</span>TEAMS</div>
    <div class="nk-build__teams">
      <div v-for="t in teams" :key="t.teamId" class="nk-build__team">
        <div class="nk-build__team-slot nk-build__team-slot--main">
          <RouterLink :to="`/character/${charId}`" class="nk-build__team-link" title="当前角色">
            <img :src="cdnUri('avatarroundicon', `${charId}.webp`)" alt="当前角色">
          </RouterLink>
        </div>
        <span class="nk-build__team-plus">+</span>
        <template v-for="(m, i) in t.members" :key="m.mid">
          <div class="nk-build__team-slot">
            <RouterLink :to="`/character/${m.mid}`" class="nk-build__team-link" :title="m.name">
              <img :src="m.img" :alt="m.name">
            </RouterLink>
            <div v-if="m.backups.length" class="nk-build__team-alt">
              <RouterLink v-for="b in m.backups" :key="b.id" :to="`/character/${b.id}`" class="nk-build__team-link" :title="b.name">
                <img :src="b.img" :alt="b.name">
              </RouterLink>
            </div>
          </div>
          <span v-if="i < t.members.length - 1" class="nk-build__team-plus">+</span>
        </template>
      </div>
    </div>
  </template>
  <template v-if="props.sections.includes('relics') && hasRelicSection">
    <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.relics }}</span>RELICS</div>
    <div class="nk-build__relics">
      <!-- 主词条槽位卡片 -->
      <div v-if="relicMainStats.length" class="nk-relic-slots">
        <div
          v-for="p in relicMainStats"
          :key="p.relic_type + p.property_type"
          class="nk-relic-slot"
        >
          <img class="nk-relic-slot__icon" :src="cdnUri('relicfigures', `${SLOT_ICONS[p.relic_type] || 'IconRelicBody'}.webp`)">
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
