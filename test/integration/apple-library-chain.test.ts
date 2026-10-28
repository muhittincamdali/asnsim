import { randomUUID } from 'node:crypto';
import {
  Environment,
  SignedDataVerifier,
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';
import { describe, expect, it } from 'vitest';
import { signJws } from '../../src/jws/jws.js';
import { APPLE_ROOT_CA_G3 } from '../../src/pki/apple-root.js';
import { createTestChain } from '../../src/pki/chain.js';

// Apple's own verifier, configured as a backend's test suite would configure it: the asnsim root
// instead of Apple's, online checks off.
const chain = createTestChain();
const x5c = [chain.signing, chain.intermediate, chain.root];

const notification = (environment: string, extra: Record<string, unknown> = {}) => ({
  notificationType: 'TEST',
  notificationUUID: randomUUID(),
  data: { bundleId: 'com.example.app', environment, ...extra },
  version: '2.0',
  signedDate: Date.now(),
});

async function status(promise: Promise<unknown>): Promise<VerificationStatus | 'ok'> {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    if (error instanceof VerificationException) return error.status;
    throw error;
  }
}

describe('Apple SignedDataVerifier with the asnsim root', () => {
  it('verifies a Sandbox notification signed by the test chain', async () => {
    const verifier = new SignedDataVerifier(
      [Buffer.from(chain.root)],
      false,
      Environment.SANDBOX,
      'com.example.app',
    );
    const decoded = await verifier.verifyAndDecodeNotification(
      signJws(notification('Sandbox'), chain.signingKey, x5c),
    );
    expect(decoded.notificationType).toBe('TEST');
  });

  it('verifies a Production notification with the app Apple ID', async () => {
    const verifier = new SignedDataVerifier(
      [Buffer.from(chain.root)],
      false,
      Environment.PRODUCTION,
      'com.example.app',
      1234,
    );
    const token = signJws(notification('Production', { appAppleId: 1234 }), chain.signingKey, x5c);
    expect(await status(verifier.verifyAndDecodeNotification(token))).toBe('ok');
    const other = signJws(notification('Production', { appAppleId: 99 }), chain.signingKey, x5c);
    expect(await status(verifier.verifyAndDecodeNotification(other))).toBe(
      VerificationStatus.INVALID_APP_IDENTIFIER,
    );
  });

  it('rejects the test chain when only Apple’s root is trusted', async () => {
    const verifier = new SignedDataVerifier(
      [Buffer.from(APPLE_ROOT_CA_G3)],
      false,
      Environment.SANDBOX,
      'com.example.app',
    );
    const token = signJws(notification('Sandbox'), chain.signingKey, x5c);
    expect(await status(verifier.verifyAndDecodeNotification(token))).toBe(
      VerificationStatus.VERIFICATION_FAILURE,
    );
  });

  it('rejects a payload whose signature does not match', async () => {
    const verifier = new SignedDataVerifier(
      [Buffer.from(chain.root)],
      false,
      Environment.SANDBOX,
      'com.example.app',
    );
    const [header, , signature] = signJws(notification('Sandbox'), chain.signingKey, x5c).split(
      '.',
    );
    const body = Buffer.from(JSON.stringify(notification('Sandbox'))).toString('base64url');
    expect(
      await status(verifier.verifyAndDecodeNotification(`${header}.${body}.${signature}`)),
    ).toBe(VerificationStatus.VERIFICATION_FAILURE);
  });
});
