import crypto from "crypto";

/** raw token for URL, and hash to store in DB */
export function makeVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex"); // 64 chars
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}
