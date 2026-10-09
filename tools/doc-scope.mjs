#!/usr/bin/env node
/**
 * 文档受管范围与跳过名单（单一来源）。
 *
 * 为什么单独成文件：受管范围原先在 check-doc-links.mjs 与 doc-audit.mjs 各写一份，
 * 新增生成物目录时必然只改一处 → 违反「禁止重复实现同一功能」。任何需要「哪些 md 受管」的
 * 工具一律 import 本模块，禁止再抄一份名单。
 */
import { existsSync, readdirSync, statSync } from 'node:fs';import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** 不进入受管范围的目录名（构建产物 / 外部数据 / 工具状态 / 自动生成分片） */
export const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'temp',
  'vendor',
  '.agents',
  '.git',
  'public',
  'DATA_CATALOG.parts', // gen_catalog.py 自动生成，每日 data-sync 会重写
  '.pytest_cache', // 工具缓存，非文档
  'playwright-report',
  '.playwright',
  '.pnpm-store',
  '.vscode',
]);

/** 受管入口（其余目录一律不进扫描） */
export const MANAGED_ENTRIES = ['README.md', 'AGENTS.md', 'CONTEXT.md', 'docs', 'tools', 'spine-lab'];

/** 与 check-doc-links.mjs 保持一致的绝对路径跳过项（自动生成 / 体量不可控） */
export const SKIP_FILE = new Set(['tools/converter/DATA_CATALOG.md']);

/** 受管文件相对路径（正斜杠） */
export const norm = (abs) => relative(ROOT, abs).split('\\').join('/');

/**
 * 叙述性文档（living docs）：**人类维护、AI 每次都要读**的文档。
 * 只有这些文档受「禁词 / 漂移断言 / 版本号」三类写法规则约束。
 * 历史档案（ADR）、审计与数据文档不受禁词规则约束——它们是**当时的证据记录**，
 * 抹平措辞等于篡改历史；但**不受约束 ≠ 不扫描**：doc-audit 会显式报告豁免数，避免假安全感。
 *
 * `docs/memory/` 属 living：2026-10 重构后它已从「按月累积的历史日志」变为**按域组织的
 * 现行避坑手册**（新增条目直接写进对应域），因此与 `docs/agents/` 同受写法规则约束。
 */
export const LIVING_DIRS = ['docs/agents/', 'docs/memory/'];
export const LIVING_FILES = new Set(['README.md', 'AGENTS.md', 'CONTEXT.md']);

export function isLiving(relPath) {
  return LIVING_FILES.has(relPath) || LIVING_DIRS.some((d) => relPath.startsWith(d));
}

/**
 * 「版本号禁入」（规则⑤）的适用范围**窄于**叙述性文档：
 * `docs/memory/` 虽是现行文档（受禁词 / 漂移断言约束），但它的坑位常**以「哪个版本的行为」为事实本身**
 * ——如「spine-ts 4.2 静默丢弃 4.0 格式骨骼的字段」「1493 与 1494 的 ID 段」，此处写版本号是在
 * **描述技术事实**，不是「声明当前技术栈版本」，禁掉等于丢信息。
 * 现状声明类的版本号仍唯一落位 `docs/agents/tech-stack.md`（由规则⑤的一致性校验兜底）。
 */
export const VERSION_BAN_EXEMPT_DIRS = ['docs/memory/'];

export function versionBanApplies(relPath) {
  return isLiving(relPath) && !VERSION_BAN_EXEMPT_DIRS.some((d) => relPath.startsWith(d));
}

/** 收集受管 markdown 绝对路径 */
export function collectManaged() {
  const files = [];
  const walk = (abs) => {
    if (!existsSync(abs)) return;
    const st = statSync(abs);
    if (st.isFile()) {
      if (abs.toLowerCase().endsWith('.md') && !SKIP_FILE.has(norm(abs))) files.push(abs);
      return;
    }
    for (const name of readdirSync(abs)) {
      if (SKIP_DIR.has(name)) continue;
      walk(join(abs, name));
    }
  };
  for (const entry of MANAGED_ENTRIES) walk(join(ROOT, entry));
  return files.sort();
}

/** 统一 token 估算：中文按 0.95 token/字、其余按 3.2 字符/token */
export function estTokens(text) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  return Math.round(cjk * 0.95 + (text.length - cjk) / 3.2);
}

