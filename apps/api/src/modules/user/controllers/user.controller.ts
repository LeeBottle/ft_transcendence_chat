import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { UserService } from '#modules/user/services/user.service.js';

import {
  AddFriendRequestDto,
  GetFriendsResponseDto,
  PublicUserProfileResponseDto,
  SearchUsersQueryDto,
  SelfUserProfileResponseDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
} from './user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 유저 검색 (초대 대상 고르기) — 로그인 아이디 / 이름 부분 일치, 본인 제외
  @Get()
  async search(
    @CurrentUserId() meId: string,
    @Query() query: SearchUsersQueryDto,
  ): Promise<PublicUserProfileResponseDto[]> {
    return await this.userService.search(meId, query);
  }

  // 프로필 조회
  @Get('me')
  async getSelfProfile(@CurrentUserId() userId: string): Promise<SelfUserProfileResponseDto> {
    return await this.userService.getSelfProfile(userId);
  }

  // 프로필 수정
  @Patch('me')
  async updateProfile(
    @CurrentUserId() id: string,
    @Body() dto: UpdateProfileRequestDto,
  ): Promise<UpdateProfileResponseDto> {
    return await this.userService.updateProfile(id, dto);
  }

  // 친구 목록 조회
  @Get('me/friends')
  async getFriends(@CurrentUserId() userId: string): Promise<GetFriendsResponseDto> {
    return await this.userService.getFriends(userId);
  }

  // 친구 추가
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
