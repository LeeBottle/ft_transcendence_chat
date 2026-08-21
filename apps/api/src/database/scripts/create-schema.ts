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

  try {
    await bootstrapDataSource.initialize();
    console.error(` Connected to MySQL server at ${dbEnv.DB_HOST}:${dbEnv.DB_PORT}`);

    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS \`${dbEnv.DB_SCHEMA_NAME}\` CHARACTER SET ${dbEnv.DB_CHARSET} COLLATE ${dbEnv.DB_COLLATION};`;

    await bootstrapDataSource.query(createDatabaseQuery);
    console.error(
      ` Schema '${dbEnv.DB_SCHEMA_NAME}' checked/created successfully (Charset: ${dbEnv.DB_CHARSET}, Collation:${dbEnv.DB_COLLATION}).`,
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
