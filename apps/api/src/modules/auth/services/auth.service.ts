import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserStatus } from '@repo/constants/user';

import type { ApiEnv } from '#config/api-env.schema.js';
import type {
  LoginUserResponseDto,
  RegisterUserResponseDto,
} from '#modules/auth/controllers/auth.dto.js';
import { UserService } from '#modules/user/services/user.service.js';

import { PasswordService } from './password.service.js';

interface RegisterUserParams {
  loginId: string;
  password: string;
  name: string;
  email: string;
}

interface LoginUserParams {
  loginId: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ApiEnv, true>,
  ) {}

  async register(params: RegisterUserParams): Promise<RegisterUserResponseDto> {
    const { loginId, password, name, email } = params;

    await this.userService.assertUniqueness({ loginId, email });

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.userService.create({ loginId, passwordHash, name, email });

    return { loginId: user.loginId, email: user.email, createdAt: user.createdAt.toISOString() };
  }

  async login(params: LoginUserParams): Promise<LoginUserResponseDto> {
    const { loginId, password } = params;

    const user = await this.userService.findByLoginId(loginId);

    if (user === null) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await this.passwordService.verify(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status === UserStatus.WITHDRAWN) {
      throw new ForbiddenException('탈퇴 처리된 계정입니다.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        '이용이 정지된 계정입니다. 자세한 사항은 고객센터로 문의해 주세요.',
      );
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow('JWT_SECRET', { infer: true }),
        expiresIn: this.configService.getOrThrow('JWT_EXPIRES_IN_SECONDS', { infer: true }),
      },
    );

    return {
      accessToken,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      role: user.role,
      status: user.status,
      profileImagePath: user.profileImagePath,
    };
  }
}
