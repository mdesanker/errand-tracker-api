const express = require("express");
const app = express();

const userRouter = require("../api/user");
const errandRouter = require("../api/errand");
const projectRouter = require("../api/project");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRouter);
app.use("/api/errand", errandRouter);
app.use("/api/project", projectRouter);

module.exports = app;
