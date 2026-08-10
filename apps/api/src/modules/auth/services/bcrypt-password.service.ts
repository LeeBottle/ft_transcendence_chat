import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import bcrypt from 'bcrypt';

import type { ApiEnv } from '#config/api-env.schema.js';

import { PasswordService } from './password.service.js';

@Injectable()
export class BcryptPasswordService extends PasswordService {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService<ApiEnv, true>) {
    super();

    this.saltRounds = this.configService.getOrThrow('BCRYPT_SALT_ROUNDS', { infer: true });
  }

  async hash(password: string): Promise<string> {
    const safePassword = this.preHash(password);

    return await bcrypt.hash(safePassword, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const safePassword = this.preHash(password);

    return await bcrypt.compare(safePassword, hash);
  }

  private preHash(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }
}
