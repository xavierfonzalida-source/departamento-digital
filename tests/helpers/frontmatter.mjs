import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// Parses a Markdown file with optional YAML frontmatter.
// Returns { data, body }; data is {} when there is no frontmatter.
export function parseFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  return { data: parse(m[1]) ?? {}, body: m[2] };
}
