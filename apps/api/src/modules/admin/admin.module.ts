import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/index.js';

import { AuthModule } from '#modules/auth/auth.module.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

import { AdminController } from './controllers/admin.controller.js';
import { AdminService } from './services/admin.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ChatRoomEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [],
})
export class AdminModule {}
