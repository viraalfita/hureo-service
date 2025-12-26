import express from "express";
import {
  cancelLeave,
  getAllLeaves,
  getLeavesByUser,
  requestLeave,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/", requestLeave);
router.get("/", getAllLeaves);
router.get("/:userId", getLeavesByUser);
router.patch("/:id/status", updateLeaveStatus);
router.delete("/:id", cancelLeave);

export default router;
