// 인증이 필요한 백엔드 호출용 fetch 래퍼.
//
// - 요청에 Authorization: Bearer <accessToken> 자동 첨부
// - /api/auth/* 가 아닌 요청이 401 을 받으면 → /api/auth/refresh 1회 → 원 요청 1회 재시도
// - 재시도도 401 이면 세션 종료 처리 (onAuthLost)
//
// 백엔드 전역 JwtAuthGuard 적용됨 (9c4df33) → 보호 API 가 실제로 401 을 뱉으므로 이 로직이 동작한다.
//
// accessToken 과 콜백은 React(AuthProvider) 안에 있으므로 모듈 스코프 홀더를 AuthProvider 가 채워준다.

import { refreshRequest } from '@/features/auth/authApi';

interface ApiClientBridge {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  onAuthLost: () => void;
}

let bridge: ApiClientBridge = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  onAuthLost: () => {},
};

/** AuthProvider 가 마운트 시 호출해 홀더를 연결한다. */
export function configureApiClient(next: ApiClientBridge): void {
  bridge = next;
}

function withAuthHeader(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers, credentials: 'include' };
}

// 동시에 여러 요청이 401 을 받아도 refresh 는 한 번만 (refresh token rotation 경쟁 방지).
let inFlightRefresh: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  inFlightRefresh ??= refreshRequest().finally(() => {
    inFlightRefresh = null;
  });
  return await inFlightRefresh;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const isAuthRoute = path.startsWith('/api/auth/');

  const response = await fetch(path, withAuthHeader(init, bridge.getAccessToken()));

  if (response.status !== 401 || isAuthRoute) {
    return response;
  }

  const newToken = await refreshOnce();

  if (newToken === null) {
    bridge.onAuthLost();
    return response;
  }

  bridge.setAccessToken(newToken);
  const retried = await fetch(path, withAuthHeader(init, newToken));

  if (retried.status === 401) {
    bridge.onAuthLost();
  }

  return retried;
}
