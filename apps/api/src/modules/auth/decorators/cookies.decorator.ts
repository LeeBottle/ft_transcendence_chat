import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { Request } from 'express';

export const Cookies = createParamDecorator(
  (cookieName: string, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const rawCookies: unknown = req.cookies;

    if (typeof rawCookies === 'object' && rawCookies !== null && cookieName in rawCookies) {
      const cookieValue = (rawCookies as Record<string, unknown>)[cookieName];

      return typeof cookieValue === 'string' && cookieValue.length > 0 ? cookieValue : null;
    }

    return null;
  },
);
