import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, MoreThan, type Repository } from 'typeorm';

import type { GetUserPresencesResponseDto } from '#modules/auth/controllers/auth.dto.js';
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

  // 유저들 온라인 여부 한번에 조회
  async getUserPresences(userIds: string[]): Promise<GetUserPresencesResponseDto> {
    // 1. 빈 배열 요청 시 즉시 빈 결과 반환 (TypeORM In([]) 에러 방지)
    if (userIds.length === 0) {
      throw new BadRequestException('최소 1명 이상의 사용자 ID가 필요합니다.');
    }

    // 3. 만료되지 않은 유효 세션 조회 (expiresAt > 현재 시각)
    const activeSessions = await this.findActiveSessionsByUserIds(userIds);

    // 4. O(1) 조회를 위해 온라인 유저 ID를 Set으로 구성
    const onlineUserIdSet = new Set(activeSessions.map((session) => session.userId));

    // 5. 요청받은 userIds 기준으로 응답 배열 매핑
    const userPresences = userIds.map((userId) => ({
      userId,
      isOnline: onlineUserIdSet.has(userId),
    }));

    return { userPresences };
  }

  private async findActiveSessionsByUserIds(userIds: string[]): Promise<UserSessionEntity[]> {
    if (userIds.length === 0) {
      return [];
    }

    return await this.userSessionRepository.find({
      where: {
        userId: In(userIds),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
