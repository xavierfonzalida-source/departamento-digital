import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { read } from './helpers/read.mjs';

test('plugin.json has required identity', () => {
  const p = JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(p.name, 'departamento-digital');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  assert.equal(p.license, 'MIT');
});
test('marketplace.json lists the plugin from this repo', () => {
  const m = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.ok(m.plugins.some(x => x.name === 'departamento-digital'));
});
test('no CLAUDE.md at plugin root (it would not load)', () => {
  assert.equal(existsSync(new URL('../CLAUDE.md', import.meta.url)), false);
});
