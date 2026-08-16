<script setup lang="ts">
/**
 * Spine Lab 外壳(研究线入口页):
 * 双 Tab 面板常驻(v-show)以保留各自运行状态——审核队列中途切 Tab 不丢结果;
 * KV 面板仅在激活 Tab 时加载场景。tab 状态经 query 参数同步(替代原 vue-router 用法)。
 */
import { onBeforeUnmount, ref } from 'vue';
import SpineKvSection from './SpineKvSection.vue';
import SpineAuditSection from './SpineAuditSection.vue';
import DeadLinksSection from './DeadLinksSection.vue';
import SystemMapSection from './SystemMapSection.vue';
import { getQueryParam, setQueryParam, subscribeQueryChange } from './lib/query-state';
import { useToasts } from './lib/toast';

type TabId = 'kv' | 'audit' | 'deadlinks' | 'map';

const TABS: { id: TabId; label: string }[] = [
  { id: 'kv', label: 'KV 场景验收' },
  { id: 'audit', label: '清单审核' },
  { id: 'deadlinks', label: '死链审核' },
  { id: 'map', label: '系统地图' },
];

const tab = ref<TabId>(
  getQueryParam('tab') === 'audit' ? 'audit'
    : getQueryParam('tab') === 'deadlinks' ? 'deadlinks'
      : getQueryParam('tab') === 'map' ? 'map' : 'kv',
);

function selectTab(id: TabId): void {
  if (tab.value === id) return;
  tab.value = id;
  setQueryParam('tab', id);
}

// 响应地址栏 / 外部导航的 ?tab= 变化(replaceState 写入与前进后退均触发)
const unsubscribe = subscribeQueryChange(() => {
  const t: TabId = getQueryParam('tab') === 'audit' ? 'audit'
    : getQueryParam('tab') === 'deadlinks' ? 'deadlinks'
      : getQueryParam('tab') === 'map' ? 'map' : 'kv';
  if (t !== tab.value) tab.value = t;
});
onBeforeUnmount(unsubscribe);

/* ─── 轻量 toast(替代主项目 useAppStore().toast) ─── */

const toasts = useToasts();
</script>

<template>
  <div class="nk-spine-debug">
    <header class="nk-spine-debug__head">
      <p class="nk-spine-debug__kicker">SPINE LAB // 研究线</p>
      <h1>Spine 调试台</h1>
      <p class="nk-spine-debug__desc">
        KV 场景验收：每版本官网抓取的场景一键验收（逐层加载 + 合并渲染 + 黑块检测）→ 导出 PASS/FAIL 报告；清单审核：全量 manifest 条目三级诊断（L0 资源 → L1 解析 → L2 渲染）；死链审核：浏览器端数据驱动 URL 可达性审计（并发 ≤3 限流，结果本地缓存复用）。
      </p>
      <div class="nk-spine-debug__tabs" role="tablist" aria-label="调试功能">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="nk-spine-debug__tab"
          role="tab"
          :aria-selected="tab === t.id"
          :class="{ 'is-active': tab === t.id }"
          @click="selectTab(t.id)"
        >{{ t.label }}</button>
      </div>
    </header>

    <div v-show="tab === 'kv'">
      <SpineKvSection :active="tab === 'kv'" />
    </div>
    <div v-show="tab === 'audit'">
      <SpineAuditSection />
    </div>
    <div v-show="tab === 'deadlinks'">
      <DeadLinksSection />
    </div>
    <div v-show="tab === 'map'">
      <SystemMapSection :active="tab === 'map'" />
    </div>

    <!-- 轻量 toast 宿主 -->
    <div class="lab-toast-host" aria-live="polite">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="lab-toast"
        :class="`is-${t.type}`"
      >{{ t.message }}</div>
    </div>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：OLED 深色控制台风格（研究线无侧栏，全宽布局） ─── */
.nk-spine-debug {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
  overflow-x: auto;
}

/* ─── 头部：HUD 引导行 + 标题 + 说明 + Tab ─── */
.nk-spine-debug__head { max-width: 1480px; margin-bottom: 20px; }
.nk-spine-debug__kicker {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-spine-debug__head h1 {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.nk-spine-debug__desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.72;
}
/* Tab 切换：分段控件风格，激活态主色强化 */
.nk-spine-debug__tabs {
  display: inline-flex;
  border: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
  border-radius: 8px;
  overflow: hidden;
}
.nk-spine-debug__tab {
  padding: 6px 16px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.nk-spine-debug__tab + .nk-spine-debug__tab { border-left: 1px solid color-mix(in srgb, var(--text) 22%, transparent); }
.nk-spine-debug__tab:hover { color: var(--text); background: color-mix(in srgb, var(--text) 8%, transparent); }
.nk-spine-debug__tab.is-active { color: var(--primary); background: color-mix(in srgb, var(--primary) 14%, transparent); }
.nk-spine-debug__tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }

/* ─── toast 宿主：右下角堆叠 ─── */
.lab-toast-host {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}
.lab-toast {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}
.lab-toast.is-success { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.45); }
.lab-toast.is-error { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); }

@media (max-width: 560px) {
  .nk-spine-debug { padding: 16px 12px; }
}
</style>