/* 语言包分组规则（数据文件相对路径 → 分组名）。
 *
 * 与转换器 `tools/converter/textpack.py` 的 `group_of` 同一规则：`characters/1310.json` → `characters`，
 * `maze.catalog.json` → `maze.catalog`。分组的唯一理由是**首屏成本**——整站单包约 4.4 MB（缺省语言），
 * 按分组切分后一个目录页只取自己那一份。
 *
 * 两侧不逐字比对源码，而是由「语言包覆盖」测试对着转换器真实产物验证（组名算错 → 该组包不存在）。
 */
export function packGroupOf(relPath: string): string {
  const rel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const slash = rel.indexOf('/');
  if (slash >= 0) return rel.slice(0, slash);
  return rel.endsWith('.json') ? rel.slice(0, -5) : rel;
}
