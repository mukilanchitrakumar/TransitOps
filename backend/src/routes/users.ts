import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserAuditHistory,
} from '../controllers/users';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);
router.get('/audit-history', getUserAuditHistory);

export default router;
