import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createProject, ProjectExistsError, MissingBriefError } from '../scripts/nuevo-cliente.mjs';
import { ATTRIBUTION_SETTING } from './platform.mjs';
import { read as readRepo, ROOT } from './helpers/read.mjs';

const read = p => readFileSync(p, 'utf8');
const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]));
const GIT_ID = { gitUserName: 'Test Person', gitUserEmail: 'test@example.com' };

let base, dir;
beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'dd-nuevo-cliente-'));
  dir = tmpSub('client');
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

// New client folder under the temp base, with a brief.md in it.
function tmpSub(name) {
  const d = join(base, name);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'brief.md'), '# Brief\n');
  return d;
}

function commitIn(repo, message) {
  return spawnSync('git', ['commit', '--allow-empty', '-m', message], { cwd: repo, encoding: 'utf8' });
}

test('creates the §10.2 structure', () => {
  createProject(dir);
  for (const p of ['CLAUDE.md', 'trabajo/decisiones.md', 'trabajo/estado.md', 'trabajo/research', 'trabajo/specs',
    'trabajo/textos', 'trabajo/prototipos', 'trabajo/reportes', 'web/.git', '.claude/settings.json'])
    assert.ok(existsSync(join(dir, p)), p);
});
test('returns the list of created paths', () => {
  const { created } = createProject(dir);
  for (const p of ['CLAUDE.md', 'trabajo/decisiones.md', 'web/', '.gitignore', '.claude/settings.json'])
    assert.ok(created.includes(p), p);
});
test('copies the templates verbatim', () => {
  createProject(dir);
  assert.equal(read(join(dir, 'CLAUDE.md')), readRepo('templates/CLAUDE.md'));
  assert.equal(read(join(dir, 'trabajo/decisiones.md')), readRepo('templates/trabajo/decisiones.md'));
  assert.equal(read(join(dir, 'trabajo/estado.md')), readRepo('templates/trabajo/estado.md'));
});
test('web/ is its own git repo on main and is ignored by the client folder', () => {
  createProject(dir);
  assert.match(read(join(dir, '.gitignore')), /^web\/$/m);
  const head = spawnSync('git', ['symbolic-ref', 'HEAD'], { cwd: join(dir, 'web'), encoding: 'utf8' });
  assert.equal(head.stdout.trim(), 'refs/heads/main');
});
test('appends web/ to an existing .gitignore without losing lines', () => {
  writeFileSync(join(dir, '.gitignore'), 'node_modules/');
  createProject(dir);
  const lines = read(join(dir, '.gitignore')).split(/\r?\n/);
  assert.ok(lines.includes('node_modules/') && lines.includes('web/'));
});
test('commit-msg hook rejects AI attribution', () => {
  createProject(dir, GIT_ID);
  const web = join(dir, 'web');
  for (const msg of ['feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>', 'feat: y\n\nGENERATED WITH a tool',
    'fix: thanks claude', 'docs: anthropic'])
    assert.notEqual(commitIn(web, msg).status, 0, msg);
  assert.equal(commitIn(web, 'feat: clean').status, 0);
});
test('commit-msg hook is installed with LF line endings', () => {
  createProject(dir);
  const hook = read(join(dir, 'web/.git/hooks/commit-msg'));
  assert.ok(hook.startsWith('#!/bin/sh\n'));
  assert.ok(!hook.includes('\r'));
});
test('sets local git identity only when given', () => {
  createProject(dir, GIT_ID);
  const name = spawnSync('git', ['config', '--local', 'user.name'], { cwd: join(dir, 'web'), encoding: 'utf8' });
  assert.equal(name.stdout.trim(), 'Test Person');
  const other = tmpSub('other');
  createProject(other);
  const none = spawnSync('git', ['config', '--local', 'user.name'], { cwd: join(other, 'web'), encoding: 'utf8' });
  assert.equal(none.stdout.trim(), '');
});
test('settings.json disables attribution and sets impeccable live agent', () => {
  createProject(dir); const s = JSON.parse(read(join(dir, '.claude/settings.json')));
  assert.equal(s.env.IMPECCABLE_LIVE_COPY_AGENT, 'chat');
  assert.deepEqual(pick(s, Object.keys(ATTRIBUTION_SETTING)), ATTRIBUTION_SETTING);
});
test('merges into the settings.json written by the project-scope install', () => {
  mkdirSync(join(dir, '.claude'));
  const existing = { enabledPlugins: { 'departamento-digital@departamento-digital': true }, env: { FOO: '1' } };
  writeFileSync(join(dir, '.claude/settings.json'), JSON.stringify(existing));
  createProject(dir);
  const s = JSON.parse(read(join(dir, '.claude/settings.json')));
  assert.deepEqual(s.enabledPlugins, existing.enabledPlugins);
  assert.deepEqual(s.env, { FOO: '1', IMPECCABLE_LIVE_COPY_AGENT: 'chat' });
  assert.deepEqual(s.attribution, ATTRIBUTION_SETTING.attribution);
});
test('refuses to overwrite an existing project', () => {
  createProject(dir); writeFileSync(join(dir, 'CLAUDE.md'), 'mine');
  assert.throws(() => createProject(dir), ProjectExistsError);
  assert.equal(read(join(dir, 'CLAUDE.md')), 'mine');
});
test('refuses when only trabajo/ or web/ exists, creating nothing', () => {
  for (const name of ['trabajo', 'web']) {
    const d = tmpSub(`has-${name}`);
    mkdirSync(join(d, name));
    assert.throws(() => createProject(d), ProjectExistsError);
    assert.equal(existsSync(join(d, 'CLAUDE.md')), false);
  }
});
test('fails clearly without brief.md', () => {
  rmSync(join(dir, 'brief.md'));
  assert.throws(() => createProject(dir), MissingBriefError);
  assert.equal(existsSync(join(dir, 'CLAUDE.md')), false);
});
test('creates structure in a path with spaces and accents', () => {
  const d = tmpSub('Cliente Ñandú y Asociados'); createProject(d, GIT_ID); assert.ok(existsSync(join(d, 'web/.git')));
  assert.notEqual(commitIn(join(d, 'web'), 'feat: x\n\nGenerated with Claude Code').status, 0);
});
test('CLI prints the created list, and exits 1 with the error', () => {
  const script = join(ROOT, 'scripts/nuevo-cliente.mjs');
  const ok = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /CLAUDE\.md/);
  const again = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  assert.equal(again.status, 1);
  assert.match(again.stderr, /already/i);
  const usage = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(usage.status, 1);
});

