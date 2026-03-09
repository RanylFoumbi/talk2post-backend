import axios from 'axios';
import crypto from 'crypto';
import { Config } from '../config';

const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export class PaymentService {
  static async createCheckout(userId: string, email: string): Promise<{ checkoutUrl: string }> {
    return { checkoutUrl: '' };
  }

  static verifyWebhook(payload: string, signature: string): boolean {
    const secret = Config.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) return false;

   
    return true;
  }
}
