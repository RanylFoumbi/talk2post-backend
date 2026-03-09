import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ErrorHandler {
  static handle(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    Sentry.captureException(err);

    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
}
