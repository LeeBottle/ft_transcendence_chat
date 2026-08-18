/** 외부 API 응답에는 INVALID_CREDENTIALS 에러 코드 사용할것 */
export const UserLoginHistoryFailureReason = {
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  USER_NOT_FOUND: 'USER_NOT_FOUND', // 유일하게 user_id가 NULL이 되는 케이스
  SUSPENDED: 'SUSPENDED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type UserLoginHistoryFailureReason =
  (typeof UserLoginHistoryFailureReason)[keyof typeof UserLoginHistoryFailureReason];
