# ft_transcendence

## 1. 개요

채팅 회의 & AI 자동 태스크 추출

## 2. 프로덕션 환경 구성

### 2-1. Run provisioning script

- Run `make setup-host` only

### 2-2. Docker compose 및 각 컨테이너 관리

- See `./infra/README.md`

## 3. 개발 환경 구성

### 3-1. Volta 설치 (터미널 전역 설치)

- `https://volta.sh/`
- 설치 후 깃 클론한 레포지토리 접속(터미널 cd)하면 자동으로 pnpm
  11.17.0, node 24.18.0 설치됨

### 3-2. 패키지 설치 (모노레포 내부 (이하 동일))

프로젝트 루트에서 `pnpm install`

### 3-3. .vscode/settings.json 설정

1. 기존에 개인적으로 사용하던 설정이 있다면
   `.vscode/settings.local.jsonc`에 복사 (없으면 이 파일 생성할 필요
   없이 다음 절차 진행)
2. 모노레포 루트에서 `pnpm vscode:merge-settings` 실행
3. 개인 설정(`.vscode/settings.local.jsonc`), 팀 공유
   설정(`.vscode/settings.shared.json`)이 합쳐져 `.vscode/settings.json`
   생성됨 (개인 설정이 공유 설정을 덮어쓰는 구조(중복 설정 존재시))

### 3-4. .vscode/extensions.json

여기 있는 익스텐션 반드시 모두 설치

## 4. 모노레포 루트 package.json scripts

### 4-1. pnpm cleanup:artifacts

빌드 결과물, 캐시 모두 제거

### 4-2. pnpm cleanup:node_modules

node_modules 모두 제거

### 4-3. pnpm cleanup:all

빌드 결과물, 캐시, node_modules 모두 제거

### 4-4. pnpm dev

- 개발 모드. 코드 변경 사항을 실시간 반영. 개발시 이 명령을 실행시켜놓고
  하는걸 매우 권장.
- 코드 변경 사항 있거나, 최초 실행시에는 반드시 `pnpm build` 수행이
  선행되어야함

### 4-5. pnpm build

모노레포 전체 패키지 빌드

### 4-6. pnpm validate

모노레포 전체 코드 타입 체크, 린트, 포맷 검사

### 4-7. pnpm fix

모노레포 전체 코드 린트, 포맷 규칙을 준수하도록 코드 수정

### 4-8. pnpm vscode:merge-settings

1. [선택사항] `.vscode/settings.local.jsonc`에 개인 VS Code 설정 작성
2. 이 명령어 실행
3. 팀 공통 설정인 `.vscode/settings.shared.json`과 개인 설정인
   `.vscode/settings.local.jsonc`가 병합되어 `.vscode/settings.json`가
   생성됨

## 5. 전체 디렉토리 구조

```text
.
├── .vscode
│   ├── extensions.json
│   ├── settings.shared.json
│   └── tasks.json
├── apps
│   ├── api : 백엔드(NestJS)
│   │   ├── src
│   │   │   ├── app.module.ts : 모듈 의존성 그래프 최상위 모듈
│   │   │   ├── common : 각 모듈 공통 사용 코드
│   │   │   │   ├── decorators
│   │   │   │   ├── exceptions
│   │   │   │   ├── filters
│   │   │   │   ├── interceptors
│   │   │   │   ├── pipes
│   │   │   │   └── utils
│   │   │   ├── config : 환경변수 검증
│   │   │   ├── database : TypeORM DB 설정
│   │   │   ├── main.ts : 서버 실행부
│   │   │   └── modules
│   │   │       ├── auth : 인증/인가 (e.g., 로그인, 회원가입)
│   │   │       ├── calendar : 캘린더 페이지 기능
│   │   │       ├── chat : 채팅(방, 멤버, 채팅 태스크, )
│   │   │       └── user : 유저 프로필 관리, 정보 수정 등
│   │   └── uploads : 서버 데이터(e.g., 유저 프로필 사진) 저장 루트
│   └── web : 프론트엔드(Next.js)
├── infra : 환경 변수 파일, 도커 및 도커 컴포즈 파일
├── packages : 프론트/백 공용 사용자 정의 패키지 모음
│   ├── build-tools : 공용 패키지 빌드 설정 모음
│   ├── constants : 각 모듈별 상수 (enum 성격의 객체 등)
│   ├── schemas : 각 모듈별 Zod 스키마 (API 요청/응답 객체 구조 및 검증)
│   └── ui : dummy (추후 삭제 예정)
└── scripts : 개발용 스크립트
```

### 5-1. apps

- api: 백엔드 NestJS
- web: 프론트엔드 Next.js

### 5-2. infra

- 개발/프로덕션 환경 공용 환경변수 파일
- 프로덕션 환경용 환경 변수 파일
- 도커 컴포즈 구성
- NGINX, MySQL, Redis 설정 파일
- 인프라 환경 구성 스크립트 파일

### 5-3. packages

- 프론트엔드/백엔드 공유 패키지들
