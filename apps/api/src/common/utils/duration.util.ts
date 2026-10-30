const DURATION_UNIT_TO_MS = {
  s: 1_000,
  m: 60 * 1_000,
  h: 60 * 60 * 1_000,
  d: 24 * 60 * 60 * 1_000,
  w: 7 * 24 * 60 * 60 * 1_000,
} as const;

type DurationUnit = keyof typeof DURATION_UNIT_TO_MS;

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhdw])$/.exec(value);

  if (match === null) {
    throw new Error('Invalid duration format');
  }

  const [, amountStr, unitStr] = match;

  return Number(amountStr) * DURATION_UNIT_TO_MS[unitStr as DurationUnit];
}
