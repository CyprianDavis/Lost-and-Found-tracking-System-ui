const base64UrlDecode = (segment) => {
  if (!segment) return null;
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4;
    const padded =
      padding === 0
        ? normalized
        : normalized + "=".repeat(4 - padding);
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(padded);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("binary");
    }
    throw new Error("No base64 decoder available in this environment");
  } catch (error) {
    console.error("Failed to decode base64 segment", error);
    return null;
  }
};

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  const [, payloadSegment] = token.split(".");
  if (!payloadSegment) return null;
  const decoded = base64UrlDecode(payloadSegment);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Invalid JWT payload", error);
    return null;
  }
};
