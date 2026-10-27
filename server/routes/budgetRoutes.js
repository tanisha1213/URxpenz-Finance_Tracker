import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { setBudget, getBudget, updateBudget, updateDailyAlertTime } from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

router.post('/', setBudget);
router.get('/', getBudget);
router.put('/', updateBudget);
router.patch('/alert-time', updateDailyAlertTime);

export default router;
