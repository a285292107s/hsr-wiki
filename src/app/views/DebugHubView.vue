<script setup lang="ts">
/**
 * Debug 调试中心入口页（路由 /debug）：
 * 汇总本项目全部诊断页面入口，点击卡片跳转对应子页面。
 */
import { useRouter } from 'vue-router';

const router = useRouter();

interface DebugEntry {
  path: string;
  code: string;
  title: string;
  desc: string;
}

const entries: DebugEntry[] = [
  {
    path: '/debug/spine',
    code: 'KV ACCEPTANCE',
    title: 'KV 场景验收台',
    desc: '每版本官网重新抓取的 KV 场景在此验收：一键验收全部场景（逐层加载 + 合并渲染 + 黑块检测），导出 PASS/FAIL 报告；单层模式供逐层排查。',
  },
  {
    path: '/debug/spine-audit',
    code: 'SPINE IMPORT AUDIT',
    title: 'Spine 导入审核台',
    desc: '全量 spine-manifest 条目批量体检（skel / official / official-scene），三级自动诊断与报告导出。',
  },
];

function go(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="nk-debug-hub">
    <header class="nk-debug-hub__head">
      <p class="nk-debug-hub__kicker">DEBUG CENTER</p>
      <h1>调试中心</h1>
      <p class="nk-debug-hub__desc">项目诊断页面入口汇总，点击卡片进入对应调试台。</p>
    </header>

    <div class="nk-debug-hub__grid">
      <button
        v-for="e in entries"
        :key="e.path"
        type="button"
        class="nk-debug-hub__card"
        @click="go(e.path)"
      >
        <span class="nk-debug-hub__code">{{ e.code }}</span>
        <span class="nk-debug-hub__name">{{ e.title }}</span>
        <span class="nk-debug-hub__info">{{ e.desc }}</span>
        <span class="nk-debug-hub__go">进入 →</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：OLED 深色控制台，左侧避让导航条（与 SpineDebugView 同语言） ─── */
.nk-debug-hub {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
}
@media (min-width: 768px) {
  .nk-debug-hub { margin-left: 72px; }
}
@media (min-width: 1024px) {
  .nk-debug-hub { margin-left: 148px; } /* 随文字侧栏（140px）避让加宽 */
}

/* ─── 头部 ─── */
.nk-debug-hub__head { max-width: 1480px; margin-bottom: 20px; }
.nk-debug-hub__kicker {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-debug-hub__head h1 {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.nk-debug-hub__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.72;
}

/* ─── 入口卡片 ─── */
.nk-debug-hub__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  max-width: 1480px;
}
.nk-debug-hub__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
  text-align: left;
  font-family: inherit;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, transform 0.18s;
}
.nk-debug-hub__card:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  transform: translateY(-1px);
}
.nk-debug-hub__code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--primary);
}
.nk-debug-hub__name {
  font-family: var(--font-hud);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.nk-debug-hub__info {
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.72;
}
.nk-debug-hub__go {
  margin-top: 4px;
  font-size: 12px;
  color: var(--primary);
}
</style>
