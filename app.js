require("dotenv").config();
const express = require("express");
const connectDB = require("./config/mongoConfig");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

const userRouter = require("./routes/api/user");
const errandRouter = require("./routes/api/errand");
const projectRouter = require("./routes/api/project");

const app = express();

connectDB();

app.use(
  cors({
    origin: [/\localhost/, "https://mdesanker.github.io"],
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRouter);
app.use("/api/errand", errandRouter);
app.use("/api/project", projectRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
