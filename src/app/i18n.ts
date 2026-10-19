import { createI18n } from 'vue-i18n';

const bundles = import.meta.glob<Record<string, string>>('../lib/i18n/messages/*.json', {
  eager: true,
  import: 'default',
});

const messages: Record<string, Record<string, string>> = {};
for (const [path, body] of Object.entries(bundles)) {
  const code = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
  messages[code] = body;
}

const DEV = import.meta.env.DEV;

export const i18n = createI18n({
  legacy: false,
  locale: 'cn',
  fallbackLocale: 'cn',
  messages,
  missingWarn: DEV,
  fallbackWarn: DEV,
});

export function setI18nLocale(code: string): void {
  i18n.global.locale.value = code;
}

export function translate(key: string, named?: Record<string, unknown>): string {
  return named ? i18n.global.t(key, named) : i18n.global.t(key);
}
