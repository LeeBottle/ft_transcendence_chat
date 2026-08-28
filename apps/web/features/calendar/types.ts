// features/calendar/types.ts

export interface CalendarTask {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  room: string;
  color: string; // hex
}
