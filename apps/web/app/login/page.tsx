import type { Metadata } from 'next';

import LoginView from '@/features/login/components/LoginView';

export const metadata: Metadata = {
  title: '로그인',
  description: 'TaskChat 계정으로 로그인해 팀 채팅과 캘린더를 이어서 사용하세요.',
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return <LoginView />;
}
