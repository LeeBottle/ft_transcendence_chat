import { Injectable } from '@nestjs/common';

import type { UserService } from '#modules/user/user.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
}
