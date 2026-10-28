import { type CatalogEvent, catalog, eventName } from '../catalog.js';
import type { Scenario } from '../scenario/schema.js';
import { VERSION } from '../version.js';
import { type Format, markdownText, oneLine, painter, wrap } from './style.js';
import type { RenderOptions } from './run.js';

// `asnsim types` and `asnsim scenarios`: what asnsim can send.

export function renderTypes(
  list: CatalogEvent[],
  format: Format,
  options: RenderOptions = {},
): string {
  const data = catalog();
  if (format === 'json') {
    return `${JSON.stringify({ schemaVersion: 0, tool: { name: 'asnsim', version: VERSION }, catalog: { version: data.version, readOn: data.readOn, sources: data.sources }, events: list }, null, 2)}\n`;
  }
  if (format === 'markdown') {
    const lines = [
      '| Notification | Payload | Access | What it means |',
      '| ------------ | ------- | ------ | ------------- |',
      ...list.map(
        (event) =>
          `| \`${eventName(event.type, event.subtype)}\` | ${event.payload} | ${event.access} | ${markdownText(event.summary)} |`,
      ),
      '',
      `Apple's pages, read ${data.readOn}: ${Object.values(data.sources).join(', ')}`,
    ];
    return `${lines.join('\n')}\n`;
  }
  const paint = painter(format === 'tty' && (options.color ?? false));
  const width = Math.max(options.width ?? 100, 60);
  const nameWidth = Math.max(...list.map((event) => eventName(event.type, event.subtype).length));
  const lines = list.map(
    (event) =>
      `${paint('bold', eventName(event.type, event.subtype).padEnd(nameWidth))}  ${paint('cyan', event.access.padEnd(9))}  ${wrap(event.summary, width, ' '.repeat(nameWidth + 13))}`,
  );
  lines.push(
    '',
    paint('dim', `${list.length} notifications, from Apple's pages read ${data.readOn}:`),
    paint('dim', data.sources.notificationType ?? ''),
  );
  return `${lines.join('\n')}\n`;
}

export function renderScenarios(
  scenarios: Scenario[],
  format: Format,
  options: RenderOptions = {},
): string {
  if (format === 'json') {
    return `${JSON.stringify({ schemaVersion: 0, tool: { name: 'asnsim', version: VERSION }, scenarios }, null, 2)}\n`;
  }
  const paint = painter(format === 'tty' && (options.color ?? false));
  const width = Math.max(options.width ?? 100, 60);
  const lines: string[] = [];
  for (const scenario of scenarios) {
    const steps = scenario.steps.map((step) =>
      eventName(step.type.toUpperCase(), step.subtype?.toUpperCase()),
    );
    if (format === 'markdown') {
      lines.push(
        `- **${markdownText(scenario.name)}**: ${markdownText(scenario.description ?? '')} (${steps.map((step) => `\`${step}\``).join(' → ')})`,
      );
      continue;
    }
    lines.push(paint('bold', scenario.name));
    if (scenario.description) lines.push(`  ${wrap(oneLine(scenario.description), width, '  ')}`);
    lines.push(`  ${paint('dim', wrap(steps.join(' → '), width, '  '))}`, '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
