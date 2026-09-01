import type { Metadata } from 'next';
import Link from 'next/link';

import RedirectAuthenticated from '@/features/home/RedirectAuthenticated';

// 이 페이지는 서버 컴포넌트다 ('use client' 없음).
// → 요청마다 서버에서 HTML 로 렌더되어, 크롤러/브라우저가 JS 실행 전에
//   전체 콘텐츠를 읽을 수 있다 (SSR + SEO).
export const metadata: Metadata = {
  title: '회의가 곧 일정이 되는 협업 워크스페이스',
  description:
    '실시간 팀 채팅에서 나온 할 일을 캘린더 일정으로 바로 옮기세요. TaskChat 은 채팅·캘린더·친구 관리를 하나로 묶은 협업 도구입니다.',
  alternates: { canonical: '/' },
};

const FEATURES = [
  {
    title: '실시간 팀 채팅',
    body: 'WebSocket 기반 채팅방에서 회의를 진행하고, 참여자와 온라인 상태를 실시간으로 확인합니다.',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: '팀 캘린더',
    body: '회의에서 정한 할 일을 날짜별 캘린더에 등록하고, 진행 상태를 한눈에 관리합니다.',
    icon: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
        />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  {
    title: '친구 & 상태',
    body: '자주 협업하는 사람을 친구로 추가하고, 지금 접속 중인지 바로 알 수 있습니다.',
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle
          cx="9"
          cy="7"
          r="4"
        />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      <RedirectAuthenticated />

      <div className="bg-surface-muted text-text flex min-h-screen flex-col">
        <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="text-body font-semibold">TaskChat</span>
          <div className="flex-1" />
          <Link
            href="/login"
            className="text-body text-text-muted hover:bg-surface-muted flex h-9 items-center rounded-lg px-3"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="bg-primary hover:bg-primary-hover text-body flex h-9 items-center rounded-lg px-4 font-medium text-white"
          >
            시작하기
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-16">
          <section className="flex flex-col items-start gap-5">
            <span className="border-border bg-surface text-caption text-text-muted rounded-full border px-3 py-1">
			<Link href="/ssr">
              이 페이지는 서버에서 렌더링됐습니다
			</Link>
            </span>
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
              회의가 끝나면
              <br />
              일정이 남습니다
            </h1>
            <p className="text-text-muted max-w-xl text-base leading-relaxed">
              TaskChat 은 실시간 팀 채팅에서 나온 할 일을 그대로 캘린더 일정으로 옮깁니다. 채팅,
              캘린더, 친구 관리를 오가지 않고 한곳에서 처리하세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="bg-primary hover:bg-primary-hover flex h-11 items-center rounded-lg px-6 text-sm font-medium text-white"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="border-border-strong bg-surface text-text-muted hover:bg-surface-muted flex h-11 items-center rounded-lg border px-6 text-sm font-medium"
              >
                로그인
              </Link>
            </div>
          </section>

          <section
            aria-label="주요 기능"
            className="grid gap-4 sm:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5"
              >
                <span className="bg-primary-soft text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {feature.icon}
                  </svg>
                </span>
                <h2 className="text-body font-semibold">{feature.title}</h2>
                <p className="text-caption text-text-muted leading-relaxed">{feature.body}</p>
              </article>
            ))}
          </section>
        </main>

        <footer className="border-border text-caption text-text-subtle border-t px-6 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} TaskChat</span>
            <Link
              href="/terms"
              className="hover:text-text-muted"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="hover:text-text-muted"
            >
              개인정보 처리방침
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
