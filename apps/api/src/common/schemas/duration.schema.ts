import { z } from 'zod';

import { parseDurationToMs } from '#common/utils/duration.util.js';

interface DurationValidationOptions {
  readonly minMsStr: string;
  readonly maxMsStr: string;
}

export function createDurationSchema(options: DurationValidationOptions): z.ZodString {
  return z.string().refine((value) => {
    const ms = parseDurationToMs(value);
    const minMs = parseDurationToMs(options.minMsStr);
    const maxMs = parseDurationToMs(options.maxMsStr);

    return ms >= minMs && ms <= maxMs;
  });
}
