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

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { ZodValidateResponse } from '#common/decorators/zod-validation-response.decorator.js';
import { UserService } from '#modules/user/services/user.service.js';

import {
  GetMyFriendsResponseDto,
  ProfileResponseDto,
  SearchUsersQueryDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
  UserSearchItemsResponseDto,
} from './user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 유저 검색 (초대 대상 고르기) — 로그인 아이디 / 이름 부분 일치, 본인 제외
  @Get()
  @ZodValidateResponse(UserSearchItemsResponseDto)
  async search(
    @CurrentUserId() meId: string,
    @Query() query: SearchUsersQueryDto,
  ): Promise<UserSearchItemsResponseDto> {
    return await this.userService.search(meId, query);
  }

  // 프로필 조회
  @Get('me')
  @ZodValidateResponse(ProfileResponseDto)
  async myProfile(@CurrentUserId() id: string): Promise<ProfileResponseDto> {
    return await this.userService.profile(id);
  }

  // 프로필 수정
  @Patch('me')
  @ZodValidateResponse(UpdateProfileResponseDto)
  async updateProfile(
    @CurrentUserId() id: string,
    @Body() dto: UpdateProfileRequestDto,
  ): Promise<UpdateProfileResponseDto> {
    return await this.userService.updateProfile(id, dto);
  }

  @Post('me/friends/:friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addFriend(
    @CurrentUserId() userId: string,
    @Param('friendId') friendUserId: string,
  ): Promise<void> {
    await this.userService.addFriend(userId, friendUserId);
  }

  @Delete('me/friends/:friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFriend(
    @CurrentUserId() userId: string,
    @Param('friendId') friendUserId: string,
  ): Promise<void> {
    await this.userService.deleteFriend(userId, friendUserId);
  }

  // 친구 목록 조회
  @Get('me/friends')
  @ZodValidateResponse(GetMyFriendsResponseDto)
  async getMyFriends(@CurrentUserId() userId: string): Promise<GetMyFriendsResponseDto> {
    return await this.userService.getFriends(userId);
  }

  // 타인 프로필 조회 — 반드시 'me' 라우트들보다 아래에 둘 것 (':id' 가 'me' 를 가로채므로)
  @Get(':id')
  @ZodValidateResponse(ProfileResponseDto)
  async getPublicProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
    return await this.userService.profile(id);
  }
}
