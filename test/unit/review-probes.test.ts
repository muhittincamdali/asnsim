import { describe, expect, it } from 'vitest';
import {
  appliesToAsnsim,
  leakedPiece,
  type Probe,
  probeName,
  probes,
  probeText,
  redactProbe,
} from '../helpers/probes.js';

// The shared review corpus (REDACTION-SPEC §8 #65, KL-H2): every probe the documentation says is
// hidden (claim C) hides its secret, except the limitations listed here by name. The corpus is
// the one of the reference package (S, 7,866 lines); bodies are read with the content type each
// probe gives (B0).

const documentedLimitations: Record<string, string> = {
  // The same two limitations as the reference package.
  'a-3#311': 'a value written before its name ("ssh-keygen -N x passphrase")',
  'a-7#496': 'the value of `status`, which free text shows ("status=x")',
};

const describeProbe = (probe: Probe, output: string) =>
  `${probeName(probe)} ${probe.category}: ${JSON.stringify(probeText(probe).slice(0, 200))} -> ${JSON.stringify(output.slice(0, 200))}`;

describe('the shared review corpus (REDACTION-SPEC §8 #65)', () => {
  const applying = probes.filter(appliesToAsnsim);

  it('holds every probe of the reviews', () => {
    expect(probes).toHaveLength(7866);
    expect(probes.filter((probe) => probe.claim === 'C')).toHaveLength(7234);
    expect(applying.filter((probe) => probe.claim === 'C')).toHaveLength(6312);
  });

  it('hides the secret of every probe the documentation says is hidden', () => {
    const leaks = applying
      .filter((probe) => probe.claim === 'C' && !(probeName(probe) in documentedLimitations))
      .map((probe) => ({ probe, output: redactProbe(probe) }))
      .filter(({ probe, output }) => leakedPiece(probe, output) !== undefined)
      .map(({ probe, output }) => describeProbe(probe, output));
    expect(leaks).toEqual([]);
  });

  // A limitation that no longer shows its secret has been fixed: the list and the documentation
  // are updated with it.
  it('still shows the secret of every documented limitation', () => {
    const byName = new Map(probes.map((probe) => [probeName(probe), probe]));
    for (const name of Object.keys(documentedLimitations)) {
      const probe = byName.get(name);
      expect(probe, name).toBeDefined();
      if (!probe) continue;
      expect(leakedPiece(probe, redactProbe(probe)), `${name} is fixed`).toBeDefined();
    }
  });
});
