import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class NormalizationFilterDto {
  @ApiPropertyOptional({ description: '특정 CVE ID 필터링 (예: CVE-2024-1234)', example: 'CVE-2024-1234' })
  @IsOptional()
  @IsString()
  cveId?: string;

  @ApiPropertyOptional({ description: '특정 연도 필터링', example: 2024 })
  @IsOptional()
  @IsNumber()
  cveYear?: number;

  @ApiPropertyOptional({ description: '수집 시작 일시 (ISO 8601)', example: '2026-01-10T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  fetchedAtStart?: Date;

  @ApiPropertyOptional({ description: '수집 종료 일시 (ISO 8601)', example: '2026-01-11T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  fetchedAtEnd?: Date;

  @ApiPropertyOptional({ description: '정규화 되지 않았거나 업데이트된 데이터만 정규화할지 여부', default: false })
  @IsOptional()
  @IsBoolean()
  incremental?: boolean;
}
