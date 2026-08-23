import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { DataSource, Repository } from 'typeorm';

import { UserRole, UserStatus } from '@repo/constants/user';

import type { ApiEnv } from '#config/api-env.schema.js';
import { AuthService } from '#modules/auth/services/auth.service.js';
import { PasswordService } from '#modules/auth/services/password.service.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';
import { UserService } from '#modules/user/services/user.service.js';

class StubUserService extends UserService {
  constructor(private readonly foundUser: UserEntity) {
    const dataSource = new DataSource({ type: 'mysql' });
    const repository = new Repository(UserEntity, dataSource.manager);

    super(repository);
  }

  override async findByLoginId(_loginId: string): Promise<UserEntity> {
    return await Promise.resolve(this.foundUser);
  }
}

class StubPasswordService extends PasswordService {
  override async hash(password: string): Promise<string> {
    return await Promise.resolve(password);
  }

  override async verify(_password: string, _hash: string): Promise<boolean> {
    return await Promise.resolve(true);
  }
}

void describe('AuthService access token', () => {
  void it('issues a verifiable bearer token with the user id in sub', async () => {
    const jwtSecret = 'test-only-secret-with-at-least-32-characters';
    const user: UserEntity = {
      id: '42',
      loginId: 'tester1',
      passwordHash: 'stored-hash',
      name: '테스터',
      email: 'tester@example.com',
      emailVerifiedAt: null,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      profileImagePath: null,
      createdAt: new Date('2026-08-23T00:00:00Z'),
      updatedAt: new Date('2026-08-23T00:00:00Z'),
      deletedAt: null,
    };
    const userService = new StubUserService(user);
    const passwordService = new StubPasswordService();
    const jwtService = new JwtService();
    const config: ApiEnv = {
      NODE_ENV: 'test',
      API_PORT: 3000,
      CLIENT_URL: 'http://localhost:3001',
      UPLOAD_BASE_DIR: 'uploads',
      BCRYPT_SALT_ROUNDS: 10,
      JWT_SECRET: jwtSecret,
      JWT_EXPIRES_IN_SECONDS: 3600,
    };
    const configService = new ConfigService<ApiEnv, true>(config);
    const service = new AuthService(userService, passwordService, jwtService, configService);

    const result = await service.login({ loginId: user.loginId, password: 'password' });
    const payload = await jwtService.verifyAsync<{ sub: string; email: string }>(
      result.accessToken,
      { secret: jwtSecret },
    );

    assert.equal(payload.sub, user.id);
    assert.equal(payload.email, user.email);
  });
});
