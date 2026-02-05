import express from "express";
import pool from "../databases/db.js";
import { validateCategory } from "../middleware/validateCategory.js";
// import { message } from "statuses";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { fromBody, toUser } from "../models/users.model.js";
// import { validateSignup } from "../middleware/validateSignup.js";
// import { requireAuth } from "../middleware/checkAuth.js";
// import isValidCloudinaryImage from "../middleware/validateAvatar.js";
// import { message } from "statuses";


const CategoriesRoutes = express.Router();

CategoriesRoutes.post("/", validateCategory, async (req, res) => {
  try {
    const { name, color } = req.validatedCategory;
    const {user_id}= req.body;
 

    
    const created = await pool.query(
      `INSERT INTO categories (name, user_id, color)
       VALUES ($1,$2,$3)
       RETURNING id, name, user_id , color`,
      [name, user_id, color]
    );

  

    return res.status(201).json(created);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});


CategoriesRoutes.post("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      "SELECT id, name, color FROM categories WHERE user_id = $1",
      [user_id]
    );

    return res.json(result.rows); // always array
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server error" });
  }
});


CategoriesRoutes.post("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {name, color}= req.body ; 
    const result = await pool.query(
      "  UPDATE categories SET name = $1, color = $2 WHERE id = $3 RETURNING name, color ",
      [name , color ,id]
    );

    return res.json(result.rows[0]); // always array
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server error" });
  }
});

CategoriesRoutes.post("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // const {name, color}= req.body ; 
    const result = await pool.query(
      "  DELETE FROM  categories WHERE id = $1",
      [id]
    );

    return res.json("Deleted suceefule"); // always array
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server error" });
  }
});

/*
CategoriesRoutes.post("/login", validateSignin,async (req, res) => {
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
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,        // true only in HTTPS production
            sameSite: "lax",      // "lax" is safest for dev
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        return res.json({ message: "Login successful" });

    } catch (err) {
        console.error(err.message);
    }
});

*/

// check loggin 
// CategoriesRoutes.post("/profile", requireAuth, async (req, res) => {
//   // return user info based on req.user.userId
//   const result = await pool.query(
//     "SELECT id, name, username, email, signup_date,avatar_url FROM users WHERE id=$1",
//     [req.user.userId]
//   );

//   return res.json(result.rows[0]);
// });


// log out 
// CategoriesRoutes.post("/logout", (req, res) => {
//   res.clearCookie("token", {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: false, // true in HTTPS production
//     path: "/",
//   });

//   res.json({ message: "Logged out" });
// });


// // update a user 
// CategoriesRoutes.put("/:username", async (req, res) => {
//     try {
    
        
//         const t = fromBody(req.body);  
//         const result = await pool.query(
//                 `UPDATE users
//                 SET password=$1, updated_date= NOW()`,
//                 [
//                     t.password
//                 ]
//             );

//         res.json(toUser(result.rows[0]));
//     } catch (err) {
//         console.error(err.message);
//     }


    
// });



// delete  a task  
// CategoriesRoutes.delete("/:username",async(req,res)=>{
//     try {
//         const {username} = req.params; 
//         const result = await pool.query("DELETE FROM users WHERE username=$1",[username]);
//         return res.json(result.rows.map(toUser));
//     } catch (err) {
//         console.error(err.message);
//     }
// });

export default CategoriesRoutes ; 



