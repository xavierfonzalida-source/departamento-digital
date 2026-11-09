#!/usr/bin/env node
// Delivery gate (spec §10.3): guarantees web/ ships with no AI traces.
// scanWeb only reads. buildPackage adds one tag and one zip outside web/. Nothing in web/ is ever edited or deleted.
// Usage: node scripts/entregar.mjs <projectDir> [--ref <branch>] | [--clean-history --confirm]
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Hard patterns: any hit is a failure. Case-insensitive. `copilot` and `claude` may be legitimate
// client words; that is why every finding carries path:line (and commit) so a human can judge.
const HARD = ['Claude', 'Anthropic', 'Co-Authored-By', 'Generated with', 'AI-generated', 'ChatGPT', 'copilot', '[PLACEHOLDER:']
  .map(name => ({ name, re: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }));
// A placeholder is unfinished content, not an AI trace: only current files are checked for it.
const HISTORY = HARD.filter(p => p.name !== '[PLACEHOLDER:');
// The GEO spec requires robots.txt rules for AI crawlers (ClaudeBot, anthropic-ai, ChatGPT-User...):
// only the User-agent lines of a file named robots.txt are exempt; every other line is still scanned.
const isCrawlerRule = (rel, text) => rel.split('/').pop() === 'robots.txt' && /^\s*User-agent:/i.test(text);
const FORBIDDEN_NAMES = new Set(['CLAUDE.md', 'AGENTS.md', '.mcp.json']);
const FORBIDDEN_DIR_SEGMENTS = new Set(['.claude']);
const FORBIDDEN_ROOT_PREFIXES = ['trabajo/', 'docs/superpowers/'];
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const IMAGE_MARKERS = ['c2pa', 'DALL-E', 'Midjourney', 'Stable Diffusion', 'Firefly', 'OpenAI'];
const BINARY_SNIFF = 8192;
const MAX_BUFFER = 1024 * 1024 * 1024;

export class TracesFoundError extends Error {
  constructor(findings) {
    super(`${findings.length} blocking finding(s) (AI traces or placeholders); nothing was packaged:\n${findings.map(formatFinding).join('\n')}`);
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

// ref: limit the history scan to that ref's ancestry (default: every branch and tag).
export function scanWeb(webDir, { ref } = {}) {
  const web = resolve(webDir);
  const failures = [];
  const warnings = [];

  if (ref !== undefined && (ref.startsWith('-') || !tryGit(web, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]))) {
    throw new Error(`Ref ${ref} not found in web/. Nothing was changed.`);
  }

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
      const hits = isCrawlerRule(rel, text) ? [] : HARD.filter(p => p.re.test(text));
      for (const h of hits) content.push({ kind: 'content', path: rel, line: i + 1, match: h.name });
      if (!hits.length && commentMentionsAI(text)) warnings.push({ kind: 'comment', path: rel, line: i + 1, match: 'AI/IA' });
    });
  }
  failures.push(...content);

  // 3. History, all refs: messages first, then added diff lines.
  failures.push(...scanHistory(web, ref));

  return { failures, warnings };
}

