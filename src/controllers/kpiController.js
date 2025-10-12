import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js"; // ← tambahkan
import Leave from "../models/Leave.js";
import User from "../models/User.js";

dayjs.extend(minMax);

function countWorkdays(start, end) {
  let cur = dayjs(start).startOf("day");
  const last = dayjs(end).startOf("day");
  let days = 0;
  while (cur.isBefore(last) || cur.isSame(last)) {
    const d = cur.day();
    if (d !== 0 && d !== 6) days++;
    cur = cur.add(1, "day");
  }
  return days;
}

async function calcKPI({ userId, month }) {
  const start = dayjs(`${month}-01`).startOf("month").toDate();
  const end = dayjs(start).endOf("month").toDate();

  const att = await Attendance.find({
    userId,
    time: { $gte: start, $lte: end },
  }).lean();

  const daysWithCheckin = new Set(
    att
      .filter((a) => a.type === "checkin")
      .map((a) => dayjs(a.time).format("YYYY-MM-DD"))
  );

  const leaves = await Leave.find({
    userId,
    status: "approved",
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }, // overlap bulan
    ],
  }).lean();

  let approvedLeaveDays = 0;
  for (const lv of leaves) {
    let s = dayjs(lv.startDate).startOf("day");
    let e = dayjs(lv.endDate).startOf("day");
    let cur = dayjs.max(s, dayjs(start));
    const last = dayjs.min(e, dayjs(end));
    while (cur.isBefore(last) || cur.isSame(last)) {
      const d = cur.day();
      if (d !== 0 && d !== 6) approvedLeaveDays++;
      cur = cur.add(1, "day");
    }
  }

  const workdays = countWorkdays(start, end);
  const hadir = daysWithCheckin.size + approvedLeaveDays;
  const presence = workdays ? Math.min(hadir / workdays, 1) : 1;

  const lateCount = att.filter((a) => a.type === "checkin" && a.late).length;
  const lateRate = hadir ? Math.max(1 - lateCount / hadir, 0) : 1;

  const score = 60 * presence + 40 * lateRate;

  return {
    month,
    userId,
    workdays,
    hadirCheckin: daysWithCheckin.size,
    approvedLeaveDays,
    hadirTotal: hadir,
    lateCount,
    presence: Number((presence * 100).toFixed(2)),
    punctuality: Number((lateRate * 100).toFixed(2)),
    score: Number(score.toFixed(2)),
  };
}

export const getCompanyKPI = async (req, res) => {
  try {
    const { companyId } = req.params;
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    // Ambil semua user di company
    const users = await User.find({ companyId })
      .select("_id username name")
      .lean();

    // Ambil semua employee untuk map userId -> fullName
    const employees = await Employee.find({ companyId })
      .select("userId fullName")
      .lean();

    const nameByUserId = new Map(
      employees
        .filter((e) => e.userId)
        .map((e) => [String(e.userId), e.fullName || ""])
    );

    const items = [];
    for (const u of users) {
      const k = await calcKPI({ userId: u._id, month });
      const displayName =
        nameByUserId.get(String(u._id)) || u.name || u.username || "-";

      items.push({
        userId: u._id,
        name: displayName, // ← selalu pakai nama karyawan kalau ada
        ...k,
      });
    }

    items.sort((a, b) => b.score - a.score);
    res.json({ month, companyId, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
