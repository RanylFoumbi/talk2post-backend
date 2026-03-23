import { Request, Response, NextFunction } from 'express';
import { APICallError } from 'ai';
import { Sentry } from '../config';
import { MulterError } from 'multer';

export function resolveStreamErrorCode(err: unknown): string {
  if (APICallError.isInstance(err)) {
    switch (err.statusCode) {
      case 401: return 'INVALID_API_KEY';
      case 429: return 'INSUFFICIENT_CREDITS';
      case 503: return 'SERVICE_UNAVAILABLE';
      default:  return 'GENERATION_FAILED';
    }
  }
  return 'GENERATION_FAILED';
}

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  static handle(
    err: AppError | MulterError,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    // Handle Multer errors
    if (err instanceof MulterError) {
      statusCode = 400;
      if (err.code === 'LIMIT_FILE_SIZE') {
        code = 'FILE_TOO_LARGE';
        message = 'File size exceeds the maximum allowed limit of 25MB';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        code = 'UNEXPECTED_FIELD';
        message = 'Unexpected file field';
      } else {
        code = 'UPLOAD_ERROR';
        message = err.message;
      }
    }
    // Handle custom upload errors (file type validation)
    else if (err.message?.includes('Invalid file type')) {
      statusCode = 400;
      code = 'INVALID_FILE_TYPE';
      message = err.message;
    }
    // Handle custom application errors
    else if (err instanceof CustomError || err.isOperational) {
      statusCode = err.statusCode || 400;
      code = err.code || 'BAD_REQUEST';
      message = err.message;
    }
    // Handle unexpected errors
    else {
      statusCode = 500;
      code = 'INTERNAL_ERROR';
      message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
    }

    Sentry.captureException(err);

    res.status(statusCode).json({
      error: {
        code,
        message,
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
}
