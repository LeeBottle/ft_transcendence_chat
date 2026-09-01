import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { ZodValidateResponse } from '#common/decorators/zod-validation-response.decorator.js';
import { ChatGateway } from '#modules/chat/gateways/chat.gateway.js';
import { ChatCacheBatchService } from '#modules/chat/services/chat-cache-batch.service.js';
import { ChatMessageService } from '#modules/chat/services/chat-message.service.js';
import { ChatService } from '#modules/chat/services/chat.service.js';

import {
  ChatMessageResponseDto,
  ChatRoomListResponseDto,
  CreateChatRoomRequestDto,
  CreateChatRoomResponseDto,
  EndSessionResponseDto,
  GetMessagesQueryDto,
  GetMessagesResponseDto,
  SendMessageRequestDto,
} from './chat.dto.js';

@Controller('chat/rooms')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessageService: ChatMessageService,
    private readonly chatCacheBatchService: ChatCacheBatchService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @ZodValidateResponse(CreateChatRoomResponseDto)
  async createRoom(
    @CurrentUserId() userId: string,
    @Body() dto: CreateChatRoomRequestDto,
  ): Promise<CreateChatRoomResponseDto> {
    const newRoom = await this.chatService.createRoom(userId, dto);

    this.chatGateway.server.emit('room_created', newRoom);
    this.chatGateway.server.emit('room_updated', {
      roomId: newRoom.roomId,
      action: 'ROOM_CREATED',
      room: newRoom,
    });

    return newRoom;
  }

  @Get()
  @ZodValidateResponse(ChatRoomListResponseDto)
  async myRooms(@CurrentUserId() userId: string): Promise<ChatRoomListResponseDto> {
    return await this.chatService.findJoinedChatRoomsByUserId(userId);
  }

  @Post(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async closeRoom(@CurrentUserId() userId: string, @Param('roomId') roomId: string): Promise<void> {
    await this.chatService.closeRoom(roomId, userId);

    const timestamp = new Date().toISOString();

    this.chatGateway.server.emit('room_deleted', {
      roomId,
      deletedAt: timestamp,
    });

    this.chatGateway.server.emit('room_updated', {
      roomId,
      closedAt: timestamp,
      status: 'CLOSED',
    });

    this.chatGateway.server.to(roomId).emit('session_ended', {
      roomId,
      endedByUserId: userId,
      timestamp,
    });
  }

  @Get(':roomId/messages')
  @ZodValidateResponse(GetMessagesResponseDto)
  async getMessages(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<GetMessagesResponseDto> {
    return await this.chatMessageService.getMessages(roomId, userId, query);
  }

  @Post(':roomId/messages')
  @HttpCode(HttpStatus.OK)
  @ZodValidateResponse(ChatMessageResponseDto)
  async sendMessage(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageRequestDto,
  ): Promise<ChatMessageResponseDto> {
    const saved = await this.chatMessageService.saveMessage(roomId, userId, dto.content, dto.type);

    await this.chatCacheBatchService.pushMessageToCache(roomId, {
      id: saved.id,
      roomId: saved.chatRoomId,
      senderUserId: saved.senderUserId,
      type: saved.type,
      content: saved.content,
      sentAt: saved.sentAt,
    });

    this.chatGateway.server.to(roomId).emit('new_message', saved);

    return saved;
  }

  @Post(':roomId/end-session')
  @HttpCode(HttpStatus.OK)
  @ZodValidateResponse(EndSessionResponseDto)
  async endSession(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
  ): Promise<EndSessionResponseDto> {
    const messages: ChatMessageResponseDto[] = [];

    const { flushedCount, aiResult } = await this.chatCacheBatchService.endRoomSession(
      roomId,
      messages,
    );

    const timestamp = new Date().toISOString();

    this.chatGateway.server.to(roomId).emit('session_ended', {
      roomId,
      endedByUserId: userId,
      flushedCount,
      aiResult,
      timestamp,
    });

    this.chatGateway.server.emit('room_deleted', {
      roomId,
      deletedAt: timestamp,
    });

    this.chatGateway.server.emit('room_updated', {
      roomId,
      closedAt: timestamp,
      status: 'CLOSED',
    });

    return {
      message: '회의/채팅 세션이 정상적으로 종료되었습니다.',
      flushedCount,
      aiResult,
    };
  }
}
