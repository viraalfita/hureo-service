import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
import User from "../models/User.js";

export const registerEmployee = async (req, res) => {
  try {
    const { username, password, companyCode } = req.body;

    if (!username || !password || !companyCode) {
      return res
        .status(400)
        .json({ error: "username, password, companyCode wajib diisi" });
    }

    const company = await Company.findOne({ companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const exists = await User.findOne({ username, companyId: company._id });
    if (exists)
      return res
        .status(409)
        .json({ error: "Username already exists in this company" });

    const user = new User({
      username,
      password,
      role: "employee",
      companyId: company._id,
    });

    await user.save();
    res.status(201).json({ message: "Employee created successfully" });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "Username already exists in this company" });
    }
    res.status(400).json({ error: err.message });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, companyCode } = req.body;

    if (!username || !password || !companyCode) {
      return res
        .status(400)
        .json({ error: "username, password, companyCode wajib diisi" });
    }

    const company = await Company.findOne({ companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const exists = await User.findOne({ username, companyId: company._id });
    if (exists)
      return res
        .status(409)
        .json({ error: "Username already exists in this company" });

    const user = new User({
      username,
      password,
      role: "admin",
      companyId: company._id,
    });

    await user.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "Username already exists in this company" });
    }
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password, companyCode } = req.body;

    if (!username || !password || !companyCode) {
      return res
        .status(400)
        .json({ error: "username, password, companyCode wajib diisi" });
    }

    const company = await Company.findOne({ companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const user = await User.findOne({
      username,
      companyId: company._id,
    }).populate("companyId");

    if (!user) {
      return res.status(404).json({ error: "User not found in this company" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        companyId: company._id,
        companyCode,
        time_start: company.time_start,
        time_end: company.time_end,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      company: {
        code: company.companyCode,
        name: company.name,
        companyId: company._id,
      },
      working_hours: {
        start: company.time_start,
        end: company.time_end,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId)
      return res.status(400).json({ error: "companyId wajib diisi" });

    const users = await User.find({ companyId }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id wajib diisi" });

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
