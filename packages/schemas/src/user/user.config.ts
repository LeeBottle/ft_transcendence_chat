import type {
  BaseStringFieldConfig,
  ExchangeValidationOptions,
  RegexStringFieldConfig,
} from '#common/types.js';
import { projectInnerProperty } from '#common/utils.js';

/*  요청 & 응답 공용 */

const LOGIN_ID_MIN_LENGTH = 5;
const LOGIN_ID_MAX_LENGTH = 20;
const LOGIN_ID_FULL_REGEX = /^(?=.*[a-z])(?=.*\d)[a-z0-9_]+$/; // 영문 소문자(최소 1자), 숫자(최소 1자) 조건 추가

export const LOGIN_ID_ALLOWED_REGEX = /^[a-z0-9_]+$/; // For UX. 영문 소문자, 숫자, 언더바(_).

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 50;
/**
 * 한글 이름은 외국인 한글 성명 표기 고려하여 공백도 허용\
 * 영문 이름은 공백, 하이픈(-), 아포스트로피(') 허용
 */
const NAME_FULL_REGEX = /^(?:[가-힣]+(?: [가-힣]+)*|[a-zA-Z]+(?:[ '-][a-zA-Z]+)*)$/;

const EMAIL_MAX_LENGTH = 254;

/* 응답 전용 */

// TODO: 추후 프로필 이미지 경로 구조 확정시 최소 길이 및 정규표현식 수정
const PROFILE_IMAGE_PATH_MIN_LENGTH = 5; // 임시: 파일명 최소 1자 + '.' + 확장자 최소 3자 = 5자
const PROFILE_IMAGE_PATH_MAX_LENGTH = 255;
const PROFILE_IMAGE_PATH_FULL_REGEX = /^(?!\/)(?:(?!\.\.?\/)[^/\0]+\/)*[^/\0]+\.[a-zA-Z0-9]+$/;

interface UserValidationOptionMap {
  /*  요청 & 응답 공용 */
  readonly loginId: ExchangeValidationOptions;
  readonly name: ExchangeValidationOptions;
  readonly email: ExchangeValidationOptions;

  /* 응답 전용 */
  readonly profileImagePath: ExchangeValidationOptions<'response'>;
}

/** 사용자 관련 필드 검증 동작 제어 옵션 */
const USER_VALIDATION_OPTIONS = {
  /* 요청 & 응답 공용 */
  loginId: {
    request: {
      trim: true,
      nonEmpty: true,
      order: ['length', 'regex'],
    },
    response: {
      trim: false,
      nonEmpty: false,
      order: ['length', 'regex'],
    },
  },
  name: {
    request: {
      trim: true,
      nonEmpty: true,
      order: ['length', 'regex'],
    },
    response: {
      trim: false,
      nonEmpty: false,
      order: ['length', 'regex'],
    },
  },
  email: {
    request: {
      trim: true,
      nonEmpty: true,
      order: ['length', 'email'],
    },
    response: {
      trim: false,
      nonEmpty: false,
      order: ['length', 'email'],
    },
  },

  /* 응답 전용 */
  profileImagePath: {
    response: {
      trim: false,
      nonEmpty: false,
      nullable: true,
      order: ['length', 'regex'],
    },
  },
} as const satisfies UserValidationOptionMap;

export const USER_REQUEST_VALIDATION_OPTIONS = projectInnerProperty(
  USER_VALIDATION_OPTIONS,
  'request',
);

export const USER_RESPONSE_VALIDATION_OPTIONS = projectInnerProperty(
  USER_VALIDATION_OPTIONS,
  'response',
);

interface UserConfigMap {
  /*  요청 & 응답 공용 */
  readonly loginId: RegexStringFieldConfig;
  readonly name: RegexStringFieldConfig;
  readonly email: BaseStringFieldConfig;

  /* 응답 전용 */
  readonly profileImagePath: RegexStringFieldConfig;
  readonly id: RegexStringFieldConfig;
}

export const USER_CONFIGS = {
  /*  요청 & 응답 공용 */
  loginId: {
    constraints: {
      minLength: LOGIN_ID_MIN_LENGTH,
      maxLength: LOGIN_ID_MAX_LENGTH,
      fullRegex: LOGIN_ID_FULL_REGEX,
    },
    messages: {
      empty: '아이디를 입력해 주세요.',
      length: `아이디는 ${LOGIN_ID_MIN_LENGTH}~${LOGIN_ID_MAX_LENGTH}자여야 합니다.`,
      format: '아이디는 영문 소문자(최소 1자), 숫자(최소 1자), 언더바(_)로만 구성되어야 합니다.',
    },
  },
  name: {
    constraints: {
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
      fullRegex: NAME_FULL_REGEX,
    },
    messages: {
      empty: '이름을 입력해 주세요.',
      length: `이름은 ${NAME_MIN_LENGTH}~${NAME_MAX_LENGTH}자여야 합니다.`,
      format:
        "이름은 한글(공백 포함 가능) 또는 영문(공백, -, ' 포함 가능)으로만 구성되어야 합니다.",
    },
  },
  email: {
    constraints: {
      maxLength: EMAIL_MAX_LENGTH,
    },
    messages: {
      format: '올바른 이메일 형식이 아닙니다.',
    },
  },

  /* 응답 전용 */
  profileImagePath: {
    constraints: {
      minLength: PROFILE_IMAGE_PATH_MIN_LENGTH,
      maxLength: PROFILE_IMAGE_PATH_MAX_LENGTH,
      fullRegex: PROFILE_IMAGE_PATH_FULL_REGEX,
    },
    messages: {
      empty: '프로필 이미지 경로가 빈 문자열입니다.',
      length: `프로필 이미지 경로는 ${PROFILE_IMAGE_PATH_MIN_LENGTH}~${PROFILE_IMAGE_PATH_MAX_LENGTH}자여야 합니다.`,
      format:
        '올바른 Linux 상대 경로 및 파일명(확장자 포함) 형식이 아닙니다. (예: profile/2026/08/01/photo.png)',
    },
  },
  id: {
    constraints: {
      maxLength: 19, // 2^63 - 1 = 9,223,372,036,854,775,807 (19자리) // 형식 맞추기용
      fullRegex: /^[1-9]\d+$/,
    },
    messages: {}, // 형식 맞추기용
  },
} as const satisfies UserConfigMap;
