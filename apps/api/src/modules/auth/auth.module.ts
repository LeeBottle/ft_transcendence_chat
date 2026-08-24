import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './controllers/auth.controller.js';
import { UserLoginHistoryEntity } from './entities/user-login-history.entity.js';
import { AuthService } from './services/auth.service.js';
import { BcryptPasswordService } from './services/bcrypt-password.service.js';
import { PasswordService } from './services/password.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLoginHistoryEntity]), UserModule],
  controllers: [AuthController],
  providers: [AuthService, { provide: PasswordService, useClass: BcryptPasswordService }],
  exports: [],
})
export class AuthModule {}
