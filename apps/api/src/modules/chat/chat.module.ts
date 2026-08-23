import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatController } from './controllers/chat.controller.js';
import { ChatRoomMemberEntity } from './entities/chat-room-member.entity.js';
import { ChatRoomMessageEntity } from './entities/chat-room-message.entity.js';
import { ChatRoomTaskEntity } from './entities/chat-room-task.entity.js';
import { ChatRoomEntity } from './entities/chat-room.entity.js';
import { ChatService } from './services/chat.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoomMessageEntity,
      ChatRoomMemberEntity,
      ChatRoomTaskEntity,
      ChatRoomEntity,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [],
})
export class ChatModule {}
