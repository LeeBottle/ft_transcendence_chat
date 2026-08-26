'use client';

import { useState, type FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SubmitResult = { status: 'success'; data: unknown } | { status: 'error'; message: string };

export default function RegisterPage() {
  const router = useRouter();
  const [result, setResult] = useState<SubmitResult | null>(null);

  const handleRegister = async (payload: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();

        setResult({ status: 'error', message: errorText });

        return;
      }

      const data: unknown = await response.json();

      setResult({ status: 'success', data });
    } catch (error) {
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      loginId: formData.get('loginId'),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm'),
      name: formData.get('name'),
      email: formData.get('email'),
    };

    void handleRegister(payload);
  };

  if (result) {
    return (
      <main>
        {result.status === 'success' ? (
          <div>
            <h1>회원가입 성공</h1>
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
            <Link href="/login">로그인 하러 가기</Link>
          </div>
        ) : (
          <div>
            <h1>회원가입 실패</h1>
            <pre>{result.message}</pre>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setResult(null);
          }}
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
        >
          뒤로가기
        </button>
      </main>
    );
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="loginId">아이디: </label>
          <input
            id="loginId"
            name="loginId"
            type="text"
            required
          />
        </div>

        <div>
          <label htmlFor="password">비밀번호: </label>
          <input
            id="password"
            name="password"
            type="password"
            required
          />
        </div>

        <div>
          <label htmlFor="passwordConfirm">비밀번호 확인: </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
          />
        </div>

        <div>
          <label htmlFor="name">이름: </label>
          <input
            id="name"
            name="name"
            type="text"
            required
          />
        </div>

        <div>
          <label htmlFor="email">이메일: </label>
          <input
            id="email"
            name="email"
            type="email"
            required
          />
        </div>

        <button type="submit">회원가입</button>
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
        >
          뒤로가기
        </button>
      </form>
    </main>
  );
}
