import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AdminUserSortBy, AdminUserSortOrder } from '@repo/constants/admin';
import { UserRole, UserStatus } from '@repo/constants/user';

import {
  AdminChatRoomListResponseDto,
  AdminCreateUserRequestDto,
  AdminCreateUserResponseDto,
  AdminUpdateChatRoomTitleResponseDto,
  AdminUpdateUserStatusResponseDto,
  AdminUserListQueryRequestDto,
  AdminUserListQueryResponseDto,
} from '#modules/admin/controllers/admin.dto.js';
import { PasswordService } from '#modules/auth/services/password.service.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

interface UserCursorPayload {
  v: string | number; // loginId, name (문자열) 또는 createdAt (밀리초 타임스탬프)
  id: string; // user.id (동점자 처리용 고유 PK)
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    private readonly passwordService: PasswordService,
  ) {}

  async findAllUsers(query: AdminUserListQueryRequestDto): Promise<AdminUserListQueryResponseDto> {
    const { status, sortBy, sortOrder, limit, cursor } = query;

    const qb = this.userRepository.createQueryBuilder('user');

    // 1. Status 필터링 적용
    if (status !== undefined) {
      qb.andWhere('user.status = :status', { status });
    }

    // 2. Keyset 커서 조건 바인딩 (loginId, createdAt, name 공통)
    if (cursor !== undefined) {
      const decodedCursor = this.decodeCursor(cursor);
      const isDesc = sortOrder === AdminUserSortOrder.DESC;
      const operator = isDesc ? '<' : '>';

      // 정렬 기준값(v) 복원
      const sortValue =
        sortBy === AdminUserSortBy.CREATED_AT
          ? new Date(Number(decodedCursor.v))
          : String(decodedCursor.v);

      // 복합 조건: (정렬컬럼 < 기준값) OR (정렬컬럼 = 기준값 AND PK < 기준PK)
      qb.andWhere(
        `(user.${sortBy} ${operator} :sortValue OR (user.${sortBy} = :sortValue AND user.id ${operator} :cursorId))`,
        {
          sortValue,
          cursorId: decodedCursor.id,
        },
      );
    }

    // 3. 정렬 적용 (1순위: 선택된 sortBy, 2순위: 고유 PK)
    qb.orderBy(`user.${sortBy}`, sortOrder);
    qb.addOrderBy('user.id', sortOrder); // 정렬 대상과 무관하게 Tie-breaker로 항상 적용
    qb.take(limit + 1); // DB에 무거운 SELECT COUNT(*) 쿼리를 날리지 않고도 단 1회의 쿼리로 "다음 페이지 존재 여부"를 판별하기 위함

    const users = await qb.getMany();

    // 4. 페이지 슬라이싱
    const hasNextPage = users.length > limit;
    const items = hasNextPage ? users.slice(0, limit) : users;

    // 5. nextCursor 생성
    let nextCursor: string | null = null;

    if (hasNextPage && items.length > 0) {
      const lastItem = items.at(-1);

      if (lastItem === undefined) {
        throw new Error('Unreachable: items must not be empty');
      }

      const cursorValue =
        sortBy === AdminUserSortBy.CREATED_AT ? lastItem.createdAt.getTime() : lastItem[sortBy];

      nextCursor = this.encodeCursor({
        v: cursorValue,
        id: lastItem.id,
      });
    }

    return {
      items: items.map((user) => ({
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      })),
      nextCursor,
      hasNextPage,
    };
  }

  private encodeCursor(payload: UserCursorPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private decodeCursor(cursor: string): UserCursorPayload {
    try {
      const json = Buffer.from(cursor, 'base64url').toString('utf-8');

      return JSON.parse(json) as UserCursorPayload;
    } catch {
      throw new BadRequestException('유효하지 않은 커서 토큰입니다.');
    }
  }

  async updateUserStatus(
    id: string,
    targetStatus: UserStatus,
  ): Promise<AdminUpdateUserStatusResponseDto> {
    if (targetStatus === UserStatus.WITHDRAWN) {
      throw new BadRequestException('탈퇴 상태로 변경할 수 없습니다. (유저 삭제 API를 사용하세요)');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, status: true, updatedAt: true },
    });

    if (user === null) {
      throw new NotFoundException(`ID가 '${id}'인 사용자를 찾을 수 없습니다.`);
    }

    if (user.status === UserStatus.WITHDRAWN) {
      throw new BadRequestException('탈퇴한 사용자의 상태는 변경할 수 없습니다.');
    }

    // 멱등성 보장: 상태가 이미 동일하면 update 쿼리 생략
    if (user.status === targetStatus) {
      return {
        id: user.id,
        status: user.status,
        updatedAt: user.updatedAt.toISOString(),
      };
    }

    user.status = targetStatus;

    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    // 대상 유저가 없거나 이미 soft-deleted 상태인 경우 affected는 0
    if (result.affected === 0) {
      throw new NotFoundException(`ID가 '${id}'인 사용자를 찾을 수 없거나 이미 삭제되었습니다.`);
    }
  }

  async createUser(dto: AdminCreateUserRequestDto): Promise<AdminCreateUserResponseDto> {
    // 1. loginId 중복 검사
    const existingUser = await this.userRepository.findOne({
      where: { loginId: dto.loginId },
      select: { id: true },
    });

    if (existingUser !== null) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    // 2. 비밀번호 암호화
    const passwordHash = await this.passwordService.hash(dto.password);

    // 3. 유저 엔티티 생성 (초기 상태 ACTIVE 자동 부여)
    const user = this.userRepository.create({
      loginId: dto.loginId,
      passwordHash,
      role: dto.role,
      name: dto.name,
      email: dto.email,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      loginId: savedUser.loginId,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      status: savedUser.status,
      createdAt: savedUser.createdAt.toISOString(),
    };
  }

  async findAllChatRooms(): Promise<AdminChatRoomListResponseDto> {
    // 생성일 내림차순 조회
    const rooms = await this.roomRepository.find({
      relations: { creatorUser: true },
      order: { createdAt: 'DESC' },
    });

    const items = rooms.map((room) => ({
      id: room.id,
      title: room.title,
      creatorLoginId: room.creatorUser?.loginId ?? '알 수 없음',
      memberCount: room.memberCount,
      createdAt: room.createdAt.toISOString(),
    }));

    return {
      items,
      totalCount: items.length,
    };
  }

  async updateChatRoomTitle(
    roomId: string,
    title: string,
  ): Promise<AdminUpdateChatRoomTitleResponseDto> {
    const room = await this.roomRepository.findOneBy({ id: roomId });

    if (room === null) {
      throw new NotFoundException('존재하지 않는 채팅방입니다.');
    }

    room.title = title;

    const updatedRoom = await this.roomRepository.save(room);

    return {
      id: updatedRoom.id,
      title: updatedRoom.title,
      updatedAt: updatedRoom.updatedAt.toISOString(),
    };
  }

  async deleteChatRoom(roomId: string): Promise<void> {
    const result = await this.roomRepository.softDelete(roomId);

    if (result.affected === 0) {
      throw new NotFoundException('채팅방이 없습니다.');
    }
  }
}
