// features/chat/types.ts

export interface Message {
  id: string;
  authorName: string;
  content: string;
  time: string;
  isMe: boolean;
  avatarLabel?: string;
  avatarColorClass?: string;
  dateLabel?: string; // 이 메시지 앞에 날짜 구분선을 보여줄 때만 채움
}

export interface Task {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  done: boolean;
  isAi: boolean;
  checked?: boolean; // AI 태스크 중 캘린더 삽입을 위해 체크된 것
  existing?: boolean; // 이미 캘린더에 연동된 태스크 (체크 불가)
}
