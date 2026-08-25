# Calendar backend

## 1. 목적

채팅 또는 사용자가 만든 태스크를 사용자별 캘린더에서 관리하는 백엔드
기능이다. 이 문서는 `calendar_module` 브랜치의 설계 기준, API 계약, 구현
순서와 검증 결과를 기록한다.

## 2. MVP 범위

- 인증된 사용자의 캘린더 태스크 생성
- 기간과 상태를 기준으로 한 태스크 목록 조회
- 소유한 태스크의 단건 조회
- 제목과 시작·마감 시각 수정
- 완료 및 완료 취소
- soft delete

다음 기능은 이번 MVP에 포함하지 않는다.

- 반복 일정
- 종일 일정
- 설명, 장소, 참석자 및 공유 권한
- 알림 전송
- 채팅 모듈에서 캘린더 태스크를 자동 생성하는 연동

## 3. API 계약

모든 경로에는 `/api` 전역 prefix가 적용된다.

| Method   | Path                                 | Description                |
| -------- | ------------------------------------ | -------------------------- |
| `POST`   | `/calendar/tasks`                    | 태스크 생성                |
| `GET`    | `/calendar/tasks?from=&to=&status=`  | 기간·상태별 목록 조회      |
| `GET`    | `/calendar/tasks/:taskId`            | 단건 조회                  |
| `PATCH`  | `/calendar/tasks/:taskId`            | 제목 및 일정 수정          |
| `PATCH`  | `/calendar/tasks/:taskId/completion` | 완료 또는 완료 취소        |
| `DELETE` | `/calendar/tasks/:taskId`            | 태스크 soft delete (`204`) |

`userId`는 요청 본문, 경로 또는 쿼리로 받지 않는다. 컨트롤러가 인증된
사용자의 JWT `sub`에서 읽고, 서비스의 모든 조회·수정·삭제는
`taskId + userId` 조건을 함께 사용한다. 존재하지 않는 태스크와 다른
사용자의 태스크는 모두 `404`로 응답하여 리소스 존재 여부를 노출하지
않는다. 모든 요청에는 로그인 응답으로 받은 토큰을 다음처럼 보낸다.

```http
Authorization: Bearer <accessToken>
```

## 4. 시간과 상태 규칙

- API 입력은 시간대가 포함된 ISO 8601 문자열만 허용한다.
- DB 연결은 UTC이며 응답 시각은 `toISOString()`을 사용한 UTC 문자열이다.
- `dueAt`은 `startedAt`보다 빠를 수 없다.
- 목록의 조회 범위는 `[from, to)`이며 조회 종료 시각 `to`는 포함하지
  않는다. 태스크 마감 시각 `dueAt`은 포함하므로 다음 조건으로 겹치는
  일정을 조회한다.

```text
startedAt < to AND dueAt >= from
```

- 따라서 `startedAt === to`인 태스크는 제외하고, `dueAt === from`인
  태스크는 포함한다.
- 정렬은 `startedAt ASC, id ASC`로 고정한다.
- 상태는 DB 컬럼이 아니라 조회 시각을 기준으로 계산한다.
  - `PENDING(1)`: 미완료이고 `startedAt > now`
  - `IN_PROGRESS(2)`: 미완료이고 `startedAt <= now`
  - `COMPLETED(3)`: `completedAt`이 존재함
- 완료·재개 요청은 `{ "completed": true }` 또는
  `{ "completed": false }`만 받고 완료 시각은 서버가 기록한다.
- 동일한 완료 상태를 다시 요청하면 DB를 다시 쓰지 않으며, 기존 완료
  시각도 유지한다.

## 5. 구현 및 검증 기록

| Unit | Implementation                   | Check                | Status |
| ---- | -------------------------------- | -------------------- | ------ |
| 1    | 계획과 API 계약                  | Markdown format      | 완료   |
| 2    | Node 테스트 실행 기반            | test pipeline        | 완료   |
| 3    | 공유 Zod 요청·응답 스키마        | schema tests         | 완료   |
| 4    | Bearer JWT 인증 기반             | auth tests           | 완료   |
| 5    | 인증 사용자 태스크 생성          | service tests        | 완료   |
| 6    | 기간·상태별 목록 조회            | service tests        | 완료   |
| 7    | 소유 태스크 단건 조회            | service tests        | 완료   |
| 8    | 제목·시간 수정                   | service tests        | 완료   |
| 9    | 완료 및 완료 취소                | service tests        | 완료   |
| 10   | soft delete                      | service tests        | 완료   |
| 11   | 기간 조회용 복합 인덱스          | migration test       | 완료   |
| 12   | nullable 단언의 엄격한 검사 전환 | test/type validation | 완료   |
| 13   | 최신 main 통합과 검증 기록       | full validation      | 완료   |
| 14   | Docker DB/API 스모크 자동화      | smoke test           | 완료   |

