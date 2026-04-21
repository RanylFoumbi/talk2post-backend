import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Config, Sentry, SentryConfig } from './config';
import './config/sentry.instrument.js';
import { AuthMiddleware } from './middleware/auth.middleware';
import { ErrorHandler } from './middleware/error.middleware';
import { RateLimiter } from './middleware/rate-limit.middleware';
import routes from './routes';

export class App {
  public readonly app: express.Application;

  constructor() {
    SentryConfig.init();

    this.app = express();
    this.initMiddleware();
    this.initRoutes();
    this.initErrorHandling();
    AuthMiddleware.warmup().catch((err) =>
      console.error('[Auth] Failed to warm up JWT secret:', err),
    );
  }

  private initMiddleware(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: [...Config.CORS_ORIGINS],
        credentials: true,
        allowedHeaders: [
          'Accept',
          'Accept-Encoding',
          'Authorization',
          'Content-Type',
          'DNT',
          'Origin',
          'User-Agent',
          'X-CSRFToken',
          'X-Requested-With',
        ],
      }),
    );

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan(':method :url :status :response-time ms'));
    this.app.use(RateLimiter.create());
    this.app.use(AuthMiddleware.handle());
  }

  private initRoutes(): void {
    this.app.use('/api', routes);
  }

  private initErrorHandling(): void {
    Sentry.setupExpressErrorHandler(this.app);
    this.app.use(ErrorHandler.handle);
  }
}
