import { Controller } from '@nestjs/common';

import type { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
