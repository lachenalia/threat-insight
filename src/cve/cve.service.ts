import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CveRawSourceEntity } from './entities/cve-raw-source.entity';

@Injectable()
export class CveService {
  private readonly logger = new Logger(CveService.name);

  constructor(
    @InjectRepository(CveRawSourceEntity)
    private readonly cveRawSourceRepository: Repository<CveRawSourceEntity>,
  ) {}

  async saveRawSource(data: {
    cveId: string;
    source: string;
    rawPayload: any;
    sourcePublishedAt?: Date;
    sourceModifiedAt?: Date;
  }) {
    // ON CONFLICT (cve_id, source, source_modified_at) DO NOTHING
    return await this.cveRawSourceRepository
      .createQueryBuilder()
      .insert()
      .into(CveRawSourceEntity)
      .values({
        ...data,
        fetchedAt: new Date(),
      })
      .orIgnore() // 중복 시 데이터 변경 없이 무시
      .execute();
  }
}
