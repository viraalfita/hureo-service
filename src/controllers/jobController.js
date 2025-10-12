import Company from "../models/Company.js";
import Job from "../models/Job.js";

function resolveCompanyId(req) {
  return (
    req.user?.companyId ||
    req.body.companyId ||
    req.query.companyId ||
    req.params.companyId
  );
}

// recruiter
export const createJob = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const payload = {
      companyId,
      title: req.body.title,
      slug: req.body.slug,
      department: req.body.department,
      employmentType: req.body.employmentType,
      location: req.body.location,
      description: req.body.description,
      requirements: req.body.requirements,
      status: req.body.status || "open",
    };

    const job = await Job.create(payload);
    return res.status(201).json(job);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const listJobs = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId)
      return res.status(400).json({ error: "companyId is required" });

    const { status, q } = req.query;
    const filter = { companyId };
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const updates = {
      title: req.body.title,
      slug: req.body.slug,
      department: req.body.department,
      employmentType: req.body.employmentType,
      location: req.body.location,
      description: req.body.description,
      requirements: req.body.requirements,
      status: req.body.status,
    };
    const job = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const closeJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// public
export const publicListJobsByCompanyCode = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const company = await Company.findOne({ companyCode: companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const jobs = await Job.find({
      companyId: company._id,
      status: "open",
    }).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const publicGetJobBySlug = async (req, res) => {
  try {
    const { companyCode, slug } = req.params;
    const company = await Company.findOne({ companyCode: companyCode });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const job = await Job.findOne({
      companyId: company._id,
      slug,
      status: "open",
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
