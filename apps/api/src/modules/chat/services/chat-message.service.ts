import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ChatRoomMemberStatus } from '@repo/constants/chat-room-member';
import { ChatRoomMessageType } from '@repo/constants/chat-room-message';

import type {
  ChatMessageResponseDto,
  GetMessagesQueryDto,
  GetMessagesResponseDto,
} from '#modules/chat/controllers/chat.dto.js';
import { ChatRoomMemberEntity } from '#modules/chat/entities/chat-room-member.entity.js';
import { ChatRoomMessageEntity } from '#modules/chat/entities/chat-room-message.entity.js';
import { ChatRoomEntity } from '#modules/chat/entities/chat-room.entity.js';

import { RedisService } from './redis.service.js';

export interface LastReadState {
  lastReadAt: string;
  lastReadMessageId: string | null;
}

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatRoomMessageEntity)
    private readonly messageRepository: Repository<ChatRoomMessageEntity>,
    @InjectRepository(ChatRoomMemberEntity)
    private readonly memberRepository: Repository<ChatRoomMemberEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly roomRepository: Repository<ChatRoomEntity>,
    private readonly redisService: RedisService,
  ) {}

  async getMessages(
    roomId: string,
    userId: string,
    query: GetMessagesQueryDto,
  ): Promise<GetMessagesResponseDto> {
    const member = await this.memberRepository.findOne({
      where: { chatRoomId: roomId, userId, status: ChatRoomMemberStatus.ACTIVE },
    });

    if (member === null) {
      throw new ForbiddenException('채팅방 멤버만 메시지를 조회할 수 있습니다.');
    }

    const cursor = query.cursor;
    const limit = query.limit;
    const direction = query.direction ?? 'BEFORE';

    // 1단계: Redis 최신 인메모리 캐시 메시지 조회
    const redisKey = `chat:room:${roomId}:messages`;
    const rawCachedMessages = await this.redisService.lrange(redisKey, 0, -1);
    const cachedMessages: ChatMessageResponseDto[] = [];

    for (const raw of rawCachedMessages) {
      try {
        const item = JSON.parse(raw) as {
          id?: string;
          roomId: string;
          senderUserId: string;
          type: ChatRoomMessageType;
          content: string | null;
          sentAt: string;
        };

        cachedMessages.push({
          id: item.id ?? `cache-${Date.now()}`,
          chatRoomId: item.roomId,
          senderUserId: item.senderUserId,
          senderName: '캐시 메시지',
          type: item.type,
          content: item.content ?? '',
          sentAt: item.sentAt,
        });
      } catch (_error) {
        // parsing exception ignore
      }
    }

    const filteredCached = cachedMessages.filter((msg) => {
      if (typeof cursor === 'string' && cursor.length > 0) {
        if (direction === 'AFTER') {
          return msg.id > cursor;
        }

        return msg.id < cursor;
      }

      return true;
    });

    // 2단계: MySQL DB 메시지 커서 페이징 조회
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.senderUser', 'senderUser')
      .where('message.chatRoomId = :roomId', { roomId });

    if (typeof cursor === 'string' && cursor.length > 0) {
      if (direction === 'AFTER') {
        queryBuilder.andWhere('message.id > :cursor', { cursor });
        queryBuilder.orderBy('message.id', 'ASC');
      } else {
        queryBuilder.andWhere('message.id < :cursor', { cursor });
        queryBuilder.orderBy('message.id', 'DESC');
      }
    } else {
      queryBuilder.orderBy('message.id', 'DESC');
    }

    queryBuilder.take(limit);

    const dbMessages = await queryBuilder.getMany();
    const dbMessageDtos: ChatMessageResponseDto[] = dbMessages.map((msg) => ({
      id: msg.id,
      chatRoomId: msg.chatRoomId,
      senderUserId: msg.senderUserId,
      senderName: msg.senderUser?.name ?? '알 수 없음',
      type: msg.type,
      content: msg.content ?? '',
      sentAt: msg.sentAt.toISOString(),
    }));

    // 3단계: Redis 캐시 + DB 메시지 하이브리드 병합 및 중복 제거
    const messageMap = new Map<string, ChatMessageResponseDto>();

    for (const msg of [...filteredCached, ...dbMessageDtos]) {
      messageMap.set(msg.id, msg);
    }

    const merged = Array.from(messageMap.values());

    merged.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return { messages: merged.slice(0, limit) };
  }

  async saveMessage(
    roomId: string,
    senderUserId: string,
    content: string,
    type: ChatRoomMessageType,
  ): Promise<ChatMessageResponseDto> {
    const room = await this.roomRepository.findOneBy({ id: roomId });

    if (room !== null && room.closedAt !== null) {
      throw new ForbiddenException(
        '이미 회의/채팅 세션이 종료된 채팅방에는 신규 메시지를 전송할 수 없습니다.',
      );
    }

    const member = await this.memberRepository.findOneBy({
      chatRoomId: roomId,
      userId: senderUserId,
      status: ChatRoomMemberStatus.ACTIVE,
    });

    if (member === null) {
      throw new ForbiddenException('채팅방 멤버만 메시지를 보낼 수 있습니다.');
    }

    const newMessage = this.messageRepository.create({
      chatRoomId: roomId,
      senderUserId,
      type,
      content,
      sentAt: new Date(),
    });

    const saved = await this.messageRepository.save(newMessage);

    const fullMessage = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: { senderUser: true },
    });

    if (fullMessage === null) {
      throw new NotFoundException('생성된 메시지를 찾을 수 없습니다.');
    }

    return {
      id: fullMessage.id,
      chatRoomId: fullMessage.chatRoomId,
      senderUserId: fullMessage.senderUserId,
      senderName: fullMessage.senderUser?.name ?? '알 수 없음',
      type: fullMessage.type,
      content: fullMessage.content ?? '',
      sentAt: fullMessage.sentAt.toISOString(),
    };
  }

  async updateLastRead(
    roomId: string,
    userId: string,
    lastReadMessageId?: string,
  ): Promise<LastReadState> {
    const key = `chat:room:${roomId}:user:${userId}:last_read`;
    const lastReadAt = new Date().toISOString();
    const readState: LastReadState = {
      lastReadAt,
      lastReadMessageId: lastReadMessageId ?? null,
    };

    await this.redisService.set(key, JSON.stringify(readState));

    return readState;
  }

  async getLastRead(roomId: string, userId: string): Promise<LastReadState | null> {
    const key = `chat:room:${roomId}:user:${userId}:last_read`;
    const raw = await this.redisService.get(key);

    if (typeof raw === 'string' && raw.length > 0) {
      try {
        return JSON.parse(raw) as LastReadState;
      } catch (_error) {
        return null;
      }
    }

    return null;
  }
}