통합 기준선은 PR #10이 병합된 `origin/main`의 `7fc33c2`다. 캘린더 커밋은
이 기준선 바로 위에 기능 단위로 재배치했다.

Node 내장 test runner와 기존 `tsx`를 사용한다. 테스트는
`apps/api/test/calendar`에 두며 `pnpm test`는 공유 패키지를 먼저 빌드한
후 API 테스트를 실행한다.

공유 스키마는 `@repo/schemas/calendar-task`에서 제공한다. 요청 객체는
strict 검증을 사용하므로 명세에 없는 `userId` 같은 필드는 거부된다. 목록
조회는 한 번에 최대 366일까지 허용한다.

기간 목록 조회는 TypeORM이 자동으로 붙이는 `deletedAt IS NULL`까지
포함하여 `userId, deletedAt, startedAt, dueAt` 순서의 복합 인덱스를
사용한다. 기존 초기 마이그레이션을 고치지 않고 별도 추가
마이그레이션으로 적용하며, 최신 main의 초기 마이그레이션 두 개보다 늦게
실행된다.

### 5.1 전체 자동 검증

최종 검증 결과는 다음과 같다.

- `pnpm test`: 테스트 20개 모두 통과
- `pnpm validate`: 타입·린트·포맷 작업 16개 모두 통과
- `pnpm build`: API와 웹을 포함한 빌드 작업 4개 모두 통과
- `pnpm exec commitlint --from origin/main --to HEAD`: 커밋 메시지 규칙
  통과
- `git diff --check`: 공백 오류 없음

`pnpm validate`와 `pnpm build`는 Next의 `.next` 산출물을 동시에 쓰지
않도록 순서대로 실행한다.

### 5.2 실제 MySQL 및 HTTP 통합 검증

- WSL의 호스트 MySQL을 중지하고 Compose의 `db`와 `chat-store`를 기동해
  두 서비스가 모두 `healthy`인 것을 확인했다.
- Docker MySQL에 일반 애플리케이션 계정으로 연결해
  `InitialSchema1787551378141`,
  `AddInitialCheckConstraints1787551480827`,
  `AddCalendarTaskRangeIndex1787564726192`가 모두 적용된 것을 확인했다.
- `pnpm test:calendar:smoke`가 공유 패키지와 API를 먼저 빌드하고 실제
  Nest 애플리케이션을 임시 loopback 포트에 기동하도록 자동화했다.
- 자동 테스트에서
  `idx_calendar_tasks_user_deleted_started_due (user_id, deleted_at, started_at, due_at)`와
  무인증 `401`, 가입 `201`, 로그인·목록·단건·수정·완료·재개 `200`, 생성
  `201`, 삭제 `204`, 삭제 후 조회 `404`를 확인했다.
- 삭제 후 `deleted_at` 저장과 테스트 사용자·태스크 제거까지 확인했으며
  테스트 2개가 모두 통과했다.
- Redis는 Compose 인증 healthcheck 기준으로 `healthy`다. 캘린더 저장
  경로는 Redis에 의존하지 않으므로 이번 스모크 테스트는 Redis 데이터를
  읽거나 쓰지 않는다.

## 6. 리뷰 순서

1. `packages/schemas/src/calendar/calendar-task.schema.ts`에서 요청과
   응답 경계를 확인한다.
2. `controllers/calendar.controller.ts`에서 HTTP 경로와 JWT 사용자
   연결을 확인한다.
3. `services/calendar.service.ts`에서 소유권, 조회 범위, 상태 계산과
   CRUD 규칙을 확인한다.
4. `apps/api/test/calendar`에서 각 규칙의 독립 테스트를 확인한다.
5. `1787564726192-AddCalendarTaskRangeIndex.ts`에서 기간 조회 인덱스의
   적용과 롤백 SQL을 확인한다.

커밋별 변경은 다음 명령으로 오래된 순서부터 볼 수 있다.

```bash
git log --reverse --oneline origin/main..calendar_module
```

## 7. 최신 main 통합 주의사항

- 최신 main의 `AppModule`과 `ChatModule` 구성을 유지한 채
  `CalendarModule`을 함께 등록했다.
