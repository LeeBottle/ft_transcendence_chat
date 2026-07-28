import { z } from 'zod';

import { DatabaseEnvError } from './exceptions/environment-validation.error.js';

const PORT_ERROR = '[1, 65535] 범위의 유효한 정수 포트 번호여야 합니다(빈 문자열 허용 불가).';

export const databaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce
    .number({ error: (issue) => `${PORT_ERROR} received '${String(issue.input)}'` }) // 이후부터 isssue.input은 number로 변환된 이후의 값 (원본값 아님)
    .int()
    .min(1)
    .max(65535)
    .default(3306),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SCHEMA_NAME: z.string().min(1),

  DB_MAX_QUERY_EXECUTION_TIME_MS: z.coerce.number().int().min(1).optional(),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

// Only TypeORM CLI
export function parseDatabaseEnv(config: Record<string, unknown>): DatabaseEnv {
  const result = databaseEnvSchema.safeParse(config);

  if (!result.success) {
    const errorDetails = JSON.stringify(z.treeifyError(result.error), null, 2);

    throw new DatabaseEnvError(errorDetails);
  }

  return result.data;
}
