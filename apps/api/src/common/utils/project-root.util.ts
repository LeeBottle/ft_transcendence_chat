import fs from 'node:fs';
import path from 'node:path';

const API_PROJECT_ROOT = getApiProjectRoot();

export function resolveFromProjectRoot(...paths: string[]): string {
  return path.join(API_PROJECT_ROOT, ...paths);
}

//  NestJS 애플리케이션(api/)의 최상위 절대 경로 반환
function getApiProjectRoot(): string {
  let currentDir = import.meta.dirname;
  const systemRoot = path.parse(currentDir).root;

  while (currentDir !== systemRoot) {
    const hasPackageJson = fs.existsSync(path.join(currentDir, 'package.json'));

    if (hasPackageJson) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  throw new Error('[getApiProjectRoot] Unable to find project root (package.json missing).');
}
