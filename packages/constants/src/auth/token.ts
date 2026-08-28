import type { UserRole } from '#user/user.js';

export interface TokenPayload {
  readonly sub: string; // id
  readonly loginId: string; // loginId
  readonly role: UserRole; // role
  readonly iat: number; // 발급 시각 (Unix Timestamp, 초)
  readonly exp: number; // 만료 시각 (Unix Timestamp, 초)
}
export type TokenInputPayload = Omit<TokenPayload, 'iat' | 'exp'>;
