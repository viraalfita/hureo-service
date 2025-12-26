// Utility helpers for face embeddings
export const normalizeVector = (vector) => {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("Embedding vector is required");
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) {
    throw new Error("Embedding magnitude is zero");
  }

  return vector.map((value) => value / magnitude);
};

export const averageEmbeddings = (embeddings) => {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("Embeddings array is required");
  }

  const normalized = embeddings.map((embedding) => normalizeVector(embedding));
  const length = normalized[0].length;
  if (!normalized.every((embedding) => embedding.length === length)) {
    throw new Error("All embeddings must share the same length");
  }

  const summed = normalized.reduce((acc, embedding) => {
    embedding.forEach((value, idx) => {
      acc[idx] += value;
    });
    return acc;
  }, new Array(length).fill(0));

  const mean = summed.map((value) => value / normalized.length);
  return normalizeVector(mean);
};

export const cosineSimilarity = (vectorA, vectorB) => {
  const normA = normalizeVector(vectorA);
  const normB = normalizeVector(vectorB);

  if (normA.length !== normB.length) {
    throw new Error("Vectors must share the same length");
  }

  return normA.reduce((sum, value, idx) => sum + value * normB[idx], 0);
};
