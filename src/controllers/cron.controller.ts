import { Request, Response } from 'express';
import { Sentry } from '../config';
import { RecordingService } from '../services/recording.service';

export class CronController {
  static async purge(req: Request, res: Response): Promise<void> {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      await RecordingService.purgeExpiredAudio();
      res.json({ ok: true });
    } catch (err) {
      Sentry.captureException(err);
      res.status(500).json({ error: 'Purge failed' });
    }
  }
}
