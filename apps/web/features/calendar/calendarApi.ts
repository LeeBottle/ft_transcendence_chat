// 캘린더 태스크 — /api/calendar/tasks (백엔드 이식 완료)
//
// 백엔드는 날짜를 ISO8601(offset 필수)로 받고 UTC 로 저장/반환한다.
// 화면은 'YYYY-MM-DD'(KST 기준 날짜)만 다루므로 이 파일에서 변환한다.
// 색상은 백엔드가 저장하지 않아 localStorage(브라우저별)에 태스크 id 로 캐시한다.

import { apiFetch } from '@/features/auth/apiClient';

import {
  calendarTaskListResponseSchema,
  calendarTaskResponseSchema,
  type CalendarTaskResponse,
} from '@repo/schemas/calendar';

import type { CalendarTask, CalendarTaskStatusValue } from './types';

const KST_OFFSET = '+09:00';
const COLOR_KEY_PREFIX = 'calendar:color:';

// 상태별 기본 색 (사용자가 색을 안 골랐을 때)
const STATUS_COLOR: Record<CalendarTaskStatusValue, string> = {
  1: '#2563EB', // 예정
  2: '#BA7517', // 진행중
  3: '#0F6E56', // 완료
};

/** 'YYYY-MM-DD' → 그 날 00:00 (KST) ISO */
export function dateToStartIso(date: string): string {
  return `${date}T00:00:00${KST_OFFSET}`;
}

/** 'YYYY-MM-DD' → 그 날 23:59 (KST) ISO */
export function dateToEndIso(date: string): string {
  return `${date}T23:59:00${KST_OFFSET}`;
}

/** UTC ISO → KST 기준 'YYYY-MM-DD' */
export function isoToDateStr(iso: string): string {
  // sv-SE 로케일은 YYYY-MM-DD 형식을 준다
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(iso));
}

function readColor(id: string): string | null {
  try {
    return localStorage.getItem(COLOR_KEY_PREFIX + id);
  } catch {
    return null;
  }
}

export function writeColor(id: string, color: string): void {
  try {
    localStorage.setItem(COLOR_KEY_PREFIX + id, color);
  } catch {
    // private 모드 등 — 무시
  }
}

export function toCalendarTask(res: CalendarTaskResponse): CalendarTask {
  // 백엔드 status 는 1|2|3 을 보장한다
  const status = res.status;

  return {
    id: res.id,
    title: res.title,
    start: isoToDateStr(res.startAt),
    end: isoToDateStr(res.dueAt),
    room: '개인생성', // 백엔드에 방 개념 없음 (채팅→캘린더 연동은 MVP 밖)
    color: readColor(res.id) ?? STATUS_COLOR[status],
    status,
    completed: res.completedAt !== null,
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };

  return body.message ?? fallback;
}

/** 기간 내 태스크 목록 (status: 1 예정 / 2 진행중 / 3 완료) */
export async function fetchTasks(params: {
  from: string;
  to: string;
  status?: CalendarTaskStatusValue;
}): Promise<CalendarTask[]> {
  const query = new URLSearchParams({
    from: dateToStartIso(params.from),
    to: dateToEndIso(params.to),
  });

  if (params.status !== undefined) {
    query.set('status', String(params.status));
  }

  const res = await apiFetch(`/api/calendar/tasks?${query.toString()}`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `태스크를 불러오지 못했어요 (${res.status})`));
  }

  const parsed = calendarTaskListResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('태스크 응답 형식이 예상과 달라요.');
  }

  return parsed.data.map(toCalendarTask);
}

async function sendTask(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<CalendarTaskResponse> {
  const res = await apiFetch(path, init);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `${fallback} (${res.status})`));
  }

  const parsed = calendarTaskResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('태스크 응답 형식이 예상과 달라요.');
  }

  return parsed.data;
}

export async function createTask(input: {
  title: string;
  start: string;
  end: string;
  color: string;
}): Promise<CalendarTask> {
  const res = await sendTask(
    '/api/calendar/tasks',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        startAt: dateToStartIso(input.start),
        dueAt: dateToEndIso(input.end),
      }),
    },
    '태스크를 만들지 못했어요',
  );

  writeColor(res.id, input.color);

  return toCalendarTask(res);
}

export async function updateTask(
  id: string,
  patch: { title?: string; start?: string; end?: string },
): Promise<CalendarTask> {
  const body: Record<string, string> = {};

  if (patch.title !== undefined) {
    body.title = patch.title;
  }
  if (patch.start !== undefined) {
    body.startAt = dateToStartIso(patch.start);
  }
  if (patch.end !== undefined) {
    body.dueAt = dateToEndIso(patch.end);
  }

  const res = await sendTask(
    `/api/calendar/tasks/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    '태스크를 수정하지 못했어요',
  );

  return toCalendarTask(res);
}

export async function setTaskCompletion(id: string, completed: boolean): Promise<CalendarTask> {
  const res = await sendTask(
    `/api/calendar/tasks/${id}/completion`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    },
    '완료 상태를 바꾸지 못했어요',
  );

  return toCalendarTask(res);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await apiFetch(`/api/calendar/tasks/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `태스크를 삭제하지 못했어요 (${res.status})`));
  }
}
