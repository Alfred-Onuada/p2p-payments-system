import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

router.use("/auth", authRoutes);

router.use("/user", userRoutes);

router.use("/wallet", walletRoutes);

export default router;
