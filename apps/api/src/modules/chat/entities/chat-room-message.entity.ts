import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { ChatRoomMessageType } from '@repo/constants/chat-room-message';

import { CreateAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

import { ChatRoomEntity } from './chat-room.entity.js';

@Entity({ name: 'chat_room_messages' })
export class ChatRoomMessageEntity extends CreateAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Index('idx_chat_room_messages_chat_room_id')
  @Column({ name: 'chat_room_id', type: 'bigint', unsigned: true })
  chatRoomId!: string;

  @Index('idx_chat_room_messages_sender_user_id')
  @Column({ name: 'sender_user_id', type: 'bigint', unsigned: true })
  senderUserId!: string;

  @Column({ name: 'type', type: 'enum', enum: ChatRoomMessageType })
  type!: ChatRoomMessageType;

  @Column({ name: 'sent_at', type: 'datetime', precision: 3 })
  sentAt!: Date;

  @Column({ name: 'content', type: 'text', nullable: true })
  content!: string | null; // 추후 파일 업로드 기능 추가 고려하여 NULL 허용

  /*
  시스템 공지, 외부 API 메시지 등 해당 채팅방 소속 멤버가 아님에도 메세지를 보내는 경우를 고려하여
  chat_room_members 대신 users, chat_rooms 테이블을 직접 참조
  */

  @ManyToOne(() => ChatRoomEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'chat_room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_messages_chat_rooms_chat_room_id',
  })
  chatRoom?: Relation<ChatRoomEntity>;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'sender_user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_chat_room_messages_users_sender_user_id',
  })
  senderUser?: Relation<UserEntity>;
}
