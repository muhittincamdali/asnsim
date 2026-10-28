import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  InputTooLarge,
  MAX_INPUT_BYTES,
  readFileLimited,
  readLimited,
} from '../../src/cli/input.js';
import { scratchDir } from '../helpers/scratch.js';

const CHUNK = 65_536;

describe('reading decode input (bounded)', () => {
  it('stops an endless stream at the first chunk past 2 MB and closes it', async () => {
    let pulled = 0;
    let closed = false;
    async function* endless() {
      try {
        for (;;) {
          pulled++;
          yield new Uint8Array(CHUNK);
        }
      } finally {
        closed = true;
      }
    }
    const started = performance.now();
    await expect(readLimited(endless())).rejects.toThrow(InputTooLarge);
    expect(performance.now() - started).toBeLessThan(2000);
    // 2,000,000 bytes fill 30.5 chunks of 64 KB: the 31st is the first past the limit.
    expect(pulled).toBe(Math.ceil((MAX_INPUT_BYTES + 1) / CHUNK));
    expect(closed).toBe(true);
  });

  it('reads a file of exactly 2 MB and refuses one byte more', async () => {
    const dir = scratchDir('input');
    const exact = join(dir, 'exact');
    const over = join(dir, 'over');
    writeFileSync(exact, Buffer.alloc(MAX_INPUT_BYTES, 0x61));
    writeFileSync(over, Buffer.alloc(MAX_INPUT_BYTES + 1, 0x61));
    expect((await readFileLimited(exact)).length).toBe(MAX_INPUT_BYTES);
    await expect(readFileLimited(over)).rejects.toThrow('larger than 2 MB');
  });

  it.skipIf(process.platform === 'win32')('refuses /dev/zero quickly', async () => {
    const started = performance.now();
    await expect(readFileLimited('/dev/zero')).rejects.toThrow(InputTooLarge);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});
