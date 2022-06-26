import { AppModule } from './app.module';
import { Test } from '@nestjs/testing';

jest.setTimeout(10000);

describe('AppMain', () => {
  it('create', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    await app.close();
  });
});
