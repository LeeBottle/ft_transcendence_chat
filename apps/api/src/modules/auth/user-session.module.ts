import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSessionEntity } from './entities/user-session.entity.js';
import { UserSessionService } from './services/user-session.service.js';

/**
 * 세션(접속여부) 도구만 담은 작은 모듈.
 * AuthModule 과 UserModule 양쪽에서 import 해서 UserSessionService 를 공유한다.
 * (한쪽이 다른 쪽 전체를 import 하면 순환참조가 생기므로 도구만 따로 뺀다.)
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserSessionEntity])],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
