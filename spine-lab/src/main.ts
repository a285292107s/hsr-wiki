/**
 * Spine Lab 独立入口(研究线):
 * - 不自建可靠:无 vue-router / Pinia,面板间状态经 query 参数 + 事件同步
 * - 自行启动 CDN 健康探测(主项目 bootstrap 的探测逻辑不共享)
 */
import { createApp } from 'vue';
import App from './App.vue';
import { startCdnHealthProbe } from '../../src/services/cdn/health';
import './styles/base.css';

startCdnHealthProbe();

createApp(App).mount('#app');