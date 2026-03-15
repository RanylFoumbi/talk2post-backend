import multer from 'multer';
import { AllMimeTypes, MimeType } from 'types/enums';
import { Sentry } from './sentry';

export class UploadConfig {
  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  static create() {
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: this.MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (AllMimeTypes.includes(file.mimetype as MimeType)) {
          cb(null, true);
        } else {
          Sentry.captureException(
            new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`),
          );
          cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
        }
      },
    });
  }
}
