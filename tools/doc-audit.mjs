#!/usr/bin/env node
/**
 * 文档结构化审核器（report-only：默认退出 0，--strict 有命中退出 1）。
 * 判据出处：AGENTS.md「强制规则 / 文档体量红线」+ docs/agents/conventions.md「文档体量 / 文档写法」。
 * 刻意不接入 pnpm build 与 CI（同 check-doc-drift.mjs 定位：迭代期报告优先于门禁）。
 *
 * 检查项（每条可断言；末尾报告覆盖率与豁免，避免「命中 0」造成假安全感）：
 *   ① 体量红线        单文件估 token > 5 万 → 必须「总索引 + 分片」
 *   ② 路由登记        docs/agents/*.md 必须在 AGENTS.md「任务 → 必读」登记；反向链接须可达
 *   ③ 概论禁词        living docs 禁 AI 汇报腔（「当然，这是 / 以下是为 / 本文介绍」）
 *   ④ 漂移断言        living docs 禁会过期断言（「已修复 / 已全部完成」）
 *   ⑤ 版本号禁入      叙述性文档**不得出现版本号**；tech-stack.md 的 <!--ver:包--> 标记必须与权威源一致
 *                      （`docs/memory/` 豁免本条：其坑位常以「哪个版本的行为」为事实本身，见 doc-scope.mjs）
 *   ⑥ ADR 否决项      每篇 ADR 必须**有结构化**的「替代方案 / 否决」字段（标题或加粗项）
 *   ⑦ memory 域索引   domain 文件须在 README 登记、索引无断链、禁止回流出按月/时序命名
 *   ⑧ CATALOG 分片    DATA_CATALOG.md 引用的 parts/*.md 必须存在
 *   ⑨ temp 死指针     文档不得把 .gitignore 的 temp/ 当引用目标（必然失效）
 *
 * 用法：node tools/doc-audit.mjs [--strict|--verbose]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, collectManaged, isLiving, versionBanApplies, estTokens, norm } from './doc-scope.mjs';

const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const TOKEN_LIMIT = 50_000;

const findings = [];
const add = (file, rule, detail, line) => findings.push({ file, rule, detail, line });

const all = collectManaged();
const living = all.filter((f) => isLiving(norm(f)));
const versionBanned = all.filter((f) => versionBanApplies(norm(f)));

/* ── ① 体量红线 ── */
for (const f of all) {
  const tokens = estTokens(readFileSync(f, 'utf8'));
  if (tokens > TOKEN_LIMIT) {
    add(norm(f), '体量红线', `估 ${(tokens / 1000).toFixed(1)}k token > 50k：必须拆「总索引 + 分片」（生成物改生成器 / 日志用 tools/tidy-memory.mjs split）`);
  }
}

/* ── ② 路由登记（docs/agents/* ↔ AGENTS.md 表） ── */
const agentsDir = join(ROOT, 'docs', 'agents');
const agentsFiles = existsSync(agentsDir)
  ? readdirSync(agentsDir).filter((n) => n.endsWith('.md')).map((n) => `docs/agents/${n}`)
  : [];
const agentsMd = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8');
const routingTable = agentsMd.split('\n').filter((l) => l.startsWith('| ')).join('\n');
for (const child of agentsFiles) {
  if (!routingTable.includes(child)) {
    add(child, '路由登记', `${child} 未在 AGENTS.md「任务 → 必读」登记（新子文件必须登记，否则 AI 发现不了）`);
  }
}
for (const m of agentsMd.matchAll(/\]\((docs\/agents\/[^)]+)\)/g)) {
  if (!existsSync(join(ROOT, m[1]))) add('AGENTS.md', '路由登记', `路由表链接指向不存在的文件：${m[1]}`);
}

