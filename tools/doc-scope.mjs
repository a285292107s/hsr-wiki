#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs';import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

export const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'temp',
  'vendor',
  '.agents',
  '.git',
  'public',
  'DATA_CATALOG.parts',
  '.pytest_cache',
  'playwright-report',
  '.playwright',
  '.pnpm-store',
  '.vscode',
]);

export const MANAGED_ENTRIES = ['README.md', 'AGENTS.md', 'CONTEXT.md', 'docs', 'tools', 'spine-lab'];

export const SKIP_FILE = new Set(['tools/converter/DATA_CATALOG.md']);

export const norm = (abs) => relative(ROOT, abs).split('\\').join('/');

export const LIVING_DIRS = ['docs/agents/', 'docs/memory/'];
export const LIVING_FILES = new Set(['README.md', 'AGENTS.md', 'CONTEXT.md']);

export function isLiving(relPath) {
  return LIVING_FILES.has(relPath) || LIVING_DIRS.some((d) => relPath.startsWith(d));
}

export const VERSION_BAN_EXEMPT_DIRS = ['docs/memory/'];

export function versionBanApplies(relPath) {
  return isLiving(relPath) && !VERSION_BAN_EXEMPT_DIRS.some((d) => relPath.startsWith(d));
}

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

export function estTokens(text) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  return Math.round(cjk * 0.95 + (text.length - cjk) / 3.2);
}

