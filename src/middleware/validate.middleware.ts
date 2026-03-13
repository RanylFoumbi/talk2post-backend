import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { CustomError } from './error.middleware';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ ...req.body, audio: req.file });
    if (!result.success) {
      const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new CustomError(message, 400, 'VALIDATION_ERROR'));
      return;
    }
    req.body = result.data;
    next();
  };
}
