require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const userRouter = require("./routes/api/user");

const app = express();

connectDB();

app.use(cors({ origin: [/\localhost/], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
