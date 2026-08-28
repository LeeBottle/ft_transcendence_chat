import { UserLoginHistoryEntity } from '#modules/auth/entities/user-login-history.entity.js';
import { UserSessionEntity } from '#modules/auth/entities/user-session.entity.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import { ChatRoomMemberEntity } from '#modules/chat/entities/chat-room-member.entity.js';
import { ChatRoomMessageEntity } from '#modules/chat/entities/chat-room-message.entity.js';
import { ChatRoomTaskEntity } from '#modules/chat/entities/chat-room-task.entity.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { UserFriendEntity } from '#modules/user/entities/user-friend.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

export const entities = [
  UserLoginHistoryEntity,
  UserSessionEntity,
  CalendarTaskEntity,
  ChatRoomMemberEntity,
  ChatRoomMessageEntity,
  ChatRoomTaskEntity,
  ChatRoomEntity,
  UserFriendEntity,
  UserEntity,
];
