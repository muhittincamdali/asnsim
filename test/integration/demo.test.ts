import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMOS, mediaPath, prepare, record } from '../../scripts/demo.ts';
import { parseAnsi, terminalSvg } from '../../scripts/terminal-svg.ts';
import { stableTimes } from '../helpers/cli.js';

// Request times change from run to run; the demos are compared with them masked, the time
// column keeping its width (see stableTimes).
const stable = (svg: string) => stableTimes(svg);

describe('parseAnsi', () => {
  it('splits a line into styled spans', () => {
    expect(parseAnsi('\u001b[1m\u001b[31mfailed\u001b[39m\u001b[22m  plain')).toEqual([
      { text: 'failed', bold: true, dim: false, color: 'red' },
      { text: '  plain', bold: false, dim: false, color: null },
    ]);
  });
});

describe('terminalSvg', () => {
  const session = { title: 'demo', command: 'asnsim', output: 'a <b> & c\n' };

  it('escapes text and carries no scripts or external references', () => {
    const svg = terminalSvg(session, 'dark');
    expect(svg).toContain('a &lt;b&gt; &amp; c');
    expect(svg).not.toMatch(/<script|href=|url\(|@import/);
  });

  it('shows everything at once when motion is reduced', () => {
    expect(terminalSvg(session, 'light')).toContain('@media (prefers-reduced-motion:reduce)');
  });

  it('uses only blues from the kit palette for status colours', () => {
    const svg = terminalSvg({ ...session, output: '\u001b[31mred\u001b[32mgreen\n' }, 'light');
    expect(svg).not.toMatch(/#(?:FF0000|FFFF00|00FF00)/i);
  });
});

describe('docs/media demos (npm run demo records them again)', () => {
  let server: Server;
  beforeAll(async () => {
    server = await prepare();
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  // In order: init writes the chain the receiver trusts and the runs use.
  it.each(DEMOS.map((demo) => [demo.name, demo] as const))(
    '%s matches what the CLI prints today',
    async (_name, demo) => {
      const session = await record(demo);
      expect(session.command.startsWith('asnsim ')).toBe(true);
      for (const theme of ['light', 'dark'] as const) {
        const committed = readFileSync(mediaPath(demo.name, theme), 'utf8');
        expect(stable(committed)).toBe(stable(terminalSvg(session, theme)));
      }
    },
  );
});
