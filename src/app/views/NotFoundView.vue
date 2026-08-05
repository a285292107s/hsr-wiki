<script setup lang="ts">
/**
 * 404 页面：Gaming HUD 风格，数据节点未连接。
 */
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="nk-notfound">
    <div class="nk-notfound__code">404</div>
    <div class="nk-notfound__title">数据节点未连接</div>
    <p class="nk-notfound__desc">请求的路径不存在或已被移除。</p>
    <RouterLink to="/" class="nk-notfound__btn">返回首页</RouterLink>
  </div>
</template>

<style scoped>
.nk-notfound {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
}

.nk-notfound__code {
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--accent, var(--ph-400));
  text-shadow: 0 0 40px color-mix(in srgb, var(--accent, var(--ph-400)) 40%, transparent);
  line-height: 1;
}

.nk-notfound__title {
  margin-top: 16px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-bright, #e2e8f0);
}

.nk-notfound__desc {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text3, #94a3b8);
}

.nk-notfound__btn {
  margin-top: 32px;
  padding: 10px 28px;
  border: 1px solid var(--border2, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  color: var(--text-bright, #e2e8f0);
  font-size: 0.875rem;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}

.nk-notfound__btn:hover {
  border-color: var(--accent, var(--ph-400));
  background: color-mix(in srgb, var(--accent, var(--ph-400)) 8%, transparent);
}
</style>
