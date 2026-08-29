import { Controller, Get } from '@nestjs/common';

import { Public } from '#common/decorators/public.decorator.js';

interface LivenessResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

@Public()
@Controller('healthz')
export class HealthController {
  @Get('live')
  checkLiveness(): LivenessResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
