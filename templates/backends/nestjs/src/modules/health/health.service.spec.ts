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
    it('should return ok status', () => {
      const result = service.getHealth();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should return HealthResponseDto shape', () => {
      const result = service.getHealth();
      expect(result).toHaveProperty('status');
      expect(typeof result.status).toBe('string');
    });
  });
});
