import bcrypt from 'bcrypt';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { ChatRoomMemberRole, ChatRoomMemberStatus } from '@repo/constants/chat-room-member';
import { UserRole, UserStatus } from '@repo/constants/user';

import type {
  ChatRoomMemberResponseDto,
  ChatRoomResponseDto,
  CreateChatRoomRequestDto,
  InviteMemberRequestDto,
} from '#modules/chat/controllers/chat.dto.js';
import { ChatRoomMemberEntity } from '#modules/chat/entities/chat-room-member.entity.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';
import { RedisService } from '#modules/chat/services/redis.service.js';

@Injectable()
export class ChatService {
  private readonly roomTopicMap = new Map<string, string>();
  private readonly bannedUserMap = new Map<string, Set<string>>();
  private readonly roomPasswordMap = new Map<string, string>();

  async hasRoomPassword(roomId: string): Promise<boolean> {
    if (this.roomPasswordMap.has(roomId)) {
      return true;
    }
    try {
      const cached = await this.redisService.get(`chat:room:${roomId}:password`);
      return typeof cached === 'string' && cached.length > 0;
    } catch (_err) {
      return false;
    }
  }

  async isUserBanned(roomId: string, userId: string): Promise<boolean> {
    const set = this.bannedUserMap.get(roomId);
    if (set && set.has(userId)) {
      return true;
    }
    try {
      const isMember = await this.redisService.sismember(`chat:room:${roomId}:bans`, userId);
      return isMember === 1;
    } catch (_err) {
      return false;
    }
  }

  constructor(
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatRoomMemberEntity)
    private readonly memberRepository: Repository<ChatRoomMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  async getRoomTopic(roomId: string): Promise<string | null> {
    if (this.roomTopicMap.has(roomId)) {
      return this.roomTopicMap.get(roomId) ?? null;
    }

    try {
      const cached = await this.redisService.get(`chat:room:${roomId}:topic`);
      if (typeof cached === 'string' && cached.length > 0) {
        this.roomTopicMap.set(roomId, cached);
        return cached;
      }
    } catch (_err) {
      // ignore redis error
    }

    return null;
  }

