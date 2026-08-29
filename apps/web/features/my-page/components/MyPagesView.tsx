'use client';

// MyPageView.tsx (.my-view)
//	vite.config.ts '@assets': '/src/assets'
import { useState, type ChangeEvent, type FormEvent } from 'react';

import Link from 'next/link';

import Avatar from '@/components/Avatar';
import {
  getPwErrors,
  getPwStrength,
  PW_RULES,
  STRENGTH_META,
} from '@/features/auth/passwordPolicy';

export interface MyPageViewProps {
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  joinDate: string;
  imageUrl?: string | null;
  onLogout: () => void;
  onSaveInfo?: (data: { name: string; email: string }) => void;
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => void;
}

function MyPageView({
  username,
  displayName,
  email,
  role,
  joinDate,
  imageUrl,
  onLogout,
  onSaveInfo,
  onChangePassword,
}: MyPageViewProps) {
  // 프로필 카드에 표시되는 값(저장 버튼을 눌러야 반영됨)과, 입력 중인 값을 분리
  const [savedName, setSavedName] = useState(displayName);
  const [nameInput, setNameInput] = useState(displayName);
  const [emailInput, setEmailInput] = useState(email);
  const [infoError, setInfoError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveInfo(e: FormEvent): void {
    e.preventDefault();
    if (!nameInput.trim()) {
      setInfoError('이름을 입력해주세요');

      return;
    }
    setInfoError('');
    setSavedName(nameInput.trim());
    onSaveInfo?.({ name: nameInput.trim(), email: emailInput.trim() });
  }

  const pwErrors = newPw ? getPwErrors(newPw, username) : [];
  const pwStrength = newPw ? getPwStrength(newPw) : 0;
  const strengthMeta = STRENGTH_META[pwStrength] ?? STRENGTH_META[0]!;
  const pwMatch = confirmPw.length > 0 ? newPw === confirmPw : null;
  const canSubmitPw =
    currentPw.length > 0 && newPw.length > 0 && pwErrors.length === 0 && pwMatch === true;

  function handleChangePassword(e: FormEvent): void {
    e.preventDefault();
    if (!canSubmitPw) {
      return;
    }
    onChangePassword?.({ currentPassword: currentPw, newPassword: newPw });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-50 px-6 py-10">
      <div className="flex w-full max-w-150 flex-col gap-4">
        {/* 프로필 헤더 */}
        <section className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="relative shrink-0">
            <Avatar
              name={savedName}
              imageUrl={previewUrl ?? imageUrl}
              size="lg"
            />
            <label className="absolute right-0 bottom-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-purple-500 text-xs text-white">
              📷
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-lg font-semibold text-gray-900">{savedName}</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">ID:</span>
              <span className="font-mono text-gray-600">{username}</span>
              <span className="rounded-lg bg-purple-50 px-1.5 py-0.5 font-medium text-purple-600">
                {role === 'admin' ? '관리자' : '일반 회원'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">가입일:</span>
              <span className="text-gray-600">{joinDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="font-medium text-green-600">활성</span>
            </div>
          </div>
        </section>

        {/* 내 정보 수정 */}
        <form
          onSubmit={handleSaveInfo}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="flex items-center gap-1.5 border-b border-gray-100 px-5 py-3.5 text-sm font-semibold text-gray-900">
            ✎ 내 정보 수정
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-name"
                className="text-xs font-medium text-gray-500"
              >
                이름
              </label>
              <input
                id="edit-name"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                }}
                placeholder="이름 입력"
                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-email"
                className="text-xs font-medium text-gray-500"
              >
                이메일 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                id="edit-email"
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                }}
                placeholder="이메일 입력"
                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              />
            </div>
            {infoError && <p className="text-xs text-red-500">{infoError}</p>}
            <button
              type="submit"
              className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-purple-500 text-sm font-medium text-white transition-colors hover:bg-purple-600"
            >
              ✓ 변경 저장
            </button>
          </div>
        </form>

        {/* 비밀번호 변경 */}
        <form
          onSubmit={handleChangePassword}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="flex items-center gap-1.5 border-b border-gray-100 px-5 py-3.5 text-sm font-semibold text-gray-900">
            🔒 비밀번호 변경
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                🛡 비밀번호 규칙
              </div>
              {PW_RULES.map((rule) => {
                const active = newPw.length > 0;
                const pass = active && rule.pass(newPw, username);
                const fail = active && !rule.pass(newPw, username);

                return (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-1 text-[11px] ${pass ? 'text-green-600' : fail ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    <span>{pass ? '●' : '○'}</span>
                    {rule.label}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="pw-current"
                className="text-xs font-medium text-gray-500"
              >
                현재 비밀번호{' '}
                <span className="text-[10px] font-normal text-gray-400">
                  (변경 버튼 클릭 시 서버에서 확인)
                </span>
              </label>
              <input
                id="pw-current"
                type="password"
                value={currentPw}
                onChange={(e) => {
                  setCurrentPw(e.target.value);
                }}
                placeholder="현재 비밀번호 입력"
                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="pw-new"
                className="text-xs font-medium text-gray-500"
              >
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="pw-new"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                  }}
                  placeholder="새 비밀번호 입력 (10자 이상)"
                  className="h-9 w-full rounded-lg border border-gray-300 pr-9 pl-3 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPw(!showNewPw);
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400"
                >
                  {showNewPw ? '🙈' : '👁'}
                </button>
              </div>
              {newPw.length > 0 && pwErrors.length > 0 && (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {pwErrors.map((err) => (
                    <div
                      key={err}
                      className="flex items-center gap-1 text-[11px] text-red-500"
                    >
                      ⚠ {err}
                    </div>
                  ))}
                </div>
              )}
              {newPw.length > 0 && (
                <div className="mt-1">
                  <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                    <span>비밀번호 강도</span>
                    <span style={{ color: strengthMeta.color }}>{strengthMeta.label}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${strengthMeta.pct}%`, backgroundColor: strengthMeta.color }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="pw-confirm"
                className="text-xs font-medium text-gray-500"
              >
                새 비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="pw-confirm"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                  }}
                  placeholder="새 비밀번호 다시 입력"
                  className="h-9 w-full rounded-lg border border-gray-300 pr-9 pl-3 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmPw(!showConfirmPw);
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400"
                >
                  {showConfirmPw ? '🙈' : '👁'}
                </button>
              </div>
              {pwMatch !== null && (
                <div
                  className={`mt-0.5 text-[11px] ${pwMatch ? 'text-green-600' : 'text-red-500'}`}
                >
                  {pwMatch ? '✓ 비밀번호가 일치해요' : '⚠ 비밀번호가 일치하지 않아요'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmitPw}
              className={`flex h-9.5 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${canSubmitPw ? 'cursor-pointer bg-purple-500 text-white hover:bg-purple-600' : 'cursor-not-allowed bg-gray-200 text-gray-400'} `}
            >
              🔒 비밀번호 변경
            </button>
          </div>
        </form>

        {/* 로그아웃 */}
        <button
          onClick={onLogout}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-300 text-sm text-red-500 transition-colors hover:bg-red-50"
        >
          로그아웃
        </button>

        {/* 약관 및 정책 */}
        <div className="flex justify-center gap-3 text-[11px] text-gray-400">
          <Link
            href="/terms"
            className="hover:text-gray-600 hover:underline"
          >
            이용약관
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/privacy"
            className="hover:text-gray-600 hover:underline"
          >
            개인정보 처리방침
          </Link>
        </div>
      </div>
    </main>
  );
}

export default MyPageView;
