import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { createPayment, listPayments, getReceipt } from '../controllers/payment.controller.js';

const router = Router();

router.get('/', authenticateToken, listPayments);
router.get('/receipts/:receiptNo', authenticateToken, getReceipt);

// Only Treasurer & Authorized Collectors can record payments
router.post('/', authenticateToken, requireRole(ROLES.TREASURER, ROLES.COLLECTOR_INSPECTOR, ROLES.COLLECTOR, ROLES.ADMIN), createPayment);

export default router;
