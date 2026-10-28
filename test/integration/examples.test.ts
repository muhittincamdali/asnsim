import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createReceiver,
  Environment,
  rootsFromEnvironment,
} from '../../examples/node-receiver/receiver.mjs';
import { runScenario, sendAll } from '../../src/run/run.js';
import { loadScenario } from '../../src/scenario/load.js';
import { DEFAULT_APP, initWorkspace, loadWorkspace } from '../../src/workspace.js';
import { ROOT } from '../helpers/cli.js';
import { scratchDir } from '../helpers/scratch.js';

// examples/node-receiver run as its README says, with asnsim's test root, against its scenarios.

const dir = scratchDir('examples');
initWorkspace(dir, DEFAULT_APP);
const workspace = loadWorkspace(dir);
const { server } = createReceiver({
  roots: rootsFromEnvironment({ ASN_TEST_ROOT: `${dir}/root.cer` }),
  environment: Environment.SANDBOX,
  bundleId: DEFAULT_APP.bundleId,
});
let url = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/notifications`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const scenario = (name: string) =>
  loadScenario(`${ROOT}examples/node-receiver/scenarios/${name}.yaml`);

describe('examples/node-receiver', () => {
  it('passes its entitlement scenario, duplicate included', async () => {
    const result = await runScenario(scenario('entitlements'), { workspace, url });
    expect(result.steps.map((step) => [step.name, step.ok])).toEqual([
      ['SUBSCRIBED/INITIAL_BUY', true],
      ['DID_FAIL_TO_RENEW/GRACE_PERIOD', true],
      ['GRACE_PERIOD_EXPIRED', true],
      ['DID_RENEW/BILLING_RECOVERY', true],
      ['REFUND', true],
    ]);
    expect(result.steps[3]?.attempts.map((attempt) => attempt.status)).toEqual([200, 200]);
  });

  it('fails the scenario that expects access after a refund', async () => {
    const result = await runScenario(scenario('refund-keeps-access'), { workspace, url });
    expect(result.ok).toBe(false);
    expect(result.steps[1]?.findings[0]?.message).toContain('$.active: expected true, got false');
  });

  it('answers every notification type with 200', async () => {
    const result = await sendAll({ workspace, url });
    expect(result.counts).toMatchObject({ steps: 40, passed: 40 });
  });

  it('rejects asnsim notifications when it trusts only another root, and refuses a test root in production', async () => {
    const other = scratchDir('examples-other');
    initWorkspace(other, DEFAULT_APP);
    const result = await runScenario(loadScenario('trial-renew-refund'), {
      workspace: loadWorkspace(other),
      url,
    });
    expect(result.steps[0]?.attempts[0]?.status).toBe(400);
    expect(result.steps[0]?.findings[0]?.code).toBe('rejected');
    expect(() =>
      rootsFromEnvironment({ ASN_TEST_ROOT: `${dir}/root.cer`, NODE_ENV: 'production' }),
    ).toThrow('refusing to trust a test root');
  });
});

describe('examples/shell/failed-steps.sh', () => {
  it('lists the failed notifications of a JSON report', async () => {
    const { spawnSync } = await import('node:child_process');
    const { renderRun } = await import('../../src/report/run.js');
    const result = await runScenario(scenario('refund-keeps-access'), { workspace, url });
    const run = spawnSync('sh', [`${ROOT}examples/shell/failed-steps.sh`], {
      input: renderRun(result, 'json'),
      encoding: 'utf8',
    });
    if (run.error || run.stderr.includes('jq: not found') || run.status === 127) return;
    expect(run.stdout).toBe('2. REFUND: check-failed\n');
  });
});
