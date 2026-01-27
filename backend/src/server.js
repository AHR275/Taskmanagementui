const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();


// dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

// update origin to your frontend url
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(4000, () => console.log("API running on http://localhost:4000"));
