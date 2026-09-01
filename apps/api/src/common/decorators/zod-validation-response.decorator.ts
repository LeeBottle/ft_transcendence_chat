import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import type { z } from 'zod';

export interface ZodDto<TOutput = unknown> {
  new (...args: unknown[]): unknown;
  schema: z.ZodType<TOutput>;
}

export type ZodSchemaInput<TOutput = unknown> = z.ZodType<TOutput> | ZodDto<TOutput>;

export const ZOD_RESPONSE_KEY = 'ZOD_RESPONSE_SCHEMA';

export function ZodValidateResponse<TOutput>(
  schemaOrDto: ZodSchemaInput<TOutput>,
): CustomDecorator<typeof ZOD_RESPONSE_KEY> {
  // DTO 클래스가 전달된 경우 정적 static schema 추출, 스키마면 그대로 사용
  const targetSchema =
    'schema' in schemaOrDto && typeof schemaOrDto.schema === 'object'
      ? schemaOrDto.schema
      : (schemaOrDto as z.ZodType<TOutput>);

  return SetMetadata(ZOD_RESPONSE_KEY, targetSchema);
}
