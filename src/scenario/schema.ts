import { z } from 'zod';
import { productSchema } from '../sim/products.js';
import { stepSchema } from '../sim/step.js';

// A scenario file (YAML or JSON): the products, then the steps in order. Each step is a
// notification plus what to expect from the webhook and, optionally, a request that checks the
// backend's state afterwards.

const statusCode = z.number().int().min(100).max(599);

export const checkSchema = z.object({
  /** URL to request after the notification; relative URLs resolve against the webhook URL. */
  url: z.string().min(1).max(2000),
  method: z.enum(['GET', 'POST']).default('GET'),
  /** Status the check must answer with. Default 200. */
  status: statusCode.default(200),
  /** JSON the response body must contain: every key given must be there with that value. */
  json: z.unknown().optional(),
  /** Text the response body must contain. */
  contains: z.string().optional(),
});

export const scenarioStepSchema = stepSchema.extend({
  /** Status the webhook must answer with, or a list of them. Default: 200 to 206, as Apple. */
  expect: z.object({ status: z.union([statusCode, z.array(statusCode).min(1)]) }).optional(),
  check: checkSchema.optional(),
  /** Send the same notification twice, as the App Store may. */
  duplicate: z.boolean().optional(),
  /** Shown in the report instead of the type and subtype. */
  name: z.string().min(1).max(200).optional(),
});

export const scenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  products: z.array(productSchema).min(1).optional(),
  /** Time of the first step (ISO 8601). With it the dates are exactly the scenario's. */
  start: z.iso.datetime({ offset: true }).optional(),
  /** Seed for transaction IDs and notificationUUIDs. */
  seed: z.string().min(1).max(200).optional(),
  appAccountToken: z.uuid().optional(),
  steps: z.array(scenarioStepSchema).min(1).max(500),
});

export type ScenarioInput = z.input<typeof scenarioSchema>;
export type Scenario = z.output<typeof scenarioSchema> & { name: string };
export type ScenarioStep = z.output<typeof scenarioStepSchema>;
export type Check = z.output<typeof checkSchema>;
