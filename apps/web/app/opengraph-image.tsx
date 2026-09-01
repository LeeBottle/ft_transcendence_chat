import { ImageResponse } from 'next/og';

// 정적 OG 이미지를 코드로 생성한다 (og:image / twitter:image).
// 빌드 시 /opengraph-image 로 노출되고 루트 metadata 의 openGraph.images 에 자동 연결된다.
export const alt = 'TaskChat — 회의가 곧 일정이 되는 협업 워크스페이스';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 24,
        padding: 96,
        background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 55%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 36,
          }}
        >
          ▲
        </div>
        <span style={{ fontSize: 40, fontWeight: 700, color: '#171717' }}>TaskChat</span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 68,
          fontWeight: 800,
          color: '#171717',
          lineHeight: 1.15,
        }}
      >
        <span>회의가 끝나면</span>
        <span>일정이 남습니다</span>
      </div>
      <div style={{ fontSize: 30, color: '#6b7280' }}>
        실시간 팀 채팅 · 캘린더 · 친구 관리를 한곳에서
      </div>
    </div>,
    size,
  );
}
