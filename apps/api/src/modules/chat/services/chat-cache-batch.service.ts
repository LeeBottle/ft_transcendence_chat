import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { DataSource } from 'typeorm';

import type { ChatMessageResponseDto } from '#modules/chat/controllers/chat.dto.js';
import { ChatRoomMessageEntity } from '#modules/chat/entities/chat-room-message.entity.js';
import {
  ChatAiService,
  type AiTaskExtractionResult,
} from '#modules/chat/services/chat-ai.service.js';
import { RedisService } from '#modules/chat/services/redis.service.js';

export interface CachedChatMessage {
  id?: string;
  roomId: string;
  senderUserId: string;
  type: ChatRoomMessageEntity['type'];
  content: string | null;
  sentAt: string;
}

const FLUSH_THRESHOLD = 5;

@Injectable()
export class ChatCacheBatchService {
  private readonly logger = new Logger(ChatCacheBatchService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly chatAiService: ChatAiService,
  ) {}

  async pushMessageToCache(
    roomId: string,
    message: CachedChatMessage,
  ): Promise<{ cachedCount: number; flushed: boolean }> {
    const key = `chat:room:${roomId}:messages`;
    const serialized = JSON.stringify(message);

    const cachedCount = await this.redisService.rpush(key, serialized);

    let flushed = false;

    if (cachedCount >= FLUSH_THRESHOLD) {
      await this.flushRoomMessages(roomId);
      flushed = true;
    }

    return { cachedCount, flushed };
  }

  async flushRoomMessages(roomId: string): Promise<{ flushedCount: number }> {
    const key = `chat:room:${roomId}:messages`;
    const rawMessages = await this.redisService.lrange(key, 0, -1);

    if (rawMessages.length === 0) {
      return { flushedCount: 0 };
    }

    const parsedMessages: CachedChatMessage[] = [];

    for (const raw of rawMessages) {
      try {
        const item = JSON.parse(raw) as CachedChatMessage;

        parsedMessages.push(item);
      } catch (error) {
        this.logger.error(`Redis 메시지 역직렬화 실패: ${raw}`, error);
      }
    }

    if (parsedMessages.length === 0) {
      await this.redisService.del(key);

      return { flushedCount: 0 };
    }

    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    if (isTempRoom) {
      this.logger.log(`채팅방 [${roomId}] 임시방 메시지이므로 DB Flush를 생략하고 Redis 캐시를 유지합니다.`);

      return { flushedCount: parsedMessages.length };
    }

    // DB Bulk Insert 트랜잭션 수행
    await this.dataSource.transaction(async (entityManager) => {
      const entities = parsedMessages.map((msg) =>
        entityManager.create(ChatRoomMessageEntity, {
          chatRoomId: msg.roomId,
          senderUserId: msg.senderUserId,
          type: msg.type,
          content: msg.content,
          sentAt: new Date(msg.sentAt),
        }),
      );

      await entityManager.save(ChatRoomMessageEntity, entities);
    });

    // DB Bulk Insert 성공 후에만 Redis 데이터 팝/삭제
    await this.redisService.ltrim(key, rawMessages.length, -1);
    this.logger.log(
      `채팅방 [${roomId}] Redis 캐시 메시지 ${parsedMessages.length}개 DB Flush 완료`,
    );

    return { flushedCount: parsedMessages.length };
  }

  async endRoomSession(
    roomId: string,
    messages: ChatMessageResponseDto[],
  ): Promise<{ flushedCount: number; aiResult: AiTaskExtractionResult }> {
    const { flushedCount } = await this.flushRoomMessages(roomId);

    const aiResult = await this.chatAiService.triggerAiTaskExtraction(roomId, messages);

    return { flushedCount, aiResult };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronFlush(): Promise<void> {
    this.logger.log('5분 주기 Redis 메시지 DB Flush 스케줄러 실행...');

    const client = this.redisService.getClient();
    const keys = await client.keys('chat:room:*:messages');

    await Promise.all(
      keys.map(async (key) => {
        const match = /^chat:room:(.+):messages$/.exec(key);

        if (match !== null) {
          const roomId = match[1];

          if (typeof roomId === 'string' && roomId.length > 0) {
            try {
              await this.flushRoomMessages(roomId);
            } catch (error) {
              this.logger.error(`채팅방 [${roomId}] 스케줄러 Flush 실패`, error);
            }
          }
        }
      }),
    );
  }
}
