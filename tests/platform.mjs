// Claude Code platform facts checked on 2026-11-08 with Claude Code CLI 2.1.302.
// Evidence and status of each fact: docs/platform-notes.md.

// Tools from a plugin-bundled MCP server are named `${MCP_TOOL_PREFIX}<server>__<tool>`.
// Verified: mcp__plugin_departamento-digital_context7__query-docs.
export const MCP_TOOL_PREFIX = 'mcp__plugin_departamento-digital_';

// Format accepted by an agent's `skills` frontmatter field for a skill from another plugin.
// Verified: `superpowers:brainstorming` preloads the full skill content into the subagent.
export const EXTERNAL_SKILL_REF = (plugin, skill) => `${plugin}:${skill}`;

// settings.json fragment that removes the Co-Authored-By trailer, the PR
// "Generated with" line and the session link.
// VERIFIED on 2.1.302: with it, a headless session received no attribution instructions.
// DOCS ONLY (not run): this form also works before 2.1.281, which rejects
// `"attribution": false`; `includeCoAuthoredBy` is deprecated.
export const ATTRIBUTION_SETTING = {
  attribution: { commit: '', pr: '', sessionUrl: false },
};

// Project-scoped install, run from the client project folder. Every marketplace
// is declared in the project's .claude/settings.json, and the plugin and its
// four dependencies are enabled only in that project.
// VERIFIED (2026-11-09): this exact sequence against the public GitHub repo in
// a fresh folder; v0.2.0 and its four dependencies installed at project scope,
// third-party marketplaces cloned from scratch. `@departamento-digital` must
// match the `name` in .claude-plugin/marketplace.json.
export const PROJECT_SCOPE_INSTALL = [
  'claude plugin marketplace add xavierfonzalida-source/departamento-digital --scope project',
  'claude plugin marketplace add pbakaus/impeccable --scope project',
  'claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill --scope project',
  'claude plugin marketplace add AgriciDaniel/claude-seo --scope project',
  'claude plugin install departamento-digital@departamento-digital --scope project',
].join('\n');
