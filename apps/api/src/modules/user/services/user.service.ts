import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityNotFoundError, QueryFailedError, type Repository } from 'typeorm';

import { UserStatus } from '@repo/constants/user';

import type {
  AddFriendRequest,
  FriendItemResponse,
  PublicUserProfileResponse,
  SelfUserProfileResponse,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
} from '#modules/user/controllers/user.dto.js';
import { UserFriendEntity } from '#modules/user/entities/user-friend.entity.js';
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

interface MySqlDriverError {
  code?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserFriendEntity)
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

  async findById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByLoginId(loginId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ loginId });
  }

  async findByLoginIdWithDeleted(loginId: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { loginId }, withDeleted: true });
  }

  async findAuthCredentialsById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      select: { id: true, loginId: true, role: true, passwordHash: true, status: true },
      where: { id },
    });
  }

  // 보안 매퍼 적용
  // 신규 추가 / 프로필 조회, 수정, 친구 관리 로직

  // 타인 프로필 조회 (민감 정보 제외)
  async getPublicProfile(userId: string): Promise<PublicUserProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (user === null) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      profileImagePath: user.profileImagePath,
      isOnline: false,
    };
  }

  // 본인 프로필 조회
  async getSelfProfile(userId: string): Promise<SelfUserProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (user === null) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }

    return this.toSelfProfileResponse(user);
  }

  // 프로필 수정
  async updateProfile(id: string, dto: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
    try {
      const result = await this.userRepository.update({ id }, dto);

      // 유저가 액세스 토큰 발급 직후 탈퇴처리된 경우 대비
      if (result.affected === 0) {
        throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
      }

      const updatedUser = await this.userRepository.findOneOrFail({
        select: { name: true, email: true },
        where: { id },
      });

      return { name: updatedUser.name, email: updatedUser.email };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // MySQL Unique 제약조건 위반
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as MySqlDriverError;

        if (driverError.code === 'ER_DUP_ENTRY') {
          throw new ConflictException('이미 사용 중인 이메일입니다.');
        }
      }

      // 검색 실패
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
      }

      throw error;
    }
  }

  // 본인 프로필 응답 매퍼 (활성 상태 가드 포함)
  private toSelfProfileResponse(user: UserEntity): SelfUserProfileResponse {
    if (user.status === UserStatus.WITHDRAWN) {
      throw new ForbiddenException('탈퇴 처리된 계정입니다.');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        '이용이 정지된 계정입니다. 자세한 사항은 고객센터로 문의해 주세요.',
      );
    }

    return {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileImagePath: user.profileImagePath,
      isOnline: true,
    };
  }

  // 친구 추가 요청
  async addFriend(userId: string, dto: AddFriendRequest): Promise<{ id: string }> {
    if (userId === dto.friendUserId) {
      throw new ConflictException('자기 자신을 친구로 추가할 수 없습니다.');
    }

    const targetUser = await this.userRepository.findOne({ where: { id: dto.friendUserId } });

    if (targetUser === null) {
      throw new NotFoundException('추가하려는 사용자가 존재하지 않습니다.');
    }

    const existing = await this.friendRepository.findOne({
      where: { userId, friendUserId: dto.friendUserId },
    });

    if (existing !== null) {
      throw new ConflictException('이미 친구로 등록된 사용자입니다.');
    }

    const friendship = this.friendRepository.create({
      userId,
      friendUserId: dto.friendUserId,
    });
    const saved = await this.friendRepository.save(friendship);

    return { id: saved.id };
  }

  // 친구 목록 조회
  async getFriends(userId: string): Promise<FriendItemResponse[]> {
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
        isOnline: false,
      },
    }));
  }

  async updatePasswordHash(id: string, newPasswordHash: string): Promise<void> {
    const result = await this.userRepository.update({ id }, { passwordHash: newPasswordHash });

    if (result.affected === 0) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }
  }
}
