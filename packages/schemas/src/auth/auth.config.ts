import type {
  BaseStringFieldConfig,
  ExchangeValidationOptions,
  RegexStringFieldConfig,
} from '#common/types.js';
import { projectInnerProperty } from '#common/utils.js';

// export const LOGIN_FAIL_MESSAGE = '아이디 또는 비밀번호가 일치하지 않습니다.';

/* 요청 전용 */

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;
const PASSWORD_FULL_REGEX = /^[\x20-\x7E]+$/; // printable ASCII

export const PASSWORD_ALLOWED_REGEX = PASSWORD_FULL_REGEX; // For UX

interface AuthValidationOptionMap {
  /* 요청 전용 */
  readonly password: ExchangeValidationOptions<'request'>;
  readonly passwordConfirm: ExchangeValidationOptions<'request'>;
}

/** 인증 관련 필드 검증 동작 제어 옵션 */
const AUTH_VALIDATION_OPTIONS = {
  /* 요청 전용 */
  password: {
    request: {
      trim: false,
      nonEmpty: true,
      order: ['length', 'regex'],
    },
  },
  passwordConfirm: {
    request: {
      trim: false,
      nonEmpty: true,
      order: [],
    },
  },
} as const satisfies AuthValidationOptionMap;

export const AUTH_REQUEST_VALIDATION_OPTIONS = projectInnerProperty(
  AUTH_VALIDATION_OPTIONS,
  'request',
);

// export const AUTH_RESPONSE_VALIDATION_OPTIONS = projectInnerProperty(
//   AUTH_VALIDATION_OPTIONS,
//   'response',
// );

interface AuthConfigMap {
  /* 요청 전용 */
  readonly password: RegexStringFieldConfig;
  readonly passwordConfirm: BaseStringFieldConfig;
}

export const AUTH_CONFIGS = {
  /* 요청 전용 */
  password: {
    constraints: {
      minLength: PASSWORD_MIN_LENGTH,
      maxLength: PASSWORD_MAX_LENGTH,
      fullRegex: PASSWORD_FULL_REGEX,
    },
    messages: {
      empty: '비밀번호를 입력해 주세요.',
      length: `비밀번호는 ${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자여야 합니다.`,
      format: '비밀번호는 영문 대소문자, 숫자, 특수문자, 공백으로만 구성되어야 합니다.',
    },
  },
  passwordConfirm: {
    messages: {
      empty: '비밀번호 확인을 입력해 주세요.',
    },
  },
} as const satisfies AuthConfigMap;
