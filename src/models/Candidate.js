import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },

    // ===== tambahan =====
    address: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    dateOfBirth: { type: Date, default: null },

    resumeUrl: { type: String, default: "" },
    coverLetter: { type: String, default: "" },

    answers: { type: Object, default: {} },
    source: {
      type: String,
      enum: ["career_page", "referral", "manual"],
      default: "career_page",
    },

    stage: {
      type: String,
      enum: ["applied", "screening", "interview", "offer", "hired", "declined"],
      default: "applied",
      index: true,
    },

    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
