import { Router } from 'express';
import { getCatalog, getSelectedTasks, saveSelectedTasks, selectTasksSchema } from '../controllers/taskController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/catalog', getCatalog);
router.get('/selected', getSelectedTasks);
router.post('/select', validateBody(selectTasksSchema), saveSelectedTasks);

export default router;
