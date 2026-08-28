import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { Request } from 'express';

export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();

  // 프록시 환경(Nginx) 고려: X-Forwarded-For 첫 번째 IP 우선 추출
  const forwardedFor = req.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  if (typeof rawIp === 'string') {
    const [firstIp] = rawIp.split(',');
    const trimmedIp = firstIp?.trim();

    if (trimmedIp !== undefined && trimmedIp.length > 0) {
      return trimmedIp;
    }
  }

  return req.ip ?? req.socket.remoteAddress ?? '127.0.0.1';
});

export const UserAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<Request>();

    return req.headers['user-agent'] ?? null;
  },
);
