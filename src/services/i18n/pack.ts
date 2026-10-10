/* 语言包加载（[ADR 0052](../../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2）。
 *
 * 路径 `data/i18n/<语言>/<分组>.json`（分组规则见 `lib/i18n/pack-path.ts`）；按 (语言, 分组)
 * 单例 Promise，失败重置允许重试。
 *
 * 调用方（`api/local.ts`）**先确认结构里确有令牌**才来取包，因此包缺失不是可容忍情形：
 * 真缺包就抛错，不静默降级成空包（否则界面会漏字而不是报错）。
 */
import { fetchJSON } from '../cache';
import { LOCAL_PACK_BASE } from '../api/base';
import { activeLocale } from '../../lib/i18n/active';
import type { TextPack } from '../../lib/i18n/text-ref';

const slots = new Map<string, Promise<TextPack>>();

/** 取某分组的语言包（默认当前语言）；同 (语言, 分组) 只请求一次。 */
export function loadTextPack(group: string, locale: string = activeLocale()): Promise<TextPack> {
  const key = `${locale}/${group}`;
  const hit = slots.get(key);
  if (hit) return hit;
  const p = fetchJSON<TextPack>(`${LOCAL_PACK_BASE}/${locale}/${group}.json`).catch((e: unknown) => {
    slots.delete(key);
    throw e;
  });
  slots.set(key, p);
  return p;
}

/** 清空语言包缓存（切换语言 / 测试隔离用）。 */
export function resetTextPacks(): void {
  slots.clear();
}
