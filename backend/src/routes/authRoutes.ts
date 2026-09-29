import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
} from '../controllers/authController';
import { validateBody } from '../middleware/validate';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateBody(resendOtpSchema), resendOtp);
router.post('/login', validateBody(loginSchema), login);

export default router;
