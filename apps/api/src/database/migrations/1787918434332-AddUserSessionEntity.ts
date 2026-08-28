import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSessionEntity1787918434332 implements MigrationInterface {
  name = 'AddUserSessionEntity1787918434332';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      CREATE TABLE \`user_sessions\` (
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT UNSIGNED NOT NULL,
        \`refresh_token_hash\` CHAR(64) COLLATE "utf8mb4_bin" NOT NULL COMMENT 'SHA-256 해시값 (64자 고정)',
        \`ip_address\` VARCHAR(45) NOT NULL,
        \`user_agent\` TEXT NULL,
        \`expires_at\` DATETIME(3) NOT NULL,
        INDEX \`idx_user_sessions_user_id\` (\`user_id\`),
        UNIQUE INDEX \`uq_user_sessions_refresh_token_hash\` (\`refresh_token_hash\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_sessions\`
      ADD CONSTRAINT \`fk_user_sessions_users_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_sessions\`
      DROP FOREIGN KEY \`fk_user_sessions_users_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`uq_user_sessions_refresh_token_hash\` ON \`user_sessions\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_user_sessions_user_id\` ON \`user_sessions\`
    `);
    await queryRunner.query(/* sql */ `DROP TABLE \`user_sessions\``);
  }
}
