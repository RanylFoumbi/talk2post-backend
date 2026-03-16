import { Router } from 'express';
import { UploadConfig } from '../config/upload';
import { RecordingController } from '../controllers/recording.controller';
import { validate } from '../middleware/validate.middleware';
import { createTranscriptionSchema, updateTranscriptionSchema } from '../schemas/recording.schema';

const router = Router();
const upload = UploadConfig.create();

router.get('/:recordingId', RecordingController.getOne);

router.get('/', RecordingController.list);

router.post(
  '/transcribe',
  upload.single('audio'),
  validate(createTranscriptionSchema),
  RecordingController.create,
);

router.patch('/:recordingId', validate(updateTranscriptionSchema), RecordingController.update);

router.delete('/:recordingId', RecordingController.delete);

export default router;
