import AttendanceLog from "../models/AttendanceLog.js";
import User from "../models/User.js";
import {
  averageEmbeddings,
  cosineSimilarity,
  normalizeVector,
} from "../utils/faceMath.js";

const DEFAULT_THRESHOLD = 0.7;

export const enrollFace = async (req, res) => {
  try {
    const { userId, embeddings } = req.body;
    if (!userId || !Array.isArray(embeddings) || embeddings.length === 0) {
      return res
        .status(400)
        .json({ error: "userId and embeddings are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Normalize each embedding and store the normalized mean as the template
    const averagedEmbedding = averageEmbeddings(embeddings);
    user.activeTemplate = {
      embedding: averagedEmbedding,
      updatedAt: new Date(),
    };
    await user.save();

    return res.status(201).json({
      message: "Face template stored",
      userId: user._id,
      activeTemplate: user.activeTemplate,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const verifyFace = async (req, res) => {
  try {
    const { userId, embedding, location } = req.body;
    const threshold =
      typeof req.body.threshold === "number"
        ? req.body.threshold
        : DEFAULT_THRESHOLD;

    if (!userId || !Array.isArray(embedding) || embedding.length === 0) {
      return res
        .status(400)
        .json({ error: "userId and embedding are required" });
    }

    const user = await User.findById(userId).select("activeTemplate username");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      !user.activeTemplate ||
      !Array.isArray(user.activeTemplate.embedding) ||
      user.activeTemplate.embedding.length === 0
    ) {
      return res.status(400).json({ error: "User has no active template" });
    }

    // Normalize incoming embedding before comparison
    const normalizedEmbedding = normalizeVector(embedding);
    const similarity = cosineSimilarity(
      user.activeTemplate.embedding,
      normalizedEmbedding
    );
    const faceVerified = similarity >= threshold;

    const sanitizedLocation =
      location && typeof location === "object"
        ? {
            lat: typeof location.lat === "number" ? location.lat : undefined,
            lng: typeof location.lng === "number" ? location.lng : undefined,
          }
        : undefined;
    const hasLocation =
      sanitizedLocation &&
      (typeof sanitizedLocation.lat === "number" ||
        typeof sanitizedLocation.lng === "number");

    const log = await AttendanceLog.create({
      userId,
      capturedAt: new Date(),
      location: hasLocation ? sanitizedLocation : undefined,
      similarity,
      threshold,
      faceVerified,
      status: faceVerified ? "verified" : "rejected",
    });

    return res.json({
      userId,
      username: user.username,
      faceVerified,
      similarity,
      threshold,
      status: log.status,
      location: log.location,
      capturedAt: log.capturedAt,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
