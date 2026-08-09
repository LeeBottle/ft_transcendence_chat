import { z } from 'zod';

import { createPortSchema } from './api-env.schema.js';
import { DatabaseEnvError } from './exceptions/environment-validation.error.js';

const databaseEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']),

    DB_HOST: z.string().min(1),
    DB_PORT: createPortSchema(3306),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_SCHEMA_NAME: z.string().min(1),

    DB_MAX_QUERY_EXECUTION_TIME_MS: z.coerce.number().int().min(1).optional(),
  })
  .readonly();

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
