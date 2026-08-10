import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { UserRole, UserStatus } from '@repo/types/user';

import { SoftDeleteAuditBase } from '#database/entities/audit-base.entity.js';

@Entity({ name: 'users' })
export class UserEntity extends SoftDeleteAuditBase {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Index('login_id_UNIQUE', { unique: true })
  @Column({ type: 'varchar', name: 'login_id', length: 20 })
  loginId!: string;

  @Column({ type: 'varchar', name: 'password_hash', length: 255, collation: 'utf8mb4_bin' })
  passwordHash!: string;

  @Column({ type: 'varchar', name: 'name', length: 50 })
  name!: string;

  @Index('email_UNIQUE', { unique: true })
  @Column({ type: 'varchar', name: 'email', length: 255 })
  email!: string;

  @Column({ type: 'datetime', name: 'email_verified_at', nullable: true })
  emailVerifiedAt!: string | null;

  @Column({ type: 'tinyint', name: 'role', unsigned: true, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'tinyint', name: 'status', unsigned: true, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({
    type: 'varchar',
    name: 'profile_image_path',
    length: 255,
    nullable: true,
    collation: 'utf8mb4_bin',
  })
  profileImagePath!: string | null;
}
