import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["waiting", "approved", "declined"],
    default: "waiting",
  },
  createdAt: { type: Date, default: Date.now },
});

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;
