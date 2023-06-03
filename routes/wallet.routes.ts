import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";
import { verifyTopup, transferFunds } from "../controllers/wallet.controller";

const router = Router();

// requires authentication on all routes within this router
router.use(isLoggedIn);

router.post('/verify/:ref', verifyTopup);

router.post('/transfer', transferFunds);

export default router;