import { z } from 'zod';

import { databaseEnvSchema } from './database-env.schema.js';
import { ApiEnvError } from './exceptions/environment-validation.error.js';

const PORT_ERROR = '[1, 65535] 범위의 유효한 정수 포트 번호여야 합니다(빈 문자열 허용 불가).';

// DB 환경변수 이외의 것들
// Backlog: app 환경변수, DB 환경변수간 공통 속성 존재시 오류처리
const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']),

    API_PORT: z.coerce
      .number({ error: (issue) => `${PORT_ERROR} received '${String(issue.input)}'` }) // isssue.input은 number로 변환된 이후의 값 (원본값 아님)
      .int()
      .min(1)
      .max(65535)
      .default(3000),
    CLIENT_URL: z.string().min(1).default('http://localhost:3001'),
    UPLOAD_BASE_DIR: z.string().min(1).default('uploads'),
  })
  .extend(databaseEnvSchema.shape);

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(config: Record<string, unknown>): ApiEnv {
  const result = apiEnvSchema.safeParse(config);

  if (!result.success) {
    const errorDetails = JSON.stringify(z.treeifyError(result.error), null, 2);

    throw new ApiEnvError(errorDetails);
  }

  return result.data;
}