// --- Templates ---

const HEADINGS = ['Role', 'Client material', 'Workflow', 'Quality standards', 'Delegation matrix', 'Two zones',
  'Commands', 'When to ask Xavier', 'Honesty', 'Communication', 'Commits in web/'];

test('CLAUDE.md has the §6 sections, in order', () => {
  const h2 = [...readRepo('templates/CLAUDE.md').matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
  assert.deepEqual(h2, HEADINGS);
});
test('CLAUDE.md covers thresholds, agents, commands and orchestrator duties', () => {
  const md = readRepo('templates/CLAUDE.md');
  for (const s of ['2.5 s', '200 ms', '0.00', '95', 'WCAG 2.2 AA', '60 fps', '×4', '3 cycles', 'claude-seo',
    'rioplatense', 'Inter', 'glassmorphism', 'emojis', 'brief.md', 'trabajo/decisiones.md', 'trabajo/estado.md',
    '[PLACEHOLDER:', 'BLOCKED', 'CLAUDE_PLUGIN_ROOT', 'Co-Authored-By', 'Generated with'])
    assert.ok(md.includes(s), s);
  for (const a of ['creative-director', 'brand-copywriter', 'seo-strategist', 'geo-strategist', 'researcher',
    'awwwards-frontend', 'qa'])
    assert.ok(md.includes(`\`${a}\``), a);
  for (const c of ['/nuevo-cliente', '/investigar', '/direccion', '/build', '/review-design', '/review-seo',
    '/review-geo', '/qa', '/ronda', '/entregar'])
    assert.ok(md.includes(c), c);
});
test('CLAUDE.md never hardcodes plugin file paths', () => {
  assert.doesNotMatch(readRepo('templates/CLAUDE.md'), /references\//);
});
test('trabajo templates carry their fields', () => {
  const d = readRepo('templates/trabajo/decisiones.md');
  for (const f of ['Idiomas', 'Español', 'rioplatense', 'neutro', 'Stack', 'Dirección aprobada', 'Cambios de rumbo'])
    assert.ok(d.includes(f), f);
  const e = readRepo('templates/trabajo/estado.md');
  for (const f of ['Etapa actual', 'Próximo paso', 'Bloqueos']) assert.ok(e.includes(f), f);
});
test('templates/commit-msg is kept with LF endings by git', () => {
  assert.match(readRepo('.gitattributes'), /^templates\/commit-msg\s.*eol=lf/m);
});
