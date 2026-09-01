import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitialCheckConstraints1788234085404 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL 마이그레이션 전 데이터 오염 방지용
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_login_histories\`
      ADD CONSTRAINT \`chk_user_login_histories_is_success_valid\` CHECK (\`is_success\` IN (0, 1));
    `);

    // 마감 시각(due_at)은 시작 시각(start_at) 이후여야 함
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`calendar_tasks\`
      ADD CONSTRAINT \`chk_calendar_tasks_due_after_start\` CHECK (\`due_at\` >= \`start_at\`);
    `);

    // 퇴장 시각(left_at)은 NULL이거나 입장 시각(joined_at) 이후여야 함
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      ADD CONSTRAINT \`chk_chat_room_members_left_after_joined\` CHECK (
        \`left_at\` IS NULL
        OR \`left_at\` >= \`joined_at\`
      );
    `);

    // 마감 시각(due_at)은 시작 시각(start_at) 이후여야 함
    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      ADD CONSTRAINT \`chk_chat_room_tasks_due_after_start\` CHECK (\`due_at\` >= \`start_at\`);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: up()의 실행 역순으로 제약조건 해제

    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_tasks\`
      DROP CHECK \`chk_chat_room_tasks_due_after_start\`;
    `);

    await queryRunner.query(/* sql */ `
      ALTER TABLE \`chat_room_members\`
      DROP CHECK \`chk_chat_room_members_left_after_joined\`;
    `);

    await queryRunner.query(/* sql */ `
      ALTER TABLE \`calendar_tasks\`
      DROP CHECK \`chk_calendar_tasks_due_after_start\`;
    `);

    await queryRunner.query(/* sql */ `
      ALTER TABLE \`user_login_histories\`
      DROP CHECK \`chk_user_login_histories_is_success_valid\`;
    `);
  }
}
