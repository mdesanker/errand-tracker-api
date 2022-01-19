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
  // console.log(req.body);
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
});

// @route   GET /api/project/all
// @desc    Get all projects
// @access  Private
project.get("/all", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({})
      .sort({ date: "asc" })
      .populate("author");

    console.log(projects);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = project;
