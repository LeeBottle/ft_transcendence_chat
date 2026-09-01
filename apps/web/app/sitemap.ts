import type { MetadataRoute } from 'next';

// 요청 시점에 렌더 → 배포 환경의 SITE_URL(env_file)을 그대로 반영한다.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

// /sitemap.xml 을 Next 가 이 함수로부터 생성한다 (App Router Metadata API).
// 검색엔진에 노출할 공개 페이지만 등록한다 (인증이 필요한 경로는 제외).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${SITE_URL}/register`, lastModified, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
