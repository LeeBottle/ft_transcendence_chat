'use client';

import { useEffect, useState, type FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';

import { loginUserRequestSchema } from '@repo/schemas/auth';

export default function LoginView() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 이미 로그인된 상태면 로그인 화면을 보여줄 이유가 없음
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/calendar');
    }
  }, [status, router]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const check = loginUserRequestSchema.safeParse({ loginId: userId, password: userPassword });

      if (!check.success) {
        setErrorMessage(check.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
        return;
      }

      const user = await login(userId, userPassword);

      // role 별 이동 (관리자 → 관리자 화면, 일반 유저 → 캘린더)
      router.push(user.role === 'ADMIN' ? '/admin/users' : '/calendar');
    } catch (error) {
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
              autoComplete="username"
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
              autoComplete="current-password"
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
        <div className="flex justify-center gap-3 text-[11px] text-gray-400">
          <Link
            href="/terms"
            className="hover:text-gray-600 hover:underline"
          >
            이용약관
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/privacy"
            className="hover:text-gray-600 hover:underline"
          >
            개인정보 처리방침
          </Link>
        </div>
      </div>
    </main>
  );
}
