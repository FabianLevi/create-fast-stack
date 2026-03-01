import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('getHealth', () => {
    const mockRequestId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return ok status with request_id', () => {
      const result = service.getHealth(mockRequestId);
      expect(result).toEqual({ status: 'ok', request_id: mockRequestId });
    });

    it('should return HealthResponseDto shape', () => {
      const result = service.getHealth(mockRequestId);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('request_id');
      expect(typeof result.status).toBe('string');
      expect(typeof result.request_id).toBe('string');
    });
  });
});
