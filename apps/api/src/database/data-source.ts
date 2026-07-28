import os from 'node:os';

import type { PoolOptions } from 'mysql2';
import type { MysqlDataSourceOptions } from 'typeorm/driver/mysql/MysqlDataSourceOptions.js';
import { DataSource } from 'typeorm';

import { resolveFromProjectRoot } from '#common/utils/project-root.util.js';
import { parseDatabaseEnv } from '#config/database-env.schema.js';
import { DatabaseEnvError } from '#config/exceptions/environment-validation.error.js';

// mysql2 패키지 전용 속성들만 가지는 타입
// DataSourceOptions의 'extra' 속성 값 객체가 가질 수 있는 속성들을 모두 보유한 객체 타입
type PureMysqlExtraOptions = Omit<
  PoolOptions,
  // TypeORM의 'username', mysql2의 'user' --> 동일
  // TypeORM의 'poolSize', mysql2의 'connectionLimit' --> 동일
  keyof MysqlDataSourceOptions | 'user' | 'connectionLimit'
>;

const DEFAULT_PROD_MAX_QUERY_EXECUTION_TIME_MS = 500;
const DEFAULT_DEV_MAX_QUERY_EXECUTION_TIME_MS = 200;

export const AppDataSource = createDataSource();

function createDataSource(): DataSource {
  try {
    const dbEnv = parseDatabaseEnv(process.env);

    const isProduction = dbEnv.NODE_ENV === 'production';

    const defaultMaxQueryExecutionTime = isProduction
      ? DEFAULT_PROD_MAX_QUERY_EXECUTION_TIME_MS
      : DEFAULT_DEV_MAX_QUERY_EXECUTION_TIME_MS;

    return new DataSource({
      type: 'mysql',

      host: dbEnv.DB_HOST,
      port: dbEnv.DB_PORT,
      username: dbEnv.DB_USERNAME,
      password: dbEnv.DB_PASSWORD,
      database: dbEnv.DB_SCHEMA_NAME,

      logging: isProduction ? ['error'] : ['error', 'warn'],
      logger: isProduction ? 'simple-console' : 'formatted-console',
      maxQueryExecutionTime: dbEnv.DB_MAX_QUERY_EXECUTION_TIME_MS ?? defaultMaxQueryExecutionTime,

      charset: 'utf8mb4_0900_ai_ci',
      timezone: 'Z', // UTC

      entities: [
        isProduction
          ? resolveFromProjectRoot('dist/modules/*/entities/*.entity.js')
          : resolveFromProjectRoot('src/modules/*/entities/*.entity.ts'),
      ],

      migrations: [
        isProduction
          ? resolveFromProjectRoot('dist/database/migrations/*.js')
          : resolveFromProjectRoot('src/database/migrations/*.ts'),
      ],
      migrationsTableName: 'sys_migrations_history',

      dateStrings: true, // 날짜/시간 타입들을 Date 객체가 아닌, 문자열 그대로 읽어옴
      supportBigNumbers: true, // default
      bigNumberStrings: true, // default
      synchronize: false, // default
      ssl: false, // dafault
      poolSize: calculateOptimalPoolSize(),

      extra: {
        decimalNumbers: true,
        keepAliveInitialDelay: 10000,
        maxIdle: 10,
        queueLimit: 1000, // 커넥션 대기열의 최대 요청수 (0은 무제한 대기, Fast-Fail 통해 시스템 포화상태시 서비스 다운 방지)
        namedPlaceholders: true,
        maxPreparedStatements: 200,
      } satisfies PureMysqlExtraOptions,
    } satisfies MysqlDataSourceOptions);
  } catch (error: unknown) {
    if (error instanceof DatabaseEnvError) {
      console.error(error.toString());

      process.exit(1);
    }

    throw error;
  }
}

/**
 * HikariCP 공식을 기반으로 최적의 DB 커넥션 풀 크기를 동적 계산
 * @param effectiveSpindleCount 현대 SSD/클라우드 환경 기본값: 1
 */
function calculateOptimalPoolSize(effectiveSpindleCount: number = 1): number {
  // Docker CPU 제한 설정(cgroup)까지 반영된 논리 프로세서 수 조회
  const logicalProcessors = os.availableParallelism();

  return logicalProcessors * 2 + effectiveSpindleCount;
}
