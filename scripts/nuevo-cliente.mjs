#!/usr/bin/env node
// Scaffolds a client project (spec §10.2): CLAUDE.md, trabajo/, web/ (own git repo
// with a commit-msg hook that rejects AI attribution), .gitignore and .claude/settings.json.
// Usage: node scripts/nuevo-cliente.mjs <projectDir>
import { appendFileSync, chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATTRIBUTION_SETTING } from '../tests/platform.mjs';

const TEMPLATES = fileURLToPath(new URL('../templates/', import.meta.url));
const WORK_DIRS = ['research', 'specs', 'textos', 'prototipos', 'reportes'];

export class ProjectExistsError extends Error {
  constructor(found) {
    super(`A project already exists here (found: ${found.join(', ')}). Nothing was changed.`);
    this.name = 'ProjectExistsError';
  }
}

export class MissingBriefError extends Error {
  constructor(dir) {
    super(`brief.md not found in ${dir}. Write the client brief there first. Nothing was changed.`);
    this.name = 'MissingBriefError';
  }
}

export function createProject(projectDir, { gitUserName, gitUserEmail } = {}) {
  const dir = resolve(projectDir);
  const at = (...p) => join(dir, ...p);

  // Every check runs before the first write, so a refusal leaves the folder untouched.
  if (!existsSync(at('brief.md'))) throw new MissingBriefError(dir);
  const found = ['CLAUDE.md', 'trabajo', 'web'].filter(p => existsSync(at(p)));
  if (found.length) throw new ProjectExistsError(found);
  const settings = mergedSettings(at('.claude', 'settings.json'));

  const created = [];

  copyFileSync(join(TEMPLATES, 'CLAUDE.md'), at('CLAUDE.md'));
  created.push('CLAUDE.md');

  for (const d of WORK_DIRS) mkdirSync(at('trabajo', d), { recursive: true });
  for (const f of ['decisiones.md', 'estado.md']) {
    copyFileSync(join(TEMPLATES, 'trabajo', f), at('trabajo', f));
    created.push(`trabajo/${f}`);
  }
  created.push(...WORK_DIRS.map(d => `trabajo/${d}/`));

  const web = at('web');
  mkdirSync(web);
  git('init', '-b', 'main', web);
  if (gitUserName) git('-C', web, 'config', 'user.name', gitUserName);
  if (gitUserEmail) git('-C', web, 'config', 'user.email', gitUserEmail);
  installHook(join(web, '.git', 'hooks', 'commit-msg'));
  created.push('web/', 'web/.git/hooks/commit-msg');

  ensureGitignored(at('.gitignore'), 'web/');
  created.push('.gitignore');

  mkdirSync(at('.claude'), { recursive: true });
  writeFileSync(at('.claude', 'settings.json'), JSON.stringify(settings, null, 2) + '\n');
  created.push('.claude/settings.json');

  return { created };
}

// The project-scope plugin install may already have written .claude/settings.json
// (marketplaces, enabledPlugins): keep it and add our keys on top.
function mergedSettings(file) {
  let existing = {};
  if (existsSync(file)) {
    try {
      existing = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
    } catch (e) {
      throw new Error(`${file} is not valid JSON (${e.message}). Fix it and run again. Nothing was changed.`);
    }
  }
  const template = JSON.parse(readFileSync(join(TEMPLATES, 'settings.json'), 'utf8'));
  return { ...existing, ...template, env: { ...existing.env, ...template.env }, ...ATTRIBUTION_SETTING };
}

// sh under Git for Windows breaks on CRLF, whatever git's autocrlf did to the template.
function installHook(dest) {
  const body = readFileSync(join(TEMPLATES, 'commit-msg'), 'utf8').replace(/\r\n/g, '\n');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
  chmodSync(dest, 0o755);
}

function ensureGitignored(file, entry) {
  if (!existsSync(file)) return writeFileSync(file, `${entry}\n`);
  const text = readFileSync(file, 'utf8');
  if (text.split(/\r?\n/).some(l => l.trim() === entry)) return;
  appendFileSync(file, `${text === '' || text.endsWith('\n') ? '' : '\n'}${entry}\n`);
}

function git(...args) {
  execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

const isMain = () => {
  if (!process.argv[1]) return false;
  const norm = p => (process.platform === 'win32' ? p.toLowerCase() : p);
  return norm(resolve(process.argv[1])) === norm(fileURLToPath(import.meta.url));
};

if (isMain()) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node scripts/nuevo-cliente.mjs <projectDir>');
    process.exit(1);
  }
  try {
    const { created } = createProject(target);
    console.log(`Project created in ${resolve(target)}:`);
    for (const p of created) console.log(`  ${p}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
