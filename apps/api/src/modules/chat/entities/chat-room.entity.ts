import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Tree,
  type Relation,
} from 'typeorm';

import { SoftDeleteAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Entity({ name: 'chat_rooms' })
export class ChatRoomEntity extends SoftDeleteAuditBase {
  @PrimaryColumn({
    name: 'id',
    type: 'char',
    length: 36,
    collation: 'utf8mb4_bin',
    comment: 'UUIDv7 (시간 순 정렬 지원, 주소창 공개 PK)',
  })
  id!: string;

  @Index('idx_chat_rooms_creator_user_id')
  @Column({ name: 'creator_user_id', type: 'bigint', unsigned: true })
  creatorUserId!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'closed_at', type: 'datetime', precision: 3, nullable: true })
  closedAt!: Date | null;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'creator_user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_rooms_users_creator_user_id',
  })
  creatorUser?: Relation<UserEntity>;
}
