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

    // 최신 100개 메시지만 Redis 인메모리 캐시로 유지 (메모리 파이프라인 트리밍)
    if (cachedCount > 100) {
      try {
        await this.redisService.ltrim(key, -100, -1);
      } catch (_err) {}
    }

    return { cachedCount, flushed: false };
  }

  async flushRoomMessages(roomId: string): Promise<{ flushedCount: number }> {
    const key = `chat:room:${roomId}:messages`;
    const rawMessages = await this.redisService.lrange(key, 0, -1);

    if (rawMessages.length === 0) {
      return { flushedCount: 0 };
    }

    // Write-Through 단일화: 이미 메시지 전송 시점에 DB INSERT가 완료되었으므로
    // 배치 flush 시 이중 DB INSERT(entityManager.save)를 수행하지 않고 최신 캐시 상태만 정리합니다.
    if (rawMessages.length > 100) {
      await this.redisService.ltrim(key, -100, -1);
    }

    this.logger.log(`채팅방 [${roomId}] Write-Through 캐시 유지 상태 확인 완료 (${rawMessages.length}개 메시지)`);

    return { flushedCount: rawMessages.length };
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
