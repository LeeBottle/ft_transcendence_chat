import type { Options } from 'tsup';

export const baseConfig = {
  entry: ['src/**/*.ts'],
  bundle: false,

  format: ['esm'],
  target: 'es2023',

  outDir: 'dist', // default
  clean: true,
  minify: false,
  sourcemap: true,
  dts: false,
} satisfies Options;