/* ── ③④ living docs 禁词（仅叙述性文档；历史档案不受约束但计入豁免报告） ── */
const FILLER = [/当然[，,]?\s*这[是里]/, /以下[是为]/, /本文将(?:介绍|阐述|说明)/, /为您?(?:整理|准备|呈现)/, /希望对(?:你|您)有帮助/, /如你所见/];
const STALE = [/已修复(?:完成)?(?!的|项)/, /已全部(?:完成|修复|通过)/, /100%\s*(?:完成|覆盖)/, /现已完美/];
for (const f of living) {
  const r = norm(f);
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    // 剥掉「」引用（如「已修复」类断言是禁令术语本身，不是断言）避免误报
    const bare = l.replace(/「[^」]*」/g, '');
    for (const re of FILLER) if (re.test(bare)) add(r, '概论禁词', `AI 汇报腔「${l.trim().slice(0, 40)}…」：文档只写约束/判据/事实`, i + 1);
    for (const re of STALE) if (re.test(bare)) add(r, '漂移断言', `会过期的事实断言「${l.trim().slice(0, 40)}…」：改成判据或指针`, i + 1);
  });
}

/* ── ⑤ 版本号禁入叙述性文档 + tech-stack 标记 vs 权威源一致性 ── */
// 版本号识别：必须带「版本语义」（包名后跟 >= ^ ~ 或 x.y 形式），避免把 xxhash64 这类算法名误判
const VER_TOKEN = /(?:Node|node)\s*\d{2,}|\bpnpm\s*\d|Python\s*3\.\d+|(?:Vue|vue)\s*3\.\d|(?:Vite|vitest)\s*\d|TypeScript\s*[456]|spine-ts\s*4\.|\bxxhash\s*[><=^~]{1,2}\s*\d|\bpytest\s*[><=^~]{1,2}\s*\d|\bxxhash>=|\bpytest>=/;
const TECH_STACK = 'docs/agents/tech-stack.md';
for (const f of versionBanned) {
  const r = norm(f);
  if (r === TECH_STACK) continue; // tech-stack 是唯一允许内联版本号处，改由下方一致性校验兜底
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (VER_TOKEN.test(l)) {
      add(r, '版本号禁入', `「${l.trim().slice(0, 48)}…」含版本号：叙述性文档只写选型名，版本指向 ${TECH_STACK}`, i + 1);
    }
  });
}

