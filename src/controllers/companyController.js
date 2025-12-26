import crypto from "crypto";
import fetch from "node-fetch";
import Company from "../models/Company.js";

const RAPIDAPI_KEY = "69b890a6f6mshd0864c6c4943557p114af0jsne8294fc3e859";

export const registerCompany = async (req, res) => {
  try {
    const { name, address, radius, timeStart, timeEnd, recruiterEmail } =
      req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }
    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: "RapidAPI key is not configured" });
    }

    const existing = await Company.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "Company name already exists" });
    }

    const params = new URLSearchParams({
      input: address,
      inputtype: "textquery",
      fields: "formatted_address,geometry,name,place_id",
      language: "en",
    });

    const url = `https://google-map-places.p.rapidapi.com/maps/api/place/findplacefromtext/json?${params.toString()}`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "google-map-places.p.rapidapi.com",
      },
    };

    const geoRes = await fetch(url, options);
    if (!geoRes.ok) {
      const text = await geoRes.text().catch(() => "");
      return res.status(502).json({
        error: `Geocoding request failed (${geoRes.status}): ${text}`,
      });
    }
    const geoData = await geoRes.json();

    if (
      !geoData ||
      geoData.status !== "OK" ||
      !Array.isArray(geoData.candidates) ||
      geoData.candidates.length === 0 ||
      !geoData.candidates[0]?.geometry?.location
    ) {
      return res.status(400).json({ error: "Could not resolve address" });
    }

    const loc = geoData.candidates[0].geometry.location;
    const latitude = Number(loc.lat);
    const longitude = Number(loc.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "Invalid coordinates returned" });
    }

    const code =
      name.substring(0, 3).toUpperCase() +
      crypto.randomBytes(2).toString("hex").toUpperCase();

    const company = new Company({
      name,
      address: geoData.candidates[0].formatted_address || address,
      location: { latitude, longitude, radius: Number(radius) || 200 },
      companyCode: code,
      timeStart,
      timeEnd,
      recruiterEmail,
    });

    await company.save();

    res.status(201).json({
      message: "Company created successfully",
      companyId: company._id,
      companyCode: company.companyCode,
      location: company.location,
      timeStart: company.timeStart,
      timeEnd: company.timeEnd,
      recruiterEmail: company.recruiterEmail,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, radius, time_start, time_end, recruiterEmail } =
      req.body;

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Jika address berubah, lakukan geocoding ulang
    let newLocation = company.location;
    if (address && address !== company.address) {
      if (!RAPIDAPI_KEY) {
        return res
          .status(500)
          .json({ error: "RapidAPI key is not configured" });
      }

      const params = new URLSearchParams({
        input: address,
        inputtype: "textquery",
        fields: "formatted_address,geometry,name,place_id",
        language: "en",
      });

      const url = `https://google-map-places.p.rapidapi.com/maps/api/place/findplacefromtext/json?${params.toString()}`;
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "google-map-places.p.rapidapi.com",
        },
      };

      const geoRes = await fetch(url, options);
      if (!geoRes.ok) {
        const text = await geoRes.text().catch(() => "");
        return res.status(502).json({
          error: `Geocoding request failed (${geoRes.status}): ${text}`,
        });
      }
      const geoData = await geoRes.json();

      if (
        !geoData ||
        geoData.status !== "OK" ||
        !Array.isArray(geoData.candidates) ||
        geoData.candidates.length === 0 ||
        !geoData.candidates[0]?.geometry?.location
      ) {
        return res.status(400).json({ error: "Could not resolve new address" });
      }

      const loc = geoData.candidates[0].geometry.location;
      const latitude = Number(loc.lat);
      const longitude = Number(loc.lng);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res
          .status(400)
          .json({ error: "Invalid coordinates returned from new address" });
      }

      newLocation = {
        latitude,
        longitude,
        radius: Number(radius) || company.location.radius || 200,
      };
    }

    // Update data company
    company.name = name || company.name;
    company.address = address || company.address;
    company.location = newLocation;

    if (radius !== undefined) {
      company.location.radius = Number(radius);
    }

    company.timeStart = time_start || company.timeStart;
    company.timeEnd = time_end || company.timeEnd;
    company.recruiterEmail = recruiterEmail || company.recruiterEmail;

    await company.save();

    res.json({
      message: "Company updated successfully",
      company: {
        id: company._id,
        name: company.name,
        address: company.address,
        location: company.location,
        timeStart: company.timeStart,
        timeEnd: company.timeEnd,
        recruiterEmail: company.recruiterEmail,
        companyCode: company.companyCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanyHours = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const company = await Company.findOne({ companyCode });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json({ time_start: company.timeStart, time_end: company.timeEnd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanyByCompanyCode = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const company = await Company.findOne({ companyCode });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
