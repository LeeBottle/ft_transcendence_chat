import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityNotFoundError, Like, Not, QueryFailedError, type Repository } from 'typeorm';

import { UserStatus } from '@repo/constants/user';
import type { SearchUsersQuery, UserSearchItemResponse } from '@repo/schemas/user';

import { UserSessionService } from '#modules/auth/services/user-session.service.js';
import type {
  GetMyFriendsResponseDto,
  ProfileResponseDto,
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
    private readonly userSessionService: UserSessionService,
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
    // passwordHash 는 엔티티에서 select:false → 로그인 검증용으로 명시적으로 포함
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.loginId = :loginId', { loginId })
      .withDeleted()
      .getOne();
  }

  async findAuthCredentialsById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      select: { id: true, loginId: true, role: true, passwordHash: true, status: true },
      where: { id },
    });
  }

  // 유저 검색 — loginId / name 부분 일치 (대소문자 무시: 테이블 기본 collation), 활성 유저, 본인 제외
  async search(meId: string, params: SearchUsersQuery): Promise<UserSearchItemResponse[]> {
    const pattern = `%${params.q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
    const base = { status: UserStatus.ACTIVE, id: Not(meId) };

    const users = await this.userRepository.find({
      where: [
        { ...base, loginId: Like(pattern) },
        { ...base, name: Like(pattern) },
      ],
      take: params.limit,
      order: { loginId: 'ASC' },
    });

    return users.map((user) => ({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      profileImagePath: user.profileImagePath,
    }));
  }

  async profile(id: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOneBy({ id });

    if (user === null) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }

    const userPresences = await this.userSessionService.getUserPresences([id]);

    return {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileImagePath: user.profileImagePath,
      isOnline: userPresences.userPresences[0]?.isOnline ?? false,
      createdAt: user.createdAt.toISOString(),
    };
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

  async addFriend(userId: string, friendUserId: string): Promise<void> {
    if (userId === friendUserId) {
      throw new ConflictException('자기 자신을 친구로 추가할 수 없습니다.');
    }

    const friend = await this.userRepository.findOneBy({ id: friendUserId });

    if (friend === null) {
      throw new NotFoundException('추가하려는 사용자가 존재하지 않습니다.');
    }

    const existing = await this.friendRepository.findOneBy({ userId, friendUserId });

    if (existing !== null) {
      throw new ConflictException('이미 친구로 등록된 사용자입니다.');
    }

    await this.friendRepository.save(this.friendRepository.create({ userId, friendUserId }));
  }

  async deleteFriend(userId: string, friendUserId: string): Promise<void> {
    const result = await this.friendRepository.delete({ userId, friendUserId });

    if (result.affected === 0) {
      throw new NotFoundException('친구를 찾을 수 없습니다.');
    }
  }

  async getFriends(userId: string): Promise<GetMyFriendsResponseDto> {
    const friendships = await this.friendRepository.find({
      where: { userId },
      relations: { friendUser: true },
    });

    if (friendships.length === 0) {
      return { friends: [] };
    }

    // 1. N+1 방지를 위해 모든 친구의 userId를 수집하여 1회의 Batch 쿼리로 온라인 상태 조회
    const friendUserIds = friendships.map((f) => f.friendUserId);
    const { userPresences } = await this.userSessionService.getUserPresences(friendUserIds);

    // 2. O(1) 조회를 위한 Presence Map 생성
    const presenceMap = new Map<string, boolean>(userPresences.map((p) => [p.userId, p.isOnline]));

    const friends: ProfileResponseDto[] = [];

    for (const friendship of friendships) {
      const friend = friendship.friendUser;

      // undefined 가드: 아래 라인부터 friend는 확실한 UserEntity로 자동 Narrowing 됨
      if (friend === undefined) {
        continue;
      }

      friends.push({
        id: friend.id,
        loginId: friend.loginId,
        name: friend.name,
        email: friend.email,
        role: friend.role,
        status: friend.status,
        profileImagePath: friend.profileImagePath,
        isOnline: presenceMap.get(friend.id) ?? false,
        createdAt: friend.createdAt.toISOString(),
      });
    }

    return { friends };
  }

  async updatePasswordHash(id: string, newPasswordHash: string): Promise<void> {
    const result = await this.userRepository.update({ id }, { passwordHash: newPasswordHash });

    if (result.affected === 0) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }
  }
}
