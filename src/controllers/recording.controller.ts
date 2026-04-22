import { NextFunction, Request, Response } from 'express';
import { WhisperService } from '../services/whisper.service';
import { Sentry } from '../config';
import { CustomError } from '../middleware/error.middleware';
import { RecordingService } from '../services/recording.service';

export class RecordingController {

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

      try {
        // Transcribe audio
        const transcription = await new WhisperService().transcribeWithLanguageDetection(
          req.file.buffer,
          requestedLanguage,
        );

        // Complete recording with transcript
        const completed = await RecordingService.updateRecording({
          recordingId: recording.id,
          transcript: transcription.text,
          language: transcription.detectedLanguage,
          duration: Math.round(transcription.duration || 0),
        });

        res.status(201).json(completed);
      } catch (err) {
        await RecordingService.markAsFailed(recording.id);
        throw err;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Could not detect language') {
        next(new CustomError('Could not detect language', 422, 'LANGUAGE_DETECTION_FAILED'));
        return;
      }
      Sentry.captureException(err);
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId } = req.params;
      const { transcript, language } = req.body;

      const updated = await RecordingService.updateRecording({
        recordingId: String(recordingId),
        transcript,
        language,
      });

      res.status(200).json(updated);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId } = req.params;

      const deleted = await RecordingService.deleteRecording(String(recordingId));

      res.status(204).json(deleted);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId } = req.params;

      const recording = await RecordingService.getRecording(String(recordingId), req.userId!);

      res.status(200).json(recording);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recordings = await RecordingService.listUserRecordings(req.userId!);

      res.status(200).json(recordings);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }
}
