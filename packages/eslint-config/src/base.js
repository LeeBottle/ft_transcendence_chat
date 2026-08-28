// @type-check

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import turbo from 'eslint-plugin-turbo';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import { GLOBAL_IGNORE_PATTERNS } from './common/eslint.ignore.js';
import { jsonConfig } from './json.js';

const JS_TARGET_FILES = ['**/*.js'];

export const TS_TARGET_FILES = ['**/*.{ts,tsx}'];
export const JS_TS_TARGET_FILES = [...JS_TARGET_FILES, ...TS_TARGET_FILES];

const commonRestrictedSyntax = [
  {
    selector: 'ForInStatement',
    message:
      'for...in 루프는 프로토타입 체인을 순회하므로 금지합니다.\n' +
      '대신 Object.keys()와 for...of 조합을 사용하십시오.',
  },
];

export const commonRestrictedImportPatterns = [
  {
    group: ['@repo/*/*/**', 'api/*/**', 'web/*/**'],
    message: '모노레포의 다른 패키지 내부 파일에 직접 접근 금지.',
  },
  {
    group: ['~*'],
    message:
      '틸드(~) 별칭은 모던 Node.js ESM 표준이 아닙니다. ' +
      'package.json의 `imports` 표준인 `#` 기반의 경로 별칭 사용하십시오.',
  },
];

