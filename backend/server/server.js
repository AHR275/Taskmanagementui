// const  express =  require("express")
// const cors= require("cors");
// const pool = require("./db")
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import pool from "./db.js";
import TasksRoutes from "./routes/tasks.routes.js";
import UsersRoutes from "./routes/users.routes.js";
import CategoriesRoutes from "./routes/categories.routes.js";
import { requireAuth } from "./middleware/checkAuth.js";
import pool from "./databases/db.js";

// import pool from "./db.js";

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://taskmanagementui-client.onrender.com",
];

app.use(cors({
  origin: (origin, cb) => {
    // يسمح لطلبات السيرفر-لسيرفر أو أدوات مثل curl بدون origin
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.use("/tasks", TasksRoutes);
app.use("/users", UsersRoutes);
app.use("/categories", CategoriesRoutes);

// check if user is already signed in 
// app.post("/profile", requireAuth, async (req, res) => {
//   console.log("whaaaaat ")
//   const userId = req.user.userId;
//   const user = await pool.query(
//     "SELECT id, username, email FROM users WHERE id = $1",
//     [userId]
//   );

//   return res.json(user.rows[0]);
// });
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, db: "not connected", error: err.message });
  }
});


const PORT = process.env.PORT ||5122;
app.listen(PORT,()=>{
    console.log("the server is running on port 5122 ........")
})