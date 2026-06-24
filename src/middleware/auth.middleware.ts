import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../config';

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
  static async warmup(): Promise<void> {
    if (!Config.SUPABASE_JWT_SECRET) {
      console.error('[Auth] SUPABASE_JWT_SECRET is not set');
    }
  }

  static handle() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (PUBLIC_PATHS.some((path) => req.path.startsWith(path))) {
        next();
        return;
      }

      const authHeader = req.headers.authorization || '';

      // ── DEV MODE: skip auth if no token provided ─────────────────
      // This lets you test on Postman without a real JWT.
      // In production, this block is NEVER reached.
      if (!authHeader.startsWith('Bearer ') && Config.NODE_ENV === 'development') {
        req.userId = '1558edb3-4dbf-46b0-b1da-c4add2d617bc';
        req.userEmail = 'ranylfoumbi@gmail.com';
        req.userRole = 'user';
        console.warn('[Auth] ⚠️  DEV MODE: Skipping auth, using fake test user');
        next();
        return;
      }

      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');

      if (!Config.SUPABASE_JWT_SECRET) {
        res.status(500).json({ error: 'Authentication service unavailable' });
        return;
      }

      try {
        const payload = jwt.verify(token, Config.SUPABASE_JWT_SECRET, {
          algorithms: ['HS256'],
          audience: 'authenticated',
        }) as jwt.JwtPayload;

        req.userId = payload.sub;
        req.userEmail = String(payload.email);
        req.userRole = String(payload.role);

        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({ error: 'Token has expired' });
          return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
          res.status(401).json({ error: `Invalid token: ${error.message}` });
          return;
        }
        res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }
}
