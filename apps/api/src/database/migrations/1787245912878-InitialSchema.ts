import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787245912878 implements MigrationInterface {
  name = 'InitialSchema1787245912878';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      CREATE TABLE \`chat_room_members\` (
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`chat_room_id\` CHAR(36) COLLATE "utf8mb4_bin" NOT NULL COMMENT 'UUIDv7 (시간 순 정렬 지원, 주소창 공개 PK)',
        \`user_id\` BIGINT UNSIGNED NOT NULL,
        \`role\` ENUM('MEMBER', 'MANAGER', 'OWNER') NOT NULL DEFAULT 'MEMBER',
        \`is_owner\` TINYINT AS (IF(\`role\` = 'OWNER', 1, NULL)) VIRTUAL NULL COMMENT '방장 유니크 제약 보장용 가상 컬럼 (role 값 수정시 자동 재계산)',
        \`status\` ENUM('ACTIVE', 'LEFT', 'KICKED') NOT NULL DEFAULT 'ACTIVE',
        \`joined_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`left_at\` DATETIME(3) NULL,
        \`calendar_synced_at\` DATETIME(3) NULL,
        INDEX \`idx_chat_room_members_user_id\` (\`user_id\`),
        UNIQUE INDEX \`uq_chat_room_members_chat_room_id_is_owner\` (\`chat_room_id\`, \`is_owner\`),
        UNIQUE INDEX \`uq_chat_room_members_chat_room_id_user_id\` (\`chat_room_id\`, \`user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
    await queryRunner.query(
      /* sql */ `
        INSERT INTO
          \`ft_transcendence\`.\`typeorm_metadata\` (
            \`database\`,
            \`schema\`,
            \`table\`,
            \`type\`,
            \`name\`,
            \`value\`
          )
        VALUES
          (DEFAULT, ?, ?, ?, ?, ?)
      `,
      [
        'ft_transcendence',
        'chat_room_members',
        'GENERATED_COLUMN',
        'is_owner',
        "IF(`role` = 'OWNER', 1, NULL)",
      ],
    );
    await queryRunner.query(/* sql */ `
      CREATE TABLE \`chat_room_messages\` (
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`chat_room_id\` CHAR(36) COLLATE "utf8mb4_bin" NOT NULL COMMENT 'UUIDv7 (시간 순 정렬 지원, 주소창 공개 PK)',
        \`sender_user_id\` BIGINT UNSIGNED NOT NULL,
        \`type\` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL,
        \`sent_at\` DATETIME(3) NOT NULL,
        \`content\` TEXT NULL,
        INDEX \`idx_chat_room_messages_chat_room_id\` (\`chat_room_id\`),
        INDEX \`idx_chat_room_messages_sender_user_id\` (\`sender_user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
    await queryRunner.query(/* sql */ `
      CREATE TABLE \`chat_room_tasks\` (
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`chat_room_member_id\` BIGINT UNSIGNED NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`started_at\` DATETIME(3) NOT NULL,
        \`due_at\` DATETIME(3) NOT NULL,
        \`completed_at\` DATETIME(3) NULL,
        \`calendar_task_id\` BIGINT UNSIGNED NULL,
        \`calendar_sync_status\` ENUM('NOT_REQUESTED', 'SUCCESS', 'FAILURE') NOT NULL DEFAULT 'NOT_REQUESTED',
        INDEX \`idx_chat_room_tasks_calendar_task_id\` (\`calendar_task_id\`),
        UNIQUE INDEX \`uq_chat_room_tasks_chat_room_member_id_calendar_task_id\` (\`chat_room_member_id\`, \`calendar_task_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_login_histories\`
      ADD CONSTRAINT \`fk_user_login_histories_users_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`calendar_tasks\`
      ADD CONSTRAINT \`fk_calendar_tasks_users_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_rooms\`
      ADD CONSTRAINT \`fk_chat_rooms_users_creator_user_id\` FOREIGN KEY (\`creator_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      ADD CONSTRAINT \`fk_chat_room_members_chat_rooms_chat_room_id\` FOREIGN KEY (\`chat_room_id\`) REFERENCES \`chat_rooms\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      ADD CONSTRAINT \`fk_chat_room_members_users_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_messages\`
      ADD CONSTRAINT \`fk_chat_room_messages_chat_rooms_chat_room_id\` FOREIGN KEY (\`chat_room_id\`) REFERENCES \`chat_rooms\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_messages\`
      ADD CONSTRAINT \`fk_chat_room_messages_users_sender_user_id\` FOREIGN KEY (\`sender_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      ADD CONSTRAINT \`fk_chat_room_tasks_chat_room_members_chat_room_member_id\` FOREIGN KEY (\`chat_room_member_id\`) REFERENCES \`chat_room_members\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      ADD CONSTRAINT \`fk_chat_room_tasks_calendar_tasks_calendar_task_id\` FOREIGN KEY (\`calendar_task_id\`) REFERENCES \`calendar_tasks\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      DROP FOREIGN KEY \`fk_chat_room_tasks_calendar_tasks_calendar_task_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      DROP FOREIGN KEY \`fk_chat_room_tasks_chat_room_members_chat_room_member_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_messages\`
      DROP FOREIGN KEY \`fk_chat_room_messages_users_sender_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_messages\`
      DROP FOREIGN KEY \`fk_chat_room_messages_chat_rooms_chat_room_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      DROP FOREIGN KEY \`fk_chat_room_members_users_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      DROP FOREIGN KEY \`fk_chat_room_members_chat_rooms_chat_room_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_rooms\`
      DROP FOREIGN KEY \`fk_chat_rooms_users_creator_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`calendar_tasks\`
      DROP FOREIGN KEY \`fk_calendar_tasks_users_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_login_histories\`
      DROP FOREIGN KEY \`fk_user_login_histories_users_user_id\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`uq_chat_room_tasks_chat_room_member_id_calendar_task_id\` ON \`chat_room_tasks\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_chat_room_tasks_calendar_task_id\` ON \`chat_room_tasks\`
    `);
    await queryRunner.query(/* sql */ `DROP TABLE \`chat_room_tasks\``);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_chat_room_messages_sender_user_id\` ON \`chat_room_messages\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_chat_room_messages_chat_room_id\` ON \`chat_room_messages\`
    `);
    await queryRunner.query(/* sql */ `DROP TABLE \`chat_room_messages\``);
    await queryRunner.query(
      /* sql */ `
        DELETE FROM \`ft_transcendence\`.\`typeorm_metadata\`
        WHERE
          \`type\` = ?
          AND \`name\` = ?
          AND \`schema\` = ?
          AND \`table\` = ?
      `,
      ['GENERATED_COLUMN', 'is_owner', 'ft_transcendence', 'chat_room_members'],
    );
    await queryRunner.query(/* sql */ `
      DROP INDEX \`uq_chat_room_members_chat_room_id_user_id\` ON \`chat_room_members\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`uq_chat_room_members_chat_room_id_is_owner\` ON \`chat_room_members\`
    `);
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_chat_room_members_user_id\` ON \`chat_room_members\`
    `);
    await queryRunner.query(/* sql */ `DROP TABLE \`chat_room_members\``);
  }
}
