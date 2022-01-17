const request = require("supertest");
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/user", userRoute);

module.exports = app;
