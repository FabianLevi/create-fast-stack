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
    it('should return health status from service', async () => {
      const expected = { status: 'ok' };
      jest.spyOn(service, 'getHealth').mockReturnValue(expected);

      const result = await controller.health();
      expect(result).toEqual(expected);
    });

    it('should call healthService.getHealth', async () => {
      const spy = jest.spyOn(service, 'getHealth');
      await controller.health();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
