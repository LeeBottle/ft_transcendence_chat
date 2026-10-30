'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { configureApiClient } from '@/features/auth/apiClient';
import {
  decodeTokenPayload,
  loginRequest,
  logoutRequest,
  refreshRequest,
  type AuthUser,
} from '@/features/auth/authApi';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** 로그인한 유저의 id (토큰 payload 의 sub). 미로그인 시 null */
  userId: string | null;
  /** 현재 메모리에 있는 access token (소켓 연결 등에 사용). 없으면 null */
  getAccessToken: () => string | null;
  /** 성공 시 로그인된 유저 반환, 실패 시 서버 메시지로 throw */
  login: (loginId: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** 프로필 일부(이름 등)를 바꾼 뒤 헤더·캐시에 반영 */
  patchUser: (partial: Partial<AuthUser>) => void;
  /** 세션 로테이션(비밀번호 변경 등) 후 새 access token 적용 */
  applyAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// 유저 프로필(이름/이메일 등)은 민감 정보가 아니라서 새로고침 생존용으로 localStorage 에 캐시.
// accessToken 은 메모리(ref)에만 — refresh 쿠키로 재발급.
const USER_CACHE_KEY = 'auth:user';

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);

    return raw === null ? null : (JSON.parse(raw) as AuthUser);
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null): void {
  try {
    if (user === null) {
      localStorage.removeItem(USER_CACHE_KEY);
    } else {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
  } catch {
    // private 모드 등 — 무시
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const didInit = useRef(false);

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setUserId(null);
    writeCachedUser(null);
    setStatus('unauthenticated');
  }, []);

  // apiClient(모듈 스코프 fetch 래퍼)에 현재 토큰/콜백 연결
  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken: (token) => {
        accessTokenRef.current = token;
      },
      onAuthLost: clearAuth,
    });
  }, [clearAuth]);

  // 앱 로드 시 refresh 쿠키로 세션 복원 시도
  useEffect(() => {
    if (didInit.current) {
      return;
    }
    didInit.current = true;

    void (async () => {
      const token = await refreshRequest();

      if (token === null) {
        clearAuth();

        return;
      }

      accessTokenRef.current = token;
      setUserId(decodeTokenPayload(token)?.sub ?? null);

      const cached = readCachedUser();

      if (cached !== null) {
        setUser(cached);
      } else {
        // 캐시가 없으면 토큰에서 최소 정보만 복원
        const payload = decodeTokenPayload(token);

        setUser(
          payload === null
            ? null
            : {
                loginId: payload.loginId,
                name: payload.loginId,
                email: '',
                emailVerifiedAt: null,
                role: payload.role,
                status: 'ACTIVE',
                profileImagePath: null,
              },
        );
      }

      setStatus('authenticated');
    })();
  }, [clearAuth]);

  const login = useCallback(async (loginId: string, password: string): Promise<AuthUser> => {
    const { accessToken, user: loggedIn } = await loginRequest(loginId, password);

    accessTokenRef.current = accessToken;
    setUserId(decodeTokenPayload(accessToken)?.sub ?? null);
    setUser(loggedIn);
    writeCachedUser(loggedIn);
    setStatus('authenticated');

    return loggedIn;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest();
    clearAuth();
  }, [clearAuth]);

  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const patchUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (prev === null) {
        return prev;
      }

      const next = { ...prev, ...partial };

      writeCachedUser(next);

      return next;
    });
  }, []);

  const applyAccessToken = useCallback((token: string) => {
    accessTokenRef.current = token;
    setUserId(decodeTokenPayload(token)?.sub ?? null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, userId, getAccessToken, login, logout, patchUser, applyAccessToken }),
    [status, user, userId, getAccessToken, login, logout, patchUser, applyAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (ctx === null) {
    throw new Error('useAuth 는 AuthProvider 내부에서만 사용할 수 있어요.');
  }

  return ctx;
}
