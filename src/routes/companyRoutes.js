import express from "express";
import {
  getCompanies,
  getCompanyByCompanyCode,
  getCompanyHours,
  registerCompany,
  updateCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.post("/register", registerCompany);
router.patch("/:id", updateCompany);
router.get("/hours/:companyCode", getCompanyHours);
router.get("/:companyCode", getCompanyByCompanyCode);

router.get("/", getCompanies);

export default router;
