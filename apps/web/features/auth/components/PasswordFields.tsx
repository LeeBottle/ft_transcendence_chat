'use client';

// 비밀번호 입력 블록 (규칙 체크리스트 + 새 비밀번호 + 확인 + 강도 + 일치 표시).
// 마이페이지 "비밀번호 변경" 모듈에서 추출 — 회원가입/비밀번호 변경 공용.
import { useState } from 'react';

import {
  getPwErrors,
  getPwStrength,
  PW_RULES,
  STRENGTH_META,
} from '@/features/auth/passwordPolicy';

interface PasswordFieldsProps {
  /** 아이디 유사성 규칙 체크에 사용 (회원가입은 입력 중인 loginId) */
  loginId: string;
  password: string;
  passwordConfirm: string;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
  /** 새 비밀번호 라벨 (기본: '비밀번호') */
  passwordLabel?: string;
}

export default function PasswordFields({
  loginId,
  password,
  passwordConfirm,
  onPasswordChange,
  onPasswordConfirmChange,
  passwordLabel = '비밀번호',
}: PasswordFieldsProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwErrors = password ? getPwErrors(password, loginId) : [];
  const pwStrength = password ? getPwStrength(password) : 0;
  const strengthMeta = STRENGTH_META[pwStrength] ?? STRENGTH_META[0]!;
  const pwMatch = passwordConfirm.length > 0 ? password === passwordConfirm : null;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
        <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-900">
          🛡 비밀번호 규칙
        </div>
        {PW_RULES.map((rule) => {
          const active = password.length > 0;
          const pass = active && rule.pass(password, loginId);
          const fail = active && !rule.pass(password, loginId);
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
          htmlFor="pw-new"
          className="text-xs font-medium text-gray-500"
        >
          {passwordLabel}
        </label>
        <div className="relative">
          <input
            id="pw-new"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              onPasswordChange(e.target.value);
            }}
            placeholder="비밀번호 입력 (10자 이상)"
            className="h-9 w-full rounded-lg border border-gray-300 pr-9 pl-3 text-sm outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={() => {
              setShowPw((prev) => !prev);
            }}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400"
          >
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {password.length > 0 && pwErrors.length > 0 && (
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
        {password.length > 0 && (
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
          {passwordLabel} 확인
        </label>
        <div className="relative">
          <input
            id="pw-confirm"
            type={showConfirm ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={(e) => {
              onPasswordConfirmChange(e.target.value);
            }}
            placeholder="비밀번호 다시 입력"
            className="h-9 w-full rounded-lg border border-gray-300 pr-9 pl-3 text-sm outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={() => {
              setShowConfirm((prev) => !prev);
            }}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400"
          >
            {showConfirm ? '🙈' : '👁'}
          </button>
        </div>
        {pwMatch !== null && (
          <div className={`mt-0.5 text-[11px] ${pwMatch ? 'text-green-600' : 'text-red-500'}`}>
            {pwMatch ? '✓ 비밀번호가 일치해요' : '⚠ 비밀번호가 일치하지 않아요'}
          </div>
        )}
      </div>
    </div>
  );
}
