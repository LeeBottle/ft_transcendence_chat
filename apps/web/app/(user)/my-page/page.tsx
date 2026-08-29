'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';
import MyPageView from '@/features/my-page/components/MyPagesView';
import { fetchMyProfile, updateMyProfile, type MyProfile } from '@/features/my-page/profileApi';

export default function MyPage() {
  const router = useRouter();
  const { user, logout, patchUser } = useAuth();

  const [profile, setProfile] = useState<MyProfile | null>(null);

  // 마운트 시 서버 프로필 조회 (로그인 응답 캐시보다 정확). 실패하면 캐시 그대로 사용.
  useEffect(() => {
    let alive = true;

    void fetchMyProfile()
      .then((p) => {
        if (alive) {
          setProfile(p);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (user === null) {
    return null; // (user) 레이아웃이 인증을 보장하므로 실제로는 도달하지 않음
  }

  function handleLogout() {
    void logout().then(() => {
      router.replace('/login');
    });
  }

  // 이름 저장 → PATCH /users/me → 로컬 프로필 + 헤더 캐시 갱신 (실패 시 throw → 폼이 에러 표시)
  async function handleSaveInfo(data: { name: string }): Promise<void> {
    const updated = await updateMyProfile({ name: data.name });

    setProfile(updated);
    patchUser({ name: updated.name });
  }

  // TODO(2-D): 비밀번호 변경 API 없음 (백엔드 신규 필요)
  function handleChangePassword(data: { currentPassword: string; newPassword: string }) {
    console.warn('change password', data);
  }

  // 서버 프로필이 오기 전엔 로그인 캐시로 즉시 표시, 오면 교체
  const shown = profile ?? {
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImagePath: user.profileImagePath,
  };

  return (
    <MyPageView
      key={profile?.id ?? 'cache'}
      username={shown.loginId}
      displayName={shown.name}
      email={shown.email}
      role={shown.role === 'ADMIN' ? 'admin' : 'user'}
      joinDate="-" // ⚠️ 가입일: GET /users/me 응답에 createdAt 없음 (백엔드 스키마 추가 필요)
      imageUrl={shown.profileImagePath}
      onLogout={handleLogout}
      onSaveInfo={handleSaveInfo}
      onChangePassword={handleChangePassword}
    />
  );
}
