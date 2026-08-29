import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { UserService } from '#modules/user/services/user.service.js';

import {
  AddFriendRequestDto,
  GetFriendsResponseDto,
  PublicUserProfileResponseDto,
  SelfUserProfileResponseDto,
  UpdateUserProfileRequestDto,
} from './user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 본인 프로필 조회
  @Get('me')
  async getSelfProfile(@CurrentUserId() userId: string): Promise<SelfUserProfileResponseDto> {
    return await this.userService.getSelfProfile(userId);
  }

  // 본인 프로필 수정 (PATCH /users/me)
  @Patch('me')
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() body: UpdateUserProfileRequestDto,
  ): Promise<SelfUserProfileResponseDto> {
    return await this.userService.updateProfile(userId, body);
  }

  // 친구 목록 조회 (GET /users/me/friends)
  @Get('me/friends')
  async getFriends(@CurrentUserId() userId: string): Promise<GetFriendsResponseDto> {
    return await this.userService.getFriends(userId);
  }

  // 친구 추가 (POST /users/me/friends)
  @Post('me/friends')
  async addFriend(
    @CurrentUserId() userId: string,
    @Body() body: AddFriendRequestDto,
  ): Promise<{ id: string }> {
    return await this.userService.addFriend(userId, body);
  }

  // 타인 프로필 조회 — 반드시 'me' 라우트들보다 아래에 둘 것 (':id' 가 'me' 를 가로채므로)
  @Get(':id')
  async getPublicProfile(@Param('id') id: string): Promise<PublicUserProfileResponseDto> {
    return await this.userService.getPublicProfile(id);
  }
}
