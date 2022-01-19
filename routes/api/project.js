const express = require("express");
const project = express.Router();
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/authMiddleware");

const Errand = require("../../models/Errand");
const User = require("../../models/User");
const Project = require("../../models/Project");

// @route   POST /api/project/test
// @desc    Test route testing
// @access  Public
project.post("/test", (req, res) => {
  console.log(req.body);
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
});

module.exports = project;
