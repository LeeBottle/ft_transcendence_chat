// @ts-check

const commitTypes = [
  'feat', // 새로운 기능 추가
  'fix', // 버그 수정
  'docs', // 문서 변경, Only 주석 변경
  'refactor', // 코드 리팩토링
  'perf', // 성능 개선
  'infra', // Docker, NGINX, .env 등 인프라 관련 설정 변경
  'deps', // 의존성 추가/업데이트/삭제
  'chore', // 기타 잡무, 패키지 설정 변경

  'test', // 테스트 코드 추가/수정
  'build', // 빌드 시스템, 외부 의존성 패키지 수정 (pnpm, turbo 등)
  'ci', // CI 설정 변경

  'security', // 보안 취약점 패치 (e.g., 스키마 내 .regex()에 대한 ReDOS 취약점 패치)
  'revert', // 이전 커밋 되돌리기
];

const commitScopes = [
  /* Applications */
  'api',
  'web',

  /* Modules */
  'api/auth',
  'api/calendar',
  'api/chat',
  'api/user',
  'web/auth',
  'web/calendar',
  'web/chat',
  'web/user',

  /* Shared packages */
  'schemas',
  'schemas/auth',
  'schemas/calendar',
  'schemas/chat',
  'schemas/user',
  'constants',
  'constants/auth',
  'constants/calendar',
  'constants/chat',
  'constants/user',

  /* Package local */
  // 각 application 혹은 shared package에서 내부적으로 공통으로 사용하는 코드(횡단 관심사)
  'api/common',
  'web/common',
  'constants/common',
  'schemas/common',

  /* type 'infra' or scope 'api' only */
  'db', // type 'infra' only
  'api/db', // TypeORM 설정 / 마이그레이션
  'cache', // type 'infra' only
  'api/cache', // Redis / 캐싱 로직

  /* Shared Configs */
  'lint', // eslint-config 패키지 내부 설정 파일 수정 (개별 패키지 eslint.config.js 수정은 chore(해당 패키지 스코프) 사용)
  'format', // prettier 설정 변경
  'tsconfig', // typescript-config 패키지 내부 설정 파일 수정 (개별 패키지 tsconfig.json 수정은 chore(해당 패키지 스코프) 사용)

  /* Developer Tooling */
  'scripts', // 모노레포 루트의 `scripts/`

  /* Monorepo Workspace */
  'repo', // 모노레포 루트 설정(e.g., turbo.json, pnpm-workspace, root package.json)
];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 허용할 커밋 타입 목록
    'type-enum': [2, 'always', commitTypes],

    // 허용할 커밋 스코프 목록
    'scope-enum': [2, 'always', commitScopes],

    'body-max-line-length': [0, 'always', Infinity],
    'breaking-change-exclamation-mark': [2, 'always'], // breaking change는 ':' 앞에 '!' 붙이고, 푸터에 BREAKING CHANGE: <내용> 작성
    'footer-max-line-length': [0, 'always', Infinity],
    'header-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', { cases: ['lower-case', 'kebab-case'], delimiters: ['/'] }],
  },
};
