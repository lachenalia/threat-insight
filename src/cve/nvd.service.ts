import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface NvdResponse {
  totalResults: number;
  vulnerabilities: Array<{
    cve: {
      id: string;
      published: string;
      lastModified: string;
      [key: string]: any;
    };
  }>;
}

@Injectable()
export class NvdService {
  private readonly baseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
  private nextRequestAt = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  fetchRecentCves(
    startDate: Date,
    startIndex = 0,
    endDate = new Date(),
  ): Promise<NvdResponse> {
    return this.request({
      lastModStartDate: startDate.toISOString(),
      lastModEndDate: endDate.toISOString(),
      startIndex,
      resultsPerPage: 2000,
    });
  }

  fetchAllCves(startIndex = 0): Promise<NvdResponse> {
    return this.request({ startIndex, resultsPerPage: 2000 });
  }

  private async request(
    params: Record<string, string | number>,
  ): Promise<NvdResponse> {
    const apiKey = this.configService.get<string>('NVD_API_KEY');
    // NVD public limits: use conservative spacing with or without an API key.
    const interval = apiKey ? 650 : 6500;
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.pause(Math.max(0, this.nextRequestAt - Date.now()));
      this.nextRequestAt = Date.now() + interval;
      try {
        const { data } = await firstValueFrom(
          this.httpService.get<NvdResponse>(this.baseUrl, {
            params,
            headers: apiKey ? { apiKey } : {},
            timeout: 30000,
            maxRedirects: 0,
          }),
        );
        if (
          !Number.isInteger(data?.totalResults) ||
          data.totalResults < 0 ||
          !Array.isArray(data.vulnerabilities)
        ) {
          throw new Error('Invalid NVD response');
        }
        return data;
      } catch (error) {
        const status = error.response?.status;
        const retryable =
          status === 429 ||
          status === 408 ||
          status >= 500 ||
          ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(
            error.code,
          );
        if (!retryable || attempt === 2) {
          // Axios errors can embed the API key; expose only a safe summary.
          throw new Error(
            `NVD request failed (${status ?? error.code ?? 'invalid response'})`,
          );
        }
        const retryAfter = error.response?.headers?.['retry-after'];
        const seconds = retryAfter ? Number(retryAfter) : NaN;
        const date = retryAfter ? Date.parse(retryAfter) : NaN;
        const delay = Number.isFinite(seconds)
          ? Math.max(0, seconds * 1000)
          : Number.isFinite(date)
            ? Math.max(0, date - Date.now())
            : 1000 * 2 ** attempt;
        // Very long Retry-After pauses are persisted as job failure, not retried early.
        if (delay > 60000)
          throw new Error(
            'NVD requested a retry after more than 60 seconds; retry the job later',
          );
        this.nextRequestAt = Math.max(this.nextRequestAt, Date.now() + delay);
      }
    }
    throw new Error('NVD retry limit reached');
  }

  private pause(ms: number): Promise<void> {
    return ms > 0
      ? new Promise((resolve) => setTimeout(resolve, ms))
      : Promise.resolve();
  }
}
