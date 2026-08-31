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
  CreateChatRoomRequestDto,
  CreateChatRoomResponseDto,
} from '#modules/chat/controllers/chat.dto.js';
import { ChatRoomMemberEntity } from '#modules/chat/entities/chat-room-member.entity.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatRoomMemberEntity)
    private readonly memberRepository: Repository<ChatRoomMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

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
        where: { loginId: In(uniqueTargetLoginIds) },
      });

      if (existingUsers.length !== uniqueTargetLoginIds.length) {
        throw new NotFoundException('존재하지 않는 사용자가 포함되어 있습니다.');
      }

      // 방장 본인이 초대 목록에 포함되어 있다면 일반 멤버 등록 대상에서 제외
      targetMemberUsers = existingUsers.filter((user) => user.id !== creatorUserId);
    }

    // 3. 채팅방 생성 및 저장
    const room = await this.roomRepository.save(
      this.roomRepository.create({
        creatorUserId,
        title: dto.title,
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
