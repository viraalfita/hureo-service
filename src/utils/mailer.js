import nodemailer from "nodemailer";

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "465",
  SMTP_SECURE = "true", // true utk 465 (Gmail)
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: String(SMTP_SECURE).toLowerCase() === "true", // 465 => true; 587 => false
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendMail({ to, subject, text, html, attachments = [] }) {
  if (!to) {
    console.log("[MAIL] (skip) set RECRUITER_EMAIL agar notifikasi terkirim.");
    return;
  }
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("[MAIL] SMTP belum dikonfigurasi, hanya log ke console:", {
      to,
      subject,
      text,
    });
    return;
  }

  return transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