- 최신 main에는 로그인 토큰 발급 코드가 있었지만 해당 코드가 참조하는
  JWT guard, strategy와 `@Public()` 데코레이터 파일이 없었다. 캘린더
  브랜치의 인증 기반 커밋 안에 이 파일들을 복원해 각 기능 커밋이
  독립적으로 빌드되도록 정리했다.
- `JWT_SECRET`과 `JWT_EXPIRES_IN_SECONDS`는 API 환경변수 스키마로
  검증하며 `apps/api/.env.development.example`과
  `infra/.env.api.example`에 계약을 반영했다. 운영 환경에서는 개발 기본
  secret을 사용할 수 없다.
- 최신 main의 초기 마이그레이션 파일은 수정하지 않았다. 캘린더 인덱스는
  그 뒤에 실행되는 별도 마이그레이션이며 `down()`에서 해당 인덱스만
  제거한다.
- Redis는 채팅 저장소용 컨테이너 구성만 추가된 상태다. 캘린더 저장
  경로에 Redis 클라이언트나 캐시 의존성을 추가하지 않았다.
- 알림 모듈은 캘린더 저장 트랜잭션 안에서 직접 호출하지 않는다. 알림
  계약이 정해지면 생성·수정·완료·삭제 후 도메인 이벤트를 발행하는
  방식으로 연결한다.
- 채팅 모듈은 `calendar_tasks`를 참조하지만 캘린더 모듈은 채팅 엔티티를
  참조하지 않는다. 이 단방향을 유지한다.

## 8. 로컬 실행과 DB 초기화

먼저 `infra/README.md`를 읽고 모노레포 루트에서 실행한다.

```bash
cd /home/ho/projects/ft_transcendence
make up
pnpm --filter=api migration:run
pnpm dev
```

- `make` 명령은 반드시 모노레포 루트에서 실행한다.
- 호스트 MySQL이 실행 중이면 컨테이너의 `3306` 포트와 충돌하므로
  `infra/README.md` 지침에 따라 먼저 중지한다.
- `make down`은 볼륨을 유지하지만 `make clean`과 `make prune`은 데이터를
  지울 수 있으므로 명시적으로 초기화할 때만 사용한다.
- `pnpm dev`는 API와 웹의 watch 모드를 실행해 코드 변경을 실시간
  반영한다. 기본 포트는 API `4000`, 웹 `3000`이다.
- 새 DB에서는 최초 한 번 마이그레이션을 실행하고, 이후 main에 새
  마이그레이션 파일이 추가될 때마다 같은 명령을 다시 실행한다.

## 9. 레포 작업 규칙과 최종 검증

- 보호 브랜치인 `main`에서 직접 작업하지 않고 `calendar_module`에서만
  작업한다.
- 커밋 제목은 commitlint의 `type(scope): subject` 형식을 따르고 72자를
  넘기지 않는다. 이 작업에서는 `feat`, `fix`, `perf`, `test`, `docs`와
  등록된 `api/calendar`, `api/auth`, `api/db`, `schemas/calendar`,
  `repo` scope만 사용한다.
- pre-commit hook은 lint-staged로 staged 파일의 Prettier를 검사한다.
- pre-push hook은 `pnpm turbo run check-types build`를 실행한다.
- 모든 캘린더 커밋은 설정된 작성자와 SSH 서명으로 기록한다.

최종 검증은 서로의 산출물 경합을 피하도록 다음 순서로 실행한다.

```bash
pnpm test
pnpm validate
pnpm build
pnpm exec commitlint --from origin/main --to HEAD
git diff --check
```

## 10. Docker DB/API 스모크 테스트

`apps/api/test/calendar/calendar-db-api.smoke.ts`는 실제 Docker MySQL과
Nest HTTP 경로를 함께 검증하는 로컬 통합 테스트다. 일반 단위 테스트와
분리되어 있으므로 `pnpm test`에는 자동으로 포함되지 않는다.

### 10.1 사전 조건

실제 값이 작성된 다음 파일이 필요하다. `.example` 파일은 형식 설명용이며
비밀값을 작성하거나 커밋하지 않는다.

- `infra/.env.database`
- `infra/.env.api`
- `apps/api/.env.development`

호스트 MySQL이 `3306` 포트를 사용 중이면 중지하고, 모노레포 루트에서
Compose와 마이그레이션을 준비한다.

```bash
cd /home/ho/projects/ft_transcendence
sudo systemctl stop mysql
make up
make ps
pnpm --filter=api migration:run
```

