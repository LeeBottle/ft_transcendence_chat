import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './controllers/user.controller.js';
import { UserEntity } from './entities/user.entity.js';
import { UserFriendEntity } from './entities/user-friend.entity.js';
import { UserService } from './services/user.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserFriendEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
