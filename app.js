require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const authRouter = require("./routes/api/auth");

const app = express();

connectDB();

app.use(cors({ origin: [/\localhost/], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
