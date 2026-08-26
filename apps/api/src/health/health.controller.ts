import { Controller, Get } from '@nestjs/common';

interface LivenessResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

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
