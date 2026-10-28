import { z } from 'zod';
import { isDuration } from './duration.js';

// One event of a scenario, as the scenario file writes it. Only `type` is required; the rest
// shapes the event or the payload. Delivery options (expect, check, duplicate) are added by the
// scenario schema.

const duration = z.string().refine(isDuration, 'an ISO 8601 duration such as P1M or P3D');

export const offerSchema = z.object({
  type: z.enum(['introductory', 'promotional', 'offer-code', 'win-back']).default('introductory'),
  id: z.string().min(1).max(200).optional(),
  discount: z.enum(['FREE_TRIAL', 'PAY_AS_YOU_GO', 'PAY_UP_FRONT', 'ONE_TIME']).optional(),
  period: duration.optional(),
  price: z.number().nonnegative().max(1_000_000).optional(),
});

export const CONSUMPTION_REASONS = [
  'UNINTENDED_PURCHASE',
  'FULFILLMENT_ISSUE',
  'UNSATISFIED_WITH_PURCHASE',
  'LEGAL',
  'OTHER',
] as const;

const overrides = z.record(z.string(), z.unknown());

export const stepSchema = z.object({
  /** notificationType, such as DID_RENEW. */
  type: z.string().regex(/^[A-Za-z_]+$/, 'a notificationType such as DID_RENEW'),
  /** subtype; leave out for the type's event without one, null to say so explicitly. */
  subtype: z
    .string()
    .regex(/^[A-Za-z_]+$/)
    .nullable()
    .optional(),
  /** Product ID: what to buy, or the target of an upgrade or downgrade. */
  product: z.string().min(1).max(200).optional(),
  /** Time since the previous step, instead of asnsim's default for the event. */
  after: duration.optional(),
  /** Absolute time of the event (ISO 8601), instead of `after`. */
  at: z.iso.datetime({ offset: true }).optional(),
  offer: offerSchema.optional(),
  refund: z
    .object({
      reason: z.union([z.literal(0), z.literal(1)]).optional(),
      percentage: z.number().gt(0).lte(100).optional(),
    })
    .optional(),
  /** consumptionRequestReason of a CONSUMPTION_REQUEST. */
  reason: z.enum(CONSUMPTION_REASONS).optional(),
  /** New price of a PRICE_INCREASE or PRICE_CHANGE, in the currency's units. */
  price: z.number().nonnegative().max(1_000_000).optional(),
  /** How far RENEWAL_EXTENDED moves the renewal date. Default P7D. */
  extendBy: duration.optional(),
  /** Length of Billing Grace Period for DID_FAIL_TO_RENEW/GRACE_PERIOD. Default P16D. */
  gracePeriod: duration.optional(),
  ownership: z.enum(['PURCHASED', 'FAMILY_SHARED', 'ASSIGNED']).optional(),
  quantity: z.number().int().positive().max(10_000).optional(),
  /** Fields merged into the payloads last, to send what asnsim would not write. */
  set: z
    .object({
      notification: overrides.optional(),
      data: overrides.optional(),
      transaction: overrides.optional(),
      renewalInfo: overrides.optional(),
    })
    .optional(),
});

export type StepInput = z.input<typeof stepSchema>;
export type Step = z.output<typeof stepSchema>;
