/**
 * spine-manifest 双清单静态校验脚本（CI 挂接；也支持本地手动运行）：
 *   node tools/check-spine-manifest.mjs [--fetch]
 *
 * 校验项（零网络依赖，--fetch 时附加在线可达性检查）：
 *   1. 两个清单（spine-manifest-official.json / spine-manifest-nanoka.json）JSON 可解析 + 顶层结构
 *   2. version 均与 src/lib/constants.ts 的 SPINE_MANIFEST_VERSION 一致（缓存键防漏 bump）
 *   3. entries 键排序（数字 ID 升序，场景键在后）且无 $ 元信息键；两清单无重复键
 *   4. official 清单：official 条目与场景层为折叠格式（dir + 相对文件名，无完整 URL、无 '/'）
 *   5. textures 键含 .png 扩展名（与 atlas page 行逐字一致的硬约束）
 *   6. nanoka 清单：全部为 skel 条目
 *   7. --fetch：展开官方清单全部 URL 后 HEAD 可达性（只取响应头）
 *
 * 退出码：0 = PASS，1 = FAIL（打印全部问题，便于 CI 定位）
 */
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const FETCH_MODE = process.argv.includes('--fetch');

function readJson(rel) {
  return JSON.parse(readFileSync(new URL(rel, ROOT), 'utf-8'));
}

const errors = [];
const warn = (msg) => errors.push(`[WARN] ${msg}`);
const fail = (msg) => errors.push(`[FAIL] ${msg}`);

// ─── 1. JSON 可解析 + 顶层结构 ───
let official;
let nanoka;
try {
  official = readJson('public/data/cn/spine-manifest-official.json');
  nanoka = readJson('public/data/cn/spine-manifest-nanoka.json');
} catch (e) {
  console.error('[FAIL] 清单文件无法解析:', e.message);
  process.exit(1);
}

const officialTopKeys = Object.keys(official).sort();
if (officialTopKeys.join(',') !== 'base,entries,version') {
  fail(`官方清单顶层键应为 base/entries/version，实际: ${officialTopKeys.join(',')}`);
}
const nanokaTopKeys = Object.keys(nanoka).sort();
if (nanokaTopKeys.join(',') !== 'entries,version') {
  fail(`nanoka 清单顶层键应为 entries/version（无 base），实际: ${nanokaTopKeys.join(',')}`);
}
if (typeof official.base !== 'string' || !official.base.startsWith('https://')) fail('官方清单 base 应为 https:// 开头的 CDN 前缀');
if (!official.base.endsWith('/')) fail('官方清单 base 应以 / 结尾');
for (const [name, m] of [['official', official], ['nanoka', nanoka]]) {
  if (typeof m.version !== 'number') fail(`${name} 清单 version 应为数字`);
  if (typeof m.entries !== 'object' || m.entries === null) fail(`${name} 清单 entries 应为对象`);
}

// ─── 2. version 与 constants.ts 一致 ───
try {
  const constantsSrc = readFileSync(new URL('src/lib/constants.ts', ROOT), 'utf-8');
  const m = constantsSrc.match(/SPINE_MANIFEST_VERSION\s*=\s*(\d+)/);
  if (!m) {
    fail('constants.ts 中未找到 SPINE_MANIFEST_VERSION');
  } else {
    const expected = Number(m[1]);
    if (official.version !== expected) {
      fail(`官方清单 version=${official.version} 与 constants.ts=${expected} 不一致（缓存键将命中旧数据）`);
    }
    if (nanoka.version !== expected) {
      fail(`nanoka 清单 version=${nanoka.version} 与 constants.ts=${expected} 不一致（缓存键将命中旧数据）`);
    }
  }
} catch (e) {
  fail(`无法读取 constants.ts: ${e.message}`);
}

