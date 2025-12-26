import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUsersByCompany,
  loginUser,
  registerAdmin,
  registerEmployee,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register/employee", registerEmployee);
router.post("/register/admin", registerAdmin);

router.post("/login", loginUser);
router.get("/", getAllUsers);

router.get("/company/:companyId", getUsersByCompany);
router.delete("/:id", deleteUser);

export default router;
