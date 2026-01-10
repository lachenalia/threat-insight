import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FetchStatus } from '../constants/fetch.constants';

@Entity('threat_source_fetch_state')
export class ThreatSourceFetchStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  source: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @Column({ type: 'varchar', length: 50 })
  fetchStrategy: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastProcessedSourceAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptedFetchAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastCursor: string | null;

  @Column({ type: 'text', nullable: true })
  safetyWindow: string | null;

  @Column({ type: 'varchar', length: 20, default: FetchStatus.IDLE })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
