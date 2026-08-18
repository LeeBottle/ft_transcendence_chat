import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { Repository } from 'typeorm';

// import { buildUserEntitySelectMap } from '#common/utils/typeorm.util.js';

import { UserEntity } from '#modules/user/entities/user.entity.js';

interface AssertUniquenessParams {
  readonly loginId: string;
  readonly email: string;
}

interface CreateUserParams {
  readonly loginId: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly email: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async assertUniqueness(params: AssertUniquenessParams): Promise<void> {
    const { loginId, email } = params;

    const existingUser = await this.userRepository.find({
      select: { loginId: true, email: true },
      where: [{ loginId }, { email }],
    });

    if (existingUser.length > 0) {
      const isLoginIdDuplicate = existingUser.some((user) => user.loginId === loginId);
      const isEmailDuplicate = existingUser.some((user) => user.email === email);

      if (isLoginIdDuplicate && isEmailDuplicate) {
        throw new ConflictException('아이디와 이메일이 모두 이미 사용 중입니다.');
      }
      if (isLoginIdDuplicate) {
        throw new ConflictException('이미 사용 중인 아이디입니다.');
      }
      if (isEmailDuplicate) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }
  }

  async create(params: CreateUserParams): Promise<UserEntity> {
    const { loginId, passwordHash, name, email } = params;

    const user = this.userRepository.create({ loginId, passwordHash, name, email });

    return await this.userRepository.save(user);
  }

  async findByLoginId(loginId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { loginId } });
  }

  // async findByLoginIdAndSelect(loginId: string, select?: (keyof UserEntity)[]): Promise<UserEntity | null> {
  //   return await this.userRepository.findOne({
  //     where: { loginId },
  //     select: buildUserEntitySelectMap<UserEntity>(select),
  //   });
  // }
}
