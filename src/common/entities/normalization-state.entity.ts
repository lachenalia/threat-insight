import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('normalization_state')
@Unique(['domain', 'source'])
export class NormalizationStateEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  domain: string; // 'cve', 'cwe' 등

  @Column({ type: 'varchar', length: 100 })
  source: string; // 'nvd@nist.gov' 등

  @Column({ type: 'varchar', nullable: true })
  lastProcessedRawId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastProcessedModifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSuccessAt: Date | null;

  @Column({ type: 'varchar', length: 20 })
  normalizerVersion: string;

  @Column({ type: 'varchar', length: 20, default: 'incremental' })
  mode: string; // full, incremental, backfill

  @Column({ type: 'varchar', length: 20, default: 'idle' })
  status: string; // idle, running, failed

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
