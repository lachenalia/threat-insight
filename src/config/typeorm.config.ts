import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export function typeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: true,
    namingStrategy: new SnakeNamingStrategy(),
  };
  return config;
}
