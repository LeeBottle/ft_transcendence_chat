import { hostname } from 'node:os';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

import ClientRenderInfo from '@/features/ssr/ClientRenderInfo';

// force-dynamic: 빌드 타임에 정적으로 굳히지 않고 요청마다 서버에서 새로 렌더한다.
// 새로고침할 때마다 아래 "서버 렌더 시각"과 난수가 바뀌는 것으로 SSR 을 확인할 수 있다.
export const dynamic = 'force-dynamic';

// 동적 메타데이터: 렌더 시각을 description 에 넣어 매 요청마다 달라지게 한다.
export function generateMetadata(): Metadata {
  return {
    title: 'SSR 동작 확인',
    description: `이 페이지는 ${new Date().toISOString()} 에 서버에서 렌더링되었습니다.`,
    robots: { index: false, follow: false },
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-subtle">{label}</dt>
      <dd className="text-text font-mono break-all">{value}</dd>
    </>
  );
}

export default async function SsrCheckPage() {
  const headerList = await headers();

  const renderedAt = new Date().toISOString();
  const serverRandom = Math.random().toString(36).slice(2, 12);
  const uptimeSeconds = Math.round(process.uptime());
  const userAgent = headerList.get('user-agent') ?? '(없음)';
  const host = headerList.get('host') ?? '(없음)';

  return (
    <main className="bg-surface-muted text-text min-h-screen">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-caption text-text-muted hover:text-text w-max"
          >
            ← 홈으로
          </Link>
          <h1 className="text-h1 font-bold">SSR 동작 확인</h1>
          <p className="text-body text-text-muted leading-relaxed">
            이 페이지(<code className="font-mono">/ssr</code>)는 서버 컴포넌트이며{' '}
            <code className="font-mono">dynamic = &quot;force-dynamic&quot;</code> 으로 요청마다
            서버 Node 프로세스에서 렌더링됩니다.
          </p>
        </header>

        <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-body font-semibold">1. 서버에서 렌더된 값</h2>
          <p className="text-caption text-text-muted">
            새로고침할 때마다 값이 바뀝니다. 이 값들은 <strong>페이지 소스 보기</strong>(⌘/Ctrl+U)
            했을 때 이미 HTML 안에 들어 있습니다.
          </p>
          <dl className="text-caption grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
            <Field
              label="서버 렌더 시각"
              value={renderedAt}
            />
            <Field
              label="서버 난수"
              value={serverRandom}
            />
            <Field
              label="서버 프로세스 업타임"
              value={`${String(uptimeSeconds)}초`}
            />
            <Field
              label="Node 버전"
              value={process.version}
            />
            <Field
              label="컨테이너 호스트명"
              value={hostname()}
            />
            <Field
              label="요청 Host 헤더"
              value={host}
            />
            <Field
              label="요청 User-Agent"
              value={userAgent}
            />
          </dl>
        </section>

        <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-body font-semibold">2. 대조군 — 브라우저에서 계산된 값</h2>
          <p className="text-caption text-text-muted">
            아래 값은 하이드레이션 이후 클라이언트에서 채워집니다. 페이지 소스에는 빈 자리로만
            존재합니다.
          </p>
          <ClientRenderInfo />
        </section>

        <section className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
          <h2 className="text-body font-semibold">3. 직접 확인하는 법</h2>
          <ol className="text-caption text-text-muted flex list-decimal flex-col gap-1.5 pl-5 leading-relaxed">
            <li>
              이 페이지에서 <strong>페이지 소스 보기</strong>(⌘⌥U / Ctrl+U) → 위 &quot;서버
              난수&quot; 문자열을 소스에서 검색하면 그대로 나옵니다.
            </li>
            <li>
              터미널에서{' '}
              <code className="font-mono">
                curl -s http://localhost:3000/ssr | grep &quot;서버 난수&quot;
              </code>{' '}
              — JS 실행 없이도 콘텐츠가 응답에 포함됩니다.
            </li>
            <li>
              브라우저 JavaScript 를 꺼도(DevTools → Settings → Debugger → Disable JavaScript) 1번
              블록은 그대로 보이고, 2번 블록만 &quot;측정 중…&quot; 으로 남습니다.
            </li>
            <li>새로고침하면 서버 값(시각·난수)이 매번 바뀝니다 = 요청마다 서버 렌더.</li>
          </ol>
        </section>

        <section className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
          <h2 className="text-body font-semibold">4. SEO 관련 산출물</h2>
          <ul className="text-caption text-text-muted flex flex-col gap-1.5 pl-1 leading-relaxed">
            <li>
              <Link
                href="/robots.txt"
                className="text-primary underline"
              >
                /robots.txt
              </Link>{' '}
              — 공개/비공개 경로 구분, 사이트맵 위치
            </li>
            <li>
              <Link
                href="/sitemap.xml"
                className="text-primary underline"
              >
                /sitemap.xml
              </Link>{' '}
              — 공개 페이지 목록
            </li>
            <li>
              루트 레이아웃의 <code className="font-mono">metadata</code> — title 템플릿, Open
              Graph, Twitter 카드, canonical
            </li>
            <li>
              이 페이지의 <code className="font-mono">generateMetadata()</code> — 요청마다 동적으로
              생성되는 메타데이터 (description 에 렌더 시각 포함)
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
