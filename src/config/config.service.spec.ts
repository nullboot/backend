import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { AppConfig } from './config.schema';

describe('ConfigService', () => {
  let service: ConfigService;

  it('initialize', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();
    service = module.get<ConfigService>(ConfigService);
    expect(service.config).toBeInstanceOf(AppConfig);
    expect(service.config.server).toBeDefined();
    expect(service.config.services).toBeDefined();
    expect(service.config.security).toBeDefined();
  });
});
