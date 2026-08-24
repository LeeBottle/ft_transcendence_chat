interface PackageJson {
  exports?: Record<string, unknown> | string;
  [key: string]: unknown;
}

/**
 * Package.json의 exports 객체에서 조건에 맞는 경로 목록을 추출합니다.
 *
 * @remarks
 * - Value가 string인 경우 -> 해당 값 추가
 * - Value가 객체이고 'types' 키(string 타입)가 존재하는 경우 -> 'types' 값 추가
 *
 * **주의**:\
 * `tsup.config.ts`에서 `bundle: true`가 설정된 경우에만 사용해야 합니다.\
 * (`bundle: false` 1:1 트랜스파일 환경에서는 사용하지 않음)
 * @example
 *
 * ```
 * import { defineConfig } from 'tsup';
 *
 * import { baseConfig } from '@repo/build-tools/tsup-base';
 * import { resolvePackageEntries } from '@repo/build-tools/tsup-utils';
 *
 * import packageJson from './package.json' with { type: 'json' };
 *
 * export default defineConfig({ ...baseConfig, entry: resolvePackageEntries(packageJson) });
 * ```
 */
export function resolvePackageEntries(pkg: PackageJson): string[] {
  const exportsField = pkg.exports;

  if (!exportsField) {
    return [];
  }

  // 단일 문자열로 정의된 예외 케이스 처리 ("exports": "./dist/index.js")
  if (typeof exportsField === 'string') {
    return [exportsField];
  }

  // exports 필드가 객체가 아닌 경우(Array, null 등) 방어
  if (typeof exportsField !== 'object' || Array.isArray(exportsField)) {
    return [];
  }

  const result: string[] = [];

  for (const value of Object.values(exportsField)) {
    if (typeof value === 'string') {
      result.push(value);
      continue;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      'types' in value &&
      typeof value.types === 'string'
    ) {
      result.push(value.types);
    }
  }

  return result;
}
