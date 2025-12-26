import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 500 },
  },
  companyCode: { type: String, required: true, unique: true },
  timeStart: { type: String, required: true }, // format "HH:MM"
  timeEnd: { type: String, required: true }, // format "HH:MM
  createdAt: { type: Date, default: Date.now },
  recruiterEmail: { type: String, required: true },
});

const Company = mongoose.model("Company", companySchema);
export default Company;
