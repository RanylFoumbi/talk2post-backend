import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';

const router = Router();

router.get('/purge', CronController.purge);

export default router;
