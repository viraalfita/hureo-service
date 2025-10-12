import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    department: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    requirements: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true }
);

// Unique index per-company untuk slug
jobSchema.index({ companyId: 1, slug: 1 }, { unique: true });

// Helper slugify
function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Auto-generate slug
jobSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

const Job = mongoose.model("Job", jobSchema);
export default Job;
