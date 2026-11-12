import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    if (!expected)
      throw new ServiceUnavailableException('Administrative API is disabled');
    const supplied: unknown = context.switchToHttp().getRequest().headers[
      'x-admin-api-key'
    ];
    const digest = (value: string) =>
      createHash('sha256').update(value).digest();
    if (
      typeof supplied !== 'string' ||
      !timingSafeEqual(digest(supplied), digest(expected))
    ) {
      throw new UnauthorizedException('Invalid administrative API key');
    }
    return true;
  }
}
