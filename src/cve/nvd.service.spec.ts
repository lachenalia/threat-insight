import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { NvdService } from './nvd.service';

const empty = { totalResults: 0, vulnerabilities: [] };
describe('NvdService request recovery', () => {
  let get: jest.Mock;
  let service: NvdService;
  beforeEach(() => {
    jest.useFakeTimers();
    get = jest.fn();
    service = new NvdService(
      { get } as unknown as HttpService,
      new ConfigService(),
    );
  });
  afterEach(() => jest.useRealTimers());

  it('keeps the supplied end date fixed and sets a request timeout', async () => {
    get.mockReturnValue(of({ data: empty }));
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-02');
    await service.fetchRecentCves(start, 0, end);
    const next = service.fetchRecentCves(start, 2000, end);
    await jest.runAllTimersAsync();
    await next;
    for (const call of get.mock.calls) {
      expect(call[1]).toEqual(
        expect.objectContaining({
          timeout: 30000,
          params: expect.objectContaining({
            lastModEndDate: end.toISOString(),
          }),
        }),
      );
    }
    expect(get.mock.calls[1][1].params.startIndex).toBe(2000);
  });

  it('honors Retry-After and public rate spacing before retrying', async () => {
    const times: number[] = [];
    get
      .mockImplementationOnce(() => {
        times.push(Date.now());
        return throwError(() => ({
          response: { status: 429, headers: { 'retry-after': '10' } },
        }));
      })
      .mockImplementationOnce(() => {
        times.push(Date.now());
        return of({ data: empty });
      });
    const task = service.fetchAllCves();
    await jest.runAllTimersAsync();
    expect(await task).toEqual(empty);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(10000);
  });

  it('retries a timeout but limits server failures to three attempts', async () => {
    get.mockReturnValue(throwError(() => ({ code: 'ECONNABORTED' })));
    const result = expect(service.fetchAllCves()).rejects.toThrow(
      'ECONNABORTED',
    );
    await jest.runAllTimersAsync();
    await result;
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('does not retry authentication errors or leak an upstream error message', async () => {
    get.mockReturnValue(
      throwError(() => ({
        response: { status: 403 },
        message: 'apiKey=private',
      })),
    );
    await expect(service.fetchAllCves()).rejects.toThrow(
      'NVD request failed (403)',
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid responses instead of treating them as an empty completed window', async () => {
    get.mockReturnValue(of({ data: {} }));
    await expect(service.fetchAllCves()).rejects.toThrow('invalid response');
  });

  it('does not retry earlier than a long Retry-After permits', async () => {
    get.mockReturnValue(
      throwError(() => ({
        response: { status: 503, headers: { 'retry-after': '120' } },
      })),
    );
    await expect(service.fetchAllCves()).rejects.toThrow('retry the job later');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('uses the same API key on retries and respects the keyed request interval', async () => {
    service = new NvdService(
      { get } as unknown as HttpService,
      new ConfigService({ NVD_API_KEY: 'test-key' }),
    );
    const times: number[] = [];
    get.mockImplementation(() => {
      times.push(Date.now());
      return of({ data: empty });
    });
    await service.fetchAllCves();
    const task = service.fetchAllCves(2000);
    await jest.runAllTimersAsync();
    await task;
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(650);
    expect(get.mock.calls[1][1].headers).toEqual({ apiKey: 'test-key' });
  });
});
