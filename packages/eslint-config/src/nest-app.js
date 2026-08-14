// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import {
  baseConfig,
  commonRestrictedImportPatterns,
  GLOBAL_TARGET_FILES,
  TS_TARGET_FILES,
} from './base.js';

export const nestAppConfig = defineConfig([
  ...baseConfig,

  {
    files: GLOBAL_TARGET_FILES,
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...commonRestrictedImportPatterns,
            {
              group: ['..', '../**', '**/..', '**/../**'],
              message:
                '부모 디렉토리 참조(../)는 의존성 파악을 훼손합니다. ' +
                'package.json의 `imports` 표준인 `#` 기반의 경로 별칭 사용하십시오.',
            },
          ],
        },
      ],
    },
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
]);
