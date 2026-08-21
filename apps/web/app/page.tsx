import Link from 'next/link';

export default function Page() {
  return (
    <main>
      <nav>
        <ul>
          <li>
            <Link href="/login">로그인</Link>
          </li>
          <li>
            <Link href="/register">회원가입</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
