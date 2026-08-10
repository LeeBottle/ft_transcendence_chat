import { Module } from '@nestjs/common';

import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';
import { BcryptPasswordService } from './services/bcrypt-password.service.js';
import { PasswordService } from './services/password.service.js';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, { provide: PasswordService, useClass: BcryptPasswordService }],
  exports: [],
})
export class AuthModule {}
