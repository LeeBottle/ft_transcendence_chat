import { DataSource } from 'typeorm';

import { dbEnv } from '#config/database-env.schema.js';

async function resetSchema(): Promise<void> {
  const schemaName = dbEnv.DB_SCHEMA_NAME;

  // database 프로퍼티를 제외하고 루트 레벨 DataSource 생성
  // 삭제하려는 데이터베이스에 접속한 상태에서는 해당 DB를 DROP할 수 없거나 연결 세션이 끊어짐
  const bootstrapDataSource = new DataSource({
    type: 'mysql',
    host: dbEnv.DB_HOST,
    port: dbEnv.DB_PORT,
    username: dbEnv.DB_USERNAME,
    password: dbEnv.DB_PASSWORD,
  });

  /*
  에러를 이 함수 안에서 먹어버리지(Swallow) 않고 상위로 던지면서도,
  자원 해제는 무조건 보장하기 위해 try-finally 구문 사용
  */
  try {
    await bootstrapDataSource.initialize(); // DB 커넥션 풀 수립
    console.error(`[DB Reset] Resetting schema: \`${schemaName}\`...`);

    await bootstrapDataSource.query(`DROP DATABASE IF EXISTS \`${schemaName}\`;`);
    await bootstrapDataSource.query(`
      CREATE DATABASE \`${schemaName}\`
        DEFAULT CHARACTER SET \`${dbEnv.DB_CHARSET}\`
        COLLATE \`${dbEnv.DB_COLLATION}\`;
    `);

    console.error(`[DB Reset] Successfully recreated schema: \`${schemaName}\``);
  } finally {
    // 커넥션 풀 완전 종료
    if (bootstrapDataSource.isInitialized) {
      await bootstrapDataSource.destroy();
    }
  }
}

resetSchema().catch((error: unknown) => {
  console.error('[DB Reset Failed]', error);
  process.exit(1);
});
