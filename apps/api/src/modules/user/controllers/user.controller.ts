import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { UserService } from '#modules/user/services/user.service.js';
import {
  UserProfileResponseDto,
  UpdateUserProfileRequestDto,
  AddFriendRequestDto,
  GetFriendsResponseDto,
} from './user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 타인/본인 프로필 조회 (GET /users/:id)
  @Get(':id')
  async getProfile(@Param('id') id: string): Promise<UserProfileResponseDto> {
    return (await this.userService.findById(id)) as unknown as UserProfileResponseDto;
  }

  // 본인 프로필 수정 (PATCH /users/me)
  @Patch('me')
  async updateProfile(@Body() body: UpdateUserProfileRequestDto): Promise<UserProfileResponseDto> {
    const currentUserId = '1'; // 추후 JWT 인증 가드 적용 시 로그인 유저 ID로 교체
    return (await this.userService.updateProfile(currentUserId, body)) as unknown as UserProfileResponseDto;
  }

  // 내 친구 목록 및 상태 조회 (GET /users/me/friends)
  @Get('me/friends')
  async getFriends(): Promise<GetFriendsResponseDto> {
    const currentUserId = '1';
    return (await this.userService.getFriends(currentUserId)) as unknown as GetFriendsResponseDto;
  }

  // 친구 추가 (POST /users/me/friends)
  @Post('me/friends')
  async addFriend(@Body() body: AddFriendRequestDto) {
    const currentUserId = '1';
    return await this.userService.addFriend(currentUserId, body);
  }
}
