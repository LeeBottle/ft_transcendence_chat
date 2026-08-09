'use client';
// MyPageView.tsx (.my-view)
//	vite.config.ts '@assets': '/src/assets'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Avatar from '@/components/Avatar'

export interface MyPageViewProps {
  username: string
  displayName: string
  email: string
  role: 'user' | 'admin'
  joinDate: string
  imageUrl?: string | null
  onLogout: () => void
  onSaveInfo?: (data: { name: string; email: string }) => void
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => void
}

// ── 비밀번호 규칙 (validatePw() / getPwErrors() 대체) ──
const COMMON_WORDS = ['password', 'qwerty', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'abc', 'iloveyou']
const SEQ_NUM = /012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210/
const SPECIAL_CHAR = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

interface PwRule {
  id: string
  label: string
  pass: (pw: string, loginId: string) => boolean
}

const PW_RULES: PwRule[] = [
  { id: 'length', label: '최소 10자 이상', pass: (pw) => pw.length >= 10 },
  { id: 'upper', label: '대문자 1자 이상 포함', pass: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: '숫자 1자 이상 포함', pass: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: '특수문자 1자 이상 포함 (!@#$%^&* 등)', pass: (pw) => SPECIAL_CHAR.test(pw) },
  { id: 'seq', label: '연속된 숫자 3자 이상 금지 (123, 456 등)', pass: (pw) => !SEQ_NUM.test(pw) },
  { id: 'id', label: '아이디와 유사한 문자 금지', pass: (pw, loginId) => !loginId || !pw.toLowerCase().includes(loginId.toLowerCase()) },
]

function getPwErrors(pw: string, loginId: string): string[] {
  const errors: string[] = []
  if (pw.length < 10) errors.push('최소 10자 이상이어야 해요')
  if (!/[A-Z]/.test(pw)) errors.push('대문자를 1자 이상 포함해야 해요')
  if (!/[0-9]/.test(pw)) errors.push('숫자를 1자 이상 포함해야 해요')
  if (!SPECIAL_CHAR.test(pw)) errors.push('특수문자를 1자 이상 포함해야 해요')
  if (SEQ_NUM.test(pw)) errors.push('연속된 숫자 3자 이상은 사용할 수 없어요 (예: 123, 456)')
  if (loginId && pw.toLowerCase().includes(loginId.toLowerCase())) errors.push('아이디와 유사한 문자는 사용할 수 없어요')
  const matched = COMMON_WORDS.find((w) => pw.toLowerCase().includes(w))
  if (matched) errors.push(`자주 쓰이는 단어 "${matched}"는 사용할 수 없어요`)
  return errors
}

