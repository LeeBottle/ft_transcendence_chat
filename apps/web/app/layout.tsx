import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { AuthProvider } from '@/features/auth/AuthContext';

import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'TaskChat';
const SITE_DESCRIPTION =
  '회의에서 나눈 대화를 그대로 일정으로. 실시간 팀 채팅과 캘린더, 친구 관리를 한곳에서 처리하는 협업 워크스페이스입니다.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 회의가 곧 일정이 되는 협업 워크스페이스`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['협업', '팀 채팅', '캘린더', '일정 관리', '실시간', 'TaskChat'],
  authors: [{ name: 'ft_transcendence team' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 회의가 곧 일정이 되는 협업 워크스페이스`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — 회의가 곧 일정이 되는 협업 워크스페이스`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
