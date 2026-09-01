import type { MetadataRoute } from 'next';

// 요청 시점에 렌더 → 배포 환경의 SITE_URL(env_file)을 그대로 반영한다.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

// /robots.txt 를 Next 가 이 함수로부터 생성한다 (App Router Metadata API).
// 공개 페이지(랜딩·로그인·회원가입·약관)만 크롤링 허용하고,
// 로그인이 필요한 앱 내부 경로는 색인에서 제외한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/calendar', '/chat/', '/friends', '/my-page', '/admin/', '/styleguide'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
