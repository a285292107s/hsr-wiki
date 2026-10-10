/* API 层共享基址：本地数据根路径（随站部署，Vite base 自动带前缀）。
   独立成模块避免 barrel 循环引用。 */
export const LOCAL_DATA_BASE = `${import.meta.env.BASE_URL}data/cn`;

/* 语言包根路径（[ADR 0052](../../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md)）：
   结构层 `data/cn/**` 语言无关（文本位置是引用令牌），各语言正文在 `data/i18n/<语言>/<分组>.json`。 */
export const LOCAL_PACK_BASE = `${import.meta.env.BASE_URL}data/i18n`;
