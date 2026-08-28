import { z } from 'zod';

import { createDurationSchema } from '#common/schemas/duration.schema.js';

import { ApiEnvError } from './exceptions/environment-validation.error.js';

export const nodeEnvSchema = z.enum(['development', 'production', 'test']).default('development');
export type NodeEnv = z.infer<typeof nodeEnvSchema>;

type CreatePortSchemaOptions = { default: number };

const PORT_ERROR = '[1, 65535] 범위의 유효한 정수 포트 번호여야 합니다(빈 문자열 허용 불가).';

export function createPortSchema(
  options: CreatePortSchemaOptions,
): z.ZodDefault<z.ZodCoercedNumber> {
  const { default: defaultPort } = options;

  return z.coerce
    .number({ error: (issue) => `${PORT_ERROR} (received: '${String(issue.input)}')` }) // 이후부터 issue.input은 number로 변환된 이후의 값 (원본값 아님)
    .int()
    .min(1)
    .max(65535)
    .default(defaultPort);
}

type CreateHostSchemaOptions = { default: string };

export function createHostSchema(options: CreateHostSchemaOptions): z.ZodDefault<z.ZodString> {
  const { default: defaultHost } = options;

  return z
    .string()
    .min(1)
    .max(255)
    .default(defaultHost)
    .refine((val) => val !== 'localhost', {
      error: "DB_HOST cannot be 'localhost'. Use '127.0.0.1' or a valid IP/domain instead.",
    });
}

// DB 환경변수 이외의 것들
const apiEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema,

    PORT: createPortSchema({ default: 4000 }),
    CLIENT_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3000'),
    UPLOAD_BASE_DIR: z.string().min(1).default('uploads'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(12).default(10),

    JWT_ACCESS_SECRET: z.string().min(32).max(64),
    JWT_REFRESH_SECRET: z.string().min(32).max(64),

    JWT_ACCESS_EXPIRATION: createDurationSchema({ minMsStr: '5m', maxMsStr: '1h' }).default('15m'),
    JWT_REFRESH_EXPIRATION: createDurationSchema({ minMsStr: '1d', maxMsStr: '30d' }).default('7d'),

    REDIS_HOST: createHostSchema({ default: '127.0.0.1' }),
    REDIS_PORT: createPortSchema({ default: 6379 }),
    REDIS_PASSWORD: z.string().min(1).max(256),
  })
  .readonly();

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(config: Record<string, unknown>): ApiEnv {
  const result = apiEnvSchema.safeParse(config);

  if (!result.success) {
    const errorDetails = JSON.stringify(z.treeifyError(result.error), null, 2);

    throw new ApiEnvError(errorDetails);
  }

  return result.data;
}
