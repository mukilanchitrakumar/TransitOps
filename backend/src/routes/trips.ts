import { Router } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from '../controllers/trips';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']),
  getTrips
);
router.get(
  '/:id',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']),
  getTripById
);
router.post('/', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), createTrip);
router.post('/:id/dispatch', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), dispatchTrip);
router.post('/:id/complete', authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'DRIVER']), completeTrip);
router.post('/:id/cancel', authorize(['SUPER_ADMIN', 'FLEET_MANAGER']), cancelTrip);

export default router;
