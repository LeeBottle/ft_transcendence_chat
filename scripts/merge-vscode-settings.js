import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vscodeDir = path.resolve(__dirname, '../.vscode');

const sharedPath = path.join(vscodeDir, 'settings.shared.json');
const localPath = path.join(vscodeDir, 'settings.local.jsonc');
const targetPath = path.join(vscodeDir, 'settings.json');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const cleanContent = content.replace(
      /("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      (match, stringGroup) => {
        // 큰따옴표로 감싸진 문자열 내부에서 발견된 '/*' 나 '//' 는 지우지 않고 원본 그대로 반환
        if (stringGroup) {
          return stringGroup;
        }

        // 문자열 밖에서 발견된 진짜 주석은 빈 문자열('')로 치환하여 삭제
        return '';
      },
    );

    return JSON.parse(cleanContent || '{}');
  } catch (error) {
    console.error(`[Warn] ${filePath} 파싱 실패:`, error.message);

    return {};
  }
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

const sharedSettings = readJson(sharedPath);
const localSettings = readJson(localPath);

const finalSettings = deepMerge(sharedSettings, localSettings);

fs.writeFileSync(targetPath, JSON.stringify(finalSettings, null, 2), 'utf-8');
console.log('✅ .vscode/settings.json 파일이 성공적으로 병합 및 갱신되었습니다.');
