import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CveRawSourceEntity } from './entities/cve-raw-source.entity';
import { CveCanonicalEntity } from './entities/cve-canonical.entity';
import { CveCvssEntity } from './entities/cve-cvss.entity';
import { CveDescriptionEntity } from './entities/cve-description.entity';
import { CveReferenceEntity } from './entities/cve-reference.entity';
import { CveWeaknessEntity } from './entities/cve-weakness.entity';
import { CveService } from './cve.service';
import { CveSchedulerService } from './cve-scheduler.service';
import { NvdService } from './nvd.service';
import { CveNormalizationService } from './normalization/cve-normalization.service';
import { CveNormalizationController } from './cve-normalization.controller';
import { ThreatSourceFetchStateEntity } from 'src/common/entities/threat-source-fetch-state.entity';
import { NormalizationStateEntity } from 'src/common/entities/normalization-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CveRawSourceEntity,
      CveCanonicalEntity,
      CveCvssEntity,
      CveDescriptionEntity,
      CveReferenceEntity,
      CveWeaknessEntity,
      ThreatSourceFetchStateEntity,
      NormalizationStateEntity,
    ]),
    HttpModule,
  ],
  controllers: [CveNormalizationController],
  providers: [CveService, CveSchedulerService, NvdService, CveNormalizationService],
  exports: [TypeOrmModule, CveService, NvdService, CveNormalizationService],
})
export class CveModule {}
