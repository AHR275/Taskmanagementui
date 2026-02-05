// middleware/validateSignup.js
// import { use } from "react";
import {isValidCloudinaryImage}  from "./validateAvatar.js";

const COLOR_RE = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/; // 3-20, letters/numbers/underscore
const NAME_RE = /^[a-zA-Z\s'-]{2,25}$/;     // simple human names

export function validateCategory(req, res, next) {
  const CategoryErrors = {};

  // normalize
  const name = (req.body.name ?? "").trim();
//   const user_id = (req.body.user_id ?? "").trim();
  const color = (req.body.color ?? "").trim();
//   const password = req.body.password ?? "";

  // name
  if (!name) CategoryErrors.name = "Name is required";
  // else if(name.length>25) CategoryErrors.name="Name is too long";
  else if (!NAME_RE.test(name)) CategoryErrors.name = "Name must be 2-30 letters (spaces, ' and - allowed)";
  
  // username
  if (!color) CategoryErrors.color = "color is required";
  // else if(color.length>20) CategoryErrors.name="color is too long";
  else if (!COLOR_RE.test(color)) CategoryErrors.color = "Color is invalid";



  if (Object.keys(CategoryErrors).length > 0) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      CategoryErrors,
    });
  }
  const avatar_url = req.body.avatar_url; 
  // attach normalized values so routes use the clean ones
  req.validatedCategory = { name, color };
  next();
}
