import { Controller } from '@nestjs/common';

import { ChatService } from '#modules/chat/services/chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
}
