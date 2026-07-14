import type { User } from '@repo/types';

async function fetchData(): Promise<User> {
  const apiUrl = process.env.API_URL;

  const response = await fetch(`${apiUrl}`, {
    cache: 'no-store', // 서버 컴포넌트에서는 명시적 캐시 제어가 중요
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  // response.json()의 결과(any)를 명시적으로 User 타입으로 단언
  const data = (await response.json()) as User;
  return data;
}

export default async function Page() {
  const data = await fetchData();

  return (
    <main>
      <h1>Next.js + NestJS Integration</h1>
      <p>
        <br />
        Data from NestJS: {data.id} {data.title}
      </p>
    </main>
  );
}
