'use client';

// 대조군: 이 값들은 서버가 아니라 브라우저에서 하이드레이션 이후 계산된다.
// 서버 렌더 블록의 값과 나란히 두면 SSR 이 뭘 하는지 눈으로 비교된다.
import { useEffect, useState } from 'react';

export default function ClientRenderInfo() {
  const [hydratedAt, setHydratedAt] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string | null>(null);

  useEffect(() => {
    setHydratedAt(new Date().toISOString());
    setUserAgent(navigator.userAgent);
  }, []);

  return (
    <dl className="text-caption grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
      <dt className="text-text-subtle">하이드레이션 시각</dt>
      <dd className="text-text font-mono">{hydratedAt ?? '측정 중…'}</dd>

      <dt className="text-text-subtle">navigator.userAgent</dt>
      <dd className="text-text font-mono break-all">{userAgent ?? '측정 중…'}</dd>

      <dt className="text-text-subtle">계산 위치</dt>
      <dd className="text-text">브라우저 (JS 실행 후) — 페이지 소스에는 없음</dd>
    </dl>
  );
}
