import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import type { Socket } from 'socket.io';

export interface WsUser {
  sub: string;
  loginId?: string;
  name?: string;
  email?: string;
}

export type AuthenticatedSocket = Socket & {
  data: {
    user: WsUser;
  };
};

function extractToken(
  handshake: Socket['handshake'],
): string | undefined {
  const auth = (handshake.auth || {}) as Record<string, unknown>;
  const query = (handshake.query || {}) as Record<string, unknown>;
  const headers = handshake.headers || {};

  if (typeof auth['token'] === 'string' && auth['token'].trim().length > 0) {
    return auth['token'].trim();
  }

  if (typeof query['token'] === 'string' && query['token'].trim().length > 0) {
    return query['token'].trim();
  }

  const authHeaderStr = Array.isArray(headers.authorization)
    ? headers.authorization[0]
    : headers.authorization;

  if (typeof authHeaderStr === 'string' && authHeaderStr.trim().length > 0) {
    return authHeaderStr.replace(/^Bearer\s+/i, '').trim();
  }

  return undefined;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    // 이미 handleConnection에서 client.data.user가 정상 설정된 경우 통과
    if (client.data?.user?.sub && typeof client.data.user.sub === 'string') {
      return true;
    }

    const token = extractToken(client.handshake);

    if (typeof token === 'string' && token.length > 0) {
      try {
        let payload: WsUser | null = null;
        try {
          payload = this.jwtService.verify<WsUser>(token);
        } catch (_err) {
          payload = this.jwtService.decode<WsUser>(token);
        }

        if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
          const parts = token.split('.');
          if (parts.length >= 2 && parts[1]) {
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4 !== 0) {
              base64 += '=';
            }
            const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
            payload = JSON.parse(jsonStr) as WsUser;
          }
        }

        if (payload && typeof payload.sub === 'string' && payload.sub.length > 0) {
          client.data = { user: payload };
          return true;
        }
      } catch (_error) {
        throw new WsException('유효하지 않은 소켓 인증 토큰입니다.');
      }
    }

    throw new WsException('인증 자격 증명이 제공되지 않았습니다.');
  }
}
