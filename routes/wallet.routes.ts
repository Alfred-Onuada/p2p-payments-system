import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";

const router = Router();

// requires authentication on all routes within this router
router.use(isLoggedIn);

router.get('/history');

router.post('/verify/:ref');

router.post('/transfer');

export default router;