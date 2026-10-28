import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fingerprint } from '../../src/pki/certificate.js';
import {
  checkAppSettings,
  DEFAULT_APP,
  initWorkspace,
  loadWorkspace,
  WorkspaceError,
} from '../../src/workspace.js';
import { scratchDir } from '../helpers/scratch.js';

describe('initWorkspace and loadWorkspace', () => {
  it('writes the chain, the key and the settings, and reads them back', () => {
    const dir = join(scratchDir('workspace'), '.asnsim');
    const files = initWorkspace(dir, { ...DEFAULT_APP, bundleId: 'com.example.pantry' });
    expect(files.map((file) => file.slice(dir.length + 1))).toEqual([
      'root.cer',
      'root.pem',
      'intermediate.pem',
      'signing.pem',
      'signing-key.pem',
      'asnsim.json',
      '.gitignore',
    ]);
    const workspace = loadWorkspace(dir);
    expect(workspace.app.bundleId).toBe('com.example.pantry');
    expect(fingerprint(workspace.chain.root)).toBe(
      fingerprint(Uint8Array.from(readFileSync(join(dir, 'root.cer')))),
    );
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toMatch(/^\*$/m);
    if (process.platform !== 'win32') {
      expect(statSync(join(dir, 'signing-key.pem')).mode & 0o777).toBe(0o600);
    }
  });

  it('keeps an existing chain unless forced', () => {
    const dir = scratchDir('workspace');
    initWorkspace(dir, DEFAULT_APP);
    const before = readFileSync(join(dir, 'root.cer'));
    expect(() => initWorkspace(dir, DEFAULT_APP)).toThrow('already exists');
    initWorkspace(dir, DEFAULT_APP, { force: true });
    expect(readFileSync(join(dir, 'root.cer')).equals(before)).toBe(false);
  });

  it('explains a missing or foreign folder', () => {
    const dir = scratchDir('workspace');
    expect(() => loadWorkspace(join(dir, 'none'))).toThrow('Run `asnsim init` first');
    writeFileSync(join(dir, 'asnsim.json'), '{"hello":1}');
    expect(() => loadWorkspace(dir)).toThrow('not a file asnsim init wrote');
    const file = join(dir, 'plain');
    writeFileSync(file, '');
    expect(() => initWorkspace(file, DEFAULT_APP)).toThrow('not a folder');
  });

  it('notices a signing certificate replaced by hand', () => {
    const dir = scratchDir('workspace');
    initWorkspace(dir, DEFAULT_APP);
    const other = scratchDir('workspace');
    initWorkspace(other, DEFAULT_APP);
    writeFileSync(join(dir, 'signing.pem'), readFileSync(join(other, 'signing.pem')));
    expect(() => loadWorkspace(dir)).toThrow(WorkspaceError);
  });
});

describe('checkAppSettings', () => {
  it('needs an app Apple ID in Production, as Apple’s verifier does', () => {
    expect(() => checkAppSettings({ ...DEFAULT_APP, environment: 'Production' })).toThrow(
      '--app-apple-id',
    );
    expect(
      checkAppSettings({ ...DEFAULT_APP, environment: 'Production', appAppleId: 1234 }).appAppleId,
    ).toBe(1234);
  });

  it('rejects a malformed bundle ID', () => {
    expect(() => checkAppSettings({ ...DEFAULT_APP, bundleId: 'has space' })).toThrow(
      'Invalid bundleId',
    );
  });
});
