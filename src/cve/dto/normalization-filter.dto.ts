import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ValidateIf,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
  Matches,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class NormalizationFilterDto {
  @ApiPropertyOptional({ example: 'CVE-2024-1234' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(20)
  @Matches(/^CVE-\d{4}-\d{4,}$/)
  cveId?: string;

  @ApiPropertyOptional({ example: 2024 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1999)
  @Max(9999)
  cveYear?: number;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fetchedAtStart?: string;

  @ApiPropertyOptional({ example: '2026-01-11T00:00:00Z' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  fetchedAtEnd?: string;

  @ApiPropertyOptional({ default: false })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  incremental?: boolean;
}
