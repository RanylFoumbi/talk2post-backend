import { Router } from 'express';
import healthRoutes from './health.routes';
import recordingRoutes from './recording.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/recordings', recordingRoutes);

export default router;
