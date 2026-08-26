// @ts-check

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,ts,tsx,json,sh,yaml,md,html,css}': ['prettier --write'],
};
