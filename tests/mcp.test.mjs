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

// A global ANTHROPIC_API_KEY would switch Claude Code itself to API billing, so every mcp-geo
// engine key is read from a MCP_GEO_-prefixed variable and renamed only for that server.
test('mcp-geo engine keys come only from MCP_GEO_ variables', () => {
  const env = mcp().mcpServers['mcp-geo'].env;
  assert.deepEqual(Object.keys(env).sort(),
    ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY', 'SERPAPI_API_KEY', 'XAI_API_KEY']);
  for (const [k, v] of Object.entries(env)) assert.equal(v, `\${MCP_GEO_${k}:-}`, k);
});

test('README warns never to set ANTHROPIC_API_KEY globally', () => {
  const r = read('README.md');
  assert.match(r, /Nunca definas `ANTHROPIC_API_KEY` como variable global/);
  assert.ok(!/setx ANTHROPIC_API_KEY/.test(r));
  assert.ok(!/^\| `ANTHROPIC_API_KEY`/m.test(r), 'the env table must list MCP_GEO_ANTHROPIC_API_KEY, not ANTHROPIC_API_KEY');
});

// Required credentials stay strict ${VAR} (no default), so a missing one is never an empty string.
test('DataForSEO and Brave credentials are strict ${VAR} references', () => {
  const s = mcp().mcpServers;
  assert.deepEqual(s.dataforseo.env, { DATAFORSEO_LOGIN: '${DATAFORSEO_LOGIN}', DATAFORSEO_PASSWORD: '${DATAFORSEO_PASSWORD}' });
  assert.deepEqual(s['brave-search'].env, { BRAVE_API_KEY: '${BRAVE_API_KEY}' });
});

test('npx servers pin an exact package version, and README pre-warms the same versions', () => {
  const r = read('README.md');
  for (const n of ['chrome-devtools', 'playwright', 'dataforseo', 'brave-search', 'mcp-geo']) {
    const pkg = mcp().mcpServers[n].args.find(a => a !== '-y' && !a.startsWith('-'));
    assert.match(pkg, /^(@[^/]+\/)?[^@]+@\d+\.\d+\.\d+$/, n);
    assert.ok(r.includes(`npx -y ${pkg} --help`), `README pre-warm for ${pkg}`);
  }
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
