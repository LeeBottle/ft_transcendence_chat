import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1785741114770 implements MigrationInterface {
  name = 'InitSchema1785741114770';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      CREATE TABLE \`users\` (
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` DATETIME(6) NULL,
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`login_id\` VARCHAR(20) NOT NULL,
        \`password\` VARCHAR(255) COLLATE "utf8mb4_bin" NOT NULL,
        \`name\` VARCHAR(50) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`role\` TINYINT UNSIGNED NOT NULL DEFAULT '1',
        \`status\` TINYINT UNSIGNED NOT NULL DEFAULT '1',
        \`profile_image_path\` VARCHAR(255) COLLATE "utf8mb4_bin" NULL,
        UNIQUE INDEX \`login_id_UNIQUE\` (\`login_id\`),
        UNIQUE INDEX \`email_UNIQUE\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `DROP INDEX \`email_UNIQUE\` ON \`users\``);
    await queryRunner.query(/* sql */ `DROP INDEX \`login_id_UNIQUE\` ON \`users\``);
    await queryRunner.query(/* sql */ `DROP TABLE \`users\``);
  }
}
