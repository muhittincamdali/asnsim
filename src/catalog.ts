import { readFileSync } from 'node:fs';
import { z } from 'zod';

// Every notificationType and subtype of App Store Server Notifications V2, as data: what the event
// means, which payload object carries it, which products it applies to and what Apple says about
// access. catalog/notifications.json cites Apple's pages and the date they were read.

export const PRODUCT_TYPES = [
  'auto-renewable',
  'consumable',
  'non-consumable',
  'non-renewing',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Apple's spelling of each product type in a transaction's `type`. */
export const APPLE_PRODUCT_TYPE: Record<ProductType, string> = {
  'auto-renewable': 'Auto-Renewable Subscription',
  consumable: 'Consumable',
  'non-consumable': 'Non-Consumable',
  'non-renewing': 'Non-Renewing Subscription',
};

/**
 * What the event means for the customer's access, from Apple's description of it:
 * grant (provide the content), keep (keep providing it, as in a grace period), end (the
 * subscription ended; you can stop the service), revoke (refunded or revoked), reinstate (a
 * refund was reversed), unchanged (no change to access by itself).
 */
export const ACCESS = ['grant', 'keep', 'end', 'revoke', 'reinstate', 'unchanged'] as const;
export type Access = (typeof ACCESS)[number];

const payloadKind = z.enum(['data', 'summary', 'externalPurchaseToken', 'appData']);
export type PayloadKind = z.infer<typeof payloadKind>;

const eventSchema = z.object({
  subtype: z
    .string()
    .regex(/^[A-Z_]+$/)
    .nullable(),
  summary: z.string().min(1),
  access: z.enum(ACCESS),
  payload: payloadKind.optional(),
});

const typeSchema = z.object({
  type: z.string().regex(/^[A-Z_]+$/),
  payload: payloadKind,
  products: z.array(z.enum(PRODUCT_TYPES)),
  advancedCommerce: z.boolean().optional(),
  events: z.array(eventSchema).min(1),
});

const catalogSchema = z.object({
  version: z.string(),
  readOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.record(z.string(), z.url()),
  types: z.array(typeSchema).min(1),
});

export type Catalog = z.infer<typeof catalogSchema>;
export type NotificationTypeEntry = z.infer<typeof typeSchema>;

/** One notificationType and subtype pair. */
export interface CatalogEvent {
  type: string;
  subtype: string | null;
  summary: string;
  access: Access;
  payload: PayloadKind;
  products: ProductType[];
  advancedCommerce: boolean;
}

export function parseCatalog(json: unknown): Catalog {
  return catalogSchema.parse(json);
}

let cached: Catalog | undefined;

/** The catalog shipped with the package (catalog/notifications.json). */
export function catalog(): Catalog {
  cached ??= parseCatalog(
    JSON.parse(readFileSync(new URL('../catalog/notifications.json', import.meta.url), 'utf8')),
  );
  return cached;
}

/** Every event of the catalog, in its order. */
export function events(from: Catalog = catalog()): CatalogEvent[] {
  return from.types.flatMap((entry) =>
    entry.events.map((event) => ({
      type: entry.type,
      subtype: event.subtype,
      summary: event.summary,
      access: event.access,
      payload: event.payload ?? entry.payload,
      products: entry.products,
      advancedCommerce: entry.advancedCommerce ?? false,
    })),
  );
}

export class CatalogError extends Error {
  override name = 'CatalogError';
}

/** "SUBSCRIBED/INITIAL_BUY", or the type alone when there is no subtype. */
export const eventName = (type: string, subtype: string | null | undefined) =>
  subtype ? `${type}/${subtype}` : type;

/**
 * Finds a type and subtype. `subtype` undefined picks the type's only event, or its event
 * without a subtype; anything else not in the catalog throws a CatalogError naming the choices.
 */
export function findEvent(type: string, subtype?: string | null, from = catalog()): CatalogEvent {
  const upper = type.toUpperCase();
  const all = events(from).filter((event) => event.type === upper);
  if (all.length === 0) {
    throw new CatalogError(
      `Unknown notification type ${type}. Types: ${from.types.map((entry) => entry.type).join(', ')}.`,
    );
  }
  const wanted =
    subtype === undefined ? undefined : subtype === null ? null : subtype.toUpperCase();
  const choices = all.map((event) => event.subtype ?? '(none)').join(', ');
  if (wanted === undefined) {
    const only = all.length === 1 ? all[0] : all.find((event) => event.subtype === null);
    if (only) return only;
    throw new CatalogError(`${upper} needs a subtype: ${choices}.`);
  }
  const match = all.find((event) => event.subtype === wanted);
  if (!match) {
    throw new CatalogError(
      `${upper} has no subtype ${wanted ?? '(none)'}. Subtypes of ${upper}: ${choices}.`,
    );
  }
  return match;
}
