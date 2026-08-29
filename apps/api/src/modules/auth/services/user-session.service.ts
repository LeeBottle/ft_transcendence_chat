import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { Repository } from 'typeorm';

import { UserSessionEntity } from '#modules/auth/entities/user-session.entity.js';

interface CreateUserSessionParams {
  readonly userId: string;
  readonly refreshTokenHash: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
  readonly expiresAt: Date;
}

interface RotateUserSessionParams {
  readonly userSessionId: string;
  readonly newRefreshTokenHash: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
  readonly expiresAt: Date;
}

@Injectable()
export class UserSessionService {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepository: Repository<UserSessionEntity>,
  ) {}

  async create(userSession: CreateUserSessionParams): Promise<UserSessionEntity> {
    return await this.userSessionRepository.save(userSession);
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<UserSessionEntity | null> {
    return await this.userSessionRepository.findOne({ where: { refreshTokenHash } });
  }

  async deleteByRefreshTokenHash(refreshTokenHash: string): Promise<void> {
    await this.userSessionRepository.delete({ refreshTokenHash });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.userSessionRepository.delete({ userId });
  }

  async rotateSession(params: RotateUserSessionParams): Promise<void> {
    const { userSessionId, newRefreshTokenHash, ipAddress, userAgent, expiresAt } = params;

    const updateResult = await this.userSessionRepository.update(
      { id: userSessionId },
      {
        refreshTokenHash: newRefreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    );

    if (updateResult.affected === 0) {
      throw new UnauthorizedException('세션이 존재하지 않거나 이미 만료되었습니다.');
    }
  }
}
