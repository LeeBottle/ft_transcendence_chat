import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserRole, UserStatus } from '@repo/types/user';

import { UserEntity } from './entities/user.entity.js';

export interface CreateUserData {
  readonly loginId: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly email: string;
}

export interface FindUserCredentialsData {
  readonly loginId: string;
  readonly passwordHash: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByLoginId(loginId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { loginId } });
  }

  async createUser(params: CreateUserData): Promise<UserEntity> {
    const { loginId, passwordHash, name, email } = params;

    // login_id 또는 email 중복 검증
    const existingUser = await this.userRepository.findOne({
      where: [{ loginId }, { email }],
    });

    if (existingUser !== null) {
      throw new ConflictException('이미 존재하는 loginId 또는 email입니다.');
    }

    const user = this.userRepository.create({
      loginId,
      passwordHash,
      name,
      email,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    return await this.userRepository.save(user);
  }

  /** DB에서 login_id와 passwordHash가 일치하는 유저 직접 조회 */
  async findOneByCredentials(params: FindUserCredentialsData): Promise<UserEntity> {
    const { loginId, passwordHash } = params;

    // WHERE login_id = ? AND passwordHash = ? 쿼리 직접 실행
    const user = await this.userRepository.findOne({
      where: {
        loginId,
        passwordHash,
      },
    });

    if (user === null) {
      throw new NotFoundException('일치하는 아이디 및 비밀번호의 유저를 찾을 수 없습니다.');
    }

    return user;
  }
}
