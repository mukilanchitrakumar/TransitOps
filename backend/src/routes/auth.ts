import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshSession,
} from '../controllers/auth';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

// Public Self-Registration & Sessions
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshSession);

// Protected Operations
router.post('/change-password', authenticate, changePassword);

export default router;
