import { Router } from "express";

const router = Router();

router.get('/history');

router.post('/verify/:ref');

router.post('/transfer');

export default router;