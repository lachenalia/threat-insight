import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseJobLockService {
  constructor(private readonly dataSource: DataSource) {}

  async run<T>(job: string, work: () => Promise<T>): Promise<T> {
    const runner = this.dataSource.createQueryRunner();
    const schema =
      'schema' in this.dataSource.options
        ? (this.dataSource.options.schema ?? 'public')
        : 'public';
    const key = `threat-insight:${schema}:${job}`;
    let locked = false;
    try {
      await runner.connect();
      const [result] = await runner.query(
        'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
        [key],
      );
      locked = result.locked === true;
      if (!locked)
        throw new ConflictException('CVE pipeline is already running');
      return await work();
    } finally {
      try {
        if (locked)
          await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [key]);
      } finally {
        await runner.release();
      }
    }
  }
}
