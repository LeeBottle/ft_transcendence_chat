import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const UserStatus = {
  INACTIVE: 0, // 탈퇴
  ACTIVE: 1, // 활성화
  SUSPENDED: 2, // 정지
  NEED_EMAIL_UPDATE: 3, // 탈퇴 이후 복구되었으나 이메일 변경이 필요한 상태 (이메일은 마스킹된 상태)
} as const;
export type UserStatus = typeof UserStatus;

@Entity('users')
@Index('login_id_UNIQUE', ['loginId'], { unique: true })
@Index('email_UNIQUE', ['email'], { unique: true })
export class UserEntity {
  /**
   * [Fact Check] BIGINT(20) 처리
   * MySQL의 BIGINT는 JavaScript의 Number.MAX_SAFE_INTEGER(2^53 - 1)를 초과할 수 있습니다.
   * 정밀도 손실(Precision Loss) 방지를 위해 TypeORM/mysql2 드라이버는 이를 기본적으로 'string'으로 반환합니다.
   * 따라서 타입은 항상 string으로 지정하고 애플리케이션 레벨에서 방어해야 합니다.
   */
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  readonly id!: string;

  @Column({ name: 'login_id', type: 'varchar', length: 20 })
  loginId!: string;

  /**
   * [보안] select: false
   * 실무에서는 개발자의 실수로 `SELECT *` 시 패스워드 해시가 프론트엔드로 유출되는 것을 막기 위해
   * 기본적으로 조회되지 않도록 차단합니다. 로그인 로직에서만 `addSelect('UserEntity.password')`로 명시적 조회를 해야 합니다.
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  /**
   * TINYINT(1)은 논리적 Boolean 값을 의미하므로 TS에서는 boolean 타입으로 매핑합니다.
   */
  @Column({ name: 'is_admin', type: 'tinyint', unsigned: true, default: 0 })
  isAdmin!: boolean;

  @Column({
    type: 'tinyint',
    unsigned: true,
    default: UserStatus.ACTIVE,
    comment: 'export enum UserStatus { INACTIVE = 0, ACTIVE = 1, SUSPENDED = 2 }',
  })
  status!: UserStatus;

  @Column({
    name: 'profile_image_extension',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: "구분자 '.'은 제거하고 저장",
  })
  profileImageExtension!: string | null;

  /**
   * 생성 및 수정 시간은 DB가 제어해야 하므로 TS 레벨에서 수정을 막기 위해 readonly 키워드를 사용합니다.
   */
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  readonly updatedAt!: Date;
}
