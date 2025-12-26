import Leave from "../models/Leave.js";

export const requestLeave = async (req, res) => {
  try {
    const { userId, reason, startDate, endDate } = req.body;

    if (!userId || !reason || !startDate || !endDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "Start date cannot be after end date" });
    }

    const overlapping = await Leave.findOne({
      userId,
      status: { $in: ["waiting", "approved"] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (overlapping) {
      return res.status(400).json({
        error: "Leave request overlaps with an existing leave",
      });
    }

    const leave = new Leave({ userId, reason, startDate, endDate });
    await leave.save();
    res.status(201).json(leave);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLeavesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "declined", "waiting"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });
    if (!leave) return res.status(404).json({ error: "Leave not found" });

    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) return res.status(404).json({ error: "Leave not found" });
    if (leave.status !== "waiting") {
      return res
        .status(400)
        .json({ error: "Only waiting requests can be cancelled" });
    }

    await leave.deleteOne();
    res.json({ message: "Leave request cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
