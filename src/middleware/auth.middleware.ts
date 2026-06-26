import { NextFunction, Request, Response } from 'express';
import { SupabaseConfig } from '../config';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

const PUBLIC_PATHS = ['/api/health', '/api/cron/purge', '/webhooks/lemonsqueezy'];

export class AuthMiddleware {
  static async warmup(): Promise<void> {}

  static handle() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (PUBLIC_PATHS.some((path) => req.path.startsWith(path))) {
        next();
        return;
      }

      const authHeader = req.headers.authorization || '';

      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
      }

      const token = authHeader.split(' ')[1];

     if (process.env.NODE_ENV === 'development') {
       console.log(`[Auth] Validating token: ${token}`);
     }

      try {
        const { data, error } = await SupabaseConfig.getAdmin().auth.getUser(token);

        if (error || !data.user) {
          console.error('[Auth] getUser error:', error?.message, error?.status);
          res.status(401).json({ error: error?.message || 'Invalid or expired token' });
          return;
        }

        req.userId = data.user.id;
        req.userEmail = data.user.email;
        req.userRole = data.user.role;

        next();
      } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }
}
