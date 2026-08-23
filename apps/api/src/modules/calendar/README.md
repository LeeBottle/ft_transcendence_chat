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
않는다.

## 4. 시간과 상태 규칙

- API 입력은 시간대가 포함된 ISO 8601 문자열만 허용한다.
- DB 연결은 UTC이며 응답 시각은 `toISOString()`을 사용한 UTC 문자열이다.
- `dueAt`은 `startedAt`보다 빠를 수 없다.
- 목록 범위는 반열린 구간 `[from, to)`이고, 다음 조건으로 겹치는 일정을
  조회한다.

```text
startedAt < to AND dueAt >= from
```

- 정렬은 `startedAt ASC, id ASC`로 고정한다.
- 상태는 DB 컬럼이 아니라 조회 시각을 기준으로 계산한다.
  - `PENDING(1)`: 미완료이고 `startedAt > now`
  - `IN_PROGRESS(2)`: 미완료이고 `startedAt <= now`
  - `COMPLETED(3)`: `completedAt`이 존재함
- 완료 요청은 `{ "completed": true }`만 받고 완료 시각은 서버가
  기록한다.

## 5. 구현 및 검증 기록

| Unit | Implementation                  | Automated check | Status |
| ---- | ------------------------------- | --------------- | ------ |
| 0    | 기준선 검증                     | `pnpm validate` | 완료   |
| 1    | 테스트 실행 기반                | Node test       | 예정   |
| 2    | 공유 Zod 스키마                 | schema tests    | 예정   |
| 3    | 인증 사용자 연결과 태스크 생성  | unit tests      | 예정   |
| 4    | 기간·상태별 목록 조회           | unit tests      | 예정   |
| 5    | 소유 태스크 단건 조회           | unit tests      | 예정   |
| 6    | 제목·시간 수정                  | unit tests      | 예정   |
| 7    | 완료 및 완료 취소               | unit tests      | 예정   |
| 8    | soft delete                     | unit tests      | 예정   |
| 9    | 전체 타입·린트·포맷·빌드·테스트 | full validation | 예정   |

기준선인 `dummy` 커밋 `7a3ee70`에서 `pnpm validate`가 통과했다.

## 6. 통합 주의사항

- 현재 기준 브랜치의 JWT guard와 strategy는 파일만 있고 로그인 토큰 발급
  및 모듈 등록이 완성되지 않았다. 캘린더는 Bearer JWT를 사용하는 기존
  strategy 방향을 따르며, 필요한 최소 인증 연결은 캘린더 변경과 분리해
  기록한다.
- 기존 초기 마이그레이션에는 캘린더와 무관한 chat 테이블 불일치가 있어
  빈 DB 전체 마이그레이션 검증이 실패할 수 있다. 기존 마이그레이션은 이
  브랜치에서 수정하지 않는다.
- 알림 모듈은 캘린더 저장 트랜잭션 안에서 직접 호출하지 않는다. 알림
  계약이 정해지면 생성·수정·완료·삭제 후 도메인 이벤트를 발행하는
  방식으로 연결한다.
- 채팅 모듈은 `calendar_tasks`를 참조하지만 캘린더 모듈은 채팅 엔티티를
  참조하지 않는다. 이 단방향을 유지한다.

## 7. 로컬 검증 명령

```bash
pnpm test
pnpm validate
pnpm build
git diff --check
```
