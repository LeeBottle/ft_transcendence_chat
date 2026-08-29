import { Injectable, Logger } from '@nestjs/common';

import type { ChatMessageResponseDto } from '#modules/chat/controllers/chat.dto.js';

export interface AiTaskExtractionResult {
  summary: string;
  actionItems: Array<{
    title: string;
    assigneeUserId?: string;
  }>;
}

@Injectable()
export class ChatAiService {
  private readonly logger = new Logger(ChatAiService.name);

  async triggerAiTaskExtraction(
    roomId: string,
    messages: ChatMessageResponseDto[],
  ): Promise<AiTaskExtractionResult> {
    const conversationText = messages
      .map((m) => `[${m.senderName ?? m.senderUserId}]: ${m.content}`)
      .join('\n');

    this.logger.log(
      `AI 모듈 트리거 실행 - 채팅방 [${roomId}] 대화 내용 ${messages.length}건 전달 완료:\n${conversationText}`,
    );

    // AI 모듈 연동 인터페이스 (추후 외부 AI API 또는 LLM 모듈 연동 지점)
    const result: AiTaskExtractionResult = {
      summary: `채팅방 ${roomId} 회의 요약: 총 ${messages.length}건의 대화가 진행되었습니다.`,
      actionItems: [
        {
          title: '회의 결과 검토 및 다음 액션 플랜 수립',
        },
      ],
    };

    this.logger.log(`AI 모듈 분석 결과 생성 완료: ${result.summary}`);

    return await Promise.resolve(result);
  }
}
