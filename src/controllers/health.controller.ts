import { Sentry } from '../config/sentry';
import { Request, Response } from 'express';

export class HealthController {
  static check(_req: Request, res: Response): void {
    // Add a breadcrumb — useful for tracing in Sentry
    Sentry.addBreadcrumb({
      category: 'health',
      message: 'Health check called',
      level: 'info',
    });

    const uptime = process.uptime();

    res.json({
      status: 'ok',
      uptime: `${Math.floor(uptime)}s`,
      timestamp: new Date().toISOString(),
    });
  }
}
