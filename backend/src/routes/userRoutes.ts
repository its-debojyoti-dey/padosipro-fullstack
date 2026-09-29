import { Router } from 'express';
import { getProfile, saveProfile, saveProfileSchema } from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/profile', getProfile);
router.post('/profile', validateBody(saveProfileSchema), saveProfile);

export default router;
