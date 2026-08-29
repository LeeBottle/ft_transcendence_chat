'use client';
// AiExtractCard.tsx (.ai-card)
// 회의 종료 등 이벤트 발생 시 메시지 목록 안에 끼워 넣는 AI 안내 카드

interface AiExtractCardProps {
  label: string;
  text: string;
}

function AiExtractCard({ label, text }: AiExtractCardProps) {
  return (
    <div className="rounded-lg border border-l-[3px] border-purple-200 border-l-purple-500 bg-purple-50 px-3.5 py-2.5">
      <div className="mb-1 text-xs font-semibold text-purple-600">✨ {label}</div>
      <div className="text-[13px] leading-snug text-gray-900">{text}</div>
    </div>
  );
}

export default AiExtractCard;
