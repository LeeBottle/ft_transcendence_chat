import { exit } from 'node:process';

import { DataSource } from 'typeorm';
import { z } from 'zod';

import { databaseEnvSchema } from '#config/database-env.schema.js';

// 1. 환경변수 검증 스키마
const dbEnvSchema = databaseEnvSchema.extend({
  DB_ROOT_USERNAME: z.string().min(1).max(32).default('root'),
  DB_ROOT_PASSWORD: z.string().min(1).max(256),
});

async function createUserAndGrantPrivileges(): Promise<void> {
  const dbEnv = dbEnvSchema.safeParse(process.env);

  if (!dbEnv.success) {
    console.error('❌ Environment validation failed:', z.treeifyError(dbEnv.error));
    exit(1);
  }

  const {
    DB_HOST,
    DB_PORT,
    DB_ROOT_USERNAME,
    DB_ROOT_PASSWORD,
    DB_USERNAME,
    DB_PASSWORD,
    DB_SCHEMA_NAME,
  } = dbEnv.data;

  // 2. 특정 데이터베이스를 지정하지 않고 루트 권한으로 인스턴스 접속
  const adminDataSource = new DataSource({
    type: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_ROOT_USERNAME,
    password: DB_ROOT_PASSWORD,
  });

  try {
    await adminDataSource.initialize();
    console.error(` Connected as '${DB_ROOT_USERNAME}' at ${DB_HOST}:${DB_PORT}`);

    // DDL 파라미터 바인딩 불가에 따른 백슬래시 및 작은따옴표 이스케이프 처리
    const sanitizedPassword = DB_PASSWORD.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    // 3-1. 유저가 없으면 생성 ('%' 호스트로 외부/컨테이너 접근 허용)
    await adminDataSource.query(
      `CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'%' IDENTIFIED BY '${sanitizedPassword}';`,
    );

    // 3-2. 기존 계정 존재 시 비밀번호 최신화
    await adminDataSource.query(
      `ALTER USER '${DB_USERNAME}'@'%' IDENTIFIED BY '${sanitizedPassword}';`,
    );

    // 3-3. 대상 스키마(존재 여부 무관)에 대한 권한 부여
    await adminDataSource.query(
      `GRANT ALL PRIVILEGES ON \`${DB_SCHEMA_NAME}\`.* TO '${DB_USERNAME}'@'%';`,
    );

    // 3-4. 권한 캐시 플러시
    await adminDataSource.query('FLUSH PRIVILEGES;');

    console.error(
      ` User '${DB_USERNAME}'@'%' created/updated and privileges granted for schema '${DB_SCHEMA_NAME}'.`,
    );
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy();
    }
  }
}

createUserAndGrantPrivileges().catch((error: unknown) => {
  console.error('❌ Failed to provision user and privileges:', error);
  exit(1);
});
