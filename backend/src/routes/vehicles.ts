import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicles';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  getVehicles
);
router.get(
  '/:id',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  getVehicleById
);
router.post('/', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), createVehicle);
router.patch('/:id', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), updateVehicle);
router.delete('/:id', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), deleteVehicle);

export default router;
