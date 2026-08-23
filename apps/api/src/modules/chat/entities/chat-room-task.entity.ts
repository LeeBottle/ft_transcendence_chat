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

import { CalendarSyncStatus } from '@repo/constants/chat-room-task';

import { CreateAuditBase } from '#database/entities/audit-base.entity.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';

import { ChatRoomMemberEntity } from './chat-room-member.entity.js';

@Entity({ name: 'chat_room_tasks' })
@Unique('uq_chat_room_tasks_chat_room_member_id_calendar_task_id', [
  'chatRoomMemberId',
  'calendarTaskId',
])
@Check('chk_chat_room_tasks_due_after_started', '`due_at` >= `started_at`')
export class ChatRoomTaskEntity extends CreateAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'chat_room_member_id', type: 'bigint', unsigned: true })
  chatRoomMemberId!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'started_at', type: 'datetime', precision: 3 })
  startedAt!: Date;

  @Column({ name: 'due_at', type: 'datetime', precision: 3 })
  dueAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', precision: 3, nullable: true })
  completedAt!: Date | null;

  @Index('idx_chat_room_tasks_calendar_task_id')
  @Column({ name: 'calendar_task_id', type: 'bigint', unsigned: true, nullable: true })
  calendarTaskId!: string | null;

  @Column({
    name: 'calendar_sync_status',
    type: 'enum',
    enum: CalendarSyncStatus,
    default: CalendarSyncStatus.NOT_REQUESTED,
  })
  calendarSyncStatus!: CalendarSyncStatus;

  @ManyToOne(() => ChatRoomMemberEntity, {
    nullable: false,
    onUpdate: 'RESTRICT',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'chat_room_member_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_tasks_chat_room_members_chat_room_member_id',
  })
  chatRoomMember?: Relation<ChatRoomMemberEntity>;

  @ManyToOne(() => CalendarTaskEntity, { onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'calendar_task_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_tasks_calendar_tasks_calendar_task_id',
  })
  calendarTask?: Relation<CalendarTaskEntity> | null;
}
