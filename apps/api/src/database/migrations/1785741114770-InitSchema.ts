import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1785741114770 implements MigrationInterface {
  name = 'InitSchema1785741114770';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`login_id\` varchar(20) NOT NULL, \`password\` varchar(255) COLLATE "utf8mb4_bin" NOT NULL, \`name\` varchar(50) NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`status\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`profile_image_path\` varchar(255) COLLATE "utf8mb4_bin" NULL, UNIQUE INDEX \`login_id_UNIQUE\` (\`login_id\`), UNIQUE INDEX \`email_UNIQUE\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`email_UNIQUE\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`login_id_UNIQUE\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