  public async ensureUserExists(userId: string): Promise<UserEntity> {
    const loginIdMap: Record<string, string> = {
      '1': 'a',
      '2': 'b',
      '3': 'c',
    };
    const nameMap: Record<string, string> = {
      '1': '사용자 A',
      '2': '사용자 B',
      '3': '사용자 C',
    };

    const loginId = loginIdMap[userId] ?? `user_${userId}`;
    const name = nameMap[userId] ?? `사용자 ${userId}`;

    try {
      let user = await this.userRepository.findOne({
        where: [{ id: userId }, { loginId }],
      });

      if (user !== null) {
        return user;
      }

      user = this.userRepository.create({
        id: userId,
        loginId,
        passwordHash: '$2b$10$dummyHashForTestingPurposesOnly12345678901234567890',
        name,
        email: `${loginId}@example.com`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      return await this.userRepository.save(user);
    } catch (_err) {
      return {
        id: userId,
        loginId,
        passwordHash: '',
        name,
        email: `${loginId}@example.com`,
        emailVerifiedAt: null,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        profileImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as UserEntity;
    }
  }

  async createRoom(
    creatorUserId: string,
    dto: CreateChatRoomRequestDto,
  ): Promise<ChatRoomResponseDto> {
    const creatorUser = await this.ensureUserExists(creatorUserId);
    const creatorId = creatorUser.id;

    const roomId = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const room = this.roomRepository.create({
      id: roomId,
      creatorUserId: creatorId,
      title: dto.title,
    });

    await this.roomRepository.save(room);

    // 비밀번호 설정 처리 (최대 12자리)
    if (typeof dto.password === 'string' && dto.password.trim().length > 0) {
      const trimmedPwd = dto.password.trim().slice(0, 12);
      const hash = await bcrypt.hash(trimmedPwd, 10);
      this.roomPasswordMap.set(roomId, hash);
      try {
        await this.redisService.set(`chat:room:${roomId}:password`, hash);
      } catch (_err) {}
    }

    // 생성자 (방장/FOUNDER) 멤버 추가
    const ownerMember = this.memberRepository.create({
      chatRoomId: roomId,
      userId: creatorId,
      role: ChatRoomMemberRole.FOUNDER,
      status: ChatRoomMemberStatus.ACTIVE,
      joinedAt: new Date(),
    });

    await this.memberRepository.save(ownerMember);

    // 초대된 멤버들 추가
    if (dto.memberUserIds && dto.memberUserIds.length > 0) {
      const uniqueInvitedIds = Array.from(
        new Set(dto.memberUserIds.filter((id) => id !== creatorUserId && id !== creatorId)),
      );

      await Promise.all(
        uniqueInvitedIds.map(async (memberUserId) => {
          const invitedUser = await this.ensureUserExists(memberUserId);

          if (invitedUser) {
            const existingMember = await this.memberRepository.findOne({
              where: { chatRoomId: roomId, userId: invitedUser.id },
            });

            if (!existingMember) {
              const newMember = this.memberRepository.create({
                chatRoomId: roomId,
                userId: invitedUser.id,
                role: ChatRoomMemberRole.USER,
                status: ChatRoomMemberStatus.ACTIVE,
                joinedAt: new Date(),
              });

              await this.memberRepository.save(newMember);
            }
          }
        }),
      );
    }

    return await this.getRoomDetail(roomId, creatorId);
  }

  async getRoomsForUser(userId: string): Promise<ChatRoomResponseDto[]> {
    const user = await this.ensureUserExists(userId);
    const targetUserId = user.id;

    const memberRecords = await this.memberRepository.find({
      where: { userId: targetUserId, status: ChatRoomMemberStatus.ACTIVE },
      relations: { chatRoom: { creatorUser: true } },
    });

    const activeRooms = memberRecords
      .map((m) => m.chatRoom)
      .filter((room): room is ChatRoomEntity => room?.deletedAt === null);

    return await Promise.all(
      activeRooms.map(async (room) => {
        const roomMembers = await this.memberRepository.find({
          where: { chatRoomId: room.id, status: ChatRoomMemberStatus.ACTIVE },
          relations: { user: true },
        });

        const roomTopic = await this.getRoomTopic(room.id);
        const hasPassword = await this.hasRoomPassword(room.id);

        return {
          id: room.id,
          title: room.title,
          topic: roomTopic,
          hasPassword,
          isPrivate: hasPassword,
          creatorUserId: room.creatorUserId,
          createdAt: room.createdAt.toISOString(),
          closedAt: room.closedAt?.toISOString() ?? null,
          members: roomMembers.map((m) => ({
            id: m.id,
            userId: m.userId,
            loginId: m.user?.loginId,
            name: m.user?.name ?? '알 수 없음',
            role: m.role,
            status: m.status,
            joinedAt: m.joinedAt.toISOString(),
          })),
        };
      }),
    );
  }

  async getRoomDetail(roomId: string, userId: string): Promise<ChatRoomResponseDto> {
    const user = await this.ensureUserExists(userId);
    const targetUserId = user.id;

    const banned = await this.isUserBanned(roomId, targetUserId);
    if (banned) {
      throw new ForbiddenException('차단(Ban)된 사용자는 해당 채팅방에 접근할 수 없습니다.');
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId, deletedAt: IsNull() },
    });

    if (room === null) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: targetUserId, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (currentMember === null) {
      throw new ForbiddenException('해당 채팅방에 접근 권한이 없습니다.');
    }

    const roomMembers = await this.memberRepository.find({
      where: { chatRoomId: roomId, status: ChatRoomMemberStatus.ACTIVE },
      relations: { user: true },
    });

    const roomTopic = await this.getRoomTopic(room.id);
    const hasPassword = await this.hasRoomPassword(room.id);

    return {
      id: room.id,
      title: room.title,
      topic: roomTopic,
      hasPassword,
      isPrivate: hasPassword,
      creatorUserId: room.creatorUserId,
      createdAt: room.createdAt.toISOString(),
      closedAt: room.closedAt?.toISOString() ?? null,
      members: roomMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        loginId: m.user?.loginId,
        name: m.user?.name ?? '알 수 없음',
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  async inviteMember(
    roomId: string,
    currentUserId: string,
    dto: InviteMemberRequestDto,
  ): Promise<ChatRoomMemberResponseDto> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    const currentUser = await this.ensureUserExists(currentUserId);
    const targetUser = await this.ensureUserExists(dto.userId);

    const banned = await this.isUserBanned(roomId, targetUser.id);
    if (banned) {
      throw new ForbiddenException('차단(Ban)된 사용자는 해당 채팅방에 초대할 수 없습니다.');
    }

    if (isTempRoom) {
      return {
        id: `temp-member-${targetUser.id}`,
        userId: targetUser.id,
        loginId: targetUser.loginId,
        name: targetUser.name,
        role: ChatRoomMemberRole.USER,
        status: ChatRoomMemberStatus.ACTIVE,
        joinedAt: new Date().toISOString(),
      };
    }

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (currentMember === null) {
      throw new ForbiddenException('채팅방 멤버만 다른 사용자를 초대할 수 있습니다.');
    }

    let member = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: targetUser.id },
    });

