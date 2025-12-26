import mongoose from "mongoose";

// Face verification attendance logs
const attendanceLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    capturedAt: { type: Date, default: Date.now },
    location: {
      lat: Number,
      lng: Number,
    },
    similarity: Number,
    threshold: Number,
    faceVerified: { type: Boolean, default: false },
    status: { type: String, trim: true },
  },
  { collection: "attendance_logs" }
);

const AttendanceLog = mongoose.model("AttendanceLog", attendanceLogSchema);
export default AttendanceLog;
