/**
 * API 层共享基址：本地数据根路径（随站部署，Vite base 自动带前缀）。
 * 独立成模块避免 barrel 循环引用。
 */
export const LOCAL_DATA_BASE = `${import.meta.env.BASE_URL}data/cn`;
