# 1. 개요

채팅 회의 & AI 자동 태스크 추출

## 2. 개발 환경 구성

### 2-1. Volta 설치

- `https://volta.sh/`
- 설치 후 깃 클론한 레포지토리 접속(터미널 cd)하면 자동으로 pnpm
  11.17.0, node 24.18.0 설치됨

### 2-2. 패키지 설치

- 프로젝트 루트에서 `pnpm install`

### 2-3. .vscode/settings.json 설정

1. 기존에 개인적으로 사용하던 설정이 있다면
   `.vscode/settings.local.jsonc`에 복사 (없으면 이 파일 생성할 필요
   없이 다음 절차 진행)
2. 모노레포 루트에서 `pnpm vscode:merge-settings` 실행
3. 개인 설정(`.vscode/settings.local.jsonc`), 팀 공유
   설정(`.vscode/settings.shared.json`)이 합쳐져 `.vscode/settings.json`
   생성됨 (개인 설정이 공유 설정을 덮어쓰는 구조(중복 설정 존재시))

## 3. 전체 디렉토리 구조

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
│   └── web : 프론트엔드(Next.js) 모음
├── infra : 환경 변수 파일, 도커 및 도커 컴포즈 파일
├── packages : 프론트/백 공용 사용자 정의 패키지 모음
│   ├── build-tools : 공용 패키지 빌드 설정 모음
│   ├── constants : 각 모듈별 상수 (enum 성격의 객체 등)
│   ├── schemas : 각 모듈별 Zod 스키마 (API 요청/응답 객체 구조 및 검증)
│   └── ui : dummy (추후 삭제 예정)
└── scripts : 개발용 스크립트
```
