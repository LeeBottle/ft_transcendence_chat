'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';
import MyPageView from '@/features/my-page/components/MyPagesView';

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (user === null) {
    return null; // (user) 레이아웃이 인증을 보장하므로 실제로는 도달하지 않음
  }

  function handleLogout() {
    void logout().then(() => {
      router.replace('/login');
    });
  }

  // TODO(API): PATCH /users/me 로 프로필 저장
  function handleSaveInfo(data: { name: string; email: string }) {
    console.warn('save info', data);
  }

  // TODO(API): PATCH /users/me/password 로 비밀번호 변경
  function handleChangePassword(data: { currentPassword: string; newPassword: string }) {
    console.warn('change password', data);
  }

  return (
    <MyPageView
      username={user.loginId}
      displayName={user.name}
      email={user.email}
      role={user.role === 'ADMIN' ? 'admin' : 'user'}
      joinDate="-" // TODO(API): 가입일은 GET /users/me 연동 시 (라우트 가드 이후)
      imageUrl={user.profileImagePath}
      onLogout={handleLogout}
      onSaveInfo={handleSaveInfo}
      onChangePassword={handleChangePassword}
    />
  );
}
