import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";
import { verifyTopup } from "../controllers/wallet.controller";

const router = Router();

// requires authentication on all routes within this router
router.use(isLoggedIn);

router.get('/history');

router.post('/verify/:ref', verifyTopup);

router.post('/transfer');

export default router;