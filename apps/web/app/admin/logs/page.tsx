import LogTable from '@/features/admin/components/LogTable';
import type { AdminLog } from '@/features/admin/types';

// TODO(API): GET /admin/logs 로 채팅 로그 조회 필요 - 지금은 mock
const LOGS: AdminLog[] = [
  { id: 1, chat_room_id: 1, sender_user_id: 'user_01', content: '스프린트 리뷰 슬라이드 준비됐나요?', created_at: '2025-06-16 10:02' },
  { id: 2, chat_room_id: 2, sender_user_id: 'user_02', content: 'API 문서 업데이트 완료했어요', created_at: '2025-06-16 14:20' },
];

const ROOMS = [
  { id: 1, name: '디자인 팀' },
  { id: 2, name: '개발팀 백엔드' },
];

export default function AdminLogsPage() {
  return <LogTable logs={LOGS} rooms={ROOMS} />;
}
