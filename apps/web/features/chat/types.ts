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
