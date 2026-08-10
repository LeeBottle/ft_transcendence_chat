import { z } from 'zod';

import type {
  InnerKeys,
  ProjectInnerProperty,
  StringFieldConfig,
  StringValidationOptions,
  StringValidationStep,
} from './types.js';

type StringFieldReturnType<T extends StringValidationOptions> = T['nullable'] extends true
  ? string | null
  : string;

/**
 * StringValidationOptions의 기본값
 *
 * @see StringValidationOptions
 */
const DEFAULT_STRING_VALIDATION_OPTIONS = {
  trim: false,
  nonEmpty: false,
  nullable: false,
  order: [],
} as const satisfies StringValidationOptions;

/**
 * 문자열 검증 스키마를 생성합니다.
 *
 * @remarks
 * 이 함수에서 반환한 스키마 뒤에 검증함수 추가 불가능. \
 * ReDoS 방지 .pipe() 구조를 위해 반환 타입을 z.ZodType<string>로 고정했기 때문. \
 * 해당 기능 필요시 리팩토링 필요.
 *
 * 또한 allowedRegex는 검증하지 않고, fullRegex만 검증.
 *
 * order에 'email' 포함시 강제로 맨 뒷 검증 순서로 지정 (.pipe(z.email()) 구조) \
 * (단 유일하게 'email'만 있는 경우는 예외적으로 .pipe() 없이 z.email())
 *
 * @param config 문자열 필드 설정 객체
 * @param options 검증 동작 제어 옵션
 * @see StringFieldConfig
 * @see StringValidationOptions
 * @see DEFAULT_STRING_VALIDATION_OPTIONS
 */
export function createStringFieldSchema<
  TOptions extends StringValidationOptions = StringValidationOptions,
>(config: StringFieldConfig, options?: TOptions): z.ZodType<StringFieldReturnType<TOptions>> {
  const { constraints, messages } = config;
  const {
    trim = DEFAULT_STRING_VALIDATION_OPTIONS.trim,
    nonEmpty = DEFAULT_STRING_VALIDATION_OPTIONS.nonEmpty,
    nullable = DEFAULT_STRING_VALIDATION_OPTIONS.nullable,
    order = DEFAULT_STRING_VALIDATION_OPTIONS.order,
  } = options ?? {};

  let schema = z.string();

  if (trim) {
    schema = schema.trim();
  }

  if (nonEmpty) {
    schema = schema.min(1, messages.empty);
  }

  const isRegexLast = !order.includes('email') && order.at(-1) === 'regex'; // email이 포함되어 있으면 email은 무조건 마지막에 실행되므로, email 포함 여부를 먼저 확인

  let regexSchema: z.ZodString | undefined;

  // 이 객체 속성값 함수들은 해당 속성이 order에 포함되어 있을 때만 실행됨
  const stepRunners: Record<StringValidationStep, () => void> = {
    length: () => {
      if (!constraints) {
        return;
      }

      const { minLength, maxLength } = constraints;

      schema = schema.max(maxLength, messages.length);

      if (minLength === undefined) {
        return;
      }

      const minThreshold = nonEmpty ? 1 : 0;

      if (minLength > minThreshold) {
        schema = schema.min(minLength, messages.length);
      }
    },
    regex: () => {
      // config에 전달된 객체가 RegexStringConstraints가 아닌 경우
      if (!constraints || !('fullRegex' in constraints)) {
        return; // 여기서 return 하면 regexSchema는 undefined로 남아있음
      }

      let target = isRegexLast ? z.string() : schema;

      target = target.regex(constraints.fullRegex, messages.format);

      if (isRegexLast) {
        regexSchema = target;
      } else {
        schema = target;
      }
    },
    email: () => undefined,
  };

  for (const step of order) {
    stepRunners[step]();
  }

  let finalSchema: z.ZodType<string | null>;

  if (isRegexLast && regexSchema) {
    finalSchema = schema.pipe(regexSchema);
  } else if (order.includes('email')) {
    if (isPureZodString(schema)) {
      finalSchema = z.email(messages.format);
    } else {
      finalSchema = schema.pipe(z.email(messages.format));
    }
  } else {
    finalSchema = schema;
  }

  if (nullable) {
    finalSchema = finalSchema.nullable();
  }

  return finalSchema as z.ZodType<StringFieldReturnType<TOptions>>;
}

/** 순수하게 z.string()으로 생성된 스키마인지 검증하는 함수 */
function isPureZodString(schema: unknown): boolean {
  // 1. null, undefined 및 비객체 안전성 1차 검증
  if (schema === undefined || schema === null || typeof schema !== 'object') {
    return false;
  }

  // 2. Control Flow Analysis가 never로 빠지지 않도록 안전한 구조체 타입으로 캐스팅
  const target = schema as {
    def?: {
      type?: string;
      coerce?: boolean;
      checks?: unknown[];
    };
  };

  // 3. Zod 4.x .def 객체 존재 유무 검증
  if (target.def === undefined) {
    return false;
  }

  // 4. instanceof 체킹 또는 Cross-Realm / Dual Package 대응 AST type 검증
  const isZodString = schema instanceof z.ZodString || target.def.type === 'string';

  if (!isZodString) {
    return false;
  }

  // 5. z.coerce.string() 스키마 제외 (형변환 스키마 방어)
  if (target.def.coerce === true) {
    return false;
  }

  // 6. 추가 체이닝 검증 함수(checks) 존재 여부 검증 (순수 z.string()은 checks가 없거나 빈 배열)
  return (target.def.checks?.length ?? 0) === 0;
}

export function projectInnerProperty<T extends object, const P extends InnerKeys<T>>(
  target: T,
  property: P,
): ProjectInnerProperty<T, P> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(target)) {
    if (value && typeof value === 'object' && property in value) {
      result[key] = (value as Record<string, unknown>)[property];
    }
  }

  return result as ProjectInnerProperty<T, P>;
}

/**
 * .superRefine(), .transform() 내부에서 하위 스키마 검증 (검증 성공 여부 반환) \
 * 검증 실패 시 ctx에 issue를 추가
 */
export function validateNestedSchema(
  ctx: z.RefinementCtx,
  schema: z.ZodType,
  value: unknown,
  path: (string | number)[] = [], // 객체 속성(string), 배열 인덱스(number)
): boolean {
  const result = schema.safeParse(value);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      ctx.addIssue({
        ...issue,
        path: [...path, ...issue.path], // 상위 path와 하위 issue.path를 병합하여 중첩 에러 위치 보존
      });
    });

    return false;
  }

  return true;
}
