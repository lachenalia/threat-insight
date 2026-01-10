import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CveRawSourceEntity } from './entities/cve-raw-source.entity';
import { CveService } from './cve.service';
import { CveSchedulerService } from './cve-scheduler.service';
import { NvdService } from './nvd.service';
import { ThreatSourceFetchStateEntity } from 'src/common/entities/threat-source-fetch-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CveRawSourceEntity, ThreatSourceFetchStateEntity]),
    HttpModule,
  ],
  providers: [CveService, CveSchedulerService, NvdService],
  exports: [TypeOrmModule, CveService, NvdService],
})
export class CveModule {}
