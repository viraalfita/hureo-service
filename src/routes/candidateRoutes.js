import express from "express";
import {
  deleteCandidate,
  listCandidates,
  updateCandidateStage,
} from "../controllers/candidatesController.js";

const router = express.Router();

router.get("/", listCandidates);
router.patch("/:id/stage", updateCandidateStage);
router.delete("/:id", deleteCandidate);

export default router;
