// @ts-check

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,ts,tsx,sh,json}': ['prettier --write', 'eslint --max-warnings=0'],
  '*.{yaml,md,html,css}': ['prettier --write'],
};
