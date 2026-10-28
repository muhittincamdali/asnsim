import { describe, expect, it } from 'vitest';
import { addDuration, DurationError, isDuration, parseDuration } from '../../src/sim/duration.js';
import { createRandom } from '../../src/sim/random.js';

describe('parseDuration', () => {
  it('reads the forms Apple and scenarios use', () => {
    expect(parseDuration('P1M')).toMatchObject({ months: 1, days: 0 });
    expect(parseDuration('P1Y2M3W4DT5H6M7S')).toEqual({
      years: 1,
      months: 2,
      weeks: 3,
      days: 4,
      hours: 5,
      minutes: 6,
      seconds: 7,
    });
    expect(parseDuration('PT5M').minutes).toBe(5);
  });

  it('rejects other text and zero durations', () => {
    for (const text of ['', 'P', 'PT', '1M', 'P1.5M', 'P0D', 'P1DT', 'p1m']) {
      expect(() => parseDuration(text)).toThrow(DurationError);
      expect(isDuration(text)).toBe(false);
    }
  });
});

describe('addDuration', () => {
  it('adds months by calendar and stops at the last day of a shorter month', () => {
    expect(addDuration(new Date('2026-01-31T09:00:00Z'), 'P1M').toISOString()).toBe(
      '2026-02-28T09:00:00.000Z',
    );
    expect(addDuration(new Date('2028-01-31T09:00:00Z'), 'P1M').toISOString()).toBe(
      '2028-02-29T09:00:00.000Z',
    );
    expect(addDuration(new Date('2026-10-15T09:00:00Z'), 'P1Y').toISOString()).toBe(
      '2027-10-15T09:00:00.000Z',
    );
    expect(addDuration(new Date('2026-12-15T00:00:00Z'), 'P1M').toISOString()).toBe(
      '2027-01-15T00:00:00.000Z',
    );
  });

  it('adds weeks, days and times exactly, and can repeat', () => {
    expect(addDuration(new Date('2026-10-01T00:00:00Z'), 'P1W').toISOString()).toBe(
      '2026-10-08T00:00:00.000Z',
    );
    expect(addDuration(new Date('2026-10-01T00:00:00Z'), 'P1DT12H').toISOString()).toBe(
      '2026-10-02T12:00:00.000Z',
    );
    expect(addDuration(new Date('2026-10-01T00:00:00Z'), 'P3D', 2).toISOString()).toBe(
      '2026-10-07T00:00:00.000Z',
    );
  });
});

describe('createRandom', () => {
  it('repeats with a seed and differs across seeds', () => {
    const a = createRandom('seed');
    const b = createRandom('seed');
    expect([a.digits(16), a.uuid(), a.digits(40)]).toEqual([b.digits(16), b.uuid(), b.digits(40)]);
    expect(createRandom('other').digits(16)).not.toBe(createRandom('seed').digits(16));
  });

  it('writes digits that do not start with 0 and version 4 UUIDs', () => {
    const random = createRandom();
    for (let index = 0; index < 50; index++) {
      expect(random.digits(16)).toMatch(/^[1-9]\d{15}$/);
      expect(random.uuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });
});
