# infra services

## 1. 기본 사용법

## 1-1. 상태 확인

- docker ps : 현재 실행 중인 컨테이너 목록 출력

## 1-2. 컨테이너 관리 (모노레포 루트에서 실행할 것)

- make up : 백그라운드 컨테이너 실행
- make down : 컨테이너 및 네트워크 제거 (볼륨 유지)
- make clean: 컨테이너, 네트워크 및 [모든 볼륨] 완전 삭제

## 2. db (mysql:8.0)

### 2-1. 개발 환경 주의사항

- `sudo systemctl status mysql` 확인하여 mysql이 active라면 inactive로
  전환할 것

### 2-2. NestJS와 연동

- 반드시 db 컨테이너가 먼저 실행중이어야 함

- 최초 1회 `pnpm --filter=api migration:run` 실행 (DB에 NestJS에서작성한
  TypeORM 엔티티 클래스를 통해 테이블 생성 및 초기화)
- 이후에는 main 브랜치의 `apps/api/src/database/migrations/`에 파일
  추가될 때마다 `pnpm --filter=api migration:run` 실행할 것

- db 초기화 완료되었으면 NestJS 실행 (`pnpm dev`)
