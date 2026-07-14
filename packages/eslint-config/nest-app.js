// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';

import { baseConfig, GLOBAL_TARGET_FILES, TS_TARGET_FILES } from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export const nestAppConfig = [
  ...baseConfig,

  globalIgnores(['eslint.config.mjs']),

  {
    files: GLOBAL_TARGET_FILES,
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: TS_TARGET_FILES,
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error', // export 되는 함수나 클래스 메서드는 무조건 리턴 타입 명시
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableObject: false,
          allowNumber: false,
        },
      ],
    },
  },

  eslintConfigPrettier,
  {
    files: GLOBAL_TARGET_FILES,
    rules: { curly: ['error', 'all'] }, // 조건/반복문 중괄호 강제
  },
];
