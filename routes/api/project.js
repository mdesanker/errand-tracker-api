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
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
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
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   POST /api/project/create
// @desc    Create project
// @access  Private
project.post("/create", auth, [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
  check("description").trim(),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description } = req.body;

      // Create new project
      const project = new Project({
        title,
        author: req.user.id,
        description,
      });

      // Save project
      await project.save();

      res.json(project);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   PUT /api/project/:id/update
// @desc    Update project
// @access  Private
project.put("/:id/update", auth, [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
  check("description").trim(),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, description } = req.body;

      // Check project exists
      const project = await Project.findById(id).populate("author");

      if (!project) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid project id" }] });
      }

      // Check user is author
      if (!(req.user.id === project.author.id)) {
        return res
          .status(401)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Create new project
      const newProject = new Project({
        title,
        description,
        members: project.members,
        _id: id,
      });

      // Update project
      const update = await Project.findByIdAndUpdate(id, newProject, {
        new: true,
      });

      res.json(update);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   PUT /api/project/:id/addmember
// @desc    Add member to project
// @access  Private
project.put("/:id/addmember", auth, async (req, res, next) => {
  const { id } = req.params;
  const { userid } = req.body;

  try {
    // Check project exists
    const project = await Project.findById(id).populate("author");

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    // Check user is author
    if (!(req.user.id === project.author.id)) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Check invited user not already a member
    if (project.members.includes(userid)) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User already a member" }] });
    }

    // Append new member to list
    const members = project.members.concat([userid]);

    // Add userid to project members
    const update = await Project.findByIdAndUpdate(
      id,
      { members },
      { new: true }
    );

    res.json(update);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/project/:id/removemember
// @desc    Remove member from project
// @access  Private
project.put("/:id/removemember", auth, async (req, res, next) => {
  const { id } = req.params;
  const { userid } = req.body;

  try {
    // Check project exists
    const project = await Project.findById(id).populate("author members");

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    // Check user is author
    if (!(req.user.id === project.author.id)) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Check userid is a member
    if (project.members.filter((member) => member.id === userid).length === 0) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Generate new member list
    const members = project.members.filter((member) => member.id !== userid);

    // Update projet
    const update = await Project.findByIdAndUpdate(
      id,
      { members },
      { new: true }
    );

    res.json(update);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   DELETE /api/project/:id/delete
// @desc    Delete project by id
// @access  Private
project.delete("/:id/delete", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check project id
    const project = await Project.findById(id).populate("author");

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    // Check user is author
    if (!(req.user.id === project.author.id)) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = project;
