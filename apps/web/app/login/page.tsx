'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [responseContent, setResponseContent] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData);

    void (async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const text = await response.text();

        setResponseContent(text);
      } catch (error) {
        setResponseContent(error instanceof Error ? error.message : '요청에 실패했습니다.');
      }
    })();
  };

  if (responseContent !== null) {
    return (
      <main>
        <pre>{responseContent}</pre>
        <button
          type="button"
          onClick={() => {
            setResponseContent(null);
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

        <button type="submit">로그인</button>
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
