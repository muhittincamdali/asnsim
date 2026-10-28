import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  builtInScenarios,
  loadScenario,
  parseScenario,
  ScenarioError,
} from '../../src/scenario/load.js';
import { scratchDir } from '../helpers/scratch.js';

describe('built-in scenarios', () => {
  it('ships nine scenarios that load', () => {
    expect(builtInScenarios()).toEqual([
      'billing-retry-expired',
      'billing-retry-grace-recovery',
      'cancel-expire-winback',
      'consumable-refund-dispute',
      'family-sharing-revoke',
      'price-increase-accepted',
      'price-increase-declined',
      'trial-renew-refund',
      'upgrade-downgrade',
    ]);
    for (const name of builtInScenarios()) {
      const scenario = loadScenario(name);
      expect(scenario.name).toBe(name);
      expect(scenario.description?.length).toBeGreaterThan(20);
    }
  });
});

describe('loadScenario', () => {
  it('reads YAML and JSON files and names them after the file', () => {
    const dir = scratchDir('scenario');
    writeFileSync(join(dir, 'mine.yml'), 'steps:\n  - type: TEST\n');
    writeFileSync(
      join(dir, 'other.json'),
      JSON.stringify({ name: 'Named', steps: [{ type: 'TEST' }] }),
    );
    expect(loadScenario(join(dir, 'mine.yml')).name).toBe('mine');
    expect(loadScenario('other.json', dir).name).toBe('Named');
  });

  it('explains a missing scenario, a folder and broken files', () => {
    const dir = scratchDir('scenario');
    expect(() => loadScenario('nope')).toThrow('Built-in scenarios: billing-retry-expired');
    expect(() => loadScenario('nope.yaml', dir)).toThrow('Cannot find nope.yaml');
    expect(() => loadScenario(dir)).toThrow('is not a file');
    writeFileSync(join(dir, 'bad.yaml'), 'steps: [\n');
    expect(() => loadScenario(join(dir, 'bad.yaml'))).toThrow('not valid YAML');
    writeFileSync(join(dir, 'bad.json'), '{');
    expect(() => loadScenario(join(dir, 'bad.json'))).toThrow('not valid JSON');
    writeFileSync(join(dir, 'big.yaml'), `# ${'x'.repeat(1_000_001)}`);
    expect(() => loadScenario(join(dir, 'big.yaml'))).toThrow('larger than 1 MB');
  });
});

describe('parseScenario', () => {
  const error = (input: unknown) => {
    try {
      parseScenario(input, 'x');
    } catch (caught) {
      expect(caught).toBeInstanceOf(ScenarioError);
      return (caught as Error).message;
    }
    return 'no error';
  };

  it('names the field of the first problem', () => {
    expect(error({ steps: [] })).toMatch(/^steps: /);
    expect(
      error({ steps: [{ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', after: '1 month' }] }),
    ).toBe('steps[0].after: an ISO 8601 duration such as P1M or P3D');
    expect(error({ steps: [{ type: 'EXPIRED', subtype: 'LATE' }] })).toMatch(
      /^steps\[0\]: EXPIRED has no subtype LATE/,
    );
    expect(error({ steps: [{ type: 'TEST', expect: { status: 999 } }] })).toMatch(
      /^steps\[0\]\.expect\.status/,
    );
    expect(
      error({
        steps: [{ type: 'TEST' }],
        products: [{ id: 'a', type: 'auto-renewable', price: 1 }],
      }),
    ).toBe('products[0].period: an auto-renewable subscription needs a period such as P1M');
    expect(
      error({
        steps: [{ type: 'TEST' }],
        products: [
          { id: 'a', type: 'consumable', price: 1 },
          { id: 'a', type: 'consumable', price: 2 },
        ],
      }),
    ).toBe('products: Product a is declared twice');
  });

  it('accepts expectations, checks and duplicates', () => {
    const scenario = parseScenario(
      {
        start: '2026-10-01T09:00:00Z',
        steps: [
          {
            type: 'REFUND',
            expect: { status: [200, 202] },
            check: { url: '/entitlements/{originalTransactionId}', json: { active: false } },
            duplicate: true,
          },
        ],
      },
      'x',
    );
    expect(scenario.steps[0]?.check).toMatchObject({ method: 'GET', status: 200 });
  });
});
