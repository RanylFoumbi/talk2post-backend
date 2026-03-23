import { Router } from 'express';
import healthRoutes from './health.routes';
import postRoutes from './post.routes';
import recordingRoutes from './recording.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/recordings', recordingRoutes);
router.use('/posts', postRoutes);

export default router;
