import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { UserLoginHistoryFailureReason } from '@repo/constants/user-login-history';

import { CreateAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Entity({ name: 'user_login_histories' })
@Check('chk_user_login_histories_is_success_valid', '`is_success` IN (0, 1)') // PostgreSQL 마이그레이션 전 데이터 오염 방지용
@Check(
  'chk_user_login_histories_failure_reason_valid',
  /* sql */ `
    \`failure_reason\` IN (
      NULL,
      ${UserLoginHistoryFailureReason.INVALID_PASSWORD},
      ${UserLoginHistoryFailureReason.USER_NOT_FOUND},
      ${UserLoginHistoryFailureReason.SUSPENDED},
      ${UserLoginHistoryFailureReason.WITHDRAWN}
    )
  `,
)
export class UserLoginHistoryEntity extends CreateAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Index('idx_user_login_histories_user_id')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  userId!: string | null;

  @Column({ name: 'attempted_identifier', type: 'varchar', length: 254 })
  attemptedIdentifier!: string; // 추후 이메일 로그인도 고려하여 Identifier 접미사 및 length: 254 사용

  @Column({ name: 'is_success', type: 'boolean' })
  isSuccess!: boolean;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress!: string; // IPv6(최대 45자)도 지원

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 64, nullable: true })
  failureReason!: UserLoginHistoryFailureReason | null;

  @ManyToOne(() => UserEntity, { onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_login_histories_users_user_id',
  })
  user?: Relation<UserEntity> | null;
}
