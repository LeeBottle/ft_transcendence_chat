// features/calendar/types.ts

/** 백엔드 status: 1 예정(시작 전) · 2 진행중 · 3 완료 */
export type CalendarTaskStatusValue = 1 | 2 | 3;

export interface CalendarTask {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD (KST)
  end: string; // YYYY-MM-DD (KST)
  room: string; // 백엔드 방 개념 없음 → 항상 '개인생성'
  color: string; // hex (localStorage 캐시 or 상태별 기본색)
  status: CalendarTaskStatusValue;
  completed: boolean;
}
