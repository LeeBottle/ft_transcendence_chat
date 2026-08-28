import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './controllers/auth.controller.js';
import { UserLoginHistoryEntity } from './entities/user-login-history.entity.js';
import { UserSessionEntity } from './entities/user-session.entity.js';
import { AuthService } from './services/auth.service.js';
import { BcryptPasswordService } from './services/bcrypt-password.service.js';
import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';
import { UserLoginHistoryService } from './services/user-login-history.service.js';
import { UserSessionService } from './services/user-session.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLoginHistoryEntity]),
    TypeOrmModule.forFeature([UserSessionEntity]),
    JwtModule.register({
      signOptions: {
        algorithm: 'HS256', // JwtService 전체에 기본 알고리즘으로 적용
      },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    UserLoginHistoryService,
    UserSessionService,
    { provide: PasswordService, useClass: BcryptPasswordService },
  ],
  exports: [],
})
export class AuthModule {}
