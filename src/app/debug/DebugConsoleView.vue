<script setup lang="ts">
/**
 * 研究线调试台（dev-only 路由 /debug，Spine Lab 迁入主站的入口页）：
 * 双 Tab 面板常驻(v-show)以保留各自运行状态——审核队列中途切 Tab 不丢结果;
 * KV 面板仅在激活 Tab 时加载场景。tab 状态经 URL query 同步（沿用研究线
 * query-state 自包含实现，不依赖 vue-router——见 lib/query-state.ts 头注释）。
 * 生产构建不注册本路由（router/index.ts DEV 分支），视图 chunk 随摇树移除。
 */
import { onBeforeUnmount, ref } from 'vue';
import SpineKvSection from './SpineKvSection.vue';
import SpineAuditSection from './SpineAuditSection.vue';
import DeadLinksSection from './DeadLinksSection.vue';
import SystemMapSection from './SystemMapSection.vue';
import { getQueryParam, setQueryParam, subscribeQueryChange } from './lib/query-state';

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
  </div>
</template>

<style scoped>
/* ─── 页面骨架：墨色控制台（研究级仪表）。主站文档流页面，≥768 内容区左避让侧栏 ───
   底色非纯平黑：顶部主色微注入的弱径向晕营造纵深，替代霓虹发光的反 AI 味基调 ─── */
.nk-spine-debug {
  padding: 28px;
  font-family: var(--font-body);
  color: var(--text);
  overflow-x: auto;
  background:
    radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 7%, transparent), transparent 70%),
    var(--bg);
  min-height: 100%;
}
@media (min-width: 768px) {
  .nk-spine-debug { margin-left: var(--nk-content-offset); }
}

/* ─── 头部：HUD 引导行 + 标题 + 说明 + 仪表 Tab ─── */
.nk-spine-debug__head { max-width: 1480px; margin-bottom: 24px; }
.nk-spine-debug__kicker {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--primary);
  text-transform: uppercase;
}
/* 引导行收尾一枚主色「原点」，把纯文字转为仪器刻度感 */
.nk-spine-debug__kicker::after {
  content: '';
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 40%, transparent);
}
.nk-spine-debug__head h1 {
  margin: 0 0 8px;
  font-family: var(--font-hud);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-bright);
}
.nk-spine-debug__desc {
  margin: 0 0 20px;
  max-width: 74ch;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text2);
}

/* 仪表 Tab：胶囊条承载，激活态=主色暖板 + 字重强化；摒弃生硬的分段盒 */
.nk-spine-debug__tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  background: var(--nk-sheet-bg);
  border: 1px solid var(--nk-sheet-border);
  border-radius: 999px;
  box-shadow: var(--nk-shadow-card);
}
.nk-spine-debug__tab {
  padding: 7px 18px;
  font-size: 12px;
  font-family: inherit;
  letter-spacing: 0.02em;
  color: var(--text2);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s var(--nk-ease-out), color 0.2s var(--nk-ease-out);
}
.nk-spine-debug__tab:hover { color: var(--text); background: color-mix(in srgb, var(--text) 8%, transparent); }
.nk-spine-debug__tab.is-active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 16%, transparent);
  font-weight: 600;
}
.nk-spine-debug__tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

@media (max-width: 560px) {
  .nk-spine-debug { padding: 20px 14px; }
  .nk-spine-debug__tabs { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>