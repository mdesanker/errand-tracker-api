const express = require("express");
const app = express();

const userRoute = require("../api/user");
const errandRoute = require("../api/errand");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/user", userRoute);
app.use("/api/errand", errandRoute);

module.exports = app;
