// src/common/pipes/zod-validation.pipe.ts
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Optional,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';

import type { ZodError, ZodType } from 'zod';

interface ZodDtoClass {
  schema: ZodType;
}

interface FormattedValidationError {
  field: string;
  message: string;
  code: string;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly schema?: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const targetSchema = this.resolveSchema(metadata);

    // 검증 대상 스키마가 없으면 원본 데이터 바이패스
    if (targetSchema === null) {
      return value;
    }

    const parseResult = targetSchema.safeParse(value);

    if (!parseResult.success) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Request validation failed',
        errors: formatZodError(parseResult.error),
      });
    }

    // Zod 변환(transform, coerce, strip)이 적용된 순수 데이터 반환
    return parseResult.data;
  }

  private resolveSchema(metadata: ArgumentMetadata): ZodType | null {
    // 파이프 생성자에 직접 주입된 스키마 우선 적용
    if (this.schema !== undefined) {
      return this.schema;
    }

    // createZodDto로 생성된 DTO의 static schema 추출
    if (isZodDto(metadata.metatype)) {
      return metadata.metatype.schema;
    }

    return null;
  }
}

function isZodDto(metatype: unknown): metatype is ZodDtoClass {
  return (
    typeof metatype === 'function' &&
    'schema' in metatype &&
    typeof (metatype as Partial<ZodDtoClass>).schema?.safeParse === 'function'
  );
}

function formatZodError(error: ZodError): FormattedValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message,
    code: issue.code,
  }));
}
