import { createHash } from 'node:crypto';
import { exit } from 'node:process';

import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { dbEnv } from '#config/database-env.schema.js';

function preHash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function seedTempUsers(): Promise<void> {
  const dataSource = new DataSource({
    type: 'mysql',
    host: dbEnv.DB_HOST,
    port: dbEnv.DB_PORT,
    username: dbEnv.DB_USERNAME,
    password: dbEnv.DB_PASSWORD,
    database: dbEnv.DB_SCHEMA_NAME,
  });

  const tempUsers = [
    { loginId: 'a', name: '사용자 A', email: 'a@example.com' },
    { loginId: 'b', name: '사용자 B', email: 'b@example.com' },
    { loginId: 'c', name: '사용자 C', email: 'c@example.com' },
  ];

  try {
    await dataSource.initialize();
    console.error(`Connected to MySQL database '${dbEnv.DB_SCHEMA_NAME}'. Seeding temp users...`);

    const rawPassword = 'password123!';
    const passwordHash = await bcrypt.hash(preHash(rawPassword), 10);

    await Promise.all(
      tempUsers.map(async (user) => {
        await dataSource.query(
          `INSERT INTO \`users\` (\`login_id\`, \`password_hash\`, \`name\`, \`email\`, \`role\`, \`status\`, \`created_at\`, \`updated_at\`)
           VALUES (?, ?, ?, ?, 'USER', 'ACTIVE', NOW(3), NOW(3))
           ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`);`,
          [user.loginId, passwordHash, user.name, user.email],
        );
        console.error(` User created/updated: ${user.loginId} (${user.name})`);
      }),
    );

    console.error(' Temp users (a, b, c) seeded successfully.');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedTempUsers().catch((error: unknown) => {
  console.error('❌ Failed to seed temp users:', error);
  exit(1);
});