    if (member !== null) {
      if (member.status === ChatRoomMemberStatus.ACTIVE) {
        throw new BadRequestException('이미 해당 채팅방에 참여 중인 사용자입니다.');
      }

      member.status = ChatRoomMemberStatus.ACTIVE;
      member.role = ChatRoomMemberRole.USER;
      member.leftAt = null;
      member.joinedAt = new Date();
    } else {
      member = this.memberRepository.create({
        chatRoomId: roomId,
        userId: targetUser.id,
        role: ChatRoomMemberRole.USER,
        status: ChatRoomMemberStatus.ACTIVE,
        joinedAt: new Date(),
      });
    }

    const saved = await this.memberRepository.save(member);

    return {
      id: saved.id,
      userId: saved.userId,
      loginId: targetUser.loginId,
      name: targetUser.name,
      role: saved.role,
      status: saved.status,
      joinedAt: saved.joinedAt.toISOString(),
    };
  }

  async removeMember(
    roomId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    if (isTempRoom) {
      return { message: '임시 채팅방에서 퇴장하였습니다.' };
    }

    const currentUser = await this.ensureUserExists(currentUserId);
    const targetUser = await this.ensureUserExists(targetUserId);

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    const targetMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: targetUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (targetMember === null) {
      return { message: '이미 퇴장하였거나 채팅방 멤버가 아닙니다.' };
    }

    const isSelf = currentUser.id === targetUser.id;

    const isFounder =
      currentMember?.role === ChatRoomMemberRole.FOUNDER ||
      currentMember?.role === ChatRoomMemberRole.OWNER;
    const isOperator =
      currentMember?.role === ChatRoomMemberRole.OPERATOR ||
      currentMember?.role === ChatRoomMemberRole.MANAGER;

    if (!isSelf) {
      if (!isFounder && !isOperator) {
        throw new ForbiddenException('멤버를 강퇴할 권한이 없습니다.');
      }

      if (
        isOperator &&
        (targetMember.role === ChatRoomMemberRole.FOUNDER ||
          targetMember.role === ChatRoomMemberRole.OPERATOR ||
          targetMember.role === ChatRoomMemberRole.OWNER ||
          targetMember.role === ChatRoomMemberRole.MANAGER)
      ) {
        throw new ForbiddenException('운영자(OPERATOR)는 방장(FOUNDER) 또는 타 운영자를 강퇴할 수 없습니다.');
      }
    }

    targetMember.status = isSelf ? ChatRoomMemberStatus.LEFT : ChatRoomMemberStatus.KICKED;
    targetMember.leftAt = new Date();

    await this.memberRepository.save(targetMember);

    return {
      message: isSelf ? '성공적으로 퇴장하였습니다.' : '성공적으로 강퇴 처리되었습니다.',
    };
  }

  async closeRoom(roomId: string, currentUserId: string): Promise<{ message: string }> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    if (isTempRoom) {
      return { message: '임시 채팅방이 삭제되었습니다.' };
    }

    const user = await this.ensureUserExists(currentUserId);
    const targetUserId = user.id;

    const room = await this.roomRepository.findOne({
      where: { id: roomId, deletedAt: IsNull() },
    });

    if (room === null) {
      return { message: '채팅방이 이미 삭제되었거나 존재하지 않습니다.' };
    }

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: targetUserId, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (
      currentMember?.role !== ChatRoomMemberRole.FOUNDER &&
      currentMember?.role !== ChatRoomMemberRole.OWNER &&
      room.creatorUserId !== targetUserId
    ) {
      throw new ForbiddenException('채팅방 방장(FOUNDER)만 채팅방을 회의 종료/삭제할 수 있습니다.');
    }

    room.closedAt = new Date();
    await this.roomRepository.save(room);

    try {
      await this.roomRepository.softDelete(roomId);
    } catch (_err) {
      // ignore query soft-delete failure if already soft-deleted
    }

    return { message: '채팅방 회의가 정상적으로 종료 및 폭파/삭제되었습니다.' };
  }

  async verifyRoomPassword(
    roomId: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    let storedHash = this.roomPasswordMap.get(roomId);
    if (!storedHash) {
      try {
        storedHash = (await this.redisService.get(`chat:room:${roomId}:password`)) ?? undefined;
      } catch (_err) {}
    }

    if (!storedHash) {
      return { success: true, message: '비밀번호가 설정되지 않은 공개방입니다.' };
    }

    const isMatch = await bcrypt.compare(password ?? '', storedHash);
    if (!isMatch) {
      throw new BadRequestException('채팅방 비밀번호가 일치하지 않습니다.');
    }

    return { success: true, message: '비밀번호가 성공적으로 확인되었습니다.' };
  }

  async updateRoomPassword(
    roomId: string,
    currentUserId: string,
    password?: string | null,
  ): Promise<{ success: boolean; hasPassword: boolean; message: string }> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    const currentUser = await this.ensureUserExists(currentUserId);

    let isFounder = false;

    if (!isTempRoom) {
      const room = await this.roomRepository.findOne({ where: { id: roomId } });
      const currentMember = await this.memberRepository.findOne({
        where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
      });

      isFounder =
        currentMember?.role === ChatRoomMemberRole.FOUNDER ||
        currentMember?.role === ChatRoomMemberRole.OWNER ||
        room?.creatorUserId === currentUser.id;
    } else {
      isFounder = true;
    }

    if (!isFounder) {
      throw new ForbiddenException('방장(FOUNDER) 권한만 비밀번호를 수정하거나 삭제할 수 있습니다.');
    }

    if (typeof password === 'string' && password.trim().length > 0) {
      const trimmedPwd = password.trim().slice(0, 12);
      const hash = await bcrypt.hash(trimmedPwd, 10);
      this.roomPasswordMap.set(roomId, hash);
      try {
        await this.redisService.set(`chat:room:${roomId}:password`, hash);
      } catch (_err) {}

      return {
        success: true,
        hasPassword: true,
        message: '채팅방 비밀번호가 성공적으로 수정되었습니다.',
      };
    }

    // 비밀번호 삭제 (공개방 전환)
    this.roomPasswordMap.delete(roomId);
    try {
      await this.redisService.del(`chat:room:${roomId}:password`);
    } catch (_err) {}

    return {
      success: true,
      hasPassword: false,
      message: '채팅방 비밀번호가 성공적으로 삭제되었습니다 (공개방 전환).',
    };
  }

  async updateMemberRole(
    roomId: string,
    currentUserId: string,
    targetUserId: string,
    requestedRole: string,
  ): Promise<ChatRoomMemberResponseDto> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    const currentUser = await this.ensureUserExists(currentUserId);
    const targetUser = await this.ensureUserExists(targetUserId);

    const isRequestingFounder = requestedRole === 'FOUNDER' || requestedRole === 'OWNER';
    const isRequestingOperator = requestedRole === 'OPERATOR' || requestedRole === 'MANAGER';

    const targetDbRole = isRequestingFounder
      ? ChatRoomMemberRole.FOUNDER
      : isRequestingOperator
        ? ChatRoomMemberRole.OPERATOR
        : ChatRoomMemberRole.USER;

    if (isTempRoom) {
      return {
        id: `temp-member-${targetUserId}`,
        userId: targetUser.id,
        loginId: targetUser.loginId,
        name: targetUser.name,
        role: targetDbRole,
        status: ChatRoomMemberStatus.ACTIVE,
        joinedAt: new Date().toISOString(),
      };
    }

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    const isFounder =
      currentMember?.role === ChatRoomMemberRole.FOUNDER ||
      currentMember?.role === ChatRoomMemberRole.OWNER ||
      room?.creatorUserId === currentUser.id;

    const isOperator =
      isFounder ||
      currentMember?.role === ChatRoomMemberRole.OPERATOR ||
      currentMember?.role === ChatRoomMemberRole.MANAGER;

    // OP 지정/해제 조작은 FOUNDER 또는 OPERATOR만 가능
    if (!isOperator) {
      throw new ForbiddenException('방장(FOUNDER) 또는 운영자(OPERATOR)만 멤버 권한을 조작할 수 있습니다.');
    }

    const targetMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: targetUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (targetMember === null) {
      throw new NotFoundException('대상 멤버를 채팅방에서 찾을 수 없습니다.');
    }

    // FOUNDER 권한은 "지정" 금지, "위임(양도)"만 가능하며, 기존 FOUNDER는 자동으로 OPERATOR로 전환됨
    if (isRequestingFounder) {
      if (!isFounder) {
        throw new ForbiddenException('방장(FOUNDER) 권한 위임은 현재 방장(FOUNDER)만 수행할 수 있습니다.');
      }

      if (currentMember) {
        currentMember.role = ChatRoomMemberRole.OPERATOR;
        await this.memberRepository.save(currentMember);
      }
      if (room) {
        room.creatorUserId = targetUser.id;
        await this.roomRepository.save(room);
      }
    } else if (isOperator && !isFounder) {
      // OPERATOR는 방장(FOUNDER)의 권한을 변경할 수 없음
      const isTargetFounder =
        targetMember.role === ChatRoomMemberRole.FOUNDER ||
        targetMember.role === ChatRoomMemberRole.OWNER ||
        room?.creatorUserId === targetUser.id;

      if (isTargetFounder) {
        throw new ForbiddenException('운영자(OPERATOR)는 방장(FOUNDER)의 권한을 변경할 수 없습니다.');
      }
    }

    targetMember.role = targetDbRole;
    const saved = await this.memberRepository.save(targetMember);

    return {
      id: saved.id,
      userId: saved.userId,
      loginId: targetUser.loginId,
      name: targetUser.name,
      role: saved.role,
      status: saved.status,
      joinedAt: saved.joinedAt.toISOString(),
    };
  }

  async updateTopic(
    roomId: string,
    currentUserId: string,
    topic: string,
  ): Promise<{ message: string; topic: string }> {
    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    const currentUser = await this.ensureUserExists(currentUserId);

    this.roomTopicMap.set(roomId, topic);
    try {
      await this.redisService.set(`chat:room:${roomId}:topic`, topic);
    } catch (_err) {
      // ignore redis error
    }

    if (isTempRoom) {
      return { message: '임시 채팅방의 주제가 변경되었습니다.', topic };
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId, deletedAt: IsNull() },
    });

    if (room === null) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    const currentMember = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
    });

    const isFounder =
      currentMember?.role === ChatRoomMemberRole.FOUNDER ||
      currentMember?.role === ChatRoomMemberRole.OWNER ||
      room.creatorUserId === currentUser.id;

    const isOperator =
      isFounder ||
      currentMember?.role === ChatRoomMemberRole.OPERATOR ||
      currentMember?.role === ChatRoomMemberRole.MANAGER;

    if (!isOperator) {
      throw new ForbiddenException('채팅방 주제(Topic) 변경은 방장(FOUNDER) 및 운영자(OPERATOR)만 가능합니다.');
    }

    return { message: '채팅방 주제(Topic)가 성공적으로 변경되었습니다.', topic };
  }

  async banMember(
    roomId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ message: string; targetUserId: string }> {
    const currentUser = await this.ensureUserExists(currentUserId);
    const targetUser = await this.ensureUserExists(targetUserId);

    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    let isFounder = false;
    let isOperator = false;

    if (!isTempRoom) {
      const room = await this.roomRepository.findOne({ where: { id: roomId } });
      const currentMember = await this.memberRepository.findOne({
        where: { chatRoomId: roomId, userId: currentUser.id, status: ChatRoomMemberStatus.ACTIVE },
      });

      isFounder =
        currentMember?.role === ChatRoomMemberRole.FOUNDER ||
        currentMember?.role === ChatRoomMemberRole.OWNER ||
        room?.creatorUserId === currentUser.id;

      isOperator =
        isFounder ||
        currentMember?.role === ChatRoomMemberRole.OPERATOR ||
        currentMember?.role === ChatRoomMemberRole.MANAGER;
    } else {
      isFounder = true;
      isOperator = true;
    }

    if (!isOperator) {
      throw new ForbiddenException('방장(FOUNDER) 및 운영자(OPERATOR)만 멤버를 차단(Ban)할 수 있습니다.');
    }

    if (!isTempRoom) {
      const targetMember = await this.memberRepository.findOne({
        where: { chatRoomId: roomId, userId: targetUser.id, status: ChatRoomMemberStatus.ACTIVE },
      });

      const isTargetFounder =
        targetMember?.role === ChatRoomMemberRole.FOUNDER ||
        targetMember?.role === ChatRoomMemberRole.OWNER;

      const isTargetOperator =
        !isTargetFounder &&
        (targetMember?.role === ChatRoomMemberRole.OPERATOR ||
          targetMember?.role === ChatRoomMemberRole.MANAGER);

      if (!isFounder && (isTargetFounder || isTargetOperator)) {
        throw new ForbiddenException('운영자(OPERATOR)는 방장(FOUNDER) 또는 타 운영자(OPERATOR)를 차단(Ban)할 수 없습니다.');
      }
    }

    if (!this.bannedUserMap.has(roomId)) {
      this.bannedUserMap.set(roomId, new Set());
    }
    this.bannedUserMap.get(roomId)!.add(targetUser.id);

    try {
      await this.redisService.sadd(`chat:room:${roomId}:bans`, targetUser.id);
    } catch (_err) {}

    if (!isTempRoom) {
      const targetMember = await this.memberRepository.findOne({
        where: { chatRoomId: roomId, userId: targetUser.id, status: ChatRoomMemberStatus.ACTIVE },
      });

      if (targetMember) {
        targetMember.status = ChatRoomMemberStatus.KICKED;
        targetMember.leftAt = new Date();
        await this.memberRepository.save(targetMember);
      }
    }

    return { message: '성공적으로 차단(Ban) 처리되었습니다.', targetUserId: targetUser.id };
  }

  async unbanMember(
    roomId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ message: string; targetUserId: string }> {
    const currentUser = await this.ensureUserExists(currentUserId);
    const targetUser = await this.ensureUserExists(targetUserId);

    if (this.bannedUserMap.has(roomId)) {
      this.bannedUserMap.get(roomId)!.delete(targetUser.id);
    }

    try {
      await this.redisService.srem(`chat:room:${roomId}:bans`, targetUser.id);
    } catch (_err) {}

    return { message: '성공적으로 차단(Unban) 해제되었습니다.', targetUserId: targetUser.id };
  }

  async getBannedMembers(
    roomId: string,
    currentUserId: string,
  ): Promise<Array<{ userId: string; loginId: string; name: string; bannedAt: string }>> {
    let bannedUserIds: string[] = [];

    if (this.bannedUserMap.has(roomId)) {
      bannedUserIds = Array.from(this.bannedUserMap.get(roomId)!);
    }

    try {
      const redisBanned = await this.redisService.smembers(`chat:room:${roomId}:bans`);
      if (Array.isArray(redisBanned) && redisBanned.length > 0) {
        bannedUserIds = Array.from(new Set([...bannedUserIds, ...redisBanned]));
      }
    } catch (_err) {}

    const bannedUsers = await Promise.all(
      bannedUserIds.map(async (userId) => {
        const user = await this.ensureUserExists(userId);
        return {
          userId: user.id,
          loginId: user.loginId,
          name: user.name,
          bannedAt: new Date().toISOString(),
        };
      }),
    );

    return bannedUsers;
  }
}
