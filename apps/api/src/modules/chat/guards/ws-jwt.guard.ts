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
  auth: Record<string, unknown>,
  authorizationHeader?: string,
): string | undefined {
  if (typeof auth['token'] === 'string') {
    return auth['token'];
  }

  if (typeof authorizationHeader === 'string') {
    return authorizationHeader.replace(/^Bearer\s+/i, '');
  }

  return undefined;
}

function extractUserId(
  auth: Record<string, unknown>,
  headerUserId?: string | string[],
): string | undefined {
  if (auth['userId'] !== undefined && auth['userId'] !== null) {
    const val = String(auth['userId']).trim();

    if (val.length > 0) {
      return val;
    }
  }

  if (typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  return undefined;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const auth = client.handshake.auth as Record<string, unknown>;
    const headers = client.handshake.headers;

    const token = extractToken(auth, headers.authorization);

    if (typeof token === 'string' && token.length > 0) {
      try {
        const payload = this.jwtService.verify<WsUser>(token);

        client.data = { user: payload };

        return true;
      } catch (_error) {
        throw new WsException('유효하지 않은 소켓 인증 토큰입니다.');
      }
    }

    const userId = extractUserId(auth, headers['x-user-id']);

    if (typeof userId === 'string' && userId.length > 0) {
      client.data = { user: { sub: userId } };

      return true;
    }

    client.data = { user: { sub: '1' } };

    return true;
  }
}
