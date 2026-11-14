// backend/routes/installmentRoutes.js
import express from 'express';
import { 
  createInstallmentPlan, 
  getInstallmentPlans, 
  toggleMonthPayment 
} from '../controllers/installmentController.js';

const router = express.Router();

// POST /api/installments - Create a new loan plan
router.post('/', createInstallmentPlan);

// GET /api/installments - Fetch all plans (supports ?search= query)
router.get('/', getInstallmentPlans);

// PATCH /api/installments/:planId/installment/:monthId - Check/uncheck monthly payment
router.patch('/:planId/installment/:monthId', toggleMonthPayment);

export default router;