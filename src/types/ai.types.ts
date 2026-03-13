export enum OpenAiModel {
  Gpt52 = 'gpt-52',
  Gpt5Mini = 'gpt-5-mini',
  Gpt5Nano = 'gpt-5-nano',
  Whisper1 = 'whisper-1',
}

export enum BillingType {
  TOKEN = 'token',
  MINUTE = 'minute',
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface WhisperTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
}

export interface WhisperTranscriptionParams {
  file: File | Buffer;
  model?: OpenAiModel;
  prompt?: string;
  responseFormat?: 'json' | 'verbose_json' | 'text';
  temperature?: number;
  language?: string;
}
