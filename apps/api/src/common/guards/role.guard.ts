import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { UserRole } from '@repo/constants/user';
import type { AuthenticatedUser } from '@repo/schemas/auth';

import { IS_PUBLIC_KEY } from '#common/decorators/public.decorator.js';
import { ROLES_KEY } from '#common/decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() 엔드포인트는 역할 검사도 함께 통과
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 메서드 및 클래스 레벨의 @Roles 메타데이터 탐색
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 설정된 Role 제한이 없으면 인증된 모든 유저 통과
    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    // JwtAuthGuard 누락 등 파이프라인 비정상 동작 방어
    if (user === undefined) {
      throw new UnauthorizedException('인증 자격 증명이 유효하지 않습니다.');
    }

    // JwtStrategy.validate()에서 Zod 파싱을 수행하므로, RolesGuard 도달 시점에 user.role은 반드시 존재

    // 사용자의 Role이 요구되는 Role 목록에 포함되는지 검증
    const hasPermission = requiredRoles.includes(user.role);

    if (!hasPermission) {
      throw new ForbiddenException('해당 리소스에 접근할 수 있는 권한이 부족합니다.');
    }

    return true;
  }
}
