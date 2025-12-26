import express from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", listEmployees);
router.get("/:id", getEmployeeById);
router.post("/", createEmployee);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
