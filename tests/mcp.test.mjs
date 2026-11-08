import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers/read.mjs';

const SERVERS = ['context7', 'chrome-devtools', 'playwright', 'dataforseo', 'brave-search', 'wikidata', 'mcp-geo'];
const mcp = () => JSON.parse(read('.mcp.json'));

// Every ${VAR} / ${VAR:-default} reference in env values, urls and headers.
function envVarsIn(config) {
  const names = new Set();
  for (const s of Object.values(config.mcpServers)) {
    const values = [...Object.values(s.env ?? {}), ...Object.values(s.headers ?? {}), s.url ?? ''];
    for (const v of values) for (const m of v.matchAll(/\$\{([A-Z0-9_]+)(?::-[^}]*)?\}/g)) names.add(m[1]);
  }
  return [...names];
}

test('declares exactly the seven servers', () => {
  assert.deepEqual(Object.keys(mcp().mcpServers).sort(), [...SERVERS].sort());
});

test('wikidata is remote at the WMDE endpoint', () => {
  assert.equal(mcp().mcpServers.wikidata.url, 'https://wd-mcp.wmcloud.org/mcp');
  assert.equal(mcp().mcpServers.wikidata.type, 'http');
});

test('context7 is remote HTTP, not the npx command', () => {
  const c = mcp().mcpServers.context7;
  assert.equal(c.url, 'https://mcp.context7.com/mcp');
  assert.equal(c.type, 'http');
  assert.equal(c.command, undefined);
});

test('local servers use npx', () => {
  for (const n of ['chrome-devtools', 'playwright', 'dataforseo', 'brave-search', 'mcp-geo'])
    assert.equal(mcp().mcpServers[n].command, 'npx', n);
});

// Optional keys (mcp-geo engines) use an EMPTY default: an unset ${VAR} would otherwise
// reach the server as the literal text "${VAR}" and look like a real key.
test('no literal secrets: every env value is a ${VAR} reference (empty default allowed)', () => {
  for (const s of Object.values(mcp().mcpServers))
    for (const v of Object.values(s.env ?? {})) assert.match(v, /^\$\{[A-Z0-9_]+(:-)?\}$/);
});

test('no literal secrets in headers', () => {
  for (const s of Object.values(mcp().mcpServers))
    for (const v of Object.values(s.headers ?? {})) assert.match(v, /^Bearer \$\{[A-Z0-9_]+:-\}$/);
});

test('README documents every env var used in .mcp.json', () => {
  const names = envVarsIn(mcp());
  assert.ok(names.length >= 8, 'expected env vars to be detected');
  for (const name of names) assert.ok(read('README.md').includes(name), name);
});

test('README documents MCP_TIMEOUT and the npx pre-warm', () => {
  const r = read('README.md');
  assert.ok(r.includes('MCP_TIMEOUT'));
  assert.ok(r.includes('npx -y'));
});
