import { createReadStream } from 'node:fs';

// What decode reads from a file or standard input: at most MAX_INPUT_BYTES, read as a stream and
// refused at the first byte past it, so a large file or an endless stream ("asnsim decode
// /dev/zero", "yes | asnsim decode -") costs at most that much memory instead of being read whole
// before its size is known.

/** The most decode reads from one file or from standard input: 2 MB, as decode() accepts. */
export const MAX_INPUT_BYTES = 2_000_000;

export class InputTooLarge extends Error {
  override name = 'InputTooLarge';
}

/** All of `source`, or InputTooLarge as soon as it has given more than `limit` bytes. */
export async function readLimited(
  source: AsyncIterable<Uint8Array | string>,
  limit: number = MAX_INPUT_BYTES,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  // Leaving the loop early (the throw) closes the stream.
  for await (const chunk of source) {
    const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
    size += bytes.length;
    if (size > limit) throw new InputTooLarge(`larger than ${limit / 1_000_000} MB`);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

/** A file's bytes, reading no more than `limit` and one byte of it. */
export const readFileLimited = (path: string, limit: number = MAX_INPUT_BYTES) =>
  // `end` is the index of the last byte read, so this reads limit + 1 bytes at most.
  readLimited(createReadStream(path, { end: limit }), limit);
