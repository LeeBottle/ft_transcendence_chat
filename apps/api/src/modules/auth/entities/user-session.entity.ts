import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';

import { MutableAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Entity('user_sessions')
@Unique('uq_user_sessions_refresh_token_hash', ['refreshTokenHash'])
export class UserSessionEntity extends MutableAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Index('idx_user_sessions_user_id')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({
    name: 'refresh_token_hash',
    type: 'char',
    length: 64,
    collation: 'utf8mb4_bin',
    comment: 'SHA-256 해시값 (64자 고정)',
  })
  refreshTokenHash!: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress!: string; // IPv6(최대 45자)도 지원

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'expires_at', type: 'datetime', precision: 3 })
  expiresAt!: Date;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_sessions_users_user_id',
  })
  user?: Relation<UserEntity>;
}
