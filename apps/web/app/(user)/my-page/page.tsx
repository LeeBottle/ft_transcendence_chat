'use client';

import { useRouter } from 'next/navigation';

import MyPageView from '@/features/my-page/components/MyPagesView';
import { MOCK_USER } from '@/features/user/mockUser';

export default function MyPage() {
  const router = useRouter();

  function handleLogout() {
    // SUCCESS: 로그아웃 처리(세션/토큰 제거) 후 로그인 화면으로 이동
    router.push('/login');
    // FAIL: 로그아웃 API 실패 시에도 로컬 세션은 지우고 이동하는 게 일반적 (백엔드 연동 시 에러 로깅 추가)
  }

  // TODO(API): PATCH /users/me 로 프로필 저장
  function handleSaveInfo(data: { name: string; email: string }) {
    // SUCCESS: 서버 응답으로 유저 정보 갱신 (지금은 콘솔 로그로 대체)
    console.warn('save info', data);
    // FAIL: 실패 시 에러 토스트 + 입력값 롤백 필요 (백엔드 연동 시 추가)
  }

  // TODO(API): PATCH /users/me/password 로 비밀번호 변경
  function handleChangePassword(data: { currentPassword: string; newPassword: string }) {
    // SUCCESS: 비밀번호 변경 성공 토스트 (지금은 콘솔 로그로 대체)
    console.warn('change password', data);
    // FAIL: 현재 비밀번호 불일치 등 에러 메시지 표시 필요 (백엔드 연동 시 추가)
  }

  return (
    <MyPageView
      {...MOCK_USER}
      onLogout={handleLogout}
      onSaveInfo={handleSaveInfo}
      onChangePassword={handleChangePassword}
    />
  );
}
