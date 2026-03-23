import { PostController } from '../controllers/post.controller';
import { validate } from '../middleware/validate.middleware';
import { generatePostSchema } from '../schemas/post.schema';
import { Router } from 'express';

const router = Router();

router.post('/generate', validate(generatePostSchema), PostController.generate);

export default router;
