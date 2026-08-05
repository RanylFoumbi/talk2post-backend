import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Config, Sentry, SentryConfig } from './config';
import './config/sentry.instrument.js';
import { AuthMiddleware } from './middleware/auth.middleware';
import { ErrorHandler } from './middleware/error.middleware';
import { RateLimiter } from './middleware/rate-limit.middleware';
import { swaggerRouter } from './config/swagger';
import routes from './routes';

SentryConfig.init();

const app = express();
app.set('trust proxy', 1);

app.use('/api/docs', swaggerRouter);

app.use(helmet());
app.use(
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url :status :response-time ms'));
app.use(RateLimiter.create());
app.use(AuthMiddleware.handle());

app.use('/api', routes);

Sentry.setupExpressErrorHandler(app);
app.use(ErrorHandler.handle);

AuthMiddleware.warmup().catch((err) =>
  console.error('[Auth] Failed to warm up JWT secret:', err),
);

export default app;
