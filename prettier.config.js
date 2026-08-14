// @ts-check

/** @type {import('prettier').Config} */
const config = {
  printWidth: 100,
  singleQuote: true,
  singleAttributePerLine: true, // HTML 태그에 여러 속성이 붙을 경우 한 줄에 하나씩 배치

  plugins: [
    // RUST 기반 고성능 Oxc 파서 설정 (파서 교체형 - Overwrite)
    // '@ianvs/prettier-plugin-sort-imports' 보다 반드시 앞에 와야함
    // '@prettier/plugin-oxc',

    '@ianvs/prettier-plugin-sort-imports', // (파서 확장형 - Wrapping)
    'prettier-plugin-packagejson',
    'prettier-plugin-sh',
    'prettier-plugin-jsdoc',
    'prettier-plugin-tailwindcss', // 활성화 시 반드시 배열의 최하단(마지막)에 위치해야 함
  ],

  // '@ianvs/prettier-plugin-sort-imports' 설정
  importOrderTypeScriptVersion: '5.9.2',
  importOrderParserPlugins: [
    // 1. 핵심 언어 기반 인프라
    'typescript',
    'jsx',
    'classProperties',

    // 2. NestJS 아키텍처 스펙
    'decorators-legacy',

    // 3. 최신 ECMAScript 표준 스펙 (Modern ES)
    'importAttributes',
  ],
  importOrder: [
    '^node:',
    '<BUILTIN_MODULES>',
    '',
    '^react($|-)',
    '^@react-',
    '',
    '^next($|/)',
    '^next-',
    '^@next/',
    '',
    '^@nestjs/', // 공식 코어
    '^@nestjs-', // 공인 확장팩
    '^nestjs-',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@repo/',
    '',
    '^#',
    '',
    '^[.]',
  ],

  tsdoc: true,
  jsdocPreferCodeFences: true,
  jsdocSeparateReturnsFromParam: true,

  overrides: [
    {
      files: ['**/*.css', '**/*.{yaml,yml}'],
      options: { singleQuote: false },
    },
    {
      files: ['**/*.jsonc'],
      options: { trailingComma: 'none' },
    },
    {
      files: ['**/*.md'],
      options: { printWidth: 72, proseWrap: 'always' },
    },
  ],
};

export default config;
