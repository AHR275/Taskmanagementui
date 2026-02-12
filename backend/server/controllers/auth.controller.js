import { sendVerificationEmail } from "../middleware/sendVerificationEmail.js";
import { makeVerificationToken } from "../services/emailVerification.service.js";
import pool from "../../shared/databases/db.js";



/**
 * POST /auth/send-verification
 * Call after signup, or for resend.
 */
export async function sendVerification(req, res) {
  const { userId, email,username } = req.body; // or from session/auth middleware
  const { token, tokenHash } = makeVerificationToken();

  // expire in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Only allow 1 active token per user (index enforces). We'll upsert by deleting old unused.
  await pool.query(
    `DELETE FROM email_verification_tokens
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  const verifyUrl = `${process.env.VITE_API_URL}/verify-email?token=${token}`;

  await sendVerificationEmail({ to: email, verifyUrl ,username});

  // avoid leaking whether email exists if this is "resend"
  return res.json({ ok: true, message: "If that email exists, we sent a verification link." });
}

/**
 * GET /verify-email?token=...
 */
export async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing token");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { rows } = await pool.query(
    `SELECT id, user_id, expires_at, used_at
     FROM email_verification_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );

  if (rows.length === 0) return res.status(400).send("Invalid link");

  const record = rows[0];
  if (record.used_at) return res.status(400).send("Link already used");
  if (new Date(record.expires_at) < new Date()) return res.status(400).send("Link expired");

  // Transaction: mark token used + verify user
  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = $1 AND used_at IS NULL`,
      [record.id]
    );

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verified_at = NOW()
       WHERE id = $1 AND email_verified = FALSE`,
      [record.user_id]
    );

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  // redirect to frontend success page
  return res.redirect(`${process.env.APP_URL}/email-verified`);
}
