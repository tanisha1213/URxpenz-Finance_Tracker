import express from 'express';
import { getMyReferralStats, validateReferralCode } from '../controllers/referralController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/validate/:code', validateReferralCode);
router.get('/stats', protect, getMyReferralStats);

export default router;
