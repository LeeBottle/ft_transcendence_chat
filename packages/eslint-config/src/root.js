// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { baseConfig, GLOBAL_TARGET_FILES } from './base.js';

export const rootConfig = defineConfig([
  ...baseConfig,

  {
    files: GLOBAL_TARGET_FILES,
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },

  eslintConfigPrettier,
  {
    files: GLOBAL_TARGET_FILES,
    rules: { curly: ['error', 'all'] }, // 조건/반복문 중괄호 강제
  },
]);
