# packages: 모노레포 공유 패키지 모음

## 1. @repo/build-tools

- 빌드 도구 관련 설정, 유틸 등

## 2. [중요] @repo/constants

- 백엔드 각 모듈 Entity 클래스에 사용된 상수 객체들
- 외부에서 import 방식은 package.json의 exports 참고

## 3. @repo/eslint-config

- eslint 설정 파일 관리 패키지

## 4. [중요] @repo/schemas

- API 요청/응답 zod 스키마 및 스키마 검증 설정들
- 외부에서 import 방식은 package.json의 exports 참고

## 5. @repo/typescript-config

- tsconfig.json 관리 패키지
