'use client';

import { useState, type FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { loginUserRequestSchema } from '@repo/schemas/auth';

// import { loginUserResponseSchema, loginUserRequestSchema, type LoginUserRequest, type LoginUserResponse } from '@repo/schemas/auth';

// 뼈대 함수 - 실제 백엔드 연동 전 mock. SUCCESS/FAIL 분기만 미리 정의해둔다.
async function mockLoginApi(
  id: string,
  password: string,
): Promise<{ success: boolean; role: 'admin' | 'user' }> {
  return await new Promise((resolve, reject) => {
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

//로그인 API 구현되면 사용할 함수 -> mockLoginApi 삭제 -> LoginResponse 랑 맞는지 확인 (loginId, role)
// async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
//   const res = await fetch('/api/auth/login', {
//     method: 'POST',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   });
//  const json: unknown = await res.json();
//  const result = loginResponseSchema.safeParse(json);
//
//   if (!result.success)
// {
//     throw new Error('서버 응답 형식이 올바르지 않습니다.');
//   }

//   return result.data;
// }

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
      const check = loginUserRequestSchema.safeParse({ loginId: userId, password: userPassword });
      //.parse()

      if (!check.success) {
        setErrorMessage(check.error.issues[0]?.message ?? '입력값을 확인해주세요.');
        return;
      }

      const result = await mockLoginApi(userId, userPassword); //상태 코드 -> 400 ,500 받으면

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
    <main className="flex h-screen items-center justify-center bg-gray-100">
      <div className="flex w-96 flex-col gap-6 rounded-2xl border border-gray-200 bg-white px-8 py-9">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-xl text-white">
            💬
          </div>
          <p className="text-xl font-bold text-gray-900">TaskChat</p>
          <p className="text-sm text-gray-500">아이디를 입력해 로그인하세요</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleLogin}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-id"
              className="text-xs font-medium text-gray-500"
            >
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              placeholder="아이디 입력"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-pw"
              className="text-xs font-medium text-gray-500"
            >
              비밀번호
            </label>
            <input
              id="login-pw"
              type="password"
              placeholder="비밀번호 입력"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
            />
          </div>
          {errorMessage !== null && <p className="text-xs text-red-500">{errorMessage}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="h-10 w-full cursor-pointer rounded-lg bg-purple-500 text-sm font-semibold text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          계정이 없으신가요?{' '}
          <Link
            href="/register"
            className="cursor-pointer font-semibold text-purple-600"
          >
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
