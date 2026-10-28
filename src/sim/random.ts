import { createHash, randomBytes } from 'node:crypto';

// Identifiers for simulated purchases. With a seed every run gives the same transaction IDs and
// notificationUUIDs, which the snapshot tests and reproducible scenarios rely on; without one
// they come from the system's random source.

export interface Random {
  /** `count` random bytes. */
  bytes(count: number): Uint8Array;
  /** A decimal string of `length` digits that does not start with 0. */
  digits(length: number): string;
  /** A version 4 UUID in lower case. */
  uuid(): string;
}

function fromSource(next: (count: number) => Uint8Array): Random {
  return {
    bytes: next,
    digits(length) {
      const bytes = next(length);
      let text = '';
      for (const [index, byte] of bytes.entries()) {
        text += index === 0 ? String(1 + (byte % 9)) : String(byte % 10);
      }
      return text;
    },
    uuid() {
      const bytes = next(16);
      bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
      bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
      const hex = Buffer.from(bytes).toString('hex');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
  };
}

/** Random values from `seed` (the same seed, the same values), or from the system. */
export function createRandom(seed?: string): Random {
  if (seed === undefined) return fromSource((count) => Uint8Array.from(randomBytes(count)));
  let counter = 0;
  let pool = new Uint8Array();
  return fromSource((count) => {
    while (pool.length < count) {
      const block = createHash('sha256').update(`${seed}\0${counter++}`).digest();
      const grown = new Uint8Array(pool.length + block.length);
      grown.set(pool);
      grown.set(block, pool.length);
      pool = grown;
    }
    const out = pool.slice(0, count);
    pool = pool.slice(count);
    return out;
  });
}
