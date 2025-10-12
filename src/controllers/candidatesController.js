import Candidate from "../models/Candidate.js";
import Company from "../models/Company.js";
import Employee from "../models/Employee.js";
import Job from "../models/Job.js";

import { sendMail } from "../utils/mailer.js";

function resolveCompanyId(req) {
  return (
    req.user?.companyId ||
    req.body.companyId ||
    req.query.companyId ||
    req.params.companyId
  );
}

// Stage pipeline yang diizinkan
const ALLOWED_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "declined",
];

async function ensureUniqueUsername({ base, companyId }) {
  let candidate = base || "user";
  let n = 0;
  while (await User.findOne({ username: candidate, companyId }).lean()) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

// helper: password random
function genPassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 char
}

/* ===================== Public Apply ===================== */
/**
 * Public endpoint: kandidat melamar job (tanpa login).
 */
export const publicApplyToJob = async (req, res) => {
  try {
    const { companyCode, slug } = req.params;
    const {
      fullName,
      email,
      phone,
      coverLetter,
      address = "",
      gender = "",
      dateOfBirth,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: "Nama & email wajib diisi" });
    }

    const company = await Company.findOne({ companyCode: companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const job = await Job.findOne({
      companyId: company._id,
      slug,
      status: "open",
    });
    if (!job) return res.status(404).json({ error: "Job not found/closed" });

    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : "";

    let dob = null;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!Number.isNaN(d.getTime())) dob = d;
    }

    const cand = await Candidate.create({
      companyId: company._id,
      jobId: job._id,
      fullName,
      email,
      phone,
      coverLetter,
      resumeUrl,
      address,
      gender: ["male", "female", "other"].includes(String(gender).toLowerCase())
        ? String(gender).toLowerCase()
        : "",
      dateOfBirth: dob,
      stage: "applied",
      source: "career_page",
    });

    const to =
      job.recruiterEmail ||
      company.recruiterEmail ||
      process.env.RECRUITER_EMAIL ||
      "";

    try {
      await sendMail({
        to,
        subject: `[${company.code}] New Candidate - ${job.title}`,
        text: `${fullName} melamar untuk ${job.title}
                Email: ${email}
                Phone: ${phone || "-"}
                Resume: ${resumeUrl || "-"}
                Gender: ${cand.gender || "-"}
                DOB: ${
                  cand.dateOfBirth
                    ? cand.dateOfBirth.toISOString().slice(0, 10)
                    : "-"
                }
                Address: ${cand.address || "-"}`,
        html: `
          <p>Ada kandidat baru untuk <b>${job.title}</b> (Perusahaan: <b>${
          company.name
        }</b>).</p>
          <ul>
            <li><b>Nama:</b> ${fullName}</li>
            <li><b>Email:</b> ${email}</li>
            <li><b>Telepon:</b> ${phone || "-"}</li>
            <li><b>Gender:</b> ${cand.gender || "-"}</li>
            <li><b>Tgl Lahir:</b> ${
              cand.dateOfBirth
                ? cand.dateOfBirth.toISOString().slice(0, 10)
                : "-"
            }</li>
            <li><b>Alamat:</b> ${cand.address || "-"}</li>
            <li><b>Resume:</b> ${
              resumeUrl
                ? `<a href="${resumeUrl}" target="_blank" rel="noopener">Lihat</a>`
                : "-"
            }</li>
          </ul>
        `,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname || "resume.pdf",
                path: req.file.path,
              },
            ]
          : [],
      });
    } catch (e) {
      console.warn("[MAIL] gagal kirim notifikasi recruiter:", e.message);
    }

    return res.status(201).json(cand);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

/* ===================== Admin/Recruiter (protected) ===================== */

