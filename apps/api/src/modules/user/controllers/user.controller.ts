import { Controller } from '@nestjs/common';

import { UserService } from '#modules/user/services/user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
