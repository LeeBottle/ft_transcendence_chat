import { Controller, Get } from '@nestjs/common';

import type { User } from '@repo/types';

@Controller('users')
export class UserController {
  @Get()
  getUser(): User {
    return {
      id: 3,
      title: 'user_title',
    };
  }
}
