// middleware/validateSignup.js
import {isValidCloudinaryImage}  from "./validateAvatar.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/; // 3-20, letters/numbers/underscore
const NAME_RE = /^[a-zA-Z\s'-]{2,25}$/;     // simple human names

export function validateSignup(req, res, next) {
  const errors = {};

  // normalize
  const name = (req.body.name ?? "").trim().toLowerCase();
  const username = (req.body.username ?? "").trim();
  const email = (req.body.email ?? "").trim().toLowerCase();
  const password = req.body.password ?? "";

  // name
  if (!name) errors.name = "Name is required";
  else if (!NAME_RE.test(name)) errors.name = "Name must be 2-25 letters (spaces, ' and - allowed)";

  // username
  if (!username) errors.username = "Username is required";
  else if (!USERNAME_RE.test(username)) errors.username = "Username must be 3-20 (letters, numbers, _ only)";

  // email (simple but effective)
  if (!email) errors.email = "Email is required";
  else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) errors.email = "Email is not valid";

  // password
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[A-Z]/.test(password)) errors.password = "Password must include 1 uppercase letter";
  else if (!/[a-z]/.test(password)) errors.password = "Password must include 1 lowercase letter";
  else if (!/[0-9]/.test(password)) errors.password = "Password must include 1 number";
  else if (/\$/.test(password)) errors.password = "Password cannnot include '$' ";

  if(!isValidCloudinaryImage(req.body.avatar_url)) errors.avatar_url="There is something wrong in the avatar"

  // block special characters you don't want (optional)
  // if (/[<>{}$]/.test(username)) errors.username = "Username contains invalid characters";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      errors,
    });
  }
  const avatar_url = req.body.avatar_url; 
  // attach normalized values so routes use the clean ones
  req.validatedUser = { name, username, email, password, avatar_url };
  next();
}
