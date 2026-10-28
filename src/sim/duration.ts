// ISO 8601 durations as Apple writes them (offerPeriod "P1M", "P3D") and as scenarios use them
// for subscription periods and the time between steps.

export interface Duration {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const PATTERN =
  /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export class DurationError extends Error {
  override name = 'DurationError';
}

/** Parses "P1M", "P1Y", "P7D", "P1W", "PT5M" and combinations such as "P1DT12H". */
export function parseDuration(text: string): Duration {
  const match = PATTERN.exec(text);
  if (!match || text === 'P' || text.endsWith('T')) {
    throw new DurationError(
      `${JSON.stringify(text)} is not an ISO 8601 duration such as P1M or P7D`,
    );
  }
  const [, years, months, weeks, days, hours, minutes, seconds] = match.map((part) =>
    part === undefined ? 0 : Number(part),
  ) as number[];
  const duration = {
    years: years ?? 0,
    months: months ?? 0,
    weeks: weeks ?? 0,
    days: days ?? 0,
    hours: hours ?? 0,
    minutes: minutes ?? 0,
    seconds: seconds ?? 0,
  };
  if (Object.values(duration).every((value) => value === 0)) {
    throw new DurationError(`${text} is a zero duration`);
  }
  return duration;
}

export const isDuration = (text: string) => {
  try {
    parseDuration(text);
    return true;
  } catch {
    return false;
  }
};

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * Adds a duration in UTC. Months and years keep the day of the month and stop at the month's
 * last day, so 31 January plus one month is 28 or 29 February.
 */
export function addDuration(date: Date, duration: Duration | string, times = 1): Date {
  const d = typeof duration === 'string' ? parseDuration(duration) : duration;
  const result = new Date(date.getTime());
  const months = (d.years * 12 + d.months) * times;
  if (months !== 0) {
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    result.setUTCDate(Math.min(day, daysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
  }
  const milliseconds =
    ((d.weeks * 7 + d.days) * 86_400 + d.hours * 3_600 + d.minutes * 60 + d.seconds) * 1000;
  return new Date(result.getTime() + milliseconds * times);
}
