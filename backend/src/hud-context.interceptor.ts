import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setContext } = require('hud-sdk/api');

@Injectable()
export class HudContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') {
      return next.handle();
    }

    const req = ctx.switchToHttp().getRequest();
    const context: Record<string, string> = {};

    const accountId = req.headers?.['x-account-id'];
    if (typeof accountId === 'string' && accountId.length > 0) {
      context.account_id = accountId;
    }

    if (Object.keys(context).length > 0) {
      try {
        setContext(context);
      } catch {
        // Hud not initialized — swallow.
      }
    }

    return next.handle();
  }
}
