import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  describe('health', () => {
    const mockReq = { id: '550e8400-e29b-41d4-a716-446655440000' } as any;

    it('should return health status with request_id from service', async () => {
      const expected = { status: 'ok', request_id: mockReq.id };
      jest.spyOn(service, 'getHealth').mockReturnValue(expected);

      const result = await controller.health(mockReq);
      expect(result).toEqual(expected);
    });

    it('should call healthService.getHealth with request id', async () => {
      const spy = jest.spyOn(service, 'getHealth');
      await controller.health(mockReq);
      expect(spy).toHaveBeenCalledWith(mockReq.id);
    });
  });
});
