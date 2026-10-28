import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import { FIXES } from '../../src/run/findings.js';
import { parseScenario } from '../../src/scenario/load.js';
import { normalizeProducts } from '../../src/sim/products.js';
import { play, simulation } from '../helpers/sim.js';

const guide = (name: string) =>
  readFileSync(new URL(`../../docs/guides/${name}`, import.meta.url), 'utf8');

/** GitHub's anchor for a Markdown heading. */
const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-');

describe('guides', () => {
  it('have the troubleshooting section every finding links to', () => {
    const anchors = new Set(
      [...guide('troubleshooting.md').matchAll(/^#{2,3} (.+)$/gm)].map((match) =>
        anchor(match[1] ?? ''),
      ),
    );
    for (const [code, fix] of Object.entries(FIXES)) {
      const [, fragment] = fix.guide.split('#');
      expect(anchors.has(fragment ?? ''), code).toBe(true);
    }
  });

  it('show a scenario that loads and plays', () => {
    const [yaml] = [...guide('scenarios.md').matchAll(/```yaml\n([\s\S]*?)```/g)].map(
      (match) => match[1] ?? '',
    );
    const scenario = parseScenario(parseYaml(yaml ?? ''), 'guide');
    const products = normalizeProducts(scenario.products ?? []);
    const { parts } = play(scenario.steps, simulation({ products }));
    expect(parts.at(-1)?.transaction?.productId).toBe('com.example.basic.monthly');
  });
});
