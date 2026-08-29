import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

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
  async getSelfProfile(@Req() req: Request): Promise<SelfUserProfileResponseDto> {
    const userId = this.extractUserId(req);
    return await this.userService.getSelfProfile(userId);
  }

  // 본인 프로필 수정 (PATCH /users/me)
  @Patch('me')
  async updateProfile(
    @Req() req: Request,
    @Body() body: UpdateUserProfileRequestDto,
  ): Promise<SelfUserProfileResponseDto> {
    const userId = this.extractUserId(req);
    return await this.userService.updateProfile(userId, body);
  }

  // 친구 목록 조회 (GET /users/me/frineds)
  @Get('me/friends')
  async getFriends(@Req() req: Request): Promise<GetFriendsResponseDto> {
    const userId = this.extractUserId(req);
    return await this.userService.getFriends(userId);
  }

  // 친구 추가 (POST /users/me/friends)
  @Post('me/friends')
  async addFriend(@Req() req: Request, @Body() body: AddFriendRequestDto) {
    const userId = this.extractUserId(req);
    return await this.userService.addFriend(userId, body);
  }

  // 타인 프로필 조회 — 반드시 'me' 라우트들보다 아래에 둘 것 (':id' 가 'me' 를 가로채므로)
  @Get(':id')
  async getPublicProfile(@Param('id') id: string): Promise<PublicUserProfileResponseDto> {
    return await this.userService.getPublicProfile(id);
  }

  // 전역 JwtAuthGuard 가 검증 후 req.user = { id, loginId, role } 를 채워준다.
  private extractUserId(req: Request): string {
    const user = (req as unknown as { user?: { id?: string } }).user;

    if (typeof user?.id !== 'string' || user.id.length === 0) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }
    return user.id;
  }
}
