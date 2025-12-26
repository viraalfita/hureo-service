import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // LINK KE USER LOGIN
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },

    address: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    dateOfBirth: { type: Date, default: null },

    position: { type: String, default: "" },
    department: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["fulltime", "parttime", "contract", "intern", ""],
      default: "",
    },

    hireDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    resumeUrl: { type: String, default: "" },
    source: { type: String, default: "recruitment" },
  },
  { timestamps: true }
);

employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
