import { Router } from "express";
import { login, logout, register, rotateTokens } from "../controllers/auth.controller";

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.post('/rotate', rotateTokens)

export default router;