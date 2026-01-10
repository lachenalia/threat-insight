import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface NvdResponse {
  vulnerabilities: Array<{
    cve: {
      id: string;
      published: string;
      lastModified: string;
      [key: string]: any;
    };
  }>;
  [key: string]: any;
}

@Injectable()
export class NvdService {
  private readonly logger = new Logger(NvdService.name);
  private readonly baseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 최근 수정된 CVE 목록을 가져옵니다.
   * @param startDate 시작 일시
   * @param startIndex 시작 인덱스 (Pagination)
   */
  async fetchRecentCves(startDate: Date, startIndex: number = 0): Promise<NvdResponse> {
    const apiKey = this.configService.get<string>('NVD_API_KEY');
    const endDate = new Date();

    const params: any = {
      lastModStartDate: startDate.toISOString(),
      lastModEndDate: endDate.toISOString(),
      startIndex,
      resultsPerPage: 2000, // 최대치
    };

    const headers = apiKey ? { apiKey } : {};

    try {
      this.logger.log(
        `Fetching CVEs from ${params.lastModStartDate} to ${params.lastModEndDate} (Index: ${startIndex})`,
      );

      const response = await firstValueFrom(
        this.httpService.get<NvdResponse>(this.baseUrl, { params, headers }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch data from NVD API', error.stack);
      throw error;
    }
  }

  /**
   * 필터 없이 전체 CVE 목록을 가져옵니다. (Pagination 사용)
   * @param startIndex 시작 인덱스
   */
  async fetchAllCves(startIndex: number = 0): Promise<NvdResponse> {
    const apiKey = this.configService.get<string>('NVD_API_KEY');

    const params: any = {
      startIndex,
      resultsPerPage: 2000,
    };

    const headers = apiKey ? { apiKey } : {};

    try {
      this.logger.log(`Fetching all CVEs (Index: ${startIndex})`);

      const response = await firstValueFrom(
        this.httpService.get<NvdResponse>(this.baseUrl, { params, headers }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch cumulative data from NVD API', error.stack);
      throw error;
    }
  }
}
