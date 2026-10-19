export function packGroupOf(relPath: string): string {
  const rel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const slash = rel.indexOf('/');
  if (slash >= 0) return rel.slice(0, slash);
  return rel.endsWith('.json') ? rel.slice(0, -5) : rel;
}
