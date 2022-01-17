const express = require("express");
const app = express();

const userRoute = require("../api/user");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/user", userRoute);

module.exports = app;
