import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware";
import { getProfileInfo } from "../controllers/user.controller";

const router = Router();

// requires authentication on all routes within this router
router.use(isLoggedIn);

router.get('/info', getProfileInfo);

export default router;