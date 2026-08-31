import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UserRole } from '@repo/constants/user';

import { Roles } from '#common/decorators/roles.decorator.js';
import {
  AdminChatRoomIdParamDto,
  AdminChatRoomListResponseDto,
  AdminCreateUserRequestDto,
  AdminCreateUserResponseDto,
  AdminUpdateChatRoomTitleRequestDto,
  AdminUpdateChatRoomTitleResponseDto,
  AdminUpdateUserStatusRequestDto,
  AdminUpdateUserStatusResponseDto,
  AdminUserIdParamDto,
  AdminUserListQueryRequestDto,
  AdminUserListQueryResponseDto,
} from '#modules/admin/controllers/admin.dto.js';
import { AdminService } from '#modules/admin/services/admin.service.js';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAllUsers(
    @Query() query: AdminUserListQueryRequestDto,
  ): Promise<AdminUserListQueryResponseDto> {
    return await this.adminService.findAllUsers(query);
  }

  @Patch(':userId/status')
  async updateUserStatus(
    @Param() param: AdminUserIdParamDto,
    @Body() body: AdminUpdateUserStatusRequestDto,
  ): Promise<AdminUpdateUserStatusResponseDto> {
    return await this.adminService.updateUserStatus(param.userId, body.status);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param() param: AdminUserIdParamDto): Promise<void> {
    await this.adminService.deleteUser(param.userId);
  }

  @Post()
  async createUser(@Body() body: AdminCreateUserRequestDto): Promise<AdminCreateUserResponseDto> {
    return await this.adminService.createUser(body);
  }

  @Get('chat/rooms')
  async findAllChatRooms(): Promise<AdminChatRoomListResponseDto> {
    return await this.adminService.findAllChatRooms();
  }

  @Patch('chat/rooms/:chatRoomId/title')
  async updateChatRoomTitle(
    @Param() param: AdminChatRoomIdParamDto,
    @Body() body: AdminUpdateChatRoomTitleRequestDto,
  ): Promise<AdminUpdateChatRoomTitleResponseDto> {
    return await this.adminService.updateChatRoomTitle(param.chatRoomId, body.title);
  }

  @Delete('chat/rooms/:chatRoomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChatRoom(@Param() param: AdminChatRoomIdParamDto): Promise<void> {
    await this.adminService.deleteChatRoom(param.chatRoomId);
  }
}
