import { describe, expect, it } from 'vitest';
import { releaseNotes } from '../../scripts/release-notes.ts';

const CHANGELOG = `# Changelog

## [Unreleased]

## [0.2.0] - 2026-11-20

### Added

- Dependency scanning.

## [0.1.0] - 2026-10-14

### Added

- First release.

[Unreleased]: https://github.com/muhittincamdali/asnsim/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/muhittincamdali/asnsim/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0
`;

describe('releaseNotes', () => {
  it('returns the section of one version without its heading', () => {
    expect(releaseNotes(CHANGELOG, '0.2.0')).toBe('### Added\n\n- Dependency scanning.\n');
  });

  it('stops at the link definitions after the last section', () => {
    expect(releaseNotes(CHANGELOG, '0.1.0')).toBe('### Added\n\n- First release.\n');
  });

  it('fails for a missing or empty section', () => {
    expect(() => releaseNotes(CHANGELOG, '9.9.9')).toThrow('no section for 9.9.9');
    expect(() => releaseNotes(CHANGELOG, 'Unreleased')).toThrow('is empty');
  });
});
