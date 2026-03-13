import OpenAI from 'openai';
import { MimeType } from 'types/enums';
import { OpenAIConfig } from '../config/openai';
import {
    OpenAiModel,
    WhisperTranscriptionParams,
    WhisperTranscriptionResponse,
} from '../types/ai.types';

export class WhisperService {
  private client: OpenAI;

  constructor() {
    this.client = OpenAIConfig.getClient();
  }

  private toFile(audioFile: File | Buffer, filename: string = 'audio.wav'): File {
    if (audioFile instanceof File) {
      return audioFile;
    }
    return new File([audioFile], filename, { type: MimeType.WAV });
  }

  async transcribeWithLanguageDetection(
    audioFile: File | Buffer,
    language?: string | null,
  ): Promise<WhisperTranscriptionResponse & { detectedLanguage: string }> {
    const transcription = await this.transcribe({
      file: audioFile,
      language: language || undefined,
    });

    const detectedLanguage = language || transcription.language || 'unknown';

    if (detectedLanguage === 'unknown') {
      throw new Error('Could not detect language');
    }
    return {
      ...transcription,
      detectedLanguage,
    };
  }

  async transcribe(params: WhisperTranscriptionParams): Promise<WhisperTranscriptionResponse> {
    const { file, prompt, language } = params;

    const audioFile = this.toFile(file);

    const verboseResponse: WhisperTranscriptionResponse =
      await this.client.audio.transcriptions.create({
        file: audioFile,
        model: OpenAiModel.Whisper1,
        prompt,
        response_format: 'verbose_json',
        temperature: 0,
        language,
      });

    return {
      text: verboseResponse.text,
      language: verboseResponse.language,
      duration: verboseResponse.duration,
      segments: verboseResponse.segments,
    };
  }

  calculateCost(duration: number): number {
    const durationMinutes = duration / 60;
    return durationMinutes * 0.006;
  }
}
