import Link from 'next/link';

export const metadata = {
  title: '개인정보 수집·이용 동의',
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen justify-center bg-gray-50 px-6 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-gray-900">개인정보 수집·이용 동의</h1>
          <Link
            href="/register"
            className="text-xs font-medium text-purple-600"
          >
            ← 회원가입으로
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          본 문서는 42 프로젝트(TaskChat) 학습용 샘플입니다. 최종 시행 전 내용이 변경될 수 있습니다.
        </p>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">1. 수집하는 개인정보 항목</h2>
          <ul className="list-disc pl-5">
            <li>필수: 아이디, 비밀번호(암호화 저장), 이름, 이메일</li>
            <li>서비스 이용 과정에서 자동 생성: 접속 일시, 채팅방·메시지 기록</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">2. 수집·이용 목적</h2>
          <ul className="list-disc pl-5">
            <li>회원 식별 및 로그인 인증</li>
            <li>채팅·일정 등 서비스 기능 제공</li>
            <li>부정 이용 방지 및 문의 대응</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">3. 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 지체 없이 파기하는 것을 원칙으로 하며, 관련 법령에 따라 보존이 필요한 경우
            해당 기간 동안 보관합니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">4. 동의를 거부할 권리</h2>
          <p>
            이용자는 개인정보 수집·이용 동의를 거부할 수 있습니다. 다만 필수 항목에 대한 동의를
            거부하는 경우 회원가입 및 서비스 이용이 제한됩니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">5. 제3자 제공</h2>
          <p>
            본 서비스는 이용자의 개인정보를 외부에 제공하지 않습니다. 법령에 근거가 있거나
            수사기관의 적법한 요청이 있는 경우에 한해 제공될 수 있습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
