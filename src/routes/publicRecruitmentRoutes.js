import express from "express";
import multer from "multer";
import { publicApplyToJob } from "../controllers/candidatesController.js";
import {
  publicGetJobBySlug,
  publicListJobsByCompanyCode,
} from "../controllers/jobController.js";

const router = express.Router();

// Storage lokal untuk resume
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes"),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

// List jobs (open) per company code
router.get("/:companyCode/jobs", publicListJobsByCompanyCode);

// Detail job by slug
router.get("/:companyCode/jobs/:slug", publicGetJobBySlug);

// Apply ke job
router.post(
  "/:companyCode/jobs/:slug/apply",
  upload.single("resume"),
  publicApplyToJob
);

export default router;
