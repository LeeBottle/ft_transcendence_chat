import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

// import { buildUserEntitySelectMap } from '#common/utils/typeorm.util.js';

import { UserEntity } from '#modules/user/entities/user.entity.js';
import { UserFriendEntity } from '#modules/user/entities/user-friend.entity.js';
import type { UpdateUserProfileRequest, AddFriendRequest } from '../controllers/user.dto.js';

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
    @InjectRepository(UserFriendEntity) // 추가
    private readonly friendRepository: Repository<UserFriendEntity>,
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


  
  // 신규 추가 / 프로필 조회, 수정, 친구 관리 로직

  // 유저 ID로 상세 프로필 조회 (타인/본인 공용)
  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // 본인 회원 정보 수정
  async updateProfile(userId: string, dto: UpdateUserProfileRequest): Promise<UserEntity> {
    const user = await this.findById(userId);

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.profileImagePath !== undefined) user.profileImagePath = dto.profileImagePath;

    return await this.userRepository.save(user);
  }

  // 친구 추가 요청
  async addFriend(userId: string, dto: AddFriendRequest): Promise<UserFriendEntity> {
    if (userId === dto.friendUserId) {
      throw new ConflictException('자기 자신을 친구로 추가할 수 없습니다.');
    }

    // 대상 유저 존재 여부 검증
    await this.findById(dto.friendUserId);

    // 중복 친구 여부 검증
    const existing = await this.friendRepository.findOne({
      where: { userId, friendUserId: dto.friendUserId },
    });
    if (existing) {
      throw new ConflictException('이미 친구로 등록된 사용자입니다.');
    }

    const friendship = this.friendRepository.create({
      userId,
      friendUserId: dto.friendUserId,
    });
    return await this.friendRepository.save(friendship);
  }

  // 내 친구 목록 및 실시간 상태 조회
  async getFriends(userId: string) {
    const friendships = await this.friendRepository.find({
      where: { userId },
      relations: { friendUser: true },
    });

    return friendships.map((f) => ({
      id: f.id,
      friendUser: {
        id: f.friendUser?.id ?? f.friendUserId,
        loginId: f.friendUser?.loginId ?? '',
        name: f.friendUser?.name ?? '',
        profileImagePath: f.friendUser?.profileImagePath ?? null,
        isOnline: false, // 웹소켓 게이트웨이 연동 전 기본값
      },
      createdAt: f.createdAt,
    }));
  }
}
