import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers/read.mjs';
import { parseFrontmatter as parseAt } from './helpers/frontmatter.mjs';
import { MCP_TOOL_PREFIX } from './platform.mjs';

const AGENTS_DIR = join(ROOT, 'agents');
const parseFrontmatter = rel => parseAt(join(ROOT, rel));
const agentNames = () => readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));

// `tools` may be a comma-separated string or a YAML list.
const toolList = tools =>
  (Array.isArray(tools) ? tools : String(tools ?? '').split(','))
    .map(t => String(t).trim()).filter(Boolean);

// Server names of the plugin-bundled MCP tools in a tool list.
const mcpServersIn = (tools, prefix) =>
  [...new Set(tools.filter(t => t.startsWith(prefix)).map(t => t.slice(prefix.length).split('__')[0]))];

const EXPECT = {
  'creative-director': { model: 'opus',   write: false, mcp: ['playwright','chrome-devtools'] },
  'brand-copywriter':  { model: 'opus',   write: false, mcp: [] },
  'seo-strategist':    { model: 'opus',   write: false, mcp: ['dataforseo','context7'] },
  'geo-strategist':    { model: 'opus',   write: false, mcp: ['wikidata','mcp-geo'] },
  'researcher':        { model: 'haiku',  write: false, mcp: ['brave-search','dataforseo'] },
  'frontend-engineer': { model: 'sonnet', write: true,  mcp: ['context7'] },
  'qa':                { model: 'opus',   write: false, mcp: ['chrome-devtools','playwright'] },
};
test('exactly the seven agents exist', () => { assert.deepEqual(agentNames().sort(), Object.keys(EXPECT).sort()); });
for (const [name, e] of Object.entries(EXPECT)) {
  test(`${name}: model, no Agent tool, write access, MCP scope`, () => {
    const { data } = parseFrontmatter(`agents/${name}.md`);
    const tools = toolList(data.tools);
    assert.equal(data.name, name);
    assert.equal(data.model, e.model);
    assert.ok(!tools.includes('Agent') && !tools.includes('NotebookEdit'));
    assert.equal(tools.includes('Write') || tools.includes('Edit'), e.write);
    assert.deepEqual(mcpServersIn(tools, MCP_TOOL_PREFIX).sort(), [...e.mcp].sort());
    assert.ok(tools.includes('Skill'));
    assert.ok(data.description.length >= 80);
    assert.ok(data.color, `${name}.color`);
  });
}
test('no agent uses fields ignored for plugin agents', () => {
  for (const n of agentNames()) for (const f of ['hooks','mcpServers','permissionMode'])
    assert.equal(parseFrontmatter(`agents/${n}.md`).data[f], undefined, `${n}.${f}`);
});
test('every agent body states the honesty rule and the BLOCKED convention', () => {
  for (const n of agentNames()) { const b = parseFrontmatter(`agents/${n}.md`).body;
    assert.match(b, /never invent/i); assert.match(b, /BLOCKED:/); }
});
test('preloaded skills stay under the 32-skill cap and are never preloadable-blocked', () => {
  for (const n of agentNames()) {
    const skills = parseFrontmatter(`agents/${n}.md`).data.skills ?? [];
    assert.ok(Array.isArray(skills) && skills.length <= 32, n);
    for (const s of skills.filter(s => s.startsWith('departamento-digital:'))) {
      const { data } = parseFrontmatter(`skills/${s.split(':')[1]}/SKILL.md`);
      assert.notEqual(data['disable-model-invocation'], true, `${n} preloads ${s}`);
    }
  }
});
