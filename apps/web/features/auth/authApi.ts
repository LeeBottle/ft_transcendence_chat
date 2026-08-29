// 백엔드 auth 엔드포인트 호출 모음.
// 모두 같은 오리진 상대경로(/api/...) — nginx 가 백엔드로 프록시.
// refreshToken 은 httpOnly 쿠키(path=/api/auth)라 JS 가 직접 다루지 않음 — credentials 로 자동 송수신.

export interface AuthUser {
  loginId: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  role: 'USER' | 'ADMIN';
  status: string;
  profileImagePath: string | null;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
}

/** 실패 시 서버 메시지를 담아 throw */
async function readError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  throw new Error(body.message ?? fallback);
}

export async function loginRequest(loginId: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ loginId, password }),
  });

  if (!response.ok) {
    return await readError(response, '아이디 또는 비밀번호를 확인해 주세요.');
  }

  return (await response.json()) as LoginResponse;
}

/** 성공 시 새 accessToken, 실패(쿠키 없음/만료) 시 null */
export async function refreshRequest(): Promise<string | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as RefreshResponse;
  return body.accessToken;
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {
    // 네트워크 실패해도 클라이언트 상태는 어차피 비움
  });
}

/** access token payload 를 검증 없이 디코드 (UI 표시용 — 보안 판단에 쓰지 말 것) */
export function decodeTokenPayload(
  token: string,
): { sub: string; loginId: string; role: 'USER' | 'ADMIN'; exp: number } | null {
  try {
    const [, payload] = token.split('.');
    if (payload === undefined) {
      return null;
    }
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub: string;
      loginId: string;
      role: 'USER' | 'ADMIN';
      exp: number;
    };
  } catch {
    return null;
  }
}
