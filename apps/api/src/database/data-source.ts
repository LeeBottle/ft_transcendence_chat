import os from 'node:os';

import type { PoolOptions } from 'mysql2';
import { DataSource, type LogLevel } from 'typeorm';
import type { MysqlDataSourceOptions } from 'typeorm/driver/mysql/MysqlDataSourceOptions.js';

import { resolveFromProjectRoot } from '#common/utils/project-root.util.js';
import type { NodeEnv } from '#config/api-env.schema.js';
import { dbEnv } from '#config/database-env.schema.js';

import { entities } from './data-source-entities.js';

/**
 * Mysql2 패키지 전용 속성들만 가지는 타입.\
 * (DataSourceOptions의 'extra' 속성 값 객체가 가질 수 있는 속성들을 모두 보유한 객체 타입)
 *
 * @remarks
 * TypeORM의 공통 옵션과 이름은 다르지만 역할이 동일한 속성들은 제외.
 */
type PureMysqlExtraOptions = Omit<
  PoolOptions,
  keyof MysqlDataSourceOptions | 'user' | 'connectionLimit'
>;

const Logging = {
  production: ['error'],
  development: ['error', 'warn'],
  test: [], // off
} as const satisfies Record<NodeEnv, LogLevel[]>;

const MaxQueryExecutionTimeMs = {
  production: 500,
  development: 200,
  test: 0, // off
} as const satisfies Record<NodeEnv, number>;

const isProduction = dbEnv.NODE_ENV === 'production';
const isTsExecution = import.meta.url.endsWith('.ts');

export const dataSourceOptions = {
  type: 'mysql',

  host: dbEnv.DB_HOST,
  port: dbEnv.DB_PORT,
  username: dbEnv.DB_USERNAME,
  password: dbEnv.DB_PASSWORD,
  database: dbEnv.DB_SCHEMA_NAME,

  logging: Logging[dbEnv.NODE_ENV],
  logger: isProduction ? 'simple-console' : 'formatted-console',
  maxQueryExecutionTime:
    dbEnv.DB_MAX_QUERY_EXECUTION_TIME_MS ?? MaxQueryExecutionTimeMs[dbEnv.NODE_ENV],

  charset: dbEnv.DB_COLLATION,
  timezone: 'Z', // UTC

  entities,
  migrations: [
    resolveFromProjectRoot(
      isTsExecution ? 'src/database/migrations/*.ts' : 'dist/database/migrations/*.js',
    ),
  ],
  migrationsTableName: 'sys_migrations_history',

  dateStrings: false, // true 설정시 날짜/시간 타입들을 Date 객체가 아닌, 문자열 그대로 읽어옴
  supportBigNumbers: true, // default
  bigNumberStrings: true, // default

  synchronize: false, // default
  ssl: false, // default
  poolSize: calculateOptimalPoolSize(),
  trace: !isProduction,

  extra: {
    decimalNumbers: true,
    keepAliveInitialDelay: 10000,
    maxIdle: 10,
    idleTimeout: 30000,
    queueLimit: 1000, // 커넥션 대기열의 최대 요청수 (0은 무제한 대기, Fast-Fail 통해 시스템 포화상태시 서비스 다운 방지)
    namedPlaceholders: true,
    maxPreparedStatements: 200,
    connectAttributes: {
      _client_name: 'nest-main-api',
      _app_version: '1.0.0',
      _env: process.env.NODE_ENV,
    },
  } satisfies PureMysqlExtraOptions,
} satisfies MysqlDataSourceOptions;

/**
 * HikariCP 공식을 기반으로 최적의 DB 커넥션 풀 크기를 동적 계산
 *
 * @param effectiveSpindleCount 현대 SSD/클라우드 환경 기본값: 1
 */
function calculateOptimalPoolSize(effectiveSpindleCount: number = 1): number {
  const logicalProcessors = os.availableParallelism(); // Docker CPU 제한 설정(cgroup)까지 반영된 논리 프로세서 수 조회

  return logicalProcessors * 2 + effectiveSpindleCount;
}

export const AppDataSource = new DataSource(dataSourceOptions);
