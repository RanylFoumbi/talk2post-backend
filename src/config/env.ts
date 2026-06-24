import dotenv from 'dotenv';

dotenv.config();

export class Config {
  static readonly PORT = parseInt(process.env.PORT || '8000', 10);
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';

  static readonly SUPABASE_URL = process.env.SUPABASE_URL || '';
  static readonly SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
  static readonly SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  static readonly SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

  static readonly LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
  static readonly LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';
  static readonly LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID || '';
  static readonly LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';

  static readonly SENTRY_DSN = process.env.SENTRY_DSN || '';

  static readonly CORS_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://talk2post.com',
    'https://www.talk2post.com',
  ];
}
