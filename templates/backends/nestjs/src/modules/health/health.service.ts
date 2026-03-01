import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  getHealth(requestId: string): HealthResponseDto {
    return { status: 'ok', request_id: requestId };
  }
}