function getPwStrength(pw: string): number {
  let score = 0
  if (pw.length >= 10) score++
  if (pw.length >= 14) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[!@#$%^&*]/.test(pw)) score++
  if (pw.length >= 18) score++
  return Math.min(score, 5)
}

const STRENGTH_META = [
  { pct: 0, color: '', label: '' },
  { pct: 20, color: '#D92D20', label: '매우 약함' },
  { pct: 40, color: '#F79009', label: '약함' },
  { pct: 60, color: '#FCD34D', label: '보통' },
  { pct: 80, color: '#6C63FF', label: '강함' },
  { pct: 100, color: '#0F6E56', label: '매우 강함' },
]

function MyPageView({ username, displayName, email, role, joinDate, imageUrl, onLogout, onSaveInfo, onChangePassword }: MyPageViewProps) {
  // 프로필 카드에 표시되는 값(저장 버튼을 눌러야 반영됨)과, 입력 중인 값을 분리
  const [savedName, setSavedName] = useState(displayName)
  const [nameInput, setNameInput] = useState(displayName)
  const [emailInput, setEmailInput] = useState(email)
  const [infoError, setInfoError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSaveInfo(e: FormEvent): void {
    e.preventDefault()
    if (!nameInput.trim()) {
      setInfoError('이름을 입력해주세요')
      return
    }
    setInfoError('')
    setSavedName(nameInput.trim())
    onSaveInfo?.({ name: nameInput.trim(), email: emailInput.trim() })
  }

  const pwErrors = newPw ? getPwErrors(newPw, username) : []
  const pwStrength = newPw ? getPwStrength(newPw) : 0
  const strengthMeta = STRENGTH_META[pwStrength] ?? STRENGTH_META[0]!
  const pwMatch = confirmPw.length > 0 ? newPw === confirmPw : null
  const canSubmitPw = currentPw.length > 0 && newPw.length > 0 && pwErrors.length === 0 && pwMatch === true

  function handleChangePassword(e: FormEvent): void {
    e.preventDefault()
    if (!canSubmitPw) return
    onChangePassword?.({ currentPassword: currentPw, newPassword: newPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="w-full max-w-150 flex flex-col gap-4">
        {/* 프로필 헤더 */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar name={savedName} imageUrl={previewUrl ?? imageUrl} size="lg" />
            <label className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white text-xs cursor-pointer">
              📷
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="min-w-0 flex flex-col gap-1">
            <div className="text-lg font-semibold text-gray-900">{savedName}</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">ID:</span>
              <span className="text-gray-600 font-mono">{username}</span>
              <span className="px-1.5 py-0.5 rounded-lg bg-purple-50 text-purple-600 font-medium">
                {role === 'admin' ? '관리자' : '일반 회원'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">가입일:</span>
              <span className="text-gray-600">{joinDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-600 font-medium">활성</span>
            </div>
          </div>
        </section>

        {/* 내 정보 수정 */}
        <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            ✎ 내 정보 수정
          </div>
          <div className="p-5 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-name" className="text-xs font-medium text-gray-500">이름</label>
              <input
                id="edit-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="이름 입력"
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-email" className="text-xs font-medium text-gray-500">
                이메일 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                id="edit-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="이메일 입력"
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
            </div>
            {infoError && <p className="text-xs text-red-500">{infoError}</p>}
            <button
              type="submit"
              className="h-9.5 rounded-lg bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-purple-600 transition-colors"
            >
              ✓ 변경 저장
            </button>
          </div>
        </form>

        {/* 비밀번호 변경 */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            🔒 비밀번호 변경
          </div>
          <div className="p-5 flex flex-col gap-3.5">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-3.5 py-2.5 flex flex-col gap-1">
              <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-0.5">
                🛡 비밀번호 규칙
              </div>
              {PW_RULES.map((rule) => {
                const active = newPw.length > 0
                const pass = active && rule.pass(newPw, username)
                const fail = active && !rule.pass(newPw, username)
                return (
                  <div
                    key={rule.id}
                    className={`text-[11px] flex items-center gap-1 ${pass ? 'text-green-600' : fail ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    <span>{pass ? '●' : '○'}</span>
                    {rule.label}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="pw-current" className="text-xs font-medium text-gray-500">
                현재 비밀번호 <span className="text-gray-400 font-normal text-[10px]">(변경 버튼 클릭 시 서버에서 확인)</span>
              </label>
              <input
                id="pw-current"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="현재 비밀번호 입력"
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="pw-new" className="text-xs font-medium text-gray-500">새 비밀번호</label>
              <div className="relative">
                <input
                  id="pw-new"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="새 비밀번호 입력 (10자 이상)"
                  className="w-full h-9 pl-3 pr-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showNewPw ? '🙈' : '👁'}
                </button>
              </div>
              {newPw.length > 0 && pwErrors.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {pwErrors.map((err) => (
                    <div key={err} className="text-[11px] text-red-500 flex items-center gap-1">⚠ {err}</div>
                  ))}
                </div>
              )}
              {newPw.length > 0 && (
                <div className="mt-1">
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>비밀번호 강도</span>
                    <span style={{ color: strengthMeta.color }}>{strengthMeta.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${strengthMeta.pct}%`, backgroundColor: strengthMeta.color }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="pw-confirm" className="text-xs font-medium text-gray-500">새 비밀번호 확인</label>
              <div className="relative">
                <input
                  id="pw-confirm"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full h-9 pl-3 pr-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showConfirmPw ? '🙈' : '👁'}
                </button>
              </div>
              {pwMatch !== null && (
                <div className={`text-[11px] mt-0.5 ${pwMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {pwMatch ? '✓ 비밀번호가 일치해요' : '⚠ 비밀번호가 일치하지 않아요'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmitPw}
              className={`
                h-9.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors
                ${canSubmitPw ? 'bg-purple-500 text-white cursor-pointer hover:bg-purple-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              🔒 비밀번호 변경
            </button>
          </div>
        </form>

        {/* 로그아웃 */}
        <button
          onClick={onLogout}
          className="h-10 rounded-lg border border-red-300 text-red-500 text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </main>
  )
}

export default MyPageView
