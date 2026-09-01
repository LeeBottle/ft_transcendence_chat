'use client';

// 랜딩(/)은 서버에서 렌더되는 공개 페이지지만, 이미 로그인한 사용자는
// 곧바로 앱 홈으로 보낸다. 렌더링 자체를 막지 않는 얇은 클라이언트 아일랜드.
import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';

export default function RedirectAuthenticated() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(user?.role === 'ADMIN' ? '/admin/users' : '/calendar');
    }
  }, [status, user, router]);

  return null;
}
