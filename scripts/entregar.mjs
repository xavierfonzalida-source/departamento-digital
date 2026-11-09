#!/usr/bin/env node
// Delivery gate (spec §10.3): guarantees web/ ships with no AI traces.
// scanWeb only reads. buildPackage adds one tag and one zip outside web/. Nothing in web/ is ever edited or deleted.
// Usage: node scripts/entregar.mjs <projectDir> [--clean-history --confirm]
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Hard patterns: any hit is a failure. Case-insensitive. `copilot` and `claude` may be legitimate
// client words; that is why every finding carries path:line (and commit) so a human can judge.
const HARD = ['Claude', 'Anthropic', 'Co-Authored-By', 'Generated with', 'AI-generated', 'ChatGPT', 'copilot', '[PLACEHOLDER:']
  .map(name => ({ name, re: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }));
const FORBIDDEN_NAMES = new Set(['CLAUDE.md', 'AGENTS.md', '.mcp.json']);
const FORBIDDEN_DIR_SEGMENTS = new Set(['.claude']);
const FORBIDDEN_ROOT_PREFIXES = ['trabajo/', 'docs/superpowers/'];
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const IMAGE_MARKERS = ['c2pa', 'DALL-E', 'Midjourney', 'Stable Diffusion', 'Firefly', 'OpenAI'];
const BINARY_SNIFF = 8192;
const MAX_BUFFER = 1024 * 1024 * 1024;

export class TracesFoundError extends Error {
  constructor(findings) {
    super(`${findings.length} AI trace(s) found; nothing was packaged:\n${findings.map(formatFinding).join('\n')}`);
    this.name = 'TracesFoundError';
    this.findings = findings;
  }
}

export class ConfirmationRequiredError extends Error {
  constructor() {
    super('Creating the clean-history branch requires confirm: true (CLI: --confirm). Nothing was changed.');
    this.name = 'ConfirmationRequiredError';
  }
}

export class DirtyTreeError extends Error {
  constructor(status) {
    super(`web/ has uncommitted changes to tracked files; the zip is built from the last commit, so commit or discard them first. Nothing was changed:
${status}`);
    this.name = 'DirtyTreeError';
  }
}

export class TagExistsError extends Error {
  constructor(tag) {
    super(`Tag ${tag} already exists (or its zip does). Use another date or remove it by hand. Nothing was changed.`);
    this.name = 'TagExistsError';
  }
}

export function scanWeb(webDir) {
  const web = resolve(webDir);
  const failures = [];
  const warnings = [];

  const tracked = git(web, ['ls-files', '-z']).split('\0').filter(Boolean);

  // 1. Forbidden files: working tree (tracked or not) plus the index.
  const forbidden = new Set();
  for (const rel of [...tracked, ...walk(web)]) {
    if (isForbidden(rel) && !forbidden.has(rel)) {
      forbidden.add(rel);
      failures.push({ kind: 'forbidden-file', path: rel, match: forbiddenLabel(rel) });
    }
  }

  // 2. Content of tracked files (images get the metadata byte scan instead).
  const content = [];
  for (const rel of tracked) {
    const file = join(web, rel);
    if (!existsSync(file) || !statSync(file).isFile()) continue;
    const buf = readFileSync(file);
    if (IMAGE_EXT.test(rel)) {
      const bin = buf.toString('latin1').toLowerCase();
      for (const m of IMAGE_MARKERS) {
        if (bin.includes(m.toLowerCase())) failures.push({ kind: 'image-metadata', path: rel, match: m });
      }
      continue;
    }
    if (buf.subarray(0, BINARY_SNIFF).includes(0)) continue;
    buf.toString('utf8').split(/\r?\n/).forEach((text, i) => {
      const hits = HARD.filter(p => p.re.test(text));
      for (const h of hits) content.push({ kind: 'content', path: rel, line: i + 1, match: h.name });
      if (!hits.length && commentMentionsAI(text)) warnings.push({ kind: 'comment', path: rel, line: i + 1, match: 'AI/IA' });
    });
  }
  failures.push(...content);

  // 3. History, all refs: messages first, then added diff lines.
  failures.push(...scanHistory(web));

  return { failures, warnings };
}

