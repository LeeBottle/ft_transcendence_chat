// 비밀번호 정책 — 회원가입 / 비밀번호 변경 화면 공용.
// 서버 검증은 "8~100자 printable ASCII"까지만 강제하지만, UX 상 더 강한 규칙을 안내한다.
// (여기 규칙을 통과하면 서버 규칙은 항상 통과한다.)

const COMMON_WORDS = [
  'password',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'abc',
  'iloveyou',
];
const SEQ_NUM = /012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210/;
const SPECIAL_CHAR = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export interface PwRule {
  id: string;
  label: string;
  pass: (pw: string, loginId: string) => boolean;
}

export const PW_RULES: PwRule[] = [
  { id: 'length', label: '최소 10자 이상', pass: (pw) => pw.length >= 10 },
  { id: 'upper', label: '대문자 1자 이상 포함', pass: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: '숫자 1자 이상 포함', pass: (pw) => /[0-9]/.test(pw) },
  {
    id: 'special',
    label: '특수문자 1자 이상 포함 (!@#$%^&* 등)',
    pass: (pw) => SPECIAL_CHAR.test(pw),
  },
  { id: 'seq', label: '연속된 숫자 3자 이상 금지 (123, 456 등)', pass: (pw) => !SEQ_NUM.test(pw) },
  {
    id: 'id',
    label: '아이디와 유사한 문자 금지',
    pass: (pw, loginId) => !loginId || !pw.toLowerCase().includes(loginId.toLowerCase()),
  },
];

export function getPwErrors(pw: string, loginId: string): string[] {
  const errors: string[] = [];

  if (pw.length < 10) {
    errors.push('최소 10자 이상이어야 해요');
  }
  if (!/[A-Z]/.test(pw)) {
    errors.push('대문자를 1자 이상 포함해야 해요');
  }
  if (!/[0-9]/.test(pw)) {
    errors.push('숫자를 1자 이상 포함해야 해요');
  }
  if (!SPECIAL_CHAR.test(pw)) {
    errors.push('특수문자를 1자 이상 포함해야 해요');
  }
  if (SEQ_NUM.test(pw)) {
    errors.push('연속된 숫자 3자 이상은 사용할 수 없어요 (예: 123, 456)');
  }
  if (loginId && pw.toLowerCase().includes(loginId.toLowerCase())) {
    errors.push('아이디와 유사한 문자는 사용할 수 없어요');
  }

  const matched = COMMON_WORDS.find((w) => pw.toLowerCase().includes(w));

  if (matched) {
    errors.push(`자주 쓰이는 단어 "${matched}"는 사용할 수 없어요`);
  }

  return errors;
}

export function getPwStrength(pw: string): number {
  let score = 0;

  if (pw.length >= 10) {
    score++;
  }
  if (pw.length >= 14) {
    score++;
  }
  if (/[A-Z]/.test(pw)) {
    score++;
  }
  if (/[0-9]/.test(pw)) {
    score++;
  }
  if (/[!@#$%^&*]/.test(pw)) {
    score++;
  }
  if (pw.length >= 18) {
    score++;
  }

  return Math.min(score, 5);
}

export interface StrengthMeta {
  pct: number;
  color: string;
  label: string;
}

export const STRENGTH_META: StrengthMeta[] = [
  { pct: 0, color: '', label: '' },
  { pct: 20, color: '#D92D20', label: '매우 약함' },
  { pct: 40, color: '#F79009', label: '약함' },
  { pct: 60, color: '#FCD34D', label: '보통' },
  { pct: 80, color: '#6C63FF', label: '강함' },
  { pct: 100, color: '#0F6E56', label: '매우 강함' },
];

const STRENGTH_FALLBACK: StrengthMeta = { pct: 0, color: '', label: '' };

/** score(0~5)에 해당하는 강도 메타. 범위를 벗어나면 빈 메타를 돌려준다. */
export function getStrengthMeta(score: number): StrengthMeta {
  return STRENGTH_META[score] ?? STRENGTH_FALLBACK;
}

/** 비밀번호 규칙 체크리스트 한 줄의 색 클래스 (통과=초록 / 실패=빨강 / 미입력=회색). */
export function pwRuleColorClass(pass: boolean, fail: boolean): string {
  if (pass) {
    return 'text-green-600';
  }

  if (fail) {
    return 'text-red-500';
  }

  return 'text-gray-400';
}
