import { Router } from 'express';
import { UploadConfig } from '../config/upload';
import { RecordingController } from '../controllers/recording.controller';
import { validate } from '../middleware/validate.middleware';
import { createTranscriptionSchema } from '../schemas/recording.schema';

const router = Router();
const upload = UploadConfig.create();

router.post(
  '/recordings/transcribe',
  upload.single('audio'),
  validate(createTranscriptionSchema),
  RecordingController.create
);

export default router;
