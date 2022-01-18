const express = require("express");
const errand = express.Router();
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/authMiddleware");
const Errand = require("../../models/Errand");
const User = require("../../models/User");

// @route   POST /api/errand/test
// @desc    Test route testing
// @access  Public
errand.post("/test", (req, res) => {
  console.log(req.body);
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
});

// @route   POST /api/errand/create
// @desc    Create errand
// @access  Private
errand.post("/create", auth, [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
  check("description").trim(),
  check("dueDate").trim(),
  check("priority").trim(),
  check("project").trim(),

  // Process input
  async (req, res, next) => {
    console.log(req.user);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, dueDate, priority, project } = req.body;

      // Create new errand object
      const errand = new Errand({
        title,
        author: req.user.id,
        description,
      });

      // Attach optionals to errand
      if (priority) errand.priority = priority;
      if (dueDate) errand.dueDate = dueDate;
      if (project) errand.project = project;

      // Save errand to db
      await errand.save();

      console.log(errand);
      res.json(errand);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

module.exports = errand;
