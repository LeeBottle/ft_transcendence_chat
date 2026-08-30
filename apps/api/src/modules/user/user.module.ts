import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSessionModule } from '#modules/auth/user-session.module.js';

import { UserController } from './controllers/user.controller.js';
import { UserFriendEntity } from './entities/user-friend.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { UserService } from './services/user.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserFriendEntity]), UserSessionModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
