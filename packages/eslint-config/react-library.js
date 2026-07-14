// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { baseConfig, GLOBAL_TARGET_FILES, TS_TARGET_FILES } from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export const reactLibraryConfig = [
  ...baseConfig,

  {
    files: GLOBAL_TARGET_FILES,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
  },
  {
    files: GLOBAL_TARGET_FILES,
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
  },

  {
    files: TS_TARGET_FILES,
    rules: {
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableString: true,
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