export function buildPackage(projectDir, { date } = {}) {
  const project = resolve(projectDir);
  const web = join(project, 'web');
  const day = date ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Invalid date "${day}" (expected YYYY-MM-DD).`);

  const dirty = git(web, ['status', '--porcelain', '--untracked-files=no']).trimEnd();
  if (dirty) throw new DirtyTreeError(dirty);

  const { failures } = scanWeb(web);
  if (failures.length) throw new TracesFoundError(failures);

  const tag = `entrega-${day}`;
  const zip = join(project, 'entrega', `${basename(project)}-${day}.zip`);
  if (git(web, ['tag', '-l', tag]).trim() || existsSync(zip)) throw new TagExistsError(tag);

  mkdirSync(join(project, 'entrega'), { recursive: true });
  git(web, ['tag', tag]);
  try {
    // Archives the tagged commit, so untracked files can never ship.
    git(web, ['archive', '--format=zip', '-o', zip, tag]);
  } catch (e) {
    git(web, ['tag', '-d', tag]);
    throw e;
  }
  return zip;
}

// Orphan branch with one commit holding the current (HEAD) tree. Built with commit-tree so the
// checked-out branch, index and working tree are never touched. Existing branches are not rewritten.
export function cleanHistory(webDir, { confirm, date } = {}) {
  if (confirm !== true) throw new ConfirmationRequiredError();
  const web = resolve(webDir);
  const branch = `clean-${date ?? today()}`;
  if (git(web, ['branch', '--list', branch]).trim()) throw new Error(`Branch ${branch} already exists. Nothing was changed.`);
  const identity = {
    GIT_AUTHOR_NAME: tryGit(web, ['config', 'user.name']) || 'Delivery',
    GIT_AUTHOR_EMAIL: tryGit(web, ['config', 'user.email']) || 'delivery@example.invalid',
  };
  const env = { ...process.env, ...identity, GIT_COMMITTER_NAME: identity.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: identity.GIT_AUTHOR_EMAIL };
  const sha = git(web, ['commit-tree', 'HEAD^{tree}', '-m', 'chore: initial delivery snapshot'], env).trim();
  git(web, ['branch', branch, sha]);
  return branch;
}

function scanHistory(web) {
  const out = [];
  const seen = new Set();
  const report = (commit, path, line, text) => {
    for (const h of HARD) {
      const key = `${commit}:${h.name}`;
      if (seen.has(key) || !h.re.test(text)) continue;
      seen.add(key);
      out.push({ kind: 'history', path, ...(line ? { line } : {}), commit, match: h.name });
    }
  };

  // Messages
  let commit = null;
  for (const l of git(web, ['-c', 'core.quotepath=false', 'log', '--all', '--format=%x01%H%x00%B']).split(/\r?\n/)) {
    if (l.startsWith('\x01')) { [commit] = l.slice(1).split('\0'); report(commit, '(commit message)', 0, l.split('\0')[1] ?? ''); }
    else if (commit) report(commit, '(commit message)', 0, l);
  }

  // Diffs: only added lines. +++ headers are skipped by tracking whether we are inside a hunk.
  let path = null, inHunk = false, ln = 0;
  commit = null;
  const diff = git(web, ['-c', 'core.quotepath=false', 'log', '--all', '-p', '--no-color', '--no-ext-diff', '--no-textconv', '--format=%x01%H']);
  for (const l of diff.split(/\r?\n/)) {
    if (l.startsWith('\x01')) { commit = l.slice(1); inHunk = false; path = null; }
    else if (l.startsWith('diff --git ')) { inHunk = false; path = null; }
    else if (!inHunk && l.startsWith('+++ ')) {
      const p = l.slice(4).replace(/\t.*$/, '');
      path = p.startsWith('b/') ? p.slice(2) : null;
    } else if (l.startsWith('@@')) {
      inHunk = true;
      ln = Number(/\+(\d+)/.exec(l)?.[1] ?? 1);
    } else if (inHunk && l.startsWith('+')) {
      if (path) report(commit, path, ln, l.slice(1));
      ln++;
    } else if (inHunk && l.startsWith(' ')) ln++;
  }
  return out;
}

// `//` (not part of a URL), `/* */` and star-continuation lines, `<!-- -->`, `#` line comments.
function commentMentionsAI(line) {
  const parts = [];
  for (const re of [/(?<!:)\/\/(.*)$/, /\/\*(.*?)(?:\*\/|$)/, /^\s*\*\s?(.*)$/, /<!--(.*?)(?:-->|$)/, /^\s*#(.*)$/]) {
    const m = re.exec(line);
    if (m) parts.push(m[1]);
  }
  return parts.some(p => /\b(AI|IA)\b/.test(p));
}

function isForbidden(rel) {
  const segs = rel.split('/');
  return FORBIDDEN_NAMES.has(segs[segs.length - 1])
    || segs.slice(0, -1).some(s => FORBIDDEN_DIR_SEGMENTS.has(s))
    || FORBIDDEN_ROOT_PREFIXES.some(p => rel.startsWith(p));
}
function forbiddenLabel(rel) {
  const segs = rel.split('/');
  return FORBIDDEN_NAMES.has(segs[segs.length - 1]) ? segs[segs.length - 1]
    : segs.find(s => FORBIDDEN_DIR_SEGMENTS.has(s)) ? `${segs.find(s => FORBIDDEN_DIR_SEGMENTS.has(s))}/`
    : FORBIDDEN_ROOT_PREFIXES.find(p => rel.startsWith(p));
}

function walk(root, rel = '') {
  const files = [];
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) files.push(r + '/', ...walk(root, r)); // directory entries let `.claude/` match even when empty
    else files.push(r);
  }
  return files;
}

function today() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function git(web, args, env) {
  return execFileSync('git', ['-C', web, ...args], { encoding: 'utf8', maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'pipe'], ...(env && { env }) });
}
function tryGit(web, args) {
  try { return git(web, args).trim(); } catch { return ''; }
}

export function formatFinding(f) {
  const where = f.line ? `${f.path}:${f.line}` : f.path;
  return `${where}  ${f.match}${f.commit ? `  [commit ${f.commit.slice(0, 7)}]` : ''}`;
}

const isMain = () => {
  if (!process.argv[1]) return false;
  const norm = p => (process.platform === 'win32' ? p.toLowerCase() : p);
  return norm(resolve(process.argv[1])) === norm(fileURLToPath(import.meta.url));
};

if (isMain()) {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const target = args.find(a => !a.startsWith('--'));
  if (!target) {
    console.error('Usage: node scripts/entregar.mjs <projectDir> [--clean-history --confirm]');
    process.exit(1);
  }
  try {
    if (flags.includes('--clean-history')) {
      const branch = cleanHistory(join(resolve(target), 'web'), { confirm: flags.includes('--confirm') });
      console.log(`Created orphan branch ${branch} with one commit. Existing branches were not touched.`);
    } else {
      const { failures, warnings } = scanWeb(join(resolve(target), 'web'));
      for (const w of warnings) console.log(`warning  ${formatFinding(w)}`);
      if (failures.length) {
        for (const f of failures) console.log(formatFinding(f));
        console.error(`${failures.length} AI trace(s) found. Nothing was packaged.`);
        process.exit(1);
      }
      console.log(buildPackage(target));
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
