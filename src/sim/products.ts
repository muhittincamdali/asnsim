import { z } from 'zod';
import { PRODUCT_TYPES, type ProductType } from '../catalog.js';
import { isDuration } from './duration.js';

// The In-App Purchases a simulated customer can buy. Scenarios declare their own; without them
// asnsim uses DEFAULT_PRODUCTS, two levels of one monthly subscription group plus one product of
// each other type.

export const productSchema = z
  .object({
    id: z.string().min(1).max(200),
    type: z.enum(PRODUCT_TYPES),
    /** Subscription period, ISO 8601 (auto-renewable subscriptions only). */
    period: z.string().refine(isDuration, 'an ISO 8601 duration such as P1M').optional(),
    /** Price in the currency's units, such as 9.99. */
    price: z.number().nonnegative().max(1_000_000),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, 'a three-letter ISO 4217 code such as USD')
      .default('USD'),
    /** subscriptionGroupIdentifier. */
    group: z.string().min(1).max(64).optional(),
    /** Level in the group: 1 is the highest; moving to a lower number is an upgrade. */
    level: z.number().int().positive().max(1000).optional(),
  })
  .refine((product) => product.type !== 'auto-renewable' || product.period !== undefined, {
    message: 'an auto-renewable subscription needs a period such as P1M',
    path: ['period'],
  });

export type ProductInput = z.input<typeof productSchema>;

export interface Product {
  id: string;
  type: ProductType;
  period?: string;
  price: number;
  currency: string;
  group?: string;
  level?: number;
}

export const DEFAULT_GROUP = '21000001';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'com.example.premium.monthly',
    type: 'auto-renewable',
    period: 'P1M',
    price: 9.99,
    currency: 'USD',
    group: DEFAULT_GROUP,
    level: 1,
  },
  {
    id: 'com.example.basic.monthly',
    type: 'auto-renewable',
    period: 'P1M',
    price: 4.99,
    currency: 'USD',
    group: DEFAULT_GROUP,
    level: 2,
  },
  { id: 'com.example.coins.100', type: 'consumable', price: 0.99, currency: 'USD' },
  { id: 'com.example.lifetime', type: 'non-consumable', price: 29.99, currency: 'USD' },
  { id: 'com.example.season.pass', type: 'non-renewing', price: 14.99, currency: 'USD' },
];

/** The price in milliunits, as transactions carry it: 9.99 USD is 9990. */
export const milliunits = (price: number) => Math.round(price * 1000);

/** Normalizes scenario products; subscriptions without a group share the default group. */
export function normalizeProducts(inputs: ProductInput[]): Product[] {
  const products = inputs.map((input) => {
    const parsed = productSchema.parse(input);
    const product: Product = {
      id: parsed.id,
      type: parsed.type,
      price: parsed.price,
      currency: parsed.currency,
    };
    if (parsed.period !== undefined) product.period = parsed.period;
    if (parsed.type === 'auto-renewable') {
      product.group = parsed.group ?? DEFAULT_GROUP;
      product.level = parsed.level ?? 1;
    }
    return product;
  });
  const ids = new Set<string>();
  for (const product of products) {
    if (ids.has(product.id)) throw new Error(`Product ${product.id} is declared twice`);
    ids.add(product.id);
  }
  return products;
}
