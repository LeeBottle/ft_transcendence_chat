import type { createStringFieldSchema } from './utils.js'; // 순환 참조 없이 TS Doc 링크 생성 위함

/**
 * 기본 문자열 길이 제약 조건
 *
 * @see StringValidationStep
 */
interface BaseStringConstraints {
  readonly minLength?: number;
  readonly maxLength: number;
}

/**
 * 정규표현식 포함 문자열 제약 조건
 *
 * @see StringValidationStep
 */
interface RegexStringConstraints extends BaseStringConstraints {
  readonly fullRegex: RegExp;
}

interface StringErrorMessages {
  /** 빈 문자열 */
  readonly empty?: string;

  /** 길이 범위 벗어남 */
  readonly length?: string;

  /** 정규표현식 패턴 불일치 혹은 기타 형식 불일치 */
  readonly format?: string;
}

export interface BaseStringFieldConfig {
  readonly constraints?: BaseStringConstraints;
  readonly messages: StringErrorMessages;
}

export interface RegexStringFieldConfig extends BaseStringFieldConfig {
  readonly constraints: RegexStringConstraints;
}

export type StringFieldConfig = BaseStringFieldConfig | RegexStringFieldConfig;

/**
 * 문자열 검증 파이프라인 실행 단계
 *
 * 1. BaseStringConstraints, RegexStringConstraints 관련
 *
 * - 'length': minLength, maxLength 검증 단계
 * - 'regex': fullRegex 검증 단계
 *
 * 2. 그 외
 *
 * - 'email': 이메일 형식 검증 단계
 *
 * @remarks
 * BaseStringConstraints 혹은 RegexStringConstraints에\
 * 'length', 'regex', 'email' 이외의 새로운 검증 단계 속성을 추가할 경우,\
 * 실행 순서 제어를 위해 본 유니온 타입에 해당 분류를 반드시 추가해야 합니다.
 * @see StringValidationOptions
 */
export type StringValidationStep = 'length' | 'regex' | 'email';

/**
 * 스키마 생성 시 문자열 검증 동작을 제어하는 옵션
 *
 * @see createStringFieldSchema
 */
export interface StringValidationOptions {
  /** .trim() 추가 여부 */
  readonly trim?: boolean;

  /** 첫 검증 함수로 .min(1) 추가 여부 */
  readonly nonEmpty?: boolean;

  /** .nullable() 추가 여부 */
  readonly nullable?: boolean;

  /**
   * Length와 format 간의 검증 순서 지정
   *
   * @remarks
   * 배열에 포함된 항목만 검증함
   * @see StringValidationStep
   */
  readonly order?: readonly StringValidationStep[];
}

type ExchangeMode = 'request' | 'response' | 'both';

/** ExchangeMode에 따라 대상이 될 프로퍼티 키 유니온을 동적으로 결정하는 헬퍼 타입 */
type ResolveExchangeKeys<Mode extends ExchangeMode> = Mode extends 'both'
  ? Exclude<ExchangeMode, 'both'>
  : Mode;

/** Mode에 따라 request, response 키를 선택적으로 필수(Required) 할당하는 타입 */
export type ExchangeValidationOptions<
  Mode extends ExchangeMode = 'both',
  T = StringValidationOptions,
> = {
  readonly [K in ResolveExchangeKeys<Mode>]: T;
};

export type InnerKeys<T extends object> = {
  [K in keyof T]: NonNullable<T[K]> extends infer U
    ? U extends object
      ? U extends ((...args: never[]) => unknown) | readonly unknown[]
        ? never
        : keyof U
      : never
    : never;
}[keyof T];

/** IDE 툴팁에서 타입을 원형 그대로 평가하여 펼쳐주는 유틸리티 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type SafeIndex<T, P extends PropertyKey> =
  NonNullable<T> extends infer U ? (P extends keyof U ? U[P] : never) : never;

/**
 * 객체/인터페이스 T에서 속성 타입이 객체이고, 그 객체가 P라는 Key를 포함하는 경우만 추출 Value 타입은 P라는 Key의 Value 타입으로 매핑됨
 *
 * @remarks
 * T[K]가 옵셔널 속성이면 최종 Value 타입도 옵셔널로 처리됨
 * @template T 원본 객체 타입 또는 interface, class
 * @template P 추출하고자 하는 대상 속성의 키
 */
export type ProjectInnerProperty<T extends object, P extends PropertyKey> = Prettify<{
  [K in keyof T as SafeIndex<T[K], P> extends never ? never : K]: SafeIndex<T[K], P> extends infer V
    ? undefined extends T[K]
      ? V | undefined
      : V
    : never;
}>;
