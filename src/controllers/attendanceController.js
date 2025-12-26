// controllers/attendanceController.js
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
dayjs.extend(timezone);

/* ========================= Utilities ========================= */

// Haversine: jarak (meter)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meter
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ambil jam kerja & grace dari dokumen Company (dukung snake_case & camelCase)
function getCompanyHours(companyDoc) {
  return {
    // Bisa "HH:mm" (untuk jadwal harian) atau ISO (untuk sekali waktu)
    timeStart: companyDoc.timeStart ?? companyDoc.time_start ?? null,
    timeEnd: companyDoc.timeEnd ?? companyDoc.time_end ?? null,

    // Grace (menit) — default 15
    graceMinutes: companyDoc.lateGraceMinutes ?? companyDoc.grace_minutes ?? 15,

    // Timezone default company kalau client tidak kirim tz
    defaultTz: companyDoc.timezone ?? "Asia/Jakarta",
  };
}

// Buat dayjs "hari-ini jam HH:mm" di timezone tertentu
function buildTodayAtTZ_fromHHmm(hhmm, tz) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return dayjs().tz(tz).hour(h).minute(m).second(0).millisecond(0);
}

// Terima "HH:mm" atau ISO; kembalikan dayjs di TZ target
function getStartMoment(timeStart, tz) {
  if (!timeStart) return null;
  // Deteksi ISO sederhana: ada 'T' atau 'Z'
  const looksISO = typeof timeStart === "string" && /T|Z/.test(timeStart);
  if (looksISO) {
    // Parse ISO (anggap UTC) lalu representasikan di TZ target
    // dayjs(timeStart) -> instant UTC; .tz(tz) untuk representasi zona
    return dayjs(timeStart).tz(tz);
  }
  // Asumsikan "HH:mm"
  return buildTodayAtTZ_fromHHmm(timeStart, tz);
}

// Ambil tz efektif (clientTimezone dari body → fallback default company)
function resolveTz(clientTimezone, defaultTz) {
  // Bisa tambahkan whitelist/validasi jika perlu
  return (
    (clientTimezone && String(clientTimezone).trim()) || defaultTz || "UTC"
  );
}

/* =============== Core Check-in/Check-out Handler =============== */

const handleAttendance = async (req, res, type) => {
  try {
    const { userId, latitude, longitude, clientTimezone } = req.body;

    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res
        .status(400)
        .json({ error: "latitude & longitude (number) are required" });
    }

    const user = await User.findById(userId).populate("companyId");
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.companyId)
      return res.status(400).json({ error: "Company not set for user" });

    const company = user.companyId;
    const { location } = company;
    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      typeof location.radius !== "number"
    ) {
      return res.status(400).json({ error: "Company location not configured" });
    }

    // Validasi geofence
    const distance = getDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    if (distance > location.radius) {
      return res.status(400).json({ error: "You are outside company area" });
    }

    const { timeStart, graceMinutes, defaultTz } = getCompanyHours(company);
    const tz = resolveTz(clientTimezone, defaultTz);

    // Ambil "sekarang" dari server, lalu representasikan dalam TZ device (anti-backdate)
    const nowTZ = dayjs().tz(tz);

    let isLate = false;
    if (type === "checkin" && timeStart) {
      const startTZ = getStartMoment(timeStart, tz);
      if (startTZ && startTZ.isValid()) {
        const dueTZ = startTZ.add(Number(graceMinutes || 0), "minute");
        if (nowTZ.isAfter(dueTZ)) isLate = true;
      } else {
        console.warn(`[ATT] Invalid timeStart in company: ${timeStart}`);
      }
    }

    const record = new Attendance({
      userId,
      type,
      location: { latitude, longitude },
      late: isLate,
      timezoneAtCheck: tz, // opsional untuk audit
      computedAt: dayjs().toDate(), // opsional
    });

    await record.save();
    return res.status(201).json(record);
  } catch (err) {
    console.error("[ATTENDANCE] handleAttendance error:", err);
    return res.status(400).json({ error: err.message });
  }
};

/* ========================= Exports (Routes) ========================= */

export const checkIn = (req, res) => handleAttendance(req, res, "checkin");
export const checkOut = (req, res) => handleAttendance(req, res, "checkout");

// Semua attendance by user (terbaru dulu)
export const getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ userId }).sort({ time: -1 });
    return res.json(records);
  } catch (err) {
    console.error("[ATTENDANCE] getAttendanceByUser error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Semua attendance (global)
export const getAllAttendance = async (_req, res) => {
  try {
    const records = await Attendance.find()
      .sort({ time: -1 })
      .populate("userId", "username");
    return res.json(records);
  } catch (err) {
    console.error("[ATTENDANCE] getAllAttendance error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Today (per user) — optional query ?tz=Asia/Jakarta untuk batas hari
export const getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const tz = req.query.tz || "Asia/Jakarta"; // fallback
    const startOfDayTZ = dayjs().tz(tz).startOf("day").toDate();

    const records = await Attendance.find({
      userId,
      time: { $gte: startOfDayTZ },
    }).sort({ time: -1 });

    return res.json(records);
  } catch (err) {
    console.error("[ATTENDANCE] getTodayAttendance error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Semua attendance by company
export const getAllAttendanceByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const users = await User.find({ companyId }).select("_id username");
    const userIds = users.map((u) => u._id);

    const records = await Attendance.find({ userId: { $in: userIds } })
      .sort({ time: -1 })
      .populate("userId", "username");

    return res.json(records);
  } catch (err) {
    console.error("[ATTENDANCE] getAllAttendanceByCompany error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Today by company — optional query ?tz=Asia/Jakarta untuk batas hari
export const getTodayAttendanceByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const tz = req.query.tz || "Asia/Jakarta"; // fallback

    const users = await User.find({ companyId }).select("_id username");
    const userIds = users.map((u) => u._id);

    const startOfDayTZ = dayjs().tz(tz).startOf("day").toDate();

    const records = await Attendance.find({
      userId: { $in: userIds },
      time: { $gte: startOfDayTZ },
    })
      .sort({ time: -1 })
      .populate("userId", "username");

    return res.json(records);
  } catch (err) {
    console.error("[ATTENDANCE] getTodayAttendanceByCompany error:", err);
    return res.status(500).json({ error: err.message });
  }
};
