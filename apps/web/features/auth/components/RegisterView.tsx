'use client';

import { useState, type FormEvent } from 'react';

import Link from 'next/link';

import PasswordFields from '@/features/auth/components/PasswordFields';
import { getPwErrors } from '@/features/auth/passwordPolicy';

import { registerUserRequestSchema } from '@repo/schemas/auth';

interface FieldError {
  field: string;
  message: string;
}

interface RegisterErrorBody {
  message?: string;
  errors?: FieldError[];
}

interface RegisterSuccess {
  loginId: string;
  email: string;
  createdAt: string;
}

export default function RegisterView() {
  const [loginId, setLoginId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<RegisterSuccess | null>(null);

  // 서버(NestJS)가 쓰는 것과 동일한 zod 스키마로 클라이언트에서 먼저 검증한다.
  const payload = {
    loginId: loginId.trim(),
    password,
    passwordConfirm,
    name: name.trim(),
    email: email.trim(),
  };
  const parsed = registerUserRequestSchema.safeParse(payload);

  // zod 이슈를 필드별 첫 메시지로 정리
  const zodError: Partial<Record<string, string>> = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];

      if (typeof key === 'string' && zodError[key] === undefined) {
        zodError[key] = issue.message;
      }
    }
  }

  // 비밀번호는 passwordPolicy 규칙이 스키마보다 엄격하므로 그걸 최종 게이트로 사용
  const pwOk = password.length > 0 && getPwErrors(password, loginId).length === 0;
  const canSubmit = parsed.success && pwOk && agreedTerms && agreedPrivacy && !isSubmitting;

  function serverErrorFor(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  // 텍스트 필드: 서버 에러 우선, 없으면 값이 입력된 경우에 한해 zod 형식 에러
  function textFieldError(field: 'loginId' | 'name' | 'email', value: string): string | undefined {
    return serverErrorFor(field) ?? (value.trim().length > 0 ? zodError[field] : undefined);
  }

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    setFieldErrors([]);
    setFormError(null);

    try {
      // nginx 가 /api 를 백엔드로 프록시하므로 같은 오리진 상대경로 사용
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as RegisterSuccess;

        setDone(data);

        return;
      }

      const body = (await response.json().catch(() => ({}))) as RegisterErrorBody;

      if (body.errors && body.errors.length > 0) {
        setFieldErrors(body.errors);
      }
      setFormError(body.message ?? '회원가입에 실패했어요. 입력값을 확인해 주세요.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '요청에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    void submit();
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="text-2xl">🎉</div>
          <p className="text-lg font-semibold text-gray-900">회원가입 완료</p>
          <p className="text-sm text-gray-500">
            <span className="font-mono text-gray-700">{done.loginId}</span> 계정이 생성됐어요.
          </p>
          <Link
            href="/login"
            className="mt-2 flex h-10 items-center justify-center rounded-lg bg-purple-500 text-sm font-semibold text-white transition-colors hover:bg-purple-600"
          >
            로그인 하러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-50 px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-xl text-white">
            💬
          </div>
          <p className="text-xl font-bold text-gray-900">회원가입</p>
        </div>

        <div className="flex flex-col gap-3.5 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="reg-loginId"
              className="text-xs font-medium text-gray-500"
            >
              아이디{' '}
              <span className="font-normal text-gray-400">(영문 소문자·숫자·_ , 5~20자)</span>
            </label>
            <input
              id="reg-loginId"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
              }}
              placeholder="아이디 입력"
              autoComplete="username"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
            {textFieldError('loginId', loginId) !== undefined && (
              <p className="text-[11px] text-red-500">{textFieldError('loginId', loginId)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="reg-name"
              className="text-xs font-medium text-gray-500"
            >
              이름 <span className="font-normal text-gray-400">(한글 또는 영문, 숫자 불가)</span>
            </label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="이름 입력"
              autoComplete="name"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
            {textFieldError('name', name) !== undefined && (
              <p className="text-[11px] text-red-500">{textFieldError('name', name)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="reg-email"
              className="text-xs font-medium text-gray-500"
            >
              이메일
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="이메일 입력"
              autoComplete="email"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
            {textFieldError('email', email) !== undefined && (
              <p className="text-[11px] text-red-500">{textFieldError('email', email)}</p>
            )}
          </div>

          <PasswordFields
            loginId={loginId}
            password={password}
            passwordConfirm={passwordConfirm}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
          />
          {(serverErrorFor('password') ?? serverErrorFor('passwordConfirm')) !== undefined && (
            <p className="text-[11px] text-red-500">
              {serverErrorFor('password') ?? serverErrorFor('passwordConfirm')}
            </p>
          )}

          {formError !== null && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3.5">
            <label className="flex items-start gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked);
                }}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-purple-500"
              />
              <span>
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-600 underline"
                >
                  이용약관
                </Link>
                에 동의합니다. <span className="text-red-500">(필수)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => {
                  setAgreedPrivacy(e.target.checked);
                }}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-purple-500"
              />
              <span>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-600 underline"
                >
                  개인정보 수집·이용
                </Link>
                에 동의합니다. <span className="text-red-500">(필수)</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              canSubmit
                ? 'cursor-pointer bg-purple-500 text-white hover:bg-purple-600'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
          >
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-semibold text-purple-600"
          >
            로그인
          </Link>
        </p>
      </form>
    </main>
  );
}
