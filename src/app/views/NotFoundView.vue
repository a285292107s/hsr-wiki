<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="nk-notfound">
    <div class="nk-notfound__card">
      <p class="nk-notfound__rubric">404 · NOT FOUND</p>
      <h1 class="nk-notfound__title">数据节点未连接</h1>
      <p class="nk-notfound__desc">请求的路径不存在或已被移除。</p>
      <RouterLink to="/" class="nk-notfound__btn">
        返回首页
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h13" /><path d="M12.5 6.5 18 12l-5.5 5.5" />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.nk-notfound {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

/* 写档卡：与全站面板同一套发丝线语言，深链落点时不像一张报错海报 */
.nk-notfound__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: min(520px, 100%);
  padding: 32px 28px 30px;
  background: var(--card);
  border: 1px solid var(--line-1);
  border-radius: var(--nk-radius-card);
}

.nk-notfound__card::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 32px;
  width: 2px;
  height: 18px;
  background: var(--primary);
}

.nk-notfound__rubric {
  font-family: var(--font-hud);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--text3);
}

.nk-notfound__title {
  font-size: clamp(1.25rem, 2.6vw, 1.5rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.25;
  color: var(--text-bright);
}

.nk-notfound__desc {
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--text2);
}

.nk-notfound__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 9px 20px;
  border: 1px solid var(--line-2);
  border-radius: 4px;
  color: var(--text-bright);
  font-family: var(--font-hud);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-decoration: none;
  transition: border-color var(--nk-dur-fast) ease, background var(--nk-dur-fast) ease;
}

.nk-notfound__btn svg {
  width: 14px;
  height: 14px;
  flex: none;
}

.nk-notfound__btn:hover {
  background: var(--nk-shell-hover);
  border-color: var(--primary);
}

.nk-notfound__btn:focus-visible {
  outline: 2px solid var(--text-bright);
  outline-offset: 2px;
}
</style>