// 一致性校验：tech-stack.md 的 <!--ver:包-->标记 必须等于权威源实际值
function authoritativeVersions() {
  const out = {};
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    if (pkg.packageManager) out.pnpm = pkg.packageManager.split('@')[1].split('+')[0];
    for (const [k, v] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
      out[k] = String(v).replace(/^[\^~>=<\s]+/, '');
    }
  } catch { /* package.json 缺失时跳过 */ }
  try {
    const req = readFileSync(join(ROOT, 'tools', 'converter', 'requirements.txt'), 'utf8');
    for (const m of req.matchAll(/^([a-zA-Z0-9_-]+)\s*(?:[><=!~]=?\s*)?([0-9][0-9.]*)/gm)) out[m[1]] = m[2];
  } catch { /* requirements.txt 缺失时跳过 */ }
  try {
    const ci = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
    const m = ci.match(/node-version:\s*['"]?(\d+)/);
    if (m) out.node = m[1];
  } catch { /* ci.yml 缺失时跳过 */ }
  try {
    // 「Node 无 engines 字段」是本仓事实：CI 是唯一 Node 权威源；engines 存在时优先 engines
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    if (pkg.engines?.node) out.node = String(pkg.engines.node).replace(/[^0-9.]/g, '').split('.')[0];
  } catch { /* 同上 */ }
  try {
    const ds = readFileSync(join(ROOT, '.github', 'workflows', 'data-sync.yml'), 'utf8');
    const m = ds.match(/python-version:\s*['"]?([0-9.]+)/);
    if (m) out.python = m[1];
  } catch { /* data-sync.yml 缺失时跳过 */ }
  try {
    const c = readFileSync(join(ROOT, 'src', 'spine', 'constants.ts'), 'utf8');
    const vs = [...c.matchAll(/['"](\d+\.\d+\.\d+)['"]/g)].map((m) => m[1]);
    if (vs.length) out['spine-ts'] = vs[0];
  } catch { /* constants.ts 缺失时跳过 */ }
  return out;
}

const auth = authoritativeVersions();
const techStackPath = join(ROOT, TECH_STACK);
if (existsSync(techStackPath)) {
  const techStack = readFileSync(techStackPath, 'utf8');
  const markers = [...techStack.matchAll(/<!--ver:([a-zA-Z0-9@/_.-]+)-->([0-9][0-9.,<>= ]*)/g)];
  if (markers.length === 0) {
    add(TECH_STACK, '版本一致性', '未发现任何 <!--ver:包名--> 标记：版本表无法被机器校验（见本文件头部纪律）');
  }
  for (const [, name, raw] of markers) {
    const declared = raw.trim().split(/[,\s]/)[0];
    const actual = auth[name];
    if (actual === undefined) continue; // 权威源缺失（如 spine-ts 在代码常量里）不误报
    if (declared !== actual) {
      add(TECH_STACK, '版本一致性', `<!--ver:${name}-->${declared} 与权威源 ${actual} 不一致：改权威文件后重跑本工具刷新此处`);
    }
  }
}

/* ── ⑥ ADR 否决项（结构化判据：标题或加粗字段；否则标为疑似待复核） ── */
const ADR_STRUCT_HEADING = /^#{2,4}\s*.*(?:替代|备选|否决|Considered Options|Alternatives)/m;
// 加粗字段形式：**替代方案（被否）** / **Considered Options**: / **Alternatives considered**
const ADR_STRUCT_BOLD = /^\s*(?:[-*]\s*)?\*\*\s*(?:替代方案|备选方案|否决方案|被否方案|Considered Options|Alternatives[^*]*)\s*[（(]?[^*]*\*\*/m;
const ADR_STRUCT = { test: (s) => ADR_STRUCT_HEADING.test(s) || ADR_STRUCT_BOLD.test(s) };
const ADR_HEURISTIC = /否掉|放弃|弃用|不采用|未采用|有意取舍|已失效|已作废|已取代|被推翻|宁缺不假/;
const adrDir = join(ROOT, 'docs', 'adr');
let adrFiles = [];
if (existsSync(adrDir)) {
  adrFiles = readdirSync(adrDir).filter((n) => n.endsWith('.md') && n !== 'README.md');
  for (const name of adrFiles) {
    const c = readFileSync(join(adrDir, name), 'utf8');
    if (!ADR_STRUCT.test(c)) {
      const hint = ADR_HEURISTIC.test(c)
        ? '正文有被否方案的行文但**无结构化字段**：建议提为「## 替代方案（被否）」小节（判据见 conventions.md「ADR 必填字段」）'
        : '未记录「替代方案 / 否决与原因」——AI 会重走被否的老路（四件套必填）';
      add(`docs/adr/${name}`, 'ADR 否决项', hint);
    }
  }
}

/* ── ⑦ memory 域索引一致性（2026-10 起 memory 为「按域组织」，不再按月分片） ──
   原检查是「月文件 ↔ -pNN 分片」同步校验；重构后按月结构已退场，该检查会成为
   **永不命中的死守卫**（正是本仓禁止的「守卫从不响 = 没有守卫」）。改为校验新结构：
   ① 每份域文件必须在 README 的域索引里登记；② 索引里的链接必须真实存在（无孤儿/断链）；
   ③ 禁止回流出按月/按时序命名的文件（时序编号对检索无意义）。 */
const memDir = join(ROOT, 'docs', 'memory');
if (existsSync(memDir)) {
  const memFiles = readdirSync(memDir).filter((n) => n.endsWith('.md'));
  const indexFile = join(memDir, 'README.md');
  const domains = memFiles.filter((n) => n !== 'README.md');

  if (!existsSync(indexFile)) {
    add('docs/memory/README.md', 'memory 域索引', '缺少 README.md 域索引：域文件将无法被发现（AI 无入口）');
  } else {
    const idx = readFileSync(indexFile, 'utf8');
    for (const d of domains) {
      if (!idx.includes(`(${d})`)) add(`docs/memory/${d}`, 'memory 域索引', `未在 README.md 域索引登记：不登记则按需加载不可发现`);
    }
    for (const m of idx.matchAll(/\]\(([^)#\s]+\.md)\)/g)) {
      const target = m[1];
      if (target.startsWith('http') || target.includes('/')) continue; // 跨目录链接由 check-doc-links 负责
      if (!existsSync(join(memDir, target))) add('docs/memory/README.md', 'memory 域索引', `索引指向不存在的文件：${target}`);
    }
  }

  // 禁止回流：重构后不应再出现按月 / 按时序分片的文件
  for (const n of memFiles) {
    if (/^\d{4}-\d{2}(-p\d+)?\.md$/.test(n)) {
      add(`docs/memory/${n}`, 'memory 域索引', `出现按月/时序命名文件：memory 按域组织，禁止回流时序分片`);
    }
  }
}

/* ── ⑧ DATA_CATALOG 分片存在性 ── */
const catalog = join(ROOT, 'tools', 'converter', 'DATA_CATALOG.md');
if (existsSync(catalog)) {
  const c = readFileSync(catalog, 'utf8');
  for (const m of c.matchAll(/\]\((DATA_CATALOG\.parts\/[^)]+)\)/g)) {
    if (!existsSync(join(ROOT, 'tools', 'converter', m[1]))) {
      add('tools/converter/DATA_CATALOG.md', 'CATALOG 分片', `总索引引用的分片不存在：${m[1]}（重跑 python tools/converter/gen_catalog.py）`);
    }
  }
}

/* ── ⑨ 禁止把 temp/ 当引用目标（临时目录不入库、随时清空 ⇒ 引用必然烂掉） ──
   `temp/` 在 .gitignore 里，从不入库、也从不长期存在。文档（含 ADR 的「过程记录」）一旦写
   「脚本见 temp/xxx.py」，那个路径就是**永久死指针**：读者既找不到脚本，也无法从 git 恢复
   （历史提交为 0）。脚本若值得复用 → 进 `tools/`（入库）；否则用文字说明「一次性探针，未入库」。
   判据只认**带扩展名的反引号路径**（引用目标必然形如 `temp/probe.mjs`）；散文里提到目录本身
   （`temp/`、`temp/memory-backup/`）不算引用。按规则写「未入库」的行本就合规，故一并豁免。 */
const TEMP_REF = /`[^`]*\btemp\/[A-Za-z0-9_.-]+\.[A-Za-z0-9]+`/;
const TEMP_OK = /未入库|已删|清理|死指针|gitignore/;
for (const f of all) {
  const r = norm(f);
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (!TEMP_REF.test(l) || TEMP_OK.test(l)) return;
    add(r, 'temp 死指针', `引用 \`temp/\` 下的文件：该目录不入库、随时清空 ⇒ 路径必然失效；脚本值得复用就进 tools/，否则写明「未入库」`, i + 1);
  });
}

/* ── 输出（含覆盖率与豁免，避免「命中 0」造成假安全感） ── */
const byRule = {};
for (const f of findings) byRule[f.rule] = (byRule[f.rule] || 0) + 1;
const exempt = all.length - living.length;
console.log(`[文档审核] 受管 md ${all.length} 份｜命中 ${findings.length} 条${strict ? '（strict）' : ''}`);
console.log(`  覆盖面：写法规则（③④）管辖 ${living.length} 份现行文档；其中版本号禁入（⑤）另辖 ${versionBanned.length} 份（docs/memory/ 豁免⑤，其版本号是技术事实而非现状声明）`);
console.log(`  豁免 ${exempt} 份历史档案（ADR ${adrFiles.length} / audit / data / spine）——豁免项仍受 ①⑥⑦⑧ 检查`);
console.log(`  权威源比对：${Object.keys(auth).length} 项（package.json / requirements.txt / ci.yml / data-sync.yml / spine constants）`);
if (findings.length === 0) {
  console.log('[PASS] 全部通过');
  process.exit(0);
}
for (const f of findings) {
  console.log(`  [${f.rule}] ${f.file}${f.line ? `:${f.line}` : ''} — ${f.detail}`);
  if (verbose) console.log('');
}
console.log('── 按规则统计 ──');
for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${rule}: ${n}`);
process.exit(strict && findings.length > 0 ? 1 : 0);
