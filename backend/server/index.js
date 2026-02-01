// const  express =  require("express")
// const cors= require("cors");
// const pool = require("./db")
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import pool from "./db.js";
import TasksRoutes from "./routes/tasks.routes.js";
import UsersRoutes from "./routes/users.routes.js";
import { requireAuth } from "./middleware/checkAuth.js";
// import pool from "./db.js";

const app = express();

app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.use("/tasks", TasksRoutes);
app.use("/users", UsersRoutes);

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


app.listen(5122,()=>{
    console.log("the server is running on port 5122 ........")
})