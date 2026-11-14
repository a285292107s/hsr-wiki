export const DETAIL_SHARD_MOD = 32;

const SHARD_DIRS = new Set(['characters', 'light_cones', 'currency/role']);

export function packGroupOf(relPath: string): string {
  const rel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = rel.split('/').filter(Boolean);
  if (!parts.length) return rel;
  const name = parts[parts.length - 1] as string;
  const stem = name.endsWith('.json') ? name.slice(0, -5) : name;
  if (parts.length === 1) return name.endsWith('.json') ? `${stem}.index` : stem;
  const directory = parts.slice(0, -1).join('/');
  if (/^\d+$/.test(stem) && SHARD_DIRS.has(directory)) {
    return `${directory.replace(/\//g, '.')}.${Number(stem) % DETAIL_SHARD_MOD}`;
  }
  return parts[0] as string;
}