export const listCandidates = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const { jobId, stage, q } = req.query;
    const filter = { companyId };

    if (jobId) filter.jobId = jobId;
    if (stage) filter.stage = stage;

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const list = await Candidate.find(filter)
      .sort({ createdAt: -1 })
      .populate("jobId", "title slug")
      .populate("companyId", "name code");

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateCandidateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!ALLOWED_STAGES.includes(String(stage))) {
      return res.status(400).json({
        error: `Invalid stage. Allowed: ${ALLOWED_STAGES.join(", ")}`,
      });
    }

    const cand = await Candidate.findByIdAndUpdate(
      id,
      { stage },
      { new: true, runValidators: true }
    )
      .populate("jobId", "title slug recruiterEmail department employmentType")
      .populate("companyId", "name code recruiterEmail");

    if (!cand) return res.status(404).json({ error: "Candidate not found" });

    let createdOrFoundEmployee = null;
    let createdUser = null;
    let plainPassword = null;

    // === Auto-create Employee & User jika HIRED ===
    if (String(stage) === "hired") {
      const companyId = cand.companyId?._id || cand.companyId;
      const job = cand.jobId || {};
      const position = job.title || "";
      const department = job.department || "";
      const employmentType = (job.employmentType || "").toLowerCase();

      // 1) Pastikan user login ada
      // Username default dari email kandidat
      const email = String(cand.email || "").trim();
      const baseUsername =
        email && email.includes("@")
          ? email.split("@")[0]
          : cand.fullName?.toLowerCase()?.replace(/\s+/g, ".") || "employee";

      const username = await ensureUniqueUsername({
        base: baseUsername,
        companyId,
      });

      // Cari user existing (berdasarkan username di company ini atau email di employee nanti)
      let user = await User.findOne({ username, companyId });
      if (!user) {
        // generate password & buat
        plainPassword = genPassword();
        user = await User.create({
          username,
          password: plainPassword, // akan di-hash oleh pre-save
          role: "employee",
          companyId,
        });
      }
      createdUser = user;

      // 2) Buat/temukan Employee & link userId
      createdOrFoundEmployee = await Employee.findOneAndUpdate(
        { companyId, email: cand.email },
        {
          $setOnInsert: {
            companyId,
            candidateId: cand._id,
            jobId: cand.jobId?._id || cand.jobId,
            userId: user._id, // <— LINK KE USER
            fullName: cand.fullName,
            email: cand.email,
            phone: cand.phone || "",
            address: cand.address || "",
            gender: cand.gender || "",
            dateOfBirth: cand.dateOfBirth || null,
            position,
            department,
            employmentType: [
              "fulltime",
              "parttime",
              "contract",
              "intern",
            ].includes(employmentType)
              ? employmentType
              : "",
            hireDate: new Date(),
            status: "active",
            resumeUrl: cand.resumeUrl || "",
            source: "recruitment",
          },
          // jika sudah ada employee-nya tapi belum link userId, isi
          $set: { userId: user._id },
        },
        { new: true, upsert: true }
      );

      // 3) Kirim kredensial ke kandidat (opsional — hanya jika user baru dibuat)
      if (plainPassword) {
        try {
          await sendMail({
            to: cand.email,
            subject: `Akun Anda di ${cand.companyId?.name || "Perusahaan"}`,
            text:
              `Halo ${cand.fullName},\n\n` +
              `Selamat bergabung! Akun Anda telah dibuat.\n\n` +
              `Username: ${user.username}\n` +
              `Password: ${plainPassword}\n\n` +
              `Silakan login dan segera ganti password Anda.\n`,
          });
        } catch (e) {
          console.warn("[MAIL] gagal kirim kredensial:", e.message);
        }
      }
    }

    // Notifikasi recruiter
    const toRecruiter =
      cand.jobId?.recruiterEmail ||
      cand.companyId?.recruiterEmail ||
      process.env.RECRUITER_EMAIL ||
      "";

    try {
      await sendMail({
        to: toRecruiter,
        subject: `[${cand.companyId?.code || ""}] Candidate Stage Update - ${
          cand.jobId?.title || "Job"
        }`,
        text: `Stage kandidat ${cand.fullName} sekarang: ${stage}`,
        html: `<p>Stage kandidat <b>${cand.fullName}</b> untuk lowongan <b>${
          cand.jobId?.title || "-"
        }</b> berubah menjadi <b>${String(stage).toUpperCase()}</b>.</p>`,
      });
    } catch (e) {
      console.warn("[MAIL] gagal kirim notifikasi stage:", e.message);
    }

    // Notifikasi kandidat (status berubah)
    try {
      await sendMail({
        to: cand.email,
        subject: `Status Lamaran: ${cand.jobId?.title || "Lamaran"}`,
        text: `Status lamaran Anda kini: ${stage}`,
        html: `<p>Halo ${cand.fullName}, status lamaran Anda untuk <b>${
          cand.jobId?.title || "-"
        }</b> sekarang: <b>${String(stage).toUpperCase()}</b>.</p>`,
      });
    } catch (e) {
      console.warn("[MAIL] gagal email ke kandidat:", e.message);
    }

    return res.json({
      candidate: cand,
      employee: createdOrFoundEmployee,
      user: createdUser
        ? {
            _id: createdUser._id,
            username: createdUser.username,
            role: createdUser.role,
          }
        : null,
      // ⚠️ JANGAN expose password di response produksi.
      // Hanya kalau kamu mau cek saat dev:
      // devPassword: plainPassword || undefined,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    await Candidate.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
