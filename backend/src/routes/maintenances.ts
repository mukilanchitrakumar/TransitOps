import { Router } from 'express';
import {
  getMaintenances,
  createMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
} from '../controllers/maintenances';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  getMaintenances
);
router.post('/', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), createMaintenance);
router.post('/:id/start', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), startMaintenance);
router.post('/:id/complete', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), completeMaintenance);
router.post('/:id/cancel', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), cancelMaintenance);

export default router;
