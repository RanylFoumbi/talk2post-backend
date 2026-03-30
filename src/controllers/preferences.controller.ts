import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config';
import { PreferencesService } from '../services/preferences.service';

export class PreferencesController {
  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await PreferencesService.getUserPreferences(req.userId!);

      res.status(200).json(preferences);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await PreferencesService.upsertPreferences(req.userId!, req.body);

      res.status(200).json(preferences);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }
}
