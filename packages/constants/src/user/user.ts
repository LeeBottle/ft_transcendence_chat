export const UserStatus = {
  /** 활성화 */
  ACTIVE: 'ACTIVE',

  /** 탈퇴 이후 복구되었으나 이메일 변경이 필요한 상태 (이메일은 마스킹 된 상태) */
  // NEED_EMAIL_UPDATE: 'NEED_EMAIL_UPDATE',

  /** 정지 */
  SUSPENDED: 'SUSPENDED',

  /** 탈퇴 */
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserRole = {
  /** 일반 유저 */
  USER: 'USER',

  /** 관리자 */
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
