import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers/read.mjs';
import { parseFrontmatter as parseAt } from './helpers/frontmatter.mjs';
import { PROJECT_SCOPE_INSTALL } from './platform.mjs';

const CMDS = ['nuevo-cliente', 'investigar', 'direccion', 'build', 'review-design', 'review-seo', 'review-geo', 'qa', 'ronda', 'entregar'];
const parseFrontmatter = rel => parseAt(join(ROOT, rel));
const body = c => parseFrontmatter(`skills/${c}/SKILL.md`).body;

test('all ten commands exist with name and description', () => {
  for (const c of CMDS) {
    const { data } = parseFrontmatter(`skills/${c}/SKILL.md`);
    assert.equal(data.name, c);
    assert.ok(data.description.length >= 40, c);
  }
});

test('only Xavier triggers the commands (no model invocation)', () => {
  for (const c of CMDS) assert.equal(parseFrontmatter(`skills/${c}/SKILL.md`).data['disable-model-invocation'], true, c);
});

test('nuevo-cliente and entregar call their scripts via ${CLAUDE_PLUGIN_ROOT}', () => {
  assert.match(body('nuevo-cliente'), /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/nuevo-cliente\.mjs/);
  assert.match(body('entregar'), /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/entregar\.mjs/);
});

test('entregar requires Xavier certification before running', () => {
  assert.match(body('entregar'), /certif/i);
});

test('direccion stops for approval 1', () => {
  assert.match(body('direccion'), /approval/i);
});

test('each delegating command names the agent it delegates to', () => {
  const map = { investigar: 'researcher', build: 'awwwards-frontend', 'review-design': 'creative-director',
    'review-seo': 'seo-strategist', 'review-geo': 'geo-strategist', qa: 'qa' };
  for (const [c, a] of Object.entries(map)) assert.ok(body(c).includes(a), `${c} -> ${a}`);
});

test('nuevo-cliente gives the verified project-scope install commands verbatim', () => {
  assert.ok(body('nuevo-cliente').includes(PROJECT_SCOPE_INSTALL));
});

test('every plugin path a command references exists in the plugin', () => {
  for (const c of CMDS) {
    for (const [, rel] of body(c).matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"]+)/g)) {
      assert.ok(existsSync(join(ROOT, rel)), `${c}: ${rel}`);
    }
  }
});
