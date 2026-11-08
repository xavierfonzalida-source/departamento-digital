import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Repo root, independent of the current working directory.
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function read(relPath) {
  return readFileSync(new URL(`../../${relPath}`, import.meta.url), 'utf8');
}
