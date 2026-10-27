import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import {
  prepareContract,
  execute,
  recordSigning,
  verifyInitialPayments,
  listContracts,
  getContractById
} from '../controllers/contract.controller.js';

const router = Router();

router.get('/', authenticateToken, listContracts);
router.get('/:id', authenticateToken, getContractById);

// Contract preparation restricted to Market Supervisor
router.post('/prepare', authenticateToken, requireRole(ROLES.MARKET_SUPERVISOR), prepareContract);

// Physical signing recorded by Market Supervisor
router.post('/:id/record-signing', authenticateToken, requireRole(ROLES.MARKET_SUPERVISOR), recordSigning);

// Initial payments verified by Treasurer
router.post('/:id/verify-initial-payments', authenticateToken, requireRole(ROLES.TREASURER, ROLES.SYSTEM_ADMIN), verifyInitialPayments);

// Contract activation restricted to Market Supervisor (requires signing + initial payments)
router.post('/:id/activate', authenticateToken, requireRole(ROLES.MARKET_SUPERVISOR), execute);
router.post('/:id/execute', authenticateToken, requireRole(ROLES.MARKET_SUPERVISOR), execute);

export default router;

