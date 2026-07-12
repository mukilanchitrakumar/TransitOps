import { Router } from 'express';
import { askAssistant } from '../controllers/ai';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/chat', authenticate, askAssistant);

export default router;
