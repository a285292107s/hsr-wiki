<script setup lang="ts">
/**
 * 货币战争 · 羁绊详情页
 * 数据：从 traits.json 按 ID 查找（共享单例缓存）
 * 展示：沉浸式头部 → 完整描述 → 备注机制 → 层级进度（含属性表）
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fmtDesc, gridFightTraitIconUrl, avatarShopIconUrl } from '../../lib/format';
import { propLabel } from '../../lib/currency-role';
import { useLoadGeneration } from '../composables/use-load-generation';
import { loadLocalCurrencyTraits, loadLocalCurrencyRoles } from '../../services/api';
import type { CurrencyTraitEntry, CurrencyRoleEntry } from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-trait-detail.css';

const route = useRoute();
const traitId = computed(() => String(route.params.id));
const data = ref<CurrencyTraitEntry | null>(null);
const members = ref<CurrencyRoleEntry[]>([]);
const loading = ref(true);
const error = ref('');

const CAT_LABEL: Record<string, string> = {
  faction: '阵营', combat: '流派', special: '特殊',
};
const QUALITY_LABEL: Record<string, string> = {
  Silver: '银色', Gold: '金色', Multicolor: '彩', Unique: '独特',
};
const QUALITY_CSS: Record<string, string> = {
  Silver: 'silver', Gold: 'gold', Multicolor: 'multicolor', Unique: 'unique',
};
const ACT_LABEL: Record<string, string> = {
  GreaterEqualThan: '≥N 人激活',
};

/** 属性值格式化：羁绊层级属性均为比率值（0.2=20%, 1.5=150%, 3.2=320%） */
function propValue(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

function traitIconUrl(icon: string): string {
  return gridFightTraitIconUrl(icon);
}

const cat = computed(() => data.value?.cat || 'special');
const catLabel = computed(() => CAT_LABEL[cat.value] || cat.value);
const actLabel = computed(() => ACT_LABEL[data.value?.activation_type || ''] || '');


/** 加载代：羁绊间快速导航时防止旧数据覆盖新数据（统一 useLoadGeneration 模式） */
const loadGen = useLoadGeneration();

async function load() {
  const gen = loadGen.begin();
  loading.value = true;
  error.value = '';
  try {
    const [{ traits }, { roles }] = await Promise.all([
      loadLocalCurrencyTraits(),
      loadLocalCurrencyRoles(),
    ]);
    if (!loadGen.isCurrent(gen)) return;
    const found = traits.find((t) => String(t.id) === traitId.value);
    if (!found) { error.value = '未找到该羁绊'; return; }
    data.value = found;
    const tid = Number(traitId.value);
    members.value = roles.filter((r) => r.trait_list.includes(tid));
  } catch (e) {
    if (!loadGen.isCurrent(gen)) return;
    error.value = (e as Error).message || '加载失败';
  } finally {
    if (loadGen.isCurrent(gen)) loading.value = false;
  }
}
watch(traitId, load, { immediate: true });
watch(data, (d) => { if (d) document.title = `${d.name} - HSR Wiki`; }, { immediate: true });
</script>

<template>
  <div class="nk-ctrait">
    <!-- 加载骨架 -->
    <div v-if="loading" class="nk-ctrait__skeleton">
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-icon"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-title" style="width:40%"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:80%"></div>
      <div class="nk-sk nk-sk--shimmer nk-ctrait__sk-line" style="width:60%"></div>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="nk-ctrait__state nk-ctrait__state--err">
      <span class="nk-ctrait__state-icon">⚠</span>
      <p>{{ error }}</p>
      <button class="nk-ctrait__retry" @click="load">重试</button>
    </div>

    <template v-else-if="data">
      <!-- ═══ Hero 头部 ═══ -->
      <header class="nk-ctrait-hero" :data-cat="cat">
        <div class="nk-ctrait-hero__glow"></div>
        <div class="nk-ctrait-hero__content">
          <div class="nk-ctrait-hero__icon">
            <img :src="traitIconUrl(data.icon)" :alt="data.name" loading="eager" />
          </div>
          <div class="nk-ctrait-hero__info">
            <div class="nk-ctrait-hero__badges">
              <span class="nk-ctrait-hero__cat" :class="`nk-ctrait-hero__cat--${cat}`">{{ catLabel }}</span>
            </div>
            <h1 class="nk-ctrait-hero__name">{{ data.name }}</h1>
          </div>
        </div>
      </header>

      <!-- ═══ 完整描述 ═══ -->
      <section class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">效果说明</h2>
        <div class="nk-ctrait-desc" v-html="fmtDesc(data.desc, data.base_params)"></div>
      </section>

      <!-- ═══ 备注机制 ═══ -->
      <section v-if="data.remarks && data.remarks.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">机制详情</h2>
        <div class="nk-ctrait-remarks">
          <div v-for="(r, ri) in data.remarks" :key="ri" class="nk-ctrait-remark">
            <div class="nk-ctrait-remark__text" v-html="fmtDesc(r.desc, r.params)"></div>
          </div>
        </div>
      </section>

      <!-- ═══ 羁绊成员 ═══ -->
      <section v-if="members.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">羁绊成员<span class="nk-ctrait-section__note">（{{ members.length }} 人）</span></h2>
        <div class="nk-ctrait-members">
          <router-link
            v-for="m in members"
            :key="m.id"
            :to="`/currency/role/${m.id}`"
            class="nk-ctrait-member"
          >
            <img class="nk-ctrait-member__avatar" :src="avatarShopIconUrl(m.avatar_id || m.id)" :alt="m.name" loading="lazy" />
            <span class="nk-ctrait-member__name">{{ m.name }}</span>
            <span v-if="m.rarity" class="nk-ctrait-member__cost">{{ m.rarity }}费</span>
          </router-link>
        </div>
      </section>

      <!-- ═══ 层级效果 ═══ -->
      <section v-if="data.layers && data.layers.length" class="nk-ctrait-section">
        <h2 class="nk-ctrait-section__title">层级效果<span v-if="actLabel" class="nk-ctrait-section__note">（{{ actLabel }}）</span></h2>
        <div class="nk-ctrait-layers">
          <article
            v-for="ly in data.layers"
            :key="ly.layer"
            class="nk-ctrait-layer"
            :class="`nk-ctrait-layer--${ly.quality ? (QUALITY_CSS[ly.quality] || '') : 'base'}`"
          >
            <!-- 左侧：品质菱形节点（内嵌阈值数字）+ 进度轨 -->
            <div class="nk-ctrait-layer__mark">
              <span class="nk-ctrait-layer__node"><span class="nk-ctrait-layer__num">{{ ly.layer }}</span></span>
            </div>
            <!-- 右侧：内容面板 -->
            <div class="nk-ctrait-layer__body">
              <header class="nk-ctrait-layer__head">
                <span class="nk-ctrait-layer__quality">
                  <i class="nk-ctrait-layer__qdot"></i>{{ ly.quality ? (QUALITY_LABEL[ly.quality] || ly.quality) : '基础' }}品质
                </span>
                <span class="nk-ctrait-layer__act">{{ ly.layer }} 人激活</span>
              </header>
              <div v-if="ly.desc" class="nk-ctrait-layer__desc" v-html="fmtDesc(ly.desc, ly.params)"></div>
              <div v-if="ly.buff_desc" class="nk-ctrait-layer__buff" v-html="fmtDesc(ly.buff_desc, ly.buff_params || [])"></div>
              <!-- 属性芯片仅在没有描述文本时展示 -->
              <div v-if="!ly.desc && (ly.member_props.length || ly.all_props.length)" class="nk-ctrait-layer__props">
                <div v-for="(p, pi) in ly.member_props" :key="'m'+pi" class="nk-ctrait-prop">
                  <span class="nk-ctrait-prop__scope">成员</span>
                  <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                  <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
                </div>
                <div v-for="(p, pi) in ly.all_props" :key="'a'+pi" class="nk-ctrait-prop">
                  <span class="nk-ctrait-prop__scope nk-ctrait-prop__scope--all">全员</span>
                  <span class="nk-ctrait-prop__name">{{ propLabel(p) }}</span>
                  <b class="nk-ctrait-prop__val">+{{ propValue(p.value) }}</b>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
