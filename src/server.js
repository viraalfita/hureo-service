import cors from "cors";
import dotenv from "dotenv";
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import userRoutes from "./routes/authRoutes.js";
import candidatesRoutes from "./routes/candidateRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import employeesRoutes from "./routes/employeeRoutes.js";
import jobsRoutes from "./routes/jobRoutes.js";
import kpiRoutes from "./routes/kpiRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import publicRecruitmentRoutes from "./routes/publicRecruitmentRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "attendance-service" })
);
app.get("/health", (_req, res) => res.send("OK"));

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/candidates", candidatesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/public", publicRecruitmentRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(devRoutes);