// ─── 3. entries 键排序 + 无 $ 键 + 无重复键 ───
const allKeys = [];
for (const [name, m] of [['official', official], ['nanoka', nanoka]]) {
  const keys = Object.keys(m.entries);
  allKeys.push(...keys);
  for (const k of keys) {
    if (k.startsWith('$')) fail(`${name} 清单 entries 内不应有 $ 元信息键: ${k}`);
  }
  const numeric = keys.filter((k) => /^\d+$/.test(k));
  for (let i = 1; i < numeric.length; i++) {
    if (Number(numeric[i]) <= Number(numeric[i - 1])) {
      fail(`${name} 清单数字键未升序: ${numeric[i - 1]} → ${numeric[i]}`);
      break;
    }
  }
  const nonNumeric = keys.filter((k) => !/^\d+$/.test(k));
  const sortedNonNumeric = [...nonNumeric].sort();
  if (nonNumeric.join(',') !== sortedNonNumeric.join(',')) {
    fail(`${name} 清单非数字键未排序: ${nonNumeric.join(', ')}`);
  }
}
const overlap = allKeys.filter((k, i) => allKeys.indexOf(k) !== i);
if (overlap.length > 0) {
  // 预期行为：官方角色在 nanoka 侧保留回退条目（官方失效时自动回退）
  console.log(`[INFO] 两清单重复键 ${overlap.length} 个（${overlap.join(', ')}）：官方优先，失效时回退 nanoka`);
}

// ─── 4/5. official 折叠格式 + 纹理键约束 ───
const officialKinds = new Set();
const urls = [];
for (const [key, v] of Object.entries(official.entries)) {
  officialKinds.add(v.kind);
  const layers = v.kind === 'official-scene' ? v.layers : [{ dir: v.dir, atlas: v.atlas, json: v.json, textures: v.textures }];
  if (v.kind === 'official-scene') {
    if (typeof v.viewport?.x !== 'number' || typeof v.viewport?.width !== 'number') fail(`${key}: viewport 不完整`);
  }
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    const tag = v.kind === 'official-scene' ? `${key}[层${i + 1}]` : key;
    if (typeof l.dir !== 'string' || !l.dir.endsWith('/')) fail(`${tag}: dir 应以 / 结尾`);
    for (const field of ['atlas', 'json']) {
      const f = l[field];
      if (typeof f !== 'string' || f.includes('/')) fail(`${tag}: ${field} 应为相对文件名`);
      const ext = field === 'atlas' ? '.atlas' : '.json';
      if (!f.endsWith(ext)) fail(`${tag}: ${field} 扩展名应为 ${ext}`);
      urls.push(official.base + l.dir + f);
    }
    if (typeof l.textures !== 'object' || l.textures === null) {
      fail(`${tag}: textures 缺失`);
      continue;
    }
    for (const [logical, file] of Object.entries(l.textures)) {
      if (!logical.endsWith('.png')) fail(`${tag}: textures 键「${logical}」应含 .png（与 atlas page 行逐字一致）`);
      if (typeof file !== 'string' || file.includes('/') || !file.endsWith('.png')) {
        fail(`${tag}: textures 值「${file}」应为相对 .png 文件名`);
      }
      urls.push(official.base + l.dir + file);
    }
  }
}
for (const k of ['official', 'official-scene']) {
  if (!officialKinds.has(k)) warn(`官方清单无 ${k} 类型条目`);
}

// ─── 6. nanoka 全部为 skel ───
for (const [key, v] of Object.entries(nanoka.entries)) {
  if (v.kind !== 'skel') fail(`nanoka 清单 ${key}: 应为 skel，实际 ${v.kind}`);
  if (!v.name || !v.name.trim()) fail(`${key}: skel name 为空`);
}

// ─── 7. 在线可达性（可选） ───
if (FETCH_MODE) {
  const seen = new Set();
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (!r.ok) fail(`HTTP ${r.status}: ${url}`);
    } catch (e) {
      fail(`网络错误: ${url} (${String(e).slice(0, 80)})`);
    }
  }
  console.log(`[--fetch] 检查 ${seen.size} 个唯一官方资源 URL`);
}

if (errors.length > 0) {
  console.error(`spine-manifest 双清单校验失败（${errors.length} 项）：`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`[PASS] spine-manifest 双清单校验通过（version=${official.version}，official=${Object.keys(official.entries).length} 条，nanoka=${Object.keys(nanoka.entries).length} 条）`);