// ref: deliver that ref (for example the clean-<date> branch) instead of HEAD.
export function buildPackage(projectDir, { date, ref } = {}) {
  const project = resolve(projectDir);
  const web = join(project, 'web');
  const day = date ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Invalid date "${day}" (expected YYYY-MM-DD).`);

  const dirty = git(web, ['status', '--porcelain', '--untracked-files=no']).trimEnd();
  if (dirty) throw new DirtyTreeError(dirty);

  const target = ref ?? 'HEAD';
  if (!tryGit(web, ['rev-parse', '--verify', '--quiet', `${target}^{commit}`])) {
    throw new Error(`Ref ${target} not found in web/. Nothing was changed.`);
  }
  // The content scan reads the checked-out files, so the delivered ref must hold exactly that tree.
  if (git(web, ['rev-parse', `${target}^{tree}`]) !== git(web, ['rev-parse', 'HEAD^{tree}'])) {
    throw new Error(`Ref ${target} does not hold the same files as the checked-out commit; the scan would not cover what ships. Nothing was changed.`);
  }

  const { failures } = scanWeb(web, { ref });
  if (failures.length) throw new TracesFoundError(failures);

  // A second delivery on the same day gets -2, -3...: an existing tag or zip is never overwritten.
  const suffix = firstFree(s => !git(web, ['tag', '-l', `entrega-${day}${s}`]).trim()
    && !existsSync(join(project, 'entrega', `${basename(project)}-${day}${s}.zip`)));
  const tag = `entrega-${day}${suffix}`;
  const zip = join(project, 'entrega', `${basename(project)}-${day}${suffix}.zip`);

  mkdirSync(join(project, 'entrega'), { recursive: true });
  git(web, ['tag', tag, target]);
  try {
    // Archives the tagged commit, so untracked files can never ship.
    git(web, ['archive', '--format=zip', '-o', zip, tag]);
  } catch (e) {
    git(web, ['tag', '-d', tag]);
    throw e;
  }
  return { zip, tag };
}

// '' if free, else '-2', '-3'...
function firstFree(isFree) {
  for (let n = 1; ; n++) {
    const s = n === 1 ? '' : `-${n}`;
    if (isFree(s)) return s;
  }
}

// Orphan branch with one commit holding the current (HEAD) tree. Built with commit-tree so the
// checked-out branch, index and working tree are never touched. Existing branches are not rewritten.
export function cleanHistory(webDir, { confirm, date } = {}) {
  if (confirm !== true) throw new ConfirmationRequiredError();
  const web = resolve(webDir);
  const day = date ?? today();
  const branch = `clean-${day}${firstFree(s => !git(web, ['branch', '--list', `clean-${day}${s}`]).trim())}`;
  const identity = {
    GIT_AUTHOR_NAME: tryGit(web, ['config', 'user.name']) || 'Delivery',
    GIT_AUTHOR_EMAIL: tryGit(web, ['config', 'user.email']) || 'delivery@example.invalid',
  };
  const env = { ...process.env, ...identity, GIT_COMMITTER_NAME: identity.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: identity.GIT_AUTHOR_EMAIL };
  const sha = git(web, ['commit-tree', 'HEAD^{tree}', '-m', 'chore: initial delivery snapshot'], env).trim();
  git(web, ['branch', branch, sha]);
  return branch;
}

function scanHistory(web, ref) {
  const revs = ref ? [ref, '--'] : ['--all'];
  const out = [];
  const seen = new Set();
  const report = (commit, path, line, text) => {
    if (isCrawlerRule(path, text)) return;
    for (const h of HISTORY) {
      const key = `${commit}:${h.name}`;
      if (seen.has(key) || !h.re.test(text)) continue;
      seen.add(key);
      out.push({ kind: 'history', path, ...(line ? { line } : {}), commit, match: h.name });
    }
  };

  // Messages
  let commit = null;
  for (const l of git(web, ['-c', 'core.quotepath=false', 'log', '--format=%x01%H%x00%B', ...revs]).split(/\r?\n/)) {
    if (l.startsWith('\x01')) { [commit] = l.slice(1).split('\0'); report(commit, '(commit message)', 0, l.split('\0')[1] ?? ''); }
    else if (commit) report(commit, '(commit message)', 0, l);
  }

  // Diffs: only added lines. +++ headers are skipped by tracking whether we are inside a hunk.
  let path = null, inHunk = false, ln = 0;
  commit = null;
  const diff = git(web, ['-c', 'core.quotepath=false', 'log', '-p', '--no-color', '--no-ext-diff', '--no-textconv', '--format=%x01%H', ...revs]);
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
  const refAt = args.indexOf('--ref');
  const ref = refAt === -1 ? undefined : args[refAt + 1];
  const rest = refAt === -1 ? args : args.filter((_, i) => i !== refAt && i !== refAt + 1);
  const flags = rest.filter(a => a.startsWith('--'));
  const target = rest.find(a => !a.startsWith('--'));
  if (!target || (refAt !== -1 && (!ref || ref.startsWith('-')))) {
    console.error('Usage: node scripts/entregar.mjs <projectDir> [--ref <branch>] | [--clean-history --confirm]');
    process.exit(1);
  }
  try {
    if (flags.includes('--clean-history')) {
      const branch = cleanHistory(join(resolve(target), 'web'), { confirm: flags.includes('--confirm') });
      console.log(`Created orphan branch ${branch} with one commit. Existing branches were not touched.`);
    } else {
      const { failures, warnings } = scanWeb(join(resolve(target), 'web'), { ref });
      for (const w of warnings) console.log(`warning  ${formatFinding(w)}`);
      if (failures.length) {
        for (const f of failures) console.log(formatFinding(f));
        console.error(`${failures.length} blocking finding(s) (AI traces or placeholders). Nothing was packaged.`);
        process.exit(1);
      }
      const { zip, tag } = buildPackage(target, { ref });
      console.log(zip);
      console.log(`Created tag ${tag} in web/.`);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}
