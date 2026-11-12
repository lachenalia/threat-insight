import { ConflictException, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { CveNormalizationController } from '../src/cve/cve-normalization.controller';
import { CveNormalizationService } from '../src/cve/normalization/cve-normalization.service';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { createValidationPipe } from '../src/common/validation';

// Exercise real HTTP validation and guards without bootstrapping collection or a database.
describe('API authorization and input validation (HTTP)', () => {
  let app: INestApplication;
  let apiKey: string | undefined;
  const normalize = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController, CveNormalizationController],
      providers: [
        AppService,
        AdminApiKeyGuard,
        { provide: ConfigService, useValue: { get: () => apiKey } },
        { provide: CveNormalizationService, useValue: { normalize } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });
  beforeEach(() => {
    apiKey = 'test-admin-key';
    normalize.mockReset().mockResolvedValue(undefined);
  });
  afterAll(async () => {
    await app?.close();
  });
  const post = () =>
    request(app.getHttpServer())
      .post('/cve/normalization')
      .set('x-admin-api-key', 'test-admin-key');

  it('serves the public root route', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
  it('rejects requests without administrative credentials', async () => {
    await request(app.getHttpServer())
      .post('/cve/normalization')
      .send({})
      .expect(401);
    expect(normalize).not.toHaveBeenCalled();
  });
  it('rejects incorrect administrative credentials', async () => {
    await request(app.getHttpServer())
      .post('/cve/normalization')
      .set('x-admin-api-key', 'wrong-key')
      .send({})
      .expect(401);
    expect(normalize).not.toHaveBeenCalled();
  });
  it('disables the administrative endpoint when its key is not configured', async () => {
    apiKey = undefined;
    await post().send({}).expect(503);
    expect(normalize).not.toHaveBeenCalled();
  });
  it.each([
    { cveId: 'invalid' },
    { cveId: null },
    { cveYear: 1998 },
    { cveYear: 2026.5 },
    { cveYear: '2026' },
    { incremental: 'false' },
    { incremental: null },
    { fetchedAtStart: 'not-a-date' },
    { fetchedAtEnd: '2026-02-30T00:00:00Z' },
    { extra: true },
    { fetchedAtStart: '2026-02-02', fetchedAtEnd: '2026-02-01' },
    { cveId: 'CVE-2026-0001', cveYear: 2026 },
  ])('rejects invalid filter %j', async (body) => {
    await post().send(body).expect(400);
    expect(normalize).not.toHaveBeenCalled();
  });
  it('accepts a valid combined year and date filter', async () => {
    const filter = {
      cveYear: 2026,
      fetchedAtStart: '2026-01-01T00:00:00Z',
      fetchedAtEnd: '2026-02-01T00:00:00Z',
      incremental: true,
    };
    await post().send(filter).expect(200);
    expect(normalize).toHaveBeenCalledWith(expect.objectContaining(filter));
  });
  it('returns conflict when the pipeline is already running', async () => {
    normalize.mockRejectedValueOnce(
      new ConflictException('CVE pipeline is already running'),
    );
    await post().send({ incremental: true }).expect(409);
  });
});
