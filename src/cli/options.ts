import { type Command, InvalidArgumentError, Option } from 'commander';
import { FORMATS, type Format } from '../report/style.js';
import { DEFAULT_DIR } from '../workspace.js';

// The options the commands share and the parsers of their values.

export const integer = (name: string, min: number, max: number) => (value: string) => {
  const number = Number(value);
  if (!/^\d+$/.test(value) || number < min || number > max) {
    throw new InvalidArgumentError(`${name} is a whole number from ${min} to ${max}.`);
  }
  return number;
};

export const date = (value: string) => {
  const parsed = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(parsed.getTime())) {
    throw new InvalidArgumentError('an ISO 8601 date such as 2026-10-01T09:00:00Z.');
  }
  return parsed;
};

export const header = (value: string, previous: Record<string, string> = {}) => {
  const match = /^([A-Za-z0-9!#$%&'*+.^_`|~-]+):\s*(.*)$/.exec(value);
  if (!match?.[1])
    throw new InvalidArgumentError('a header such as "Authorization: Bearer token".');
  return { ...previous, [match[1].toLowerCase()]: match[2] ?? '' };
};

export const statuses = (value: string) =>
  value.split(',').map((part) => {
    const number = Number(part.trim());
    if (!Number.isInteger(number) || number < 100 || number > 599) {
      throw new InvalidArgumentError('HTTP status codes such as 200 or 200,202.');
    }
    return number;
  });

export interface OutputOptions {
  format: Format;
  json?: boolean;
  output?: string;
  color: boolean;
}

export interface DeliveryOptions extends OutputOptions {
  dir: string;
  url?: string;
  clock?: 'live' | 'fixed';
  start?: Date;
  seed?: string;
  retries: number;
  duplicate?: boolean;
  timeout: number;
  header?: Record<string, string>;
  out?: string;
  dryRun?: boolean;
}

export function outputOptions(command: Command): Command {
  return command
    .addOption(new Option('-f, --format <format>', 'report format').choices(FORMATS).default('tty'))
    .option('--json', 'same as --format json')
    .option('-o, --output <file>', 'write the report to a file instead of stdout')
    .option('--no-color', 'plain text even in a terminal');
}

export function deliveryOptions(command: Command): Command {
  return outputOptions(
    command
      .option('-u, --url <url>', 'webhook URL that receives the notifications')
      .option('-d, --dir <folder>', 'folder asnsim init wrote', DEFAULT_DIR)
      .addOption(
        new Option('--clock <clock>', 'live: dated when sent; fixed: the scenario’s dates').choices(
          ['live', 'fixed'],
        ),
      )
      .option('--start <date>', 'date of the first event (makes the clock fixed)', date)
      .option('--seed <text>', 'seed for transaction IDs and notificationUUIDs')
      .option(
        '--retries <n>',
        'resend a failed notification up to n times (0-5)',
        integer('--retries', 0, 5),
        0,
      )
      .option('--duplicate', 'send every notification twice')
      .option(
        '--timeout <ms>',
        'time limit per request',
        integer('--timeout', 100, 600_000),
        10_000,
      )
      .option('-H, --header <header>', 'extra request header, repeatable', header)
      .option('--out <folder>', 'also write each request body to this folder')
      .option('--dry-run', 'sign and write the notifications, send nothing'),
  );
}
