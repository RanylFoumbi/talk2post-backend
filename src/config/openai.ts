import OpenAI from 'openai';
import { Config } from './env';

export class OpenAIConfig {
  private static instance: OpenAI | null = null;

  static getClient(): OpenAI {
    if (!this.instance) {
      this.instance = new OpenAI({
        apiKey: Config.OPENAI_API_KEY,
      });
    }
    return this.instance;
  }
}
