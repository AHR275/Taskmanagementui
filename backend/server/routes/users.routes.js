import express from "express";
import pool from "../../shared/databases/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { fromBody, toUser } from "../models/users.model.js";
import { validateSignup } from "../middleware/validateSignup.js";
import { validateSignin } from "../middleware/validateSignin.js";
import { requireAuth } from "../middleware/checkAuth.js";
import { sendVerification, verifyEmail } from "../controllers/auth.controller.js";

// import isValidCloudinaryImage from "../middleware/validateAvatar.js";
// import { message } from "statuses";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,                 // true على Render
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};


const UsersRoutes = express.Router();

UsersRoutes.post("/", validateSignup, async (req, res) => {
  try {
    const { name, username, email, password, avatar_url } = req.validatedUser;

    const checkUsername = await pool.query(
      `SELECT 1 FROM users WHERE username=$1`,
      [username]
    );
    if (checkUsername.rowCount > 0) {
      return res.status(409).json({
        ok: false,
        message: "user already exists",
        errors: { username: "username is already taken" },
      });
    }

    const checkEmail = await pool.query(
      `SELECT 1 FROM users WHERE email=$1`,
      [email]
    );
    if (checkEmail.rowCount > 0) {
      return res.status(409).json({
        ok: false,
        message: "user already exists",
        errors: { email: "Email is already taken" },
      });
    }

    const passwordHashed = await bcrypt.hash(password, 10);

    const created = await pool.query(
      `INSERT INTO users (username, password, email, name, avatar_url)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, username, email, signup_date, avatar_url`,
      [username, passwordHashed, email, name, avatar_url ?? null]
    );

    const newUser = created.rows[0];

    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(201).json(toUser(newUser));
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});


// get all users 
// UsersRoutes.get("", async (req, res) => {

//     try {
        
//         const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
//         return res.json(result.rows.map(toUser));
//     } catch (err) {
//         console.error(err.message);
//     }
// });

// sign in with an account  
UsersRoutes.post("/login", validateSignin,async (req, res) => {
    const {username,password}= req.validatedUser
    
    try {
        
        const result = await pool.query("SELECT * FROM users WHERE username= $1 OR email=$1 ORDER BY id DESC",[username]);
        // const passwordHashed =  await bcrypt.hash(password, 10);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" ,
                errors :{   email: "Email/Username or password is wrong" , 
                    username: "Email/Username or password is wrong"  ,
                    password: "Email/Username or password is wrong"  ,

                },
            });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials", 
            errors :{   email: "Email/Username or password is wrong" , 
                        username: "Email/Username or password is wrong"  ,
                        password: "Email/Username or password is wrong"  ,

            },
         });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.cookie("token", token, cookieOptions);

        return res.json({ message: "Login successful" });

    } catch (err) {
        console.error(err.message);
    }
});

// check loggin 
UsersRoutes.get("/profile", requireAuth, async (req, res) => {
  // return user info based on req.user.userId
  const result = await pool.query(
    "SELECT id, name, username, email,email_verified,avatar_url ,streak_current , streak_best  FROM users WHERE id=$1",
    [req.user.userId]
  );

  return res.json(result.rows[0]);
});


// log out 
UsersRoutes.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.json({ message: "Logged out" });
});


// update a user 
UsersRoutes.put("/:username", async (req, res) => {
    try {
    
        
        const t = fromBody(req.body);  
        const result = await pool.query(
                `UPDATE users
                SET password=$1, updated_date= NOW()`,
                [
                    t.password
                ]
            );

        res.json(toUser(result.rows[0]));
    } catch (err) {
        console.error(err.message);
    }


    
});


// delete  a task  
UsersRoutes.delete("/:username",async(req,res)=>{
    try {
        const {username} = req.params; 
        const result = await pool.query("DELETE FROM users WHERE username=$1",[username]);
        return res.json(result.rows.map(toUser));
    } catch (err) {
        console.error(err.message);
    }
});

UsersRoutes.put("/data/:username", async (req, res) => {
  try {
    const { timezone } = req.body;
    const { username } = req.params;

    if (!timezone) {
      return res.status(400).json({ error: "timezone is required" });
    }

    const active_date = new Date();

    const result = await pool.query(
      `UPDATE users
       SET timezone = $1, active_date = $2
       WHERE username = $3
       RETURNING username, timezone, active_date`,
      [timezone, active_date, username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user data error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

UsersRoutes.patch("/email",requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET email = $1,
           email_verified = FALSE,
           email_verified_at = NULL
       WHERE id = $2
       RETURNING email`,
      [email, userId]
    );

    return res.json({ email: result.rows[0].email });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ errors: { email: "Email already used" } });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});


UsersRoutes.post("/auth/send-verification", sendVerification);
UsersRoutes.get("/verify-email", verifyEmail);



export default UsersRoutes ; 



