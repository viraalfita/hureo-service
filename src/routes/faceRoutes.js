import express from "express";
import { enrollFace, verifyFace } from "../controllers/faceController.js";

const router = express.Router();

router.post("/enroll", enrollFace);
router.post("/verify", verifyFace);

export default router;
