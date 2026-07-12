import { Router } from 'express';
import { getFuelLogs, createFuelLog } from '../controllers/fuelLogs';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']),
  getFuelLogs
);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'DRIVER']),
  createFuelLog
);

export default router;
