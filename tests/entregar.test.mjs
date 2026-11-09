import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  scanWeb, buildPackage, cleanHistory, TracesFoundError, ConfirmationRequiredError, TagExistsError,
} from '../scripts/entregar.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'entregar.mjs');
const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

let base, project, web;
beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'dd-entregar-'));
  ({ project, web } = makeProject('proj'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

// <base>/<name>/web is its own repo with one clean commit. Identity is set per repo, never globally.
function makeProject(name) {
  const project = join(base, name);
  const web = join(project, 'web');
  mkdirSync(web, { recursive: true });
  git(web, ['init', '-q', '-b', 'main']);
  git(web, ['config', 'user.name', 'Test Person']);
  git(web, ['config', 'user.email', 'test@example.com']);
  add(web, 'README.md', '# Cliente\n');
  add(web, 'src/index.js', 'export const a = 1;\n');
  return { project, web };
}

function addBytes(repo, rel, content) {
  const file = join(repo, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  git(repo, ['add', '--', rel]);
  git(repo, ['commit', '-q', '--no-verify', '-m', 'chore: add file']);
}
const add = addBytes;
const commitRaw = (repo, msg) => git(repo, ['commit', '-q', '--no-verify', '--allow-empty', '-m', msg]);

function pngWithText(key, value) {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('tEXt'), Buffer.from(`${key}\0${value}`, 'latin1'), Buffer.from('IEND'),
  ]);
}

function branchWithFileThenRevert(repo, branch, rel, content) {
  git(repo, ['checkout', '-q', '-b', branch]);
  add(repo, rel, content);
  git(repo, ['rm', '-q', '--', rel]);
  git(repo, ['commit', '-q', '--no-verify', '-m', 'chore: remove file']);
  git(repo, ['checkout', '-q', 'main']);
}

test('clean repo passes and produces tag + zip', () => {
  const zip = buildPackage(project, { date: '2026-12-01' });
  assert.ok(existsSync(zip));
  assert.equal(zip, join(project, 'entrega', 'proj-2026-12-01.zip'));
  assert.equal(git(web, ['tag', '-l', 'entrega-2026-12-01']).trim(), 'entrega-2026-12-01');
  const bytes = readFileSync(zip);
  assert.ok(bytes.includes('README.md'));
});
test('untracked files never ship in the zip', () => {
  writeFileSync(join(web, 'draft-notes.txt'), 'private\n');
  const zip = buildPackage(project, { date: '2026-12-01' });
  assert.ok(!readFileSync(zip).includes('draft-notes.txt'));
});
test('buildPackage does not touch the working tree', () => {
  writeFileSync(join(web, 'draft-notes.txt'), 'private\n');
  buildPackage(project, { date: '2026-12-01' });
  assert.ok(existsSync(join(web, 'draft-notes.txt')));
  assert.equal(git(web, ['status', '--porcelain']).trim(), '?? draft-notes.txt');
});
test('planted CLAUDE.md fails', () => {
  add(web, 'CLAUDE.md', 'x');
  assert.equal(scanWeb(web).failures[0].kind, 'forbidden-file');
});
for (const rel of ['AGENTS.md', '.claude/settings.json', '.mcp.json', 'docs/superpowers/plan.md', 'trabajo/estado.md']) {
  test(`forbidden file ${rel} fails`, () => {
    add(web, rel, 'x');
    const f = scanWeb(web).failures.find(x => x.kind === 'forbidden-file');
    assert.ok(f, rel);
    assert.equal(f.path, rel);
  });
}
test('untracked forbidden file in the working tree fails too', () => {
  mkdirSync(join(web, 'trabajo'));
  writeFileSync(join(web, 'trabajo', 'notes.md'), 'x');
  assert.ok(scanWeb(web).failures.some(f => f.kind === 'forbidden-file' && f.path === 'trabajo/notes.md'));
});
test('Co-Authored-By in a commit message fails', () => {
  commitRaw(web, 'feat: y\n\nCo-Authored-By: Claude <x@y>');
  const hist = scanWeb(web).failures.filter(f => f.kind === 'history');
  assert.ok(hist.length >= 1);
  assert.match(hist[0].commit, /^[0-9a-f]{40}$/);
});
test('detects a trace in an older commit on another branch', () => {
  branchWithFileThenRevert(web, 'other', 'src/a.js', '// Generated with Claude');
  const f = scanWeb(web).failures.find(x => x.kind === 'history' && x.path === 'src/a.js');
  assert.ok(f);
  assert.equal(f.line, 1);
});
test('history findings are reported once per (commit, pattern)', () => {
  add(web, 'src/a.js', 'const a = "Claude";\nconst b = "Claude";\n// Claude again\n');
  const hist = scanWeb(web).failures.filter(f => f.kind === 'history' && f.match === 'Claude');
  assert.equal(hist.length, 1);
});
test('"Anthropic" in a source file fails with path and line', () => {
  add(web, 'src/x.js', '\n\nconst a = "Anthropic";');
  const f = scanWeb(web).failures[0];
  assert.equal(f.kind, 'content');
  assert.equal(f.path, 'src/x.js');
  assert.equal(f.line, 3);
});
test('patterns are case-insensitive', () => {
  add(web, 'src/x.js', 'const a = "COPILOT";\n');
  assert.ok(scanWeb(web).failures.some(f => f.kind === 'content' && f.line === 1));
});
test('planted [PLACEHOLDER: …] in a source file fails', () => {
  add(web, 'src/x.js', 'const t = "[PLACEHOLDER: client tagline]";\n');
  const r = scanWeb(web);
  assert.ok(r.failures.some(f => f.kind === 'content' && f.path === 'src/x.js'));
  assert.ok(r.failures.some(f => f.kind === 'history'));
});
test('reports comment mentions of AI as warnings, not failures', () => {
  add(web, 'src/c.js', '// IA para clientes: texto del cliente');
  const r = scanWeb(web);
  assert.equal(r.failures.length, 0);
  assert.equal(r.warnings[0].kind, 'comment');
  assert.equal(r.warnings[0].path, 'src/c.js');
  assert.equal(r.warnings[0].line, 1);
});
test('AI in code outside a comment is not even a warning', () => {
  add(web, 'src/c.js', 'const AI = 1;\n');
  const r = scanWeb(web);
  assert.equal(r.failures.length, 0);
  assert.equal(r.warnings.length, 0);
});
test('a comment that matches a hard pattern is a failure, not a warning', () => {
  add(web, 'src/c.js', '/* AI-generated */\n');
  const r = scanWeb(web);
  assert.ok(r.failures.some(f => f.kind === 'content'));
  assert.equal(r.warnings.length, 0);
});
test('AI generator marker in image metadata fails', () => {
  addBytes(web, 'img/h.png', pngWithText('Software', 'DALL-E'));
  const f = scanWeb(web).failures.find(x => x.kind === 'image-metadata');
  assert.ok(f);
  assert.equal(f.path, 'img/h.png');
});
test('an image with ordinary metadata passes', () => {
  addBytes(web, 'img/h.png', pngWithText('Software', 'GIMP'));
  assert.equal(scanWeb(web).failures.length, 0);
});
test('binary files are skipped by the content scan', () => {
  addBytes(web, 'data/blob.bin', Buffer.concat([Buffer.from([0, 1, 2, 0]), Buffer.from('Claude Anthropic')]));
  assert.equal(scanWeb(web).failures.filter(f => f.kind === 'content').length, 0);
});
test('scanWeb never modifies the repository', () => {
  add(web, 'src/x.js', 'const a = "Anthropic";\n');
  const before = git(web, ['rev-parse', 'HEAD']);
  scanWeb(web);
  assert.equal(git(web, ['rev-parse', 'HEAD']), before);
  assert.match(readFileSync(join(web, 'src/x.js'), 'utf8'), /Anthropic/);
});
test('buildPackage refuses when traces exist', () => {
  add(web, '.mcp.json', '{}');
  assert.throws(() => buildPackage(project, { date: '2026-12-01' }), TracesFoundError);
  assert.ok(!existsSync(join(project, 'entrega')));
  assert.equal(git(web, ['tag', '-l']).trim(), '');
});
test('buildPackage fails clearly when the tag already exists', () => {
  buildPackage(project, { date: '2026-12-01' });
  assert.throws(() => buildPackage(project, { date: '2026-12-01' }), TagExistsError);
});
test('cleanHistory requires confirmation', () => {
  assert.throws(() => cleanHistory(web, { confirm: false }), ConfirmationRequiredError);
  assert.throws(() => cleanHistory(web, {}), ConfirmationRequiredError);
  assert.equal(git(web, ['branch', '--list', 'clean-*']).trim(), '');
});
test('cleanHistory creates an orphan branch with one commit and leaves main alone', () => {
  commitRaw(web, 'feat: second');
  const mainBefore = git(web, ['rev-parse', 'main']).trim();
  const branch = cleanHistory(web, { confirm: true, date: '2026-12-01' });
  assert.equal(branch, 'clean-2026-12-01');
  assert.equal(git(web, ['rev-parse', 'main']).trim(), mainBefore);
  assert.equal(git(web, ['symbolic-ref', '--short', 'HEAD']).trim(), 'main');
  assert.equal(git(web, ['rev-list', '--count', branch]).trim(), '1');
  assert.equal(git(web, ['log', '-1', '--format=%P', branch]).trim(), '');
  assert.equal(git(web, ['log', '-1', '--format=%B', branch]).trim(), 'chore: initial delivery snapshot');
  assert.equal(git(web, ['rev-parse', `${branch}^{tree}`]), git(web, ['rev-parse', 'main^{tree}']));
});
test('scans a web repo in a path with spaces and accents', () => {
  ({ project, web } = makeProject('Cliente Ñandú'));
  const zip = buildPackage(project, { date: '2026-12-01' });
  assert.ok(existsSync(zip));
  assert.equal(zip, join(project, 'entrega', 'Cliente Ñandú-2026-12-01.zip'));
  add(web, 'src/ñ x.js', 'const a = "Anthropic";\n');
  const f = scanWeb(web).failures.find(x => x.kind === 'content');
  assert.equal(f.path, 'src/ñ x.js');
});
test('CLI prints path:line  pattern and exits 1 on failures', () => {
  add(web, 'src/x.js', '\n\nconst a = "Anthropic";');
  const r = spawnSync('node', [SCRIPT, project], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /src\/x\.js:3 {2}Anthropic/);
});
test('CLI on a clean project exits 0 and prints the zip path', () => {
  const r = spawnSync('node', [SCRIPT, project], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /proj-\d{4}-\d{2}-\d{2}\.zip/);
});
test('CLI --clean-history without --confirm exits 1', () => {
  const r = spawnSync('node', [SCRIPT, project, '--clean-history'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.equal(git(web, ['branch', '--list', 'clean-*']).trim(), '');
});
test('CLI --clean-history --confirm creates the branch', () => {
  const r = spawnSync('node', [SCRIPT, project, '--clean-history', '--confirm'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(git(web, ['branch', '--list', 'clean-*']), /clean-\d{4}-\d{2}-\d{2}/);
});
