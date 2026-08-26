import { exit } from 'node:process';

import { DataSource } from 'typeorm';

import { dbEnv } from '#config/database-env.schema.js';

async function createSchema(): Promise<void> {
  const bootstrapDataSource = new DataSource({
    type: 'mysql',
    host: dbEnv.DB_HOST,
    port: dbEnv.DB_PORT,
    username: dbEnv.DB_USERNAME,
    password: dbEnv.DB_PASSWORD,
  });

  const charset = 'utf8mb4';
  const collation = 'utf8mb4_0900_ai_ci';

  try {
    await bootstrapDataSource.initialize();
    console.log(` Connected to MySQL server at ${dbEnv.DB_HOST}:${dbEnv.DB_PORT}`);

    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS \`${dbEnv.DB_SCHEMA_NAME}\` CHARACTER SET ${charset} COLLATE ${collation};`;

    await bootstrapDataSource.query(createDatabaseQuery);
    console.log(
      ` Schema '${dbEnv.DB_SCHEMA_NAME}' checked/created successfully (Charset: ${charset}, Collation:${collation}).`,
    );
  } finally {
    if (bootstrapDataSource.isInitialized) {
      await bootstrapDataSource.destroy();
    }
  }
}

createSchema().catch((error: unknown) => {
  console.error(`❌ Unexpected error during schema creation:`, error);
  exit(1);
});
