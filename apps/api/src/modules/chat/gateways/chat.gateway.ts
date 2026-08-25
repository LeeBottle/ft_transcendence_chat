import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import type { ZodType } from 'zod';

import { sendMessageRequestSchema } from '@repo/schemas/chat';

import {
  WsJwtGuard,
  type AuthenticatedSocket,
  type WsUser,
} from '#modules/chat/guards/ws-jwt.guard.js';
import { ChatCacheBatchService } from '#modules/chat/services/chat-cache-batch.service.js';
import { ChatMessageService } from '#modules/chat/services/chat-message.service.js';
import { RedisService } from '#modules/chat/services/redis.service.js';

interface JoinRoomPayload {
  roomId: string;
}

interface LeaveRoomPayload {
  roomId: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
}

interface TypingPayload {
  roomId: string;
  isTyping: boolean;
}

interface ReadMessagePayload {
  roomId: string;
  lastReadMessageId?: string;
}

function getSocketUserId(client: AuthenticatedSocket): string {
  const socketData = client.data as { user?: WsUser };

  return socketData.user?.sub ?? '1';
}

function validateWsPayload<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(', ');

    throw new WsException(`소켓 데이터 검증 실패: ${messages}`);
  }

  return result.data;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatMessageService: ChatMessageService,
    private readonly chatCacheBatchService: ChatCacheBatchService,
    private readonly redisService: RedisService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`소켓 연결됨: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`소켓 연결 해제됨: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: JoinRoomPayload,
  ): Promise<void> {
    if (payload === undefined || typeof payload.roomId !== 'string') {
      return;
    }

    const { roomId } = payload;
    const userId = getSocketUserId(client);

    try {
      await client.join(roomId);

      try {
        await this.redisService.sadd(`chat:room:${roomId}:users`, userId);
      } catch (redisError) {
        this.logger.warn(`Redis sadd 처리 실패 (소켓 방 입장은 정상 유지): ${redisError}`);
      }

      this.logger.log(`유저 ${userId} 방 입장 완료: ${roomId}`);

      this.server.to(roomId).emit('user_joined', {
        roomId,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`handleJoinRoom 에러 (roomId: ${roomId})`, error);

      throw new WsException('채팅방 입장 처리에 실패했습니다.');
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: LeaveRoomPayload,
  ): Promise<void> {
    if (payload === undefined || typeof payload.roomId !== 'string') {
      return;
    }

    const { roomId } = payload;
    const userId = getSocketUserId(client);

    try {
      await client.leave(roomId);
      await this.redisService.srem(`chat:room:${roomId}:users`, userId);

      this.logger.log(`유저 ${userId} 방 퇴장: ${roomId}`);

      this.server.to(roomId).emit('user_left', {
        roomId,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`handleLeaveRoom 에러 (roomId: ${roomId})`, error);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: SendMessagePayload,
  ): Promise<void> {
    if (payload === undefined || typeof payload.roomId !== 'string') {
      return;
    }

    const userId = getSocketUserId(client);

    try {
      const validated = validateWsPayload(sendMessageRequestSchema, payload);
      const { roomId } = payload;
      const type = validated.type;

      let savedMessage;
      try {
        savedMessage = await this.chatMessageService.saveMessage(
          roomId,
          userId,
          validated.content,
          type,
        );
      } catch (dbError) {
        this.logger.warn(
          `DB 메시지 저장 실패 (임시 채팅방 또는 미등록 멤버 fallback): roomId=${roomId}, userId=${userId}`,
        );

        const socketData = client.data as { user?: WsUser };
        const senderName = socketData.user?.name ?? `사용자 ${userId}`;

        savedMessage = {
          id: `temp-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          chatRoomId: roomId,
          senderUserId: userId,
          senderName,
          type: type ?? 'TEXT',
          content: validated.content,
          sentAt: new Date().toISOString(),
        };
      }

      try {
        await this.chatCacheBatchService.pushMessageToCache(roomId, {
          id: savedMessage.id,
          roomId: savedMessage.chatRoomId,
          senderUserId: savedMessage.senderUserId,
          type: savedMessage.type,
          content: savedMessage.content,
          sentAt: savedMessage.sentAt,
        });
      } catch (cacheError) {
        this.logger.warn(`Redis 캐시 저장은 실패하였으나 소켓 메시지 브로드캐스트는 계속 진행합니다: ${cacheError}`);
      }

      this.logger.log(`소켓 방 [${roomId}] 실시간 new_message 브로드캐스팅 성공 (content: "${savedMessage.content}")`);
      this.server.to(roomId).emit('new_message', savedMessage);
    } catch (error) {
      this.logger.error(`handleSendMessage 상세 에러: ${error instanceof Error ? error.stack : String(error)}`);

      if (error instanceof WsException) {
        throw error;
      }

      throw new WsException('메시지 전송 처리에 실패했습니다.');
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: TypingPayload,
  ): void {
    if (payload === undefined || typeof payload.roomId !== 'string') {
      return;
    }

    const { roomId, isTyping } = payload;
    const userId = getSocketUserId(client);

    client.to(roomId).emit('user_typing', {
      roomId,
      userId,
      isTyping,
    });
  }

  @SubscribeMessage('read_message')
  async handleReadMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload?: ReadMessagePayload,
  ): Promise<void> {
    if (payload === undefined || typeof payload.roomId !== 'string') {
      return;
    }

    const { roomId, lastReadMessageId } = payload;
    const userId = getSocketUserId(client);

    try {
      const readState = await this.chatMessageService.updateLastRead(roomId, userId, lastReadMessageId,);

      client.to(roomId).emit('read_receipt', {
        roomId,
        userId,
        lastReadMessageId: readState.lastReadMessageId,
        lastReadAt: readState.lastReadAt,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`handleReadMessage 에러`, error);
    }
  }
}
