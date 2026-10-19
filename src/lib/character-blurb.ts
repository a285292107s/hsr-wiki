export function characterBlurb(stories: Record<string, string | null> | undefined | null): string {
  const first = stories?.['0'] ?? '';
  return first.split('\\n')[0]?.trim() ?? '';
}
