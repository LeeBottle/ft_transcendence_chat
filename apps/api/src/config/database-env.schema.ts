import { z } from 'zod';

import { createHostSchema, createPortSchema, nodeEnvSchema } from './api-env.schema.js';
import { DatabaseEnvError } from './exceptions/environment-validation.error.js';

export const databaseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,

  DB_HOST: createHostSchema({ default: '127.0.0.1' }),
  DB_PORT: createPortSchema({ default: 3306 }),
  DB_USERNAME: z.string().min(1).max(32),
  DB_PASSWORD: z.string().min(1).max(256),
  DB_SCHEMA_NAME: z.string().min(1).max(64),
  DB_MAX_QUERY_EXECUTION_TIME_MS: z.coerce.number().int().min(1).max(1000).optional(),
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export const dbEnv = parseDatabaseEnv(process.env);

function parseDatabaseEnv(config: Record<string, unknown>): DatabaseEnv {
  const result = databaseEnvSchema.safeParse(config);

  if (!result.success) {
    const errorDetails = JSON.stringify(z.treeifyError(result.error), null, 2);

    throw new DatabaseEnvError(errorDetails);
  }

  return result.data;
}
