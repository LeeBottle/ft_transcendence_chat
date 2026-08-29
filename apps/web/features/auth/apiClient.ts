// 인증이 필요한 백엔드 호출용 fetch 래퍼 + 공용 토큰 갱신.
//
// - apiFetch: Authorization: Bearer <accessToken> 자동 첨부.
//   /api/auth/* 가 아닌 요청이 401 이면 → refresh 1회 → 원 요청 1회 재시도.
//   재시도도 401 이면 세션 종료 처리(onAuthLost).
// - refreshAccessToken: 앱 전체에서 딱 하나의 refresh 만 돌도록 in-flight 공유
//   (refresh token rotation 경쟁 방지). 소켓 재연결 등에서도 이걸 쓴다.
//
// accessToken 과 콜백은 React(AuthProvider) 안에 있으므로 모듈 스코프 홀더를 AuthProvider 가 채운다.

import { refreshRequest } from '@/features/auth/authApi';

interface ApiClientBridge {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  onAuthLost: () => void;
}

let bridge: ApiClientBridge = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  onAuthLost: () => undefined,
};

/** AuthProvider 가 마운트 시 호출해 홀더를 연결한다. */
export function configureApiClient(next: ApiClientBridge): void {
  bridge = next;
}

let inFlightRefresh: Promise<string | null> | null = null;

/**
 * refresh 쿠키로 새 access token 발급 (앱 전체 공유, 동시 호출은 1회로 합쳐짐).
 * 성공 시 새 토큰을 AuthProvider 에 반영하고 반환, 실패 시 세션 종료 처리 후 null.
 */
export async function refreshAccessToken(): Promise<string | null> {
  inFlightRefresh ??= refreshRequest().finally(() => {
    inFlightRefresh = null;
  });

  const token = await inFlightRefresh;

  if (token === null) {
    bridge.onAuthLost();
  } else {
    bridge.setAccessToken(token);
  }

  return token;
}

function withAuthHeader(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);

  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return { ...init, headers, credentials: 'include' };
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const isAuthRoute = path.startsWith('/api/auth/');

  const response = await fetch(path, withAuthHeader(init, bridge.getAccessToken()));

  if (response.status !== 401 || isAuthRoute) {
    return response;
  }

  const newToken = await refreshAccessToken();

  if (newToken === null) {
    return response;
  }

  const retried = await fetch(path, withAuthHeader(init, newToken));

  if (retried.status === 401) {
    bridge.onAuthLost();
  }

  return retried;
}
