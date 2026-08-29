import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import type { Socket } from 'socket.io';

import { tokenPayloadSchema, type AuthenticatedUser } from '@repo/schemas/auth';

import type { ApiEnv } from '#config/api-env.schema.js';

export type WsUser = AuthenticatedUser; // { id, loginId, role }

export type AuthenticatedSocket = Socket & {
  data: {
    user: WsUser;
  };
};

// 소켓 핸드셰이크에서 토큰 추출: auth.token → Authorization 헤더 순
function extractToken(handshake: Socket['handshake']): string | undefined {
  const auth = (handshake.auth ?? {}) as Record<string, unknown>;

  if (typeof auth['token'] === 'string' && auth['token'].trim().length > 0) {
    return auth['token'].trim();
  }

  const rawHeader = handshake.headers?.authorization;
  const headerStr = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (typeof headerStr === 'string' && headerStr.trim().length > 0) {
    return headerStr.replace(/^Bearer\s+/i, '').trim();
  }

  return undefined;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ApiEnv, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    // 같은 연결에서 이미 검증된 경우 통과
    if (typeof client.data?.user?.id === 'string' && client.data.user.id.length > 0) {
      return true;
    }

    const token = extractToken(client.handshake);

    if (token === undefined) {
      throw new WsException('인증 자격 증명이 제공되지 않았습니다.');
    }

    let rawPayload: unknown;
    try {
      rawPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw new WsException('유효하지 않거나 만료된 토큰입니다.');
    }

    const result = tokenPayloadSchema.safeParse(rawPayload);

    if (!result.success) {
      throw new WsException('유효하지 않은 토큰 페이로드입니다.');
    }

    client.data = {
      user: { id: result.data.sub, loginId: result.data.loginId, role: result.data.role },
    };

    return true;
  }
}
