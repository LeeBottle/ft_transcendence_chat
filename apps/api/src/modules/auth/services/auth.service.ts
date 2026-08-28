import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole, UserStatus } from '@repo/constants/user';
import { UserLoginHistoryFailureReason } from '@repo/constants/user-login-history';

import { parseDurationToMs } from '#common/utils/duration.util.js';
import type { ApiEnv } from '#config/api-env.schema.js';
import type { RegisterUserResponseDto } from '#modules/auth/controllers/auth.dto.js';
import { UserService } from '#modules/user/services/user.service.js';

import { hashSha256 } from './common/crypto.util.js';
import { PasswordService } from './password.service.js';
import { TokenService, type GeneratedTokenPair } from './token.service.js';
import { UserLoginHistoryService } from './user-login-history.service.js';
import { UserSessionService } from './user-session.service.js';

interface RegisterUserParams {
  readonly loginId: string;
  readonly password: string;
  readonly name: string;
  readonly email: string;
}

interface LoginUserParams {
  readonly loginId: string;
  readonly password: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

interface LoginUserResult {
  tokens: GeneratedTokenPair;
  user: {
    loginId: string;
    name: string;
    email: string;
    emailVerifiedAt: string | null;
    role: UserRole;
    status: UserStatus;
    profileImagePath: string | null;
  };
}

interface ReissueTokenPairParams {
  readonly refreshToken: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<ApiEnv, true>,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly userSessionService: UserSessionService,
    private readonly userLoginHistoryService: UserLoginHistoryService,
  ) {}

  async register(params: RegisterUserParams): Promise<RegisterUserResponseDto> {
    const { loginId, password, name, email } = params;

    await this.userService.assertUniqueness({ loginId, email });

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.userService.create({ loginId, passwordHash, name, email });

    return { loginId: user.loginId, email: user.email, createdAt: user.createdAt.toISOString() };
  }

  async login(params: LoginUserParams): Promise<LoginUserResult> {
    const { loginId, password, ipAddress, userAgent } = params;

    const user = await this.userService.findByLoginIdWithDeleted(loginId);

    if (user === null) {
      await this.userLoginHistoryService.record({
        userId: null,
        attemptedIdentifier: loginId,
        isSuccess: false,
        ipAddress,
        userAgent,
        failureReason: UserLoginHistoryFailureReason.USER_NOT_FOUND,
      });

      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await this.passwordService.verify(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.userLoginHistoryService.record({
        userId: user.id,
        attemptedIdentifier: loginId,
        isSuccess: false,
        ipAddress,
        userAgent,
        failureReason: UserLoginHistoryFailureReason.INVALID_PASSWORD,
      });

      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status === UserStatus.WITHDRAWN) {
      await this.userLoginHistoryService.record({
        userId: user.id,
        attemptedIdentifier: loginId,
        isSuccess: false,
        ipAddress,
        userAgent,
        failureReason: UserLoginHistoryFailureReason.WITHDRAWN,
      });

      throw new ForbiddenException('탈퇴 처리된 계정입니다.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      await this.userLoginHistoryService.record({
        userId: user.id,
        attemptedIdentifier: loginId,
        isSuccess: false,
        ipAddress,
        userAgent,
        failureReason: UserLoginHistoryFailureReason.SUSPENDED,
      });

      throw new ForbiddenException(
        '이용이 정지된 계정입니다. 자세한 사항은 고객센터로 문의해 주세요.',
      );
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      loginId: user.loginId,
      role: user.role,
    });
    const tokenHash = hashSha256(tokens.refreshToken);

    const refreshTokenExpiration = parseDurationToMs(
      this.configService.getOrThrow('JWT_REFRESH_EXPIRATION', { infer: true }),
    );
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiration);

    await Promise.all([
      this.userLoginHistoryService.record({
        userId: user.id,
        attemptedIdentifier: loginId,
        isSuccess: true,
        ipAddress,
        userAgent,
        failureReason: null,
      }),
      this.userSessionService.create({
        userId: user.id,
        refreshTokenHash: tokenHash,
        ipAddress,
        userAgent,
        expiresAt: refreshTokenExpiresAt,
      }),
    ]);

    return {
      tokens,
      user: {
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        role: user.role,
        status: user.status,
        profileImagePath: user.profileImagePath,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const refreshTokenHash = hashSha256(refreshToken);

    await this.userSessionService.deleteByRefreshTokenHash(refreshTokenHash);
  }

  async reissueTokenPair(params: ReissueTokenPairParams): Promise<GeneratedTokenPair> {
    const { refreshToken, ipAddress, userAgent } = params;

    // 1. JWT 암호화 서명 및 만료 검증
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    // 2. DB 세션 조회 (해시값 기반 매칭)
    const incomingTokenHash = hashSha256(refreshToken);
    const userSession = await this.userSessionService.findByRefreshTokenHash(incomingTokenHash);

    if (userSession === null) {
      // 세션이 없거나 이미 회전되어 폐기된 토큰인 경우
      throw new UnauthorizedException('유효하지 않은 세션입니다. 다시 로그인해 주세요.');
    }

    // 3. 유저 상태 확인 (활성 유저인지 검증)
    const user = await this.userService.findById(payload.sub);

    if (user?.status !== UserStatus.ACTIVE) {
      await this.userSessionService.deleteByRefreshTokenHash(incomingTokenHash);

      throw new UnauthorizedException('계정이 비활성화되었거나 존재하지 않습니다.');
    }

    // 4. 새로운 토큰 쌍 발급 (Refresh Token Rotation)
    const newTokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      loginId: user.loginId,
      role: user.role,
    });

    // 5. 세션 DB 정보 원자적 갱신 (새 해시값, 갱신된 만료일, 접속 IP/UA 반영)
    const refreshTokenExpiration = parseDurationToMs(
      this.configService.getOrThrow('JWT_REFRESH_EXPIRATION', { infer: true }),
    );
    const newExpiresAt = new Date(Date.now() + refreshTokenExpiration);
    const newTokenHash = hashSha256(newTokens.refreshToken);

    await this.userSessionService.rotateSession({
      userSessionId: userSession.id,
      newRefreshTokenHash: newTokenHash,
      ipAddress,
      userAgent,
      expiresAt: newExpiresAt,
    });

    return newTokens;
  }
}
