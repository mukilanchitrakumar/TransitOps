import { Router } from 'express';
import { login, logout, getProfile } from '../controllers/auth';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;
