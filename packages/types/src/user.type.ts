export const UserStatus = {
  /** 탈퇴 */
  INACTIVE: 0,

  /** 활성화 */
  ACTIVE: 1,

  /** 정지 */
  SUSPENDED: 2,

  /** 탈퇴 이후 복구되었으나 이메일 변경이 필요한 상태 (이메일은 마스킹 된 상태) */
  NEED_EMAIL_UPDATE: 3,
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserRole = {
  /** 관리자 */
  ADMIN: 0,

  /** 일반 유저 */
  USER: 1,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
