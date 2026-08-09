'use client';
// AiExtractCard.tsx (.ai-card)
// 회의 종료 등 이벤트 발생 시 메시지 목록 안에 끼워 넣는 AI 안내 카드

interface AiExtractCardProps {
  label: string
  text: string
}

function AiExtractCard({ label, text }: AiExtractCardProps) {
  return (
    <div className="bg-purple-50 border border-purple-200 border-l-[3px] border-l-purple-500 rounded-lg px-3.5 py-2.5">
      <div className="text-xs text-purple-600 font-semibold mb-1">✨ {label}</div>
      <div className="text-[13px] text-gray-900 leading-snug">{text}</div>
    </div>
  )
}

export default AiExtractCard
