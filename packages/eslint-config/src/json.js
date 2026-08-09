// @type-check

import json from '@eslint/json';
import eslintConfigPrettier from 'eslint-config-prettier';
import packageJson, { configs as packageJsonConfigs } from 'eslint-plugin-package-json';

/** @type {import("eslint").Linter.Config[]} */
export const jsonConfig = [
  {
    files: ['**/*.json'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    language: 'json/json',
    plugins: { json },
    rules: { 'json/top-level-interop': 'error' }, // 최상위 값이 반드시 객체 or 배열
    ...json.configs.recommended,
  },

  packageJsonConfigs.recommended,
  {
    files: ['**/package.json'],
    plugins: { 'package-json': packageJson },
    rules: {
      'package-json/no-local-dependencies': 'error', // 로컬 파일 경로 의존성 금지
      'package-json/valid-version': 'error', // 유효한 유의적 버전(SemVer) 체크
      'package-json/exports-subpaths-style': ['error', { prefer: 'explicit' }],
    },
  },

  {
    files: [
      '**/tsconfig.json',
      '**/tsconfig.*.json',
      '**/turbo.json',
      '.vscode/{extensions,settings.shared,tasks}.json',
    ],
    language: 'json/jsonc',
  },

  eslintConfigPrettier,
];
