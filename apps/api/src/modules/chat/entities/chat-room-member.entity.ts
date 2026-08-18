import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';

import { ChatRoomMemberRole, ChatRoomMemberStatus } from '@repo/constants/chat-room-member';

import { MutableAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

import { ChatRoomEntity } from './chat-room.entity.js';

@Entity({ name: 'chat_room_members' })
@Unique('uq_chat_room_members_chat_room_id_user_id', ['chatRoomId', 'userId'])
@Unique('uq_chat_room_members_chat_room_id_is_owner', ['chatRoomId', 'isOwner'])
@Check(
  'chk_chat_room_members_role_valid',
  /* sql */ `
    \`role\` IN (
      ${ChatRoomMemberRole.MEMBER},
      ${ChatRoomMemberRole.MANAGER},
      ${ChatRoomMemberRole.OWNER}
    )
  `,
)
@Check(
  'chk_chat_room_members_status_valid',
  /* sql */ `
    \`status\` IN (
      ${ChatRoomMemberStatus.ACTIVE},
      ${ChatRoomMemberStatus.LEFT},
      ${ChatRoomMemberStatus.KICKED}
    )
  `,
)
@Check('chk_chat_room_members_left_after_joined', '`left_at` IS NULL OR `left_at` >= `joined_at`')
export class ChatRoomMemberEntity extends MutableAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'chat_room_id', type: 'bigint', unsigned: true })
  chatRoomId!: string;

  @Index('idx_chat_room_members_user_id')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ name: 'role', type: 'varchar', length: 64, default: ChatRoomMemberRole.MEMBER })
  role!: ChatRoomMemberRole;

  @Column({
    name: 'is_owner',
    type: 'tinyint',
    unsigned: true,
    nullable: true,
    asExpression: `IF(\`role\` = ${ChatRoomMemberRole.OWNER}, 1, NULL)`,
    generatedType: 'VIRTUAL',
    insert: false,
    update: false,
    comment: '방장 유니크 제약 보장용 가상 컬럼 (role 값 수정시 자동 재계산)',
  })
  isOwner!: 1 | null;

  @Column({ name: 'status', type: 'varchar', length: 64, default: ChatRoomMemberStatus.ACTIVE })
  status!: ChatRoomMemberStatus;

  @Column({
    name: 'joined_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'datetime', precision: 3, nullable: true })
  leftAt!: Date | null;

  @Column({ name: 'calendar_synced_at', type: 'datetime', precision: 3, nullable: true })
  calendarSyncedAt!: Date | null;

  @ManyToOne(() => ChatRoomEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'chat_room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_members_chat_rooms_chat_room_id',
  })
  chatRoom?: Relation<ChatRoomEntity>;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_members_users_user_id',
  })
  user?: Relation<UserEntity>;
}
