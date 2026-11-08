import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { read, ROOT } from './helpers/read.mjs';
import { parseFrontmatter } from './helpers/frontmatter.mjs';

const VENDORED = [
  'emil-design-eng', 'animate', 'review-animations', 'improve-animations',
  'find-animation-opportunities', 'choreograph', 'animation-performance',
  'animation-vocabulary', 'break-ui',
  'geo-citability', 'geo-crawlers', 'geo-llmstxt',
  'copywriting', 'copy-editing', 'cro',
];
const skillPath = (s, f) => new URL(`../skills/${s}/${f}`, import.meta.url);
const notices = () => read('THIRD_PARTY_NOTICES.md');

test('every vendored skill ships its upstream LICENSE', () => {
  for (const s of VENDORED) assert.ok(existsSync(skillPath(s, 'LICENSE')), s);
});
test('every vendored skill has a SKILL.md whose name matches its folder', () => {
  for (const s of VENDORED) {
    assert.equal(parseFrontmatter(fileURLToPath(skillPath(s, 'SKILL.md'))).data.name, s, s);
  }
});
test('THIRD_PARTY_NOTICES lists repo, commit SHA and license per vendored skill', () => {
  for (const s of VENDORED) assert.match(notices(), new RegExp(`${s}[\\s\\S]*?[0-9a-f]{40}`));
});
test('taste reference has no frontmatter and no hooks', () => {
  const t = read('references/taste.md');
  assert.ok(!t.startsWith('---')); assert.ok(!/hooks:/.test(t));
});
test('no vendored SKILL.md declares hooks', () => {
  for (const s of VENDORED) {
    const p = new URL(`../skills/${s}/SKILL.md`, import.meta.url);
    assert.equal(parseFrontmatter(p).data.hooks, undefined, s);
  }
});
test('Spanish ai-tells list has Ban and Cap sections with at least 30 entries', () => {
  const es = read('references/ai-tells-es.md');
  assert.match(es, /## .*Prohibid/i); assert.match(es, /## .*L[ií]mite/i);
  assert.ok((es.match(/^- /gm) ?? []).length >= 30);
});
test('copywriting ships references/ai-tells.md', () => {
  assert.ok(existsSync(skillPath('copywriting', 'references/ai-tells.md')));
});
