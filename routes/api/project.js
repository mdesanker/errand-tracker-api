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

// @route   GET /api/project/user/:userid
// @desc    Get projects for user
// @access  Private
project.get("/user/:userid", auth, async (req, res, next) => {
  const { userid } = req.params;

  try {
    // Check user exists
    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid userid" }] });
    }

    //  Get projects
    const projects = await Project.find({ author: userid }).sort({
      date: "asc",
    });

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/project/:id
// @desc    Get project by id
// @access  Private
project.get("/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid projectid" }] });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = project;
