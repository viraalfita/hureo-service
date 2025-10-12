// controllers/employeeController.js
import Employee from "../models/Employee.js";

/** Ambil companyId dari auth/user atau dari body/query/params */
function resolveCompanyId(req) {
  return (
    req.user?.companyId ||
    req.body.companyId ||
    req.query.companyId ||
    req.params.companyId
  );
}

/**
 * CREATE
 * POST /api/employees
 */
export const createEmployee = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const {
      fullName,
      email,
      phone = "",
      address = "",
      gender = "",
      dateOfBirth = null,
      position = "",
      department = "",
      employmentType = "",
      hireDate = new Date(),
      status = "active",
      resumeUrl = "",
      source = "recruitment",
      candidateId = null,
      jobId = null,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: "fullName & email are required" });
    }

    const doc = await Employee.create({
      companyId,
      candidateId,
      jobId,
      fullName,
      email,
      phone,
      address,
      gender,
      dateOfBirth,
      position,
      department,
      employmentType,
      hireDate,
      status,
      resumeUrl,
      source,
    });

    return res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "Employee already exists (email used in this company)",
      });
    }
    return res.status(400).json({ error: err.message });
  }
};

/**
 * LIST (tanpa pagination)
 * GET /api/employees?department=&status=&employmentType=&q=&sort=createdAt:-1
 */
export const listEmployees = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const { department, status, employmentType, q } = req.query;

    const filter = { companyId };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (employmentType) filter.employmentType = employmentType;

    if (q) {
      const rx = { $regex: q, $options: "i" };
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { phone: rx },
        { position: rx },
        { department: rx },
      ];
    }

    // sorting opsional: ?sort=createdAt:-1,fullName:1
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      sort = {};
      for (const token of String(req.query.sort).split(",")) {
        const [k, v] = token.split(":");
        if (k) sort[k] = Number(v) >= 0 ? 1 : -1;
      }
    }

    const items = await Employee.find(filter).sort(sort).lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * READ detail
 * GET /api/employees/:id
 */
export const getEmployeeById = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const { id } = req.params;
    const doc = await Employee.findOne({ _id: id, companyId }).lean();
    if (!doc) return res.status(404).json({ error: "Employee not found" });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * UPDATE
 * PATCH /api/employees/:id
 */
export const updateEmployee = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const { id } = req.params;

    const allowed = [
      "fullName",
      "phone",
      "address",
      "gender",
      "dateOfBirth",
      "position",
      "department",
      "employmentType",
      "hireDate",
      "status",
      "resumeUrl",
      "source",
      "email", // hati-hati: unique per companyId
    ];
    const $set = {};
    for (const k of allowed) if (k in req.body) $set[k] = req.body[k];

    const doc = await Employee.findOneAndUpdate(
      { _id: id, companyId },
      { $set },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ error: "Employee not found" });
    return res.json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "Email already in use in this company" });
    }
    return res.status(400).json({ error: err.message });
  }
};

/**
 * DELETE
 * DELETE /api/employees/:id
 */
export const deleteEmployee = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const { id } = req.params;
    const r = await Employee.findOneAndDelete({ _id: id, companyId });
    if (!r) return res.status(404).json({ error: "Employee not found" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
