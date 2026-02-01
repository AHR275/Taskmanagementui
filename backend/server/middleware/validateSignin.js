export function validateSignin(req, res, next) {
  const errors = {};
  const body = req.body ?? {}; // ✅ prevent crash

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username) errors.username = "Username is required";
  else if (username.includes("$")) errors.username = "This email or username is not valid";

  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, message: "Validation failed", errors });
  }

  req.validatedUser = { username, password };
  next();
}
