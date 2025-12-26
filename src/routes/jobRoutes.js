import express from "express";
import {
  closeJob,
  createJob,
  getJob,
  listJobs,
  updateJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", createJob);
router.get("/", listJobs);
router.get("/:id", getJob);
router.put("/:id", updateJob);
router.patch("/:id/close", closeJob);

export default router;
