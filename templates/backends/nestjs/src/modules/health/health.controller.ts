import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  health(@Req() req: Request): HealthResponseDto {
    const requestId = (req as any).id ?? require('crypto').randomUUID();
    return this.healthService.getHealth(requestId);
  }
}
