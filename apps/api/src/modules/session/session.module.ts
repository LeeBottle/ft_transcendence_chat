import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSessionEntity } from './entities/user-session.entity.js';
import { UserSessionService } from './services/session.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserSessionEntity])],
  controllers: [],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class SessionModule {}
