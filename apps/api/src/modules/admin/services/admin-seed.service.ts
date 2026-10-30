import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserRole } from '@repo/constants/user';

import { AuthService } from '#modules/auth/services/auth.service.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const adminLoginId = 'admin01';
    const adminPassword = 'Admin1357!';
    const adminEmail = 'admin@taskchat.com';

    // 1. 이미 존재하는지 멱등성(Idempotency) 확인
    const existingAdmin = await this.userRepository.findOne({
      where: [{ loginId: adminLoginId }, { email: adminEmail }],
    });

    if (existingAdmin !== null) {
      return;
    }

    try {
      // 2. AuthService의 회원가입 로직 호출 (해싱 및 중복 검증 로직 재사용)
      // * signUp 반환값(JWT 토큰 등)은 시딩 단계이므로 무시
      await this.authService.register({
        loginId: adminLoginId,
        password: adminPassword,
        name: '관리자',
        email: adminEmail,
      });

      // 3. 일반 가입으로 생성된 계정의 role을 ADMIN으로 승격
      await this.userRepository.update(
        { loginId: adminLoginId },
        {
          role: UserRole.ADMIN,
          emailVerifiedAt: new Date(), // 관리자는 이메일 인증 완료 상태로 설정
        },
      );

      this.logger.log(`[Seed] Default admin account successfully created: ${adminLoginId}`);
    } catch (error) {
      this.logger.error(`[Seed] Failed to initialize admin account: ${(error as Error).message}`);
    }
  }
}
