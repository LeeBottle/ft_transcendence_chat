export const CalendarSyncStatus = {
  NOT_REQUESTED: 'NOT_REQUESTED', // 캘린더 연동 비희망
  SUCCESS: 'SUCCESS', // 연동 성공
  FAILURE: 'FAILURE', // 연동 시도했으나 실패
} as const;
export type CalendarSyncStatus = (typeof CalendarSyncStatus)[keyof typeof CalendarSyncStatus];
