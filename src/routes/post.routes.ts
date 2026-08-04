import { PostController } from '../controllers/post.controller';
import { validate } from '../middleware/validate.middleware';
import { createDraftSchema, generatePostSchema, updatePostSchema } from '../schemas/post.schema';
import { Router } from 'express';

const router = Router();

router.get('/', PostController.list);
router.get('/:postId', PostController.getOne);
router.post('/draft', validate(createDraftSchema), PostController.createDraft);
router.post('/generate', validate(generatePostSchema), PostController.generate);
router.patch('/:postId', validate(updatePostSchema), PostController.update);
router.delete('/:postId', PostController.delete);

export default router;
