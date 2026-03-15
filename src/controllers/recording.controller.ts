import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config';
import { CustomError } from '../middleware/error.middleware';
import { RecordingService } from '../services/recording.service';
import { WhisperService } from 'services/whisper.service';

export class RecordingController {
  private static whisperService = new WhisperService();

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
      }

      const requestedLanguage = req.body.language as string | undefined;
      const fileName = `${Date.now()}-${req.file.originalname}`;

      // Upload audio to storage
      const audioUrl = await RecordingService.uploadAudio({
        userId: req.userId!,
        fileName,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      // Create recording in database
      const recording = await RecordingService.createRecording({
        userId: req.userId!,
        audioUrl,
        duration: req.body.duration ? parseInt(req.body.duration) : undefined,
      });

      // Transcribe audio
      const audioFile = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });
      const transcription = await this.whisperService.transcribeWithLanguageDetection(
        audioFile,
        requestedLanguage,
      );

      // Complete recording with transcript
      const completed = await RecordingService.completeRecording({
        recordingId: recording.id,
        transcript: transcription.text,
        language: transcription.detectedLanguage,
        duration: Math.round(transcription.duration || 0),
      });

      res.status(201).json(completed);
    } catch (err) {
      if (err instanceof Error && err.message === 'Could not detect language') {
        next(new CustomError('Could not detect language', 422, 'LANGUAGE_DETECTION_FAILED'));
        return;
      }
      Sentry.captureException(err);
      next(err);
    }
  }
}
