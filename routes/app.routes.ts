import { Router } from "express";

const router = Router()

router.get('/hello', (req, res) => { 
  res.status(200).send("Hello world")
})

export default router;