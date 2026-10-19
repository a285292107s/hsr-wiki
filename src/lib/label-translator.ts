let translateFn: ((key: string) => string) | null = null;

export function setLabelTranslator(fn: (key: string) => string): void {
  translateFn = fn;
}

export function labelText(key: string): string {
  return translateFn ? translateFn(key) : key;
}

export function labelTextOr(key: string, fallback: string): string {
  const got = labelText(key);
  return got === key ? fallback : got;
}
