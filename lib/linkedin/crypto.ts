import crypto from "node:crypto";

/** AES-256-GCM for storing OAuth tokens at rest. Key: LINKEDIN_TOKEN_KEY, falling back to SESSION_SECRET. */
function key() {
  const secret = process.env.LINKEDIN_TOKEN_KEY || process.env.SESSION_SECRET;
  if (!secret) throw new Error("Set SESSION_SECRET (or LINKEDIN_TOKEN_KEY) to store LinkedIn tokens.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt<T>(payload: string): T | null {
  if (!payload) return null;
  try {
    const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null; // Wrong key (e.g. SESSION_SECRET rotated) — treat as disconnected.
  }
}
