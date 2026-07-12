import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/reports';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/metrics', authenticate, getDashboardMetrics);

export default router;
