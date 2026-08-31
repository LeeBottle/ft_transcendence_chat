import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionModule } from '#modules/session/session.module.js';
import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './controllers/auth.controller.js';
import { UserLoginHistoryEntity } from './entities/user-login-history.entity.js';
import { AuthService } from './services/auth.service.js';
import { BcryptPasswordService } from './services/bcrypt-password.service.js';
import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';
import { UserLoginHistoryService } from './services/user-login-history.service.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLoginHistoryEntity]),
    JwtModule.register({
      signOptions: {
        algorithm: 'HS256', // JwtService 전체에 기본 알고리즘으로 적용
      },
    }),
    PassportModule,
    UserModule,
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    UserLoginHistoryService,
    JwtAccessStrategy,
    { provide: PasswordService, useClass: BcryptPasswordService },
  ],
  exports: [PasswordService],
})
export class AuthModule {}
