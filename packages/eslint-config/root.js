// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

import { baseConfig, GLOBAL_TARGET_FILES } from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export const rootConfig = [
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
];
