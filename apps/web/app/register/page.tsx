import type { Metadata } from 'next';

import RegisterView from '@/features/auth/components/RegisterView';

export const metadata: Metadata = {
  title: '회원가입',
  description: '이메일과 비밀번호만으로 TaskChat 워크스페이스를 시작하세요.',
  alternates: { canonical: '/register' },
};

export default function RegisterPage() {
  return <RegisterView />;
}
