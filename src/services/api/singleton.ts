export function singletonOf<T>(load: () => Promise<T>, generation?: () => string): () => Promise<T> {
  let p: Promise<T> | null = null;
  let gen: string | undefined;
  return () => {
    const now = generation ? generation() : undefined;
    if (!p || now !== gen) {
      gen = now;
      p = load().catch((e) => { p = null; throw e; });
    }
    return p;
  };
}
