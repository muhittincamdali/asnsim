import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { findEvent } from '../catalog.js';
import { normalizeProducts } from '../sim/products.js';
import { type Scenario, scenarioSchema } from './schema.js';

// Scenarios come from a file the user names or from scenarios/ in the package. Problems are
// reported with the path of the field ("steps[2].subtype") and a fix.

export class ScenarioError extends Error {
  override name = 'ScenarioError';
}

const BUILT_IN = fileURLToPath(new URL('../../scenarios/', import.meta.url));
const MAX_BYTES = 1_000_000;

/** Names of the scenarios shipped with asnsim. */
export function builtInScenarios(): string[] {
  return readdirSync(BUILT_IN)
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => file.slice(0, -'.yaml'.length))
    .sort();
}

function where(path: PropertyKey[]): string {
  return path
    .map((part, index) =>
      typeof part === 'number' ? `[${part}]` : `${index === 0 ? '' : '.'}${String(part)}`,
    )
    .join('');
}

/** Checks a parsed scenario: schema, products, and every type and subtype against the catalog. */
export function parseScenario(input: unknown, fallbackName: string): Scenario {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0] as z.core.$ZodIssue;
    throw new ScenarioError(`${where(issue.path) || 'scenario'}: ${issue.message}`);
  }
  const scenario = parsed.data;
  try {
    if (scenario.products) normalizeProducts(scenario.products);
  } catch (error) {
    throw new ScenarioError(`products: ${(error as Error).message}`);
  }
  scenario.steps.forEach((step, index) => {
    try {
      findEvent(step.type, step.subtype);
    } catch (error) {
      throw new ScenarioError(`steps[${index}]: ${(error as Error).message}`);
    }
  });
  return { ...scenario, name: scenario.name ?? fallbackName };
}

/**
 * Reads a scenario by built-in name (`trial-renew-refund`) or from a .yaml, .yml or .json file.
 * A name with a path separator or one of those extensions is always a file.
 */
export function loadScenario(nameOrPath: string, cwd = process.cwd()): Scenario {
  const looksLikeFile = /[/\\]|\.(ya?ml|json)$/i.test(nameOrPath);
  const path = resolve(cwd, nameOrPath);
  if (!looksLikeFile && builtInScenarios().includes(nameOrPath)) {
    return parseText(readFileSync(`${BUILT_IN}${nameOrPath}.yaml`, 'utf8'), '.yaml', nameOrPath);
  }
  if (!existsSync(path)) {
    throw new ScenarioError(
      looksLikeFile
        ? `Cannot find ${nameOrPath}.`
        : `No scenario ${nameOrPath}. Built-in scenarios: ${builtInScenarios().join(', ')}; or give a .yaml or .json file.`,
    );
  }
  const stat = statSync(path);
  if (!stat.isFile()) throw new ScenarioError(`${nameOrPath} is not a file.`);
  if (stat.size > MAX_BYTES) throw new ScenarioError(`${nameOrPath} is larger than 1 MB.`);
  return parseText(
    readFileSync(path, 'utf8'),
    extname(path).toLowerCase(),
    basename(path, extname(path)),
  );
}

function parseText(text: string, extension: string, name: string): Scenario {
  let data: unknown;
  try {
    data = extension === '.json' ? JSON.parse(text) : parseYaml(text, { maxAliasCount: 100 });
  } catch (error) {
    throw new ScenarioError(
      `${name}: not valid ${extension === '.json' ? 'JSON' : 'YAML'}: ${(error as Error).message.split('\n')[0]}`,
    );
  }
  return parseScenario(data, name);
}
