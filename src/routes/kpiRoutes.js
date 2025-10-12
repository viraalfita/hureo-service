import express from "express";
import { getCompanyKPI } from "../controllers/kpiController.js";
const router = express.Router();
router.get("/company/:companyId", getCompanyKPI);
export default router;
