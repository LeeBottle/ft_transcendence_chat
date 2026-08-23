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

import { CreateAuditBase } from '#database/entities/audit-base.entity.js';

import { UserEntity } from './user.entity.js';

@Entity('user_friends')
@Unique('uq_user_friends_user_id_friend_user_id', ['userId', 'friendUserId'])
export class UserFriendEntity extends CreateAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Index('idx_user_friends_friend_user_id')
  @Column({ name: 'friend_user_id', type: 'bigint', unsigned: true })
  friendUserId!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_friends_users_user_id',
  })
  user?: Relation<UserEntity>;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'friend_user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_friends_users_friend_user_id',
  })
  friendUser?: Relation<UserEntity>;
}
