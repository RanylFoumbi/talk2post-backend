import { Router } from 'express';
import { UploadConfig } from '../config/upload';
import { RecordingController } from '../controllers/recording.controller';
import { validate } from '../middleware/validate.middleware';
import { createTranscriptionSchema, updateTranscriptionSchema } from '../schemas/recording.schema';

const router = Router();
const upload = UploadConfig.create();

router.get(
  '/recordings/:recordingId',
  RecordingController.getOne,
);

router.get(
  '/recordings',
  RecordingController.list,
);

router.post(
  '/recordings/transcribe',
  upload.single('audio'),
  validate(createTranscriptionSchema),
  RecordingController.create,
);

router.patch(
  '/recordings/:recordingId',
  validate(updateTranscriptionSchema),
  RecordingController.update,
);

router.delete(
  '/recordings/:recordingId',
  RecordingController.delete,
);

export default router;
