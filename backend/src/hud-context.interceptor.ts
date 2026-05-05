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
    const context: Record<string, string | number | boolean> = {};

    if (req?.method && (req?.route?.path || req?.url)) {
      context.route = `${req.method} ${req.route?.path ?? req.url}`;
    }

    const sessionId =
      typeof req?.query?.sessionId === 'string' && req.query.sessionId.length > 0
        ? req.query.sessionId
        : undefined;
    if (sessionId) {
      context.session_id = sessionId;
      context.is_load_tester = sessionId.startsWith('load-tester-');
    }

    const incomingRequestId = req?.headers?.['x-request-id'];
    if (typeof incomingRequestId === 'string' && incomingRequestId.length > 0) {
      context.request_id = incomingRequestId;
    }

    if (Object.keys(context).length > 0) {
      try {
        setContext(context);
      } catch {
        // Hud not initialized (e.g. HUD_API_KEY missing) - swallow.
      }
    }

    return next.handle();
  }
}
