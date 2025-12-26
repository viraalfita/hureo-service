import express from "express";
import { sendMail } from "../utils/mailer.js";
const router = express.Router();

router.post("/_mail/test", async (req, res) => {
  try {
    await sendMail({
      to: process.env.RECRUITER_EMAIL,
      subject: "Test Mailer",
      text: "Halo dari HRIS 👋",
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
