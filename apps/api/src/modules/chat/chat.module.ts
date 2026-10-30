import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '#modules/user/entities/user.entity.js';

import { ChatController } from './controllers/chat.controller.js';
import { ChatRoomMemberEntity } from './entities/chat-room-member.entity.js';
import { ChatRoomMessageEntity } from './entities/chat-room-message.entity.js';
import { ChatRoomTaskEntity } from './entities/chat-room-task.entity.js';
import { ChatRoomEntity } from './entities/chat-room.entity.js';
import { ChatGateway } from './gateways/chat.gateway.js';
import { WsJwtGuard } from './guards/ws-jwt.guard.js';
import { ChatAiService } from './services/chat-ai.service.js';
import { ChatCacheBatchService } from './services/chat-cache-batch.service.js';
import { ChatMessageService } from './services/chat-message.service.js';
import { ChatService } from './services/chat.service.js';
import { RedisService } from './services/redis.service.js';

@Module({
  imports: [
    // 시크릿은 WsJwtGuard 가 검증 시 JWT_ACCESS_SECRET 으로 명시적으로 전달한다.
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      ChatRoomMessageEntity,
      ChatRoomMemberEntity,
      ChatRoomTaskEntity,
      ChatRoomEntity,
      UserEntity,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatMessageService,
    RedisService,
    ChatCacheBatchService,
    ChatAiService,
    ChatGateway,
    WsJwtGuard,
  ],
  exports: [
    ChatService,
    ChatMessageService,
    RedisService,
    ChatCacheBatchService,
    ChatAiService,
    ChatGateway,
  ],
})
export class ChatModule {}
