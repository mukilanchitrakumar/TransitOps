import { Router } from 'express';
import { getExpenses, createExpense, approveExpense, rejectExpense } from '../controllers/expenses';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER']),
  getExpenses
);
router.post(
  '/',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'DRIVER']),
  createExpense
);
router.patch(
  '/:id/approve',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']),
  approveExpense
);
router.patch(
  '/:id/reject',
  authorize(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']),
  rejectExpense
);

export default router;
