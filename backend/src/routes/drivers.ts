import { Router } from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/drivers';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  getDrivers
);
router.get(
  '/:id',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  getDriverById
);
router.post('/', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), createDriver);
router.patch('/:id', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), updateDriver);
router.delete('/:id', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), deleteDriver);

export default router;
