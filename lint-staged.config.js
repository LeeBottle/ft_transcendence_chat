// @ts-check

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,ts,tsx,json}': ['prettier --write', 'eslint --max-warnings=0'],
  '*.{sh,yaml,md,html,css}': ['prettier --write'],
};
