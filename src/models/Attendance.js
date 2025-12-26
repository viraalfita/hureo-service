import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["checkin", "checkout"], required: true },
  time: { type: Date, default: Date.now },
  location: {
    latitude: Number,
    longitude: Number,
  },
  late: { type: Boolean, default: false },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
