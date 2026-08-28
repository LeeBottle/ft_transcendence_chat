import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { Repository } from 'typeorm';

import { UserLoginHistoryFailureReason } from '@repo/constants/user-login-history';

import { UserLoginHistoryEntity } from '#modules/auth/entities/user-login-history.entity.js';

interface UserLoginHistoryRecordParams {
  readonly userId: string | null;
  readonly attemptedIdentifier: string;
  readonly isSuccess: boolean;
  readonly ipAddress: string;
  readonly userAgent: string | null;
  readonly failureReason: UserLoginHistoryFailureReason | null;
}

@Injectable()
export class UserLoginHistoryService {
  constructor(
    @InjectRepository(UserLoginHistoryEntity)
    private readonly userLoginHistoryRepository: Repository<UserLoginHistoryEntity>,
  ) {}

  async record(userLoginHistory: UserLoginHistoryRecordParams): Promise<void> {
    await this.userLoginHistoryRepository.save(userLoginHistory);
  }
}
