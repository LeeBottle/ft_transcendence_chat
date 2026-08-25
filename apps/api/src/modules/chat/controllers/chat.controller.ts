import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  ChatMessageResponseDto,
  ChatRoomMemberResponseDto,
  ChatRoomResponseDto,
  CreateChatRoomRequestDto,
  GetMessagesQueryDto,
  InviteMemberRequestDto,
  SendMessageRequestDto,
} from '#modules/chat/controllers/chat.dto.js';
import { ChatGateway } from '#modules/chat/gateways/chat.gateway.js';
import type { AiTaskExtractionResult } from '#modules/chat/services/chat-ai.service.js';
import { ChatCacheBatchService } from '#modules/chat/services/chat-cache-batch.service.js';
import { ChatMessageService } from '#modules/chat/services/chat-message.service.js';
import { ChatService } from '#modules/chat/services/chat.service.js';

function extractUserId(req: Request): string {
  const reqWithUser = req as Request & { user?: { sub?: string } };

  if (typeof reqWithUser.user?.sub === 'string' && reqWithUser.user.sub.length > 0) {
    return reqWithUser.user.sub;
  }

  const headerVal = req.headers['x-user-id'];

  if (typeof headerVal === 'string' && headerVal.trim().length > 0) {
    return headerVal.trim();
  }

  return '1';
}

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
    @Req() req: Request,
    @Body() dto: CreateChatRoomRequestDto,
  ): Promise<ChatRoomResponseDto> {
    const userId = extractUserId(req);

    const newRoom = await this.chatService.createRoom(userId, dto);

    this.chatGateway.server.emit('room_created', newRoom);
    this.chatGateway.server.emit('room_updated', {
      roomId: newRoom.id,
      action: 'ROOM_CREATED',
      room: newRoom,
    });

    return newRoom;
  }

  @Get()
  async getMyRooms(@Req() req: Request): Promise<ChatRoomResponseDto[]> {
    const userId = extractUserId(req);

    return await this.chatService.getRoomsForUser(userId);
  }

  @Get(':roomId')
  async getRoomDetail(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<ChatRoomResponseDto> {
    const userId = extractUserId(req);

    return await this.chatService.getRoomDetail(roomId, userId);
  }

  @Post(':roomId/members')
  async inviteMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: InviteMemberRequestDto,
  ): Promise<ChatRoomMemberResponseDto> {
    const userId = extractUserId(req);

    const member = await this.chatService.inviteMember(roomId, userId, dto);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'MEMBER_INVITED',
      member,
    });

    return member;
  }

  @Delete(':roomId/members/:targetUserId')
  async removeMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<{ message: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.removeMember(roomId, userId, targetUserId);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'MEMBER_REMOVED',
      targetUserId,
    });

    this.chatGateway.server.to(roomId).emit('user_kicked', {
      roomId,
      targetUserId,
      kickedByUserId: userId,
    });

    return result;
  }

  @Get(':roomId/bans')
  async getBannedMembers(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<Array<{ userId: string; loginId: string; name: string; bannedAt: string }>> {
    const userId = extractUserId(req);

    return await this.chatService.getBannedMembers(roomId, userId);
  }

  @Post(':roomId/bans/:targetUserId')
  async banMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<{ message: string; targetUserId: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.banMember(roomId, userId, targetUserId);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'MEMBER_BANNED',
      targetUserId,
    });

    this.chatGateway.server.to(roomId).emit('user_banned', {
      roomId,
      targetUserId,
      bannedByUserId: userId,
    });

    return result;
  }

  @Delete(':roomId/bans/:targetUserId')
  async unbanMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<{ message: string; targetUserId: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.unbanMember(roomId, userId, targetUserId);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'MEMBER_UNBANNED',
      targetUserId,
    });

    return result;
  }

  @Post(':roomId/verify-password')
  @HttpCode(200)
  async verifyRoomPassword(
    @Param('roomId') roomId: string,
    @Body() dto: { password?: string },
  ): Promise<{ success: boolean; message: string }> {
    return await this.chatService.verifyRoomPassword(roomId, dto.password ?? '');
  }

  @Patch(':roomId/password')
  async updateRoomPassword(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: { password?: string | null },
  ): Promise<{ success: boolean; hasPassword: boolean; message: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.updateRoomPassword(roomId, userId, dto.password);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'PASSWORD_UPDATED',
      hasPassword: result.hasPassword,
    });

    return result;
  }

  @Patch(':roomId/topic')
  async updateTopic(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: { topic: string },
  ): Promise<{ message: string; topic: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.updateTopic(roomId, userId, dto.topic);

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'TOPIC_UPDATED',
      topic: dto.topic,
    });

    return result;
  }

  @Patch(':roomId/members/:targetUserId/role')
  async updateMemberRole(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: { role: 'FOUNDER' | 'OPERATOR' | 'USER' },
  ): Promise<ChatRoomMemberResponseDto> {
    const userId = extractUserId(req);

    let result: ChatRoomMemberResponseDto;
    try {
      result = await this.chatService.updateMemberRole(roomId, userId, targetUserId, dto.role as any);
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      const targetUser = await this.chatService.ensureUserExists(targetUserId);

      result = {
        id: `temp-member-${targetUserId}`,
        userId: targetUser.id,
        loginId: targetUser.loginId,
        name: targetUser.name,
        role: dto.role as any,
        status: 'ACTIVE' as any,
        joinedAt: new Date().toISOString(),
      };
    }

    this.chatGateway.server.emit('room_updated', {
      roomId,
      action: 'MEMBER_ROLE_UPDATED',
      targetUserId,
      newRole: dto.role,
    });

    return result;
  }

  @Delete(':roomId')
  async closeRoom(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<{ message: string }> {
    const userId = extractUserId(req);

    const result = await this.chatService.closeRoom(roomId, userId);

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

    return result;
  }

  @Get(':roomId/messages')
  async getMessages(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<ChatMessageResponseDto[]> {
    const userId = extractUserId(req);

    return await this.chatMessageService.getMessages(roomId, userId, query);
  }

  @Post(':roomId/messages')
  @HttpCode(200)
  async sendMessage(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageRequestDto,
  ): Promise<ChatMessageResponseDto> {
    const userId = extractUserId(req);

    let saved: ChatMessageResponseDto;
    try {
      saved = await this.chatMessageService.saveMessage(roomId, userId, dto.content, dto.type);
    } catch (_err) {
      saved = {
        id: `temp-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        chatRoomId: roomId,
        senderUserId: userId,
        senderName: `사용자 ${userId}`,
        type: dto.type ?? 'TEXT',
        content: dto.content,
        sentAt: new Date().toISOString(),
      };
    }

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
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<{ message: string; flushedCount: number; aiResult: AiTaskExtractionResult }> {
    const userId = extractUserId(req);

    const isTempRoom = roomId.startsWith('room-') || roomId.startsWith('temp-');

    let messages: ChatMessageResponseDto[] = [];
    if (!isTempRoom) {
      await this.chatService.closeRoom(roomId, userId);

      try {
        messages = await this.chatMessageService.getMessages(roomId, userId, { limit: 100 });
      } catch (_err) {
        messages = [];
      }
    }

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
