import express from "express";
import {
  checkIn,
  checkOut,
  getAllAttendance,
  getAllAttendanceByCompany,
  getAttendanceByUser,
  getTodayAttendance,
  getTodayAttendanceByCompany,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/checkin", checkIn);
router.post("/checkout", checkOut);
router.get("/", getAllAttendance);
router.get("/company/:companyId", getAllAttendanceByCompany);
router.get("/:userId", getAttendanceByUser);
router.get("/today/:userId", getTodayAttendance);
router.get("/company/:companyId/today", getTodayAttendanceByCompany);

export default router;
