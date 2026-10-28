import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Folder for the files tests write: inside the repository (ignored by git), not the system temp. */
export const SCRATCH = fileURLToPath(new URL('../../.test-work/', import.meta.url));

/** A new empty folder under .test-work whose name starts with `prefix`. */
export function scratchDir(prefix: string): string {
  mkdirSync(SCRATCH, { recursive: true });
  return mkdtempSync(join(SCRATCH, `${prefix}-`));
}