`make ps`에서 `db`와 `chat-store`가 모두 `healthy`여야 한다.
`migration:run`이 `No migrations are pending`을 출력하는 것은 필요한
마이그레이션이 이미 모두 적용됐다는 뜻이므로 정상이다.

### 10.2 실행 방법

모노레포 루트에서 다음 한 줄을 실행한다.

```bash
pnpm test:calendar:smoke
```

Turbo가 공유 constants·schemas와 API를 먼저 빌드한다. 테스트가 Nest를
사용 가능한 임시 loopback 포트에 직접 기동하고 종료하므로 별도의
`pnpm dev` 또는 `pnpm start`는 필요하지 않다. 테스트가 끝나도 Docker
컨테이너와 볼륨은 유지된다.

### 10.3 검증 범위와 성공 로그

테스트는 다음을 실제 DB와 HTTP 요청으로 검증한다.

- 캘린더 기간 조회 복합 인덱스의 이름과 컬럼 순서
- JWT가 없는 캘린더 요청의 `401`
- 테스트 사용자 가입과 로그인 토큰 발급
- 태스크 생성·목록·단건·제목 수정
- 완료와 재개
- soft delete와 삭제 후 `404`
- DB의 `deleted_at` 저장
- 테스트 사용자·로그인 이력·태스크 자동 제거

성공 시 핵심 출력은 다음과 같고 프로세스 종료 코드는 `0`이다.

```text
✔ has the expected range-query index in MySQL
ℹ unauthorized=401
ℹ register=201
ℹ login=200
ℹ create=201
ℹ list=200
ℹ read=200
ℹ update=200
ℹ complete=200
ℹ reopen=200
ℹ delete=204
ℹ readAfterDelete=404
ℹ softDeletePersisted=true
ℹ cleanup=true
ℹ pass 2
ℹ fail 0
```

### 10.4 안전장치와 테스트 데이터

- 스크립트는 `NODE_ENV=test`로 고정한다.
- `DB_HOST`가 `127.0.0.1`, `localhost`, `::1` 중 하나가 아니면 DB 연결
  전에 실패시킨다.
- 매 실행마다 고유한 로그인 ID와 `calendar-smoke-...@example.test`
  이메일을 사용한다.
- 정상 종료와 테스트 실패 모두 `after` hook에서 생성한 행만 hard
  delete한다. 스키마 초기화나 다른 사용자 데이터 삭제는 하지 않는다.
- 프로세스를 강제 종료하거나 WSL 자체를 종료하면 정리 hook이 실행되지
  않을 수 있으므로 테스트 중에는 `kill -9`를 사용하지 않는다.
- 로컬 호스트 검사는 최소 안전장치일 뿐이다. 운영 DB를 로컬 포트로
  터널링한 상태에서도 실행하지 않는다.

### 10.5 일반 테스트와의 차이

| Command                    | External dependency | Purpose                   |
| -------------------------- | ------------------- | ------------------------- |
| `pnpm test`                | 없음                | 서비스·스키마 격리 테스트 |
| `pnpm test:calendar:smoke` | Docker MySQL        | 실제 DB와 HTTP 통합 검증  |

PR 전에는 먼저 `pnpm test`로 빠른 회귀 검사를 하고, Docker 인프라가
준비된 로컬 환경에서 스모크 테스트를 추가 실행한다.

### 10.6 문제 해결

- `Bind for 0.0.0.0:3306 failed`: `sudo systemctl stop mysql` 후
  `make up`을 다시 실행한다.
- `permission denied`로 Docker 소켓에 접근하지 못함: `newgrp docker`를
  실행하거나 WSL/VS Code 터미널을 다시 연다.
- `db` 또는 `chat-store`가 `unhealthy`: `make logs c=db` 또는
  `make logs c=chat-store`로 확인하고 `Ctrl+C`로 로그 추적을 종료한다.
- 테이블 또는 인덱스가 없다는 오류: `pnpm --filter=api migration:run`을
  다시 실행하고 migration 3개가 완료 상태인지 확인한다.
- 환경변수 검증 실패: 실제 `.env` 파일이 올바른 위치에 있는지 확인하고,
  값이 비어 있는 `.example` 파일을 실행용으로 사용하지 않는다.

테스트 후 인프라를 내릴 때는 볼륨을 보존하는 다음 명령을 사용한다.

```bash
make down
```

`make clean`과 `make prune`은 데이터 볼륨 또는 다른 Docker 리소스를
삭제할 수 있으므로 일반 테스트 정리 용도로 사용하지 않는다.