export const baseConfig = defineConfig([
  globalIgnores(GLOBAL_IGNORE_PATTERNS),

  ...jsonConfig,

  {
    files: JS_TS_TARGET_FILES,
    ...js.configs.recommended,
  },

  // 내부적으로 parser 설정 및 '@typescript-eslint/' plugin 포함
  // js.configs.recommended에서 겹치는 설정들도 off 해줌
  // 전역 files에 .ts, .tsx, .mts, .cts 추가
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: TS_TARGET_FILES,
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: TS_TARGET_FILES,
  })),

  {
    files: JS_TS_TARGET_FILES,
    languageOptions: { sourceType: 'module' },
    rules: {
      complexity: ['warn', { max: 15 }], // 하나의 함수 안에 분기문 15개 초과시 경고

      // switch문 default 분기가 마지막에 반드시 존재해야함
      // 단, switch문 마지막에 `// no default` 추가시 default 분기 의도적 생략 가능
      'default-case': 'error',
      'default-case-last': 'error',

      eqeqeq: ['error', 'always'], // ===, !== 만 사용하도록 강제
      'grouped-accessor-pairs': ['error', 'getBeforeSet'], // getter, setter 인접 강제, getter 먼저 배치
      radix: 'error', // parseInt() 10진수 변환시 10 명시 강제

      // 'no-alert': 'error',
      'no-await-in-loop': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-else-return': ['error', { allowElseIf: false }], // `if (A) { return 1; } else { return 2; }` --> `if (A) return 1; return 2;`
      'no-eval': 'error',
      'no-extend-native': 'error', // JS 내장 객체의 Prototype 오염 방지
      'no-implicit-coercion': ['error', { boolean: true, string: true, number: true }],
      'no-lonely-if': 'error',
      'no-multi-assign': 'error', // 한 줄에 여러 변수 연쇄 할당 금지 (e.g., a = b = c = 1)
      'no-nested-ternary': 'error', // 중첩 삼항 연산자 금지
      'no-new-func': 'error',
      'no-param-reassign': [
        'error',
        {
          props: true, // 파라미터로 전달받은 객체 속성값도 변경 금지
          ignorePropertyModificationsFor: [
            // 별도 상태 관리 툴에서 파라미터로 전달받은 객체 값 수정 필요시 추가할것

            'req',
            'request',
            'res',
            'response',
            'config',

            'socket',
            'client',

            // Array.prototype.reduce() 사용시 누적 객체의 프로퍼티 수정하는 패턴 허용
            'acc',
            'accumulator',
          ],
        },
      ], // 예외 추가해야함
      'no-promise-executor-return': 'error', // Promise 생성자 내부에 return 사용 금지
      'no-restricted-imports': ['error', { patterns: commonRestrictedImportPatterns }],
      'no-restricted-syntax': ['error', ...commonRestrictedSyntax],
      'no-return-assign': 'error',
      'no-sequences': 'error', // 쉼표 연산자 사용하여 여러 표현식 묶기 금지
      'no-unmodified-loop-condition': 'error', // 루프 조건에 사용된 변수에 대해 루프 내에서 상태 변경 로직 누락시 오류
      'no-var': 'error',

      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': 'error', // 콜백 함수 넘길 때는 화살표 함수 강제
      'prefer-const': 'error',
      'prefer-object-spread': 'error', // 객체 전개시 전개 연산자(...) 사용 강제
      'prefer-rest-params': 'error', // JS 레거시 객체인 arguments 사용 금지
      'prefer-spread': 'error', // 배열 풀기에 전개 연산자(...array) 강제
      'prefer-template': 'error', // 문자열 '+' 연산 대신 템플릿 리터럴 쓰도록 강제
      'require-atomic-updates': 'error', // 할당 연산자와 await 섞어 쓰기 금지 (race condition 방지)
      yoda: ['error', 'never'], // 상수나 리터럴을 왼쪽에 두는 것 금지 (e.g., if ('ADMIN' === role))
    },
  },
  {
    files: JS_TS_TARGET_FILES,
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: ['const', 'let'] },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },

        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: 'export', next: '*' },
        { blankLine: 'any', prev: 'export', next: 'export' },

        {
          blankLine: 'always',
          prev: '*',
          next: ['class', 'enum', 'function', 'interface', 'type'],
        },
        {
          blankLine: 'always',
          prev: ['class', 'enum', 'function', 'interface', 'type'],
          next: '*',
        },

        { blankLine: 'always', prev: '*', next: ['return', 'throw'] },
      ],
    },
  },
  {
    files: JS_TS_TARGET_FILES,
    plugins: { turbo },
    rules: { 'turbo/no-undeclared-env-vars': 'error' },
  },
  {
    files: JS_TS_TARGET_FILES,
    plugins: { unicorn },
    rules: {
      'unicorn/prefer-node-protocol': 'error', // node 내장 패키지 import시 앞에 'node:' 강제
      'unicorn/catch-error-name': 'error', // try-catch의 에러 면수명 error, *Error, _, error_ 등(접미사 '_' 허용)으로 강제
      'unicorn/no-await-expression-member': 'error', // await 결과물에서 즉시 속성을 뽑아내는 문법 금지
    },
  },
  {
    files: JS_TS_TARGET_FILES,
    plugins: { import: importPlugin },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',

      // 'import/no-default-export': 'error' // export default가 요구되는 것만 "off"로 예외처리 필요
      'import/no-commonjs': 'error', // CommonJS 금지. ESM 강제.
      'import/no-cycle': 'error',
      'import/no-deprecated': 'warn', // 함수 위에 `/** @deprecated ~~~~ */`와 같은 JSDoc 존재시 import하는 쪽 린터에서 경고 띄움
      'import/no-duplicates': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-extraneous-dependencies': 'error', // 유령 의존성 차단
      'import/no-mutable-exports': 'error', // 모듈 레벨에서 재할당 가능한 변수(let, var)는 export const 강제
      'import/no-named-as-default-member': 'error',
      'import/no-relative-packages': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error', // 파일 시스템 경로를 최소한으로 압축
    },
  },
  {
    files: JS_TS_TARGET_FILES,
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // 'unused-imports/no-unused-imports': 'warn',	// 나중에 husky 설정 후 주석 해제

      // 미사용 import에 대해서도 경고함. But --fix로 수정은 안됨.
      // no-unused-var도 unused-imports 플러그인에 위임하여 no-unused-vars와 no-unused-imports 역할 완벽 분리.
      '@typescript-eslint/no-unused-vars': 'off',

      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: JS_TS_TARGET_FILES,

    // 변수명, 함수명 등에 ASCII 기반의 영문, 숫자, 언더스코어, 달러 기호만 허용하도록 정규식 강제
    // 식별자에 '-' 포함시 문법 오류. 단지 객체 프로퍼티에 허용하기 위해 '-' 추가함
    // 한글 변수명 사용 금지
    rules: { 'id-match': ['error', '^[a-zA-Z0-9_$-]+$', { properties: true }] },
  },
  {
    files: JS_TS_TARGET_FILES,
    rules: {
      // 주석 기호(// 또는 /*) 뒤에 반드시 공백을 1개 이상 두도록 강제
      'spaced-comment': [
        'error',
        'always',
        {
          line: {
            markers: ['/'], // TypeScript의 /// <reference /> 문법은 예외 처리
            exceptions: ['-', '+'], // //--- 처럼 구분선 용도로 쓰는 주석은 예외 처리
          },
          block: {
            markers: ['!'], // /*! 처럼 웹팩 번들링 시 보존해야 하는 JSDoc 마커 예외 처리
            exceptions: ['*'],
            balanced: true, // /* 주석 내용 */ 양쪽에 균형 있게 공백 추가
          },
        },
      ],
    },
  },
  {
    files: ['**/scripts/**/*.{js,ts}'],
    languageOptions: { sourceType: 'module' },
    rules: {
      'no-console': 'off', // 스크립트에서는 console.log 허용
    },
  },

  {
    files: JS_TARGET_FILES,
    ...tseslint.configs.disableTypeChecked,
    rules: { 'max-params': ['error', 5] },
  },

  {
    files: TS_TARGET_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true, // 개별 파일에 맞는 tsconfig.json을 자동 탐색 (상향식) (TS 전용)
        // tsconfigRootDir: process.cwd(), // 탐색 상한선 (TS 전용)
      },
    },
    rules: {
      '@typescript-eslint/max-params': ['error', { max: 6 }],
      'no-restricted-syntax': [
        'error',
        ...commonRestrictedSyntax,
        {
          selector: 'TSEnumDeclaration',
          message:
            'TypeScript enum은 런타임 오버헤드 및 번들링 문제를 유발합니다.\n' +
            '대신 `as const` 객체와 Union 타입을 사용하십시오.',
        },
      ],

      /* 타입 추론 강제 */
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreParameters: true, // 함수 매개변수는 초기값이 있어도 타입 명시 허용
          ignoreProperties: true, // 클래스 속성(DTO, Entity)은 초기값이 있어도 타입 명시 허용
        },
      ],

      /* ESM 최적화 및 의존성 격리 */
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        // 타입 import시 type 키워드 강제
        'error',
        // import/no-duplicates와의 충돌 방지 위해 inline 설정
        // @typescript-eslint/no-import-type-side-effects 에서 단독 type import 시에는 type을 중괄호 밖으로 빼냄
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      /* tseslint.configs.stylisticTypeChecked 내의 생산성 훼손, 런타임 버그 유발 규칙들 OFF */
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { objectLiteralTypeAssertions: 'never' },
      ], // 빈 객체({})를 as로 강제 캐스팅 금지. tsc가 타입 에러 못잡는 런타임 버그 방지.
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/method-signature-style': ['error', 'property'], // 인터페이스에서 함수를 정의시 `method(): void` 형태 대신 `property: () => void` 강제
      '@typescript-eslint/no-extraneous-class': ['error', { allowEmpty: true }],
      '@typescript-eslint/no-loop-func': 'error', // 루프 안에서 함수 선언하고, 그 함수가 루프 스코프 변수 참조하는 행위 차단 (Closure 비동기 참조 버그 방지)
      '@typescript-eslint/no-shadow': 'error', // 상위 스코프에 선언된 변수명을 내부 콜백이나 스코프에서 같은 이름으로 재선언 금지
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
      '@typescript-eslint/prefer-enum-initializers': 'error', // 각 enum 상수에 명시적 값 할당 강제
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: true },
      ],
      '@typescript-eslint/return-await': ['error', 'always'], // async 함수가 Promise를 반환할 때는 무조건 앞에 await 키워드를 붙이도록 강제
      '@typescript-eslint/require-array-sort-compare': 'error', // .sort() 사용시 비교 함수 전달 강제
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },

  eslintConfigPrettier,
  {
    files: JS_TS_TARGET_FILES,
    rules: { curly: ['error', 'all'] }, // 조건/반복문 중괄호 강제
  },
]);
