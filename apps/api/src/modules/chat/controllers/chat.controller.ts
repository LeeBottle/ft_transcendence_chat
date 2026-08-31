import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';

import type { AiTaskExtractionResult } from '@repo/schemas/chat';

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { ChatGateway } from '#modules/chat/gateways/chat.gateway.js';
import { ChatCacheBatchService } from '#modules/chat/services/chat-cache-batch.service.js';
import { ChatMessageService } from '#modules/chat/services/chat-message.service.js';
import { ChatService } from '#modules/chat/services/chat.service.js';

import {
  ChatMessageResponseDto,
  ChatRoomListResponseDto,
  ChatRoomMemberListResponseDto,
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
  async myRooms(@CurrentUserId() userId: string): Promise<ChatRoomListResponseDto> {
    return await this.chatService.findJoinedChatRoomsByUserId(userId);
  }

  @Get(':roomId/members')
  async roomMembers(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
  ): Promise<ChatRoomMemberListResponseDto> {
    return await this.chatService.findRoomMembers(roomId, userId);
  }

  @Post(':roomId')
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
  async getMessages(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<GetMessagesResponseDto> {
    return await this.chatMessageService.getMessages(roomId, userId, query);
  }

  @Post(':roomId/messages')
  @HttpCode(200)
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
  @HttpCode(200)
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
