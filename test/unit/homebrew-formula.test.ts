import { describe, expect, it } from 'vitest';
import { DESCRIPTION, formula } from '../../scripts/homebrew-formula.ts';

const SHA = 'a'.repeat(64);

describe('Homebrew formula', () => {
  it('installs the release tarball of the given version with Homebrew’s npm arguments', () => {
    const text = formula({ version: '0.1.0', sha256: SHA });
    expect(text).toContain(
      'url "https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz"',
    );
    expect(text).toContain(`sha256 "${SHA}"`);
    expect(text).toContain('system "npm", "install", *std_npm_args');
    expect(text).toContain('depends_on "node"');
    expect(text).toMatchSnapshot();
  });

  it('keeps the description within brew audit rules', () => {
    // At most 80 characters, no leading article or formula name, no trailing period.
    expect(DESCRIPTION.length).toBeLessThanOrEqual(80);
    expect(DESCRIPTION).not.toMatch(/^(?:a|an|the|asnsim)\b/i);
    expect(DESCRIPTION).not.toMatch(/\.$/);
  });

  it('tests the installed binary: --version, init, payload and a verified decode', () => {
    const text = formula({ version: '1.2.3', sha256: SHA });
    expect(text).toContain('shell_output("#{bin}/asnsim --version")');
    expect(text).toContain('system bin/"asnsim", "init", "--dir", testpath/"chain"');
    expect(text).toContain('assert_match "3 verified", output');
  });

  it.each([
    ['a version with a v prefix', { version: 'v0.1.0', sha256: SHA }],
    ['a short checksum', { version: '0.1.0', sha256: 'abc' }],
  ])('rejects %s', (_label, input) => {
    expect(() => formula(input)).toThrow();
  });
});
