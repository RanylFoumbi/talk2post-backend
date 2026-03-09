import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Config, SentryConfig, Sentry } from './config';
import { AuthMiddleware, ErrorHandler, RateLimiter } from './utils';
import routes from './routes';

export class App {
  public readonly app: express.Application;

  constructor() {
    SentryConfig.init();

    this.app = express();
    this.initMiddleware();
    this.initRoutes();
    this.initErrorHandling();
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
      })
    );

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan(Config.NODE_ENV === 'production' ? 'combined' : 'dev'));
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
