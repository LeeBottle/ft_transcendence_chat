import Link from 'next/link';

export const metadata = {
  title: '이용약관',
};

export default function TermsPage() {
  return (
    <main className="flex min-h-screen justify-center bg-gray-50 px-6 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-gray-900">이용약관</h1>
          <Link
            href="/register"
            className="text-xs font-medium text-purple-600"
          >
            ← 회원가입으로
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          본 약관은 42 프로젝트(TaskChat) 학습용 샘플 문서입니다. 최종 시행 전 내용이 변경될 수
          있습니다.
        </p>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">제1조 (목적)</h2>
          <p>
            이 약관은 회원이 TaskChat 서비스(이하 &ldquo;서비스&rdquo;)를 이용함에 있어 서비스
            제공자와 회원 간의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">제2조 (회원가입)</h2>
          <p>
            회원가입은 이용자가 약관 내용에 동의하고 가입 양식에 정보를 기입한 후 신청하며, 서비스
            제공자가 이를 승낙함으로써 성립합니다. 타인의 정보를 도용하거나 허위 정보를 기재한 경우
            서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">제3조 (회원의 의무)</h2>
          <p>
            회원은 계정 정보를 스스로 관리할 책임이 있으며, 서비스를 이용하여 법령 또는 공서양속에
            위반되는 행위, 타인의 권리를 침해하는 행위, 서비스의 정상적인 운영을 방해하는 행위를
            해서는 안 됩니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">제4조 (서비스의 변경 및 중단)</h2>
          <p>
            서비스 제공자는 운영상·기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할
            수 있으며, 이 경우 사전에 공지하도록 노력합니다.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-semibold text-gray-900">제5조 (책임의 한계)</h2>
          <p>
            본 서비스는 학습 목적으로 제공되며, 서비스 이용으로 발생한 손해에 대해 서비스 제공자는
            관련 법령이 허용하는 범위 내에서 책임을 지지 않습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
