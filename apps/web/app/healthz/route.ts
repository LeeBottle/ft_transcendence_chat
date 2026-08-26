import { NextResponse } from 'next/server';

// 빌드 타임 사전 렌더링을 방지하고 항상 런타임 서버 상태를 반환하도록 강제
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
