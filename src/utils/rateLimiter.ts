import rateLimit from 'express-rate-limit';

export class RateLimiter {
  static create() {
    return rateLimit({
      windowMs: 60 * 60 * 1000,
      max: (req) => (req.userId ? 1000 : 100),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
  }
}
