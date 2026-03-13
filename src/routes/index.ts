import { Router } from 'express';
import healthRoutes from './health.routes';
import recordingRoutes from './recording.routes';

const router = Router();

router.use(healthRoutes);
router.use(recordingRoutes);

export default router;
