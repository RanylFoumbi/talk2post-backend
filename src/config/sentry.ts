import * as Sentry from '@sentry/node';
import { Config } from './env';

export class SentryConfig {
  static init(): void {
    if (!Config.SENTRY_DSN) return;

    Sentry.init({
      dsn: Config.SENTRY_DSN,
      environment: Config.NODE_ENV,
      tracesSampleRate: Config.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
  }
}

export { Sentry };
