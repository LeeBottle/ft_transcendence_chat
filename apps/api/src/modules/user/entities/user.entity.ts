import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { UserRole, UserStatus } from '@repo/constants/user';

import { SoftDeleteAuditBase } from '#database/entities/audit-base.entity.js';

@Entity({ name: 'users' })
@Unique('uq_users_login_id', ['loginId'])
@Unique('uq_users_email', ['email'])
export class UserEntity extends SoftDeleteAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'login_id', type: 'varchar', length: 20 })
  loginId!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, collation: 'utf8mb4_bin' })
  passwordHash!: string;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name!: string;

  @Column({ name: 'email', type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'email_verified_at', type: 'datetime', precision: 3, nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'role', type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({
    name: 'profile_image_path',
    type: 'varchar',
    length: 255,
    collation: 'utf8mb4_bin',
    nullable: true,
    comment: '업로드 루트 기준 상대경로',
  })
  profileImagePath!: string | null;
}
