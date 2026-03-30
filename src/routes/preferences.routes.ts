import { Router } from 'express';
import { PreferencesController } from '../controllers/preferences.controller';
import { validate } from '../middleware/validate.middleware';
import { upsertPreferencesSchema } from '../schemas/preferences.schema';

const router = Router();

router.get('/', PreferencesController.get);
router.put('/', validate(upsertPreferencesSchema), PreferencesController.upsert);

export default router;
