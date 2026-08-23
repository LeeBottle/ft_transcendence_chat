import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './controllers/auth.controller.js';
import { UserLoginHistoryEntity } from './entities/user-login-history.entity.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthService } from './services/auth.service.js';
import { BcryptPasswordService } from './services/bcrypt-password.service.js';
import { PasswordService } from './services/password.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([UserLoginHistoryEntity]), UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    { provide: PasswordService, useClass: BcryptPasswordService },
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
