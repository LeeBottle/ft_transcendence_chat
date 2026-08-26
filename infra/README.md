# infra services

## 1. 기본 사용법

## 1-1. 호스트 인프라 초기 세팅

- `make setup-host` 실행 (필요시 모노레포 루트 기준
  `chmod +x infra/scripts/setup-host.sh` 실행 필요)
- 이후 `make up-build` 실행시 컨테이너 빌드, 실행됨

## 1-2. 컨테이너 관리 (모노레포 루트에서 실행할 것)

- `make up-build` : 백그라운드 컨테이너 실행 (소스코드/설정/환경변수 값
  변경시에만 재빌드)
- `make down` : 컨테이너 및 네트워크 제거 (볼륨 유지)
- `make clean`: 컨테이너, 네트워크 및 [모든 볼륨] 완전 삭제
- `make ps`: 현재 실행 중인 컨테이너 확인
- `make shell`: 현재 실행 중인 컨테이너 내부 환경에 접근 (`c=서비스명`
  인자 필요. e.g., `make shell c=db`)

## 2. db (mysql:8.0)

### 2-1. 개발 환경 (db만 컨테이너인 경우)

[주의사항]

- `sudo systemctl status mysql` 확인하여 mysql이 active라면 inactive로
  전환할 것

[NestJS와 연동]

- 반드시 db 컨테이너가 먼저 실행중이어야 함

- 최초 1회 `pnpm --filter=api migration:run` 실행 (DB에 NestJS에서작성한
  TypeORM 엔티티 클래스를 통해 테이블 생성 및 초기화)
- 이후에는 main 브랜치의 `apps/api/src/database/migrations/`에 파일
  추가될 때마다 `pnpm --filter=api migration:run` 실행할 것

- db 초기화 완료되었으면 NestJS 실행 (`pnpm dev`)

### 2-2. 프로덕션 환경

- `make up-build`만 실행하면 됨
