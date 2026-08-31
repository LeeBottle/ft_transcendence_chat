// 채팅 메시지 — 히스토리 조회 + 백엔드 응답을 화면용 Message 로 변환.

import { apiFetch } from '@/features/auth/apiClient';

import { getMessagesResponseSchema, type ChatMessageResponse } from '@repo/schemas/chat';

import type { Message } from './types';

const HISTORY_PAGE_SIZE = 30;

interface FetchMessagesOptions {
  /** 이 id 보다 과거(더 예전) 메시지를 가져온다 (더보기용) */
  before?: string;
  limit?: number;
}

/**
 * 방의 메시지 히스토리 조회.
 * 백엔드는 "최신 → 과거" 순으로 주므로, 화면 표시용으로 뒤집어 "과거 → 최신" 순으로 반환한다.
 */
export async function fetchMessages(
  roomId: string,
  options: FetchMessagesOptions = {},
): Promise<ChatMessageResponse[]> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? HISTORY_PAGE_SIZE),
  });

  if (options.before !== undefined) {
    params.set('cursor', options.before);
    params.set('direction', 'BEFORE');
  }

  const res = await apiFetch(`/api/chat/rooms/${roomId}/messages?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`메시지를 불러오지 못했어요 (${res.status})`);
  }

  const parsed = getMessagesResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('메시지 응답 형식이 예상과 달라요.');
  }

  return parsed.data.messages.reverse();
}

export { HISTORY_PAGE_SIZE };

const AVATAR_CLASSES = [
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
] as const;

function hashIndex(value: string, mod: number): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash) % mod;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(iso));
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/**
 * "과거 → 최신" 순으로 정렬된 백엔드 메시지 목록을 화면용 Message[] 로 변환.
 * 날짜가 바뀌는 첫 메시지에만 dateLabel 을 채운다.
 */
export function mapMessages(list: ChatMessageResponse[], myUserId: string | null): Message[] {
  let previousDay: string | null = null;

  return list.map((res) => {
    const day = dayKey(res.sentAt);
    const dateLabel = day === previousDay ? undefined : formatDateLabel(res.sentAt);

    previousDay = day;

    const authorName = res.senderName ?? '알 수 없음';

    return {
      id: res.id,
      authorName,
      content: res.content,
      time: formatTime(res.sentAt),
      isMe: myUserId !== null && res.senderUserId === myUserId,
      avatarLabel: authorName.slice(0, 1),
      avatarColorClass: AVATAR_CLASSES[hashIndex(res.senderUserId, AVATAR_CLASSES.length)],
      dateLabel,
    };
  });
}

/** id 중복 없이 과거 메시지를 앞에, 신규 메시지를 뒤에 합친다. */
export function mergeMessages(
  current: ChatMessageResponse[],
  incoming: ChatMessageResponse[],
  position: 'prepend' | 'append',
): ChatMessageResponse[] {
  const seen = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));

  if (fresh.length === 0) {
    return current;
  }

  return position === 'prepend' ? [...fresh, ...current] : [...current, ...fresh];
}
