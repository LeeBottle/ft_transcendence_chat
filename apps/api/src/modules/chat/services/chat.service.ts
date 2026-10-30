import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, IsNull, Repository } from 'typeorm';

import { ChatRoomMemberRole, ChatRoomMemberStatus } from '@repo/constants/chat-room-member';
import { UserStatus } from '@repo/constants/user';

import type {
  ChatRoomListResponseDto,
  ChatRoomMemberListResponseDto,
  CreateChatRoomRequestDto,
  CreateChatRoomResponseDto,
} from '#modules/chat/controllers/chat.dto.js';
import { ChatRoomMemberEntity } from '#modules/chat/entities/chat-room-member.entity.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { RedisService } from '#modules/chat/services/redis.service.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

// 참여자 목록 정렬: 방장 → 운영자 → 일반, 같으면 입장 순
const ROLE_ORDER: Record<ChatRoomMemberRole, number> = {
  [ChatRoomMemberRole.OWNER]: 0,
  [ChatRoomMemberRole.MANAGER]: 1,
  [ChatRoomMemberRole.MEMBER]: 2,
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatRoomMemberEntity)
    private readonly memberRepository: Repository<ChatRoomMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  // 채팅방 참여자 목록 — 방 멤버만 조회 가능. isOnline 은 "이 방 소켓에 접속 중" 여부.
  async findRoomMembers(
    roomId: string,
    requesterId: string,
  ): Promise<ChatRoomMemberListResponseDto> {
    await this.validateRoomAccess(roomId, requesterId);

    const rows = await this.memberRepository.find({
      where: { chatRoomId: roomId, status: ChatRoomMemberStatus.ACTIVE },
      relations: { user: true },
    });

    let onlineUserIds: string[] = [];

    try {
      onlineUserIds = await this.redisService.smembers(`chat:room:${roomId}:users`);
    } catch {
      // Redis 장애 시 전원 오프라인으로 (표시용이라 치명적 아님)
    }

    const onlineSet = new Set(onlineUserIds);

    const members = rows
      .filter((row): row is ChatRoomMemberEntity & { user: UserEntity } => row.user !== undefined)
      .map((row) => ({
        userId: row.userId,
        loginId: row.user.loginId,
        name: row.user.name,
        profileImagePath: row.user.profileImagePath,
        role: row.role,
        joinedAt: row.joinedAt.toISOString(),
        isOnline: onlineSet.has(row.userId),
      }))
      .sort((a, b) => {
        const byRole = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];

        return byRole !== 0 ? byRole : a.joinedAt.localeCompare(b.joinedAt);
      });

    return { members };
  }

  async findJoinedChatRoomsByUserId(userId: string): Promise<ChatRoomListResponseDto> {
    const members = await this.memberRepository.find({
      where: {
        userId,
        status: ChatRoomMemberStatus.ACTIVE,
        chatRoom: { deletedAt: IsNull() },
      },
      relations: { chatRoom: true },
      order: { chatRoom: { updatedAt: 'DESC' } },
    });

    return {
      rooms: members.map((m) => {
        const room = m.chatRoom;

        if (room === undefined) {
          throw new InternalServerErrorException(
            `채팅방 관계 데이터가 정상적으로 로드되지 않았습니다. (memberId: ${m.id})`,
          );
        }

        return {
          roomId: m.chatRoomId,
          title: room.title,
          role: m.role,
          // member_count 는 bigint 라 드라이버가 문자열로 줄 수 있음 → 스키마(z.coerce)가 숫자로 변환
          memberCount: room.memberCount,
          closedAt: room.closedAt?.toISOString() ?? null,
          updatedAt: room.updatedAt.toISOString(),
        };
      }),
    };
  }
  async validateRoomAccess(roomId: string, userId: string): Promise<void> {
    // 1. I/O 지연 최소화를 위해 유저, 방, 멤버십 정보를 병렬 조회
    const [user, room, member] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId, deletedAt: IsNull() },
        select: { id: true, status: true },
      }),
      this.roomRepository.findOne({
        where: { id: roomId, deletedAt: IsNull() },
        select: { id: true, deletedAt: true },
      }),
      this.memberRepository.findOne({
        where: {
          chatRoomId: roomId,
          userId,
          status: ChatRoomMemberStatus.ACTIVE,
        },
        select: { id: true, status: true },
      }),
    ]);

    // 2. 유저 존재 및 상태 검증 (Fail-Fast)
    if (user === null) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('정지되었거나 비활성화된 계정은 채팅방에 접근할 수 없습니다.');
    }

    // 3. 채팅방 존재 및 소프트 딜리트 검증 (closedAt 상태는 허용)
    if (room === null) {
      throw new NotFoundException('존재하지 않거나 삭제된 채팅방입니다.');
    }

    // 4. 활성 멤버십(ACTIVE) 검증 (미가입, 강퇴, 탈퇴 차단)
    if (member === null) {
      throw new ForbiddenException('해당 채팅방에 참여 중인 멤버만 접근할 수 있습니다.');
    }
  }

  async createRoom(
    creatorUserId: string,
    dto: CreateChatRoomRequestDto,
  ): Promise<CreateChatRoomResponseDto> {
    // 1. 중복 제거된 요청 loginId 목록 추출
    const uniqueTargetLoginIds = Array.from(new Set(dto.memberUserLoginIds));
    let targetMemberUsers: Pick<UserEntity, 'id' | 'loginId'>[] = [];

    // 2. loginId 기준으로 DB 유저 조회 및 존재 여부 검증 (404 예외 처리)
    if (uniqueTargetLoginIds.length > 0) {
      const existingUsers = await this.userRepository.find({
        select: { id: true, loginId: true },
        where: { loginId: In(uniqueTargetLoginIds), status: UserStatus.ACTIVE },
      });

      if (existingUsers.length !== uniqueTargetLoginIds.length) {
        throw new NotFoundException('존재하지 않거나 활성 상태가 아닌 사용자가 포함되어 있습니다.');
      }

      // 방장 본인이 초대 목록에 포함되어 있다면 일반 멤버 등록 대상에서 제외
      targetMemberUsers = existingUsers.filter((user) => user.id !== creatorUserId);
    }

    // 3. 채팅방 생성 및 저장
    const room = await this.roomRepository.save(
      this.roomRepository.create({
        creatorUserId,
        title: dto.title,
        memberCount: targetMemberUsers.length + 1, // 방장 포함
      }),
    );

    // 4. 방장 등록 (OWNER)
    await this.memberRepository.save(
      this.memberRepository.create({
        chatRoomId: room.id,
        userId: creatorUserId,
        role: ChatRoomMemberRole.OWNER,
        status: ChatRoomMemberStatus.ACTIVE,
        joinedAt: new Date(),
      }),
    );

    // 5. 일반 멤버 일괄 등록 (MEMBER: 조회된 실제 PK user.id 매핑)
    if (targetMemberUsers.length > 0) {
      await this.memberRepository.save(
        this.memberRepository.create(
          targetMemberUsers.map((user) => ({
            chatRoomId: room.id,
            userId: user.id, // loginId로 찾아낸 실제 PK(id)를 바인딩
            role: ChatRoomMemberRole.MEMBER,
            status: ChatRoomMemberStatus.ACTIVE,
            joinedAt: new Date(),
          })),
        ),
      );
    }

    return { roomId: room.id, title: room.title };
  }

  async closeRoom(roomId: string, ownerUserId: string): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId, deletedAt: IsNull() },
    });

    if (room === null) {
      throw new NotFoundException('채팅방이 이미 삭제되었거나 존재하지 않습니다.');
    }

    const user = await this.memberRepository.findOne({
      where: {
        chatRoomId: roomId,
        userId: ownerUserId,
        status: ChatRoomMemberStatus.ACTIVE,
        role: ChatRoomMemberRole.OWNER,
      },
    });

    if (user === null) {
      throw new ForbiddenException('방장만 회의 종료 가능합니다.');
    }

    room.closedAt = new Date();
    await this.roomRepository.save(room);
  }
}
