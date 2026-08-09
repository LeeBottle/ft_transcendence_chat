'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// 뼈대 함수 - 실제 백엔드 연동 전 mock. SUCCESS/FAIL 분기만 미리 정의해둔다.
function mockLoginApi(id: string, password: string): Promise<{ success: boolean; role: 'admin' | 'user' }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id !== '' && password !== '') {
        // SUCCESS: 로그인 성공 - role에 따라 이동할 화면이 달라짐 (호출부에서 분기)
        resolve({ success: true, role: id === 'admin' ? 'admin' : 'user' });
      } else {
        // FAIL: 아이디/비밀번호 중 하나라도 빈 값이면 실패
        reject(new Error('아이디/비밀번호를 확인해주세요.'));
      }
    }, 800);
  });
}

export default function LoginView() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await mockLoginApi(userId, userPassword);
      // SUCCESS: role별로 이동할 화면 분기 (관리자 -> 관리자 화면, 일반 유저 -> 캘린더)
      router.push(result.role === 'admin' ? '/admin/users' : '/calendar');
    } catch (error) {
      // FAIL: 에러 메시지를 화면에 노출
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했어요.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white w-96 rounded-2xl px-8 py-9 border border-gray-200 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-purple-500 rounded-xl w-12 h-12 flex items-center justify-center text-white text-xl">
            💬
          </div>
          <p className="font-bold text-xl text-gray-900">TaskChat</p>
          <p className="text-sm text-gray-500">아이디를 입력해 로그인하세요</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-id" className="text-xs font-medium text-gray-500">
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              placeholder="아이디 입력"
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-pw" className="text-xs font-medium text-gray-500">
              비밀번호
            </label>
            <input
              id="login-pw"
              type="password"
              placeholder="비밀번호 입력"
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
            />
          </div>
          {errorMessage !== null && <p className="text-xs text-red-500">{errorMessage}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          계정이 없으신가요?{' '}
          <span className="text-purple-600 font-semibold cursor-pointer" onClick={() => console.log('회원가입 클릭')}>
            회원가입
          </span>
        </p>
      </div>
    </main>
  );
}
