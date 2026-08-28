// 인증이 필요한 백엔드 호출용 fetch 래퍼.
//
// - 요청에 Authorization: Bearer <accessToken> 자동 첨부
// - /api/auth/* 가 아닌 요청이 401 을 받으면 → /api/auth/refresh 1회 → 원 요청 1회 재시도
//
// ⚠️ 백엔드 라우트 보호 가드가 아직 없어서 지금은 보호 API 가 401 을 안 뱉음
//    → 이 파일의 401 분기는 "작성만 해둔" 상태. 가드가 들어오면 자동으로 동작 시작.
//
// accessToken 과 refresh 함수는 React(AuthProvider) 안에 있으므로,
// 모듈 스코프 홀더를 AuthProvider 가 채워준다.

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

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const isAuthRoute = path.startsWith('/api/auth/');

  let response = await fetch(path, withAuthHeader(init, bridge.getAccessToken()));

  if (response.status !== 401 || isAuthRoute) {
    return response;
  }

  // 401 → refresh 시도
  const newToken = await refreshRequest();

  if (newToken === null) {
    bridge.onAuthLost();
    return response;
  }

  bridge.setAccessToken(newToken);
  response = await fetch(path, withAuthHeader(init, newToken));
  return response;
}
