const express = require("express");
const errand = express.Router();
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/authMiddleware");

const Errand = require("../../models/Errand");
const User = require("../../models/User");
const Project = require("../../models/Project");

// @route   POST /api/errand/test
// @desc    Test route testing
// @access  Public
errand.post("/test", (req, res) => {
  // console.log(req.body);
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
    // console.log(req.user.id);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // console.log(errors.array());
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

      // console.log(errand);
      res.json(errand);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   GET /api/errand/all
// @desc    Return all errands
// @access  Private
errand.get("/all", auth, async (req, res, next) => {
  try {
    const errands = await Errand.find({})
      .sort({ date: "asc" })
      .populate("author");

    res.json(errands);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/errand/:id
// @desc    Return all errands
// @access  Private
errand.get("/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const errand = await Errand.findById(id).populate("author project");

    if (!errand) {
      return res.status(400).json({ errors: [{ msg: "Invalid errand id" }] });
    }

    res.json(errand);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/errand/user/:userid
// @desc    Return errands for specific user
// @access  Private
errand.get("/user/:userid", auth, async (req, res, next) => {
  const { userid } = req.params;

  try {
    // Check user exists
    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Find user's errands
    const errands = await Errand.find({ author: userid })
      .sort({ date: "asc" })
      .populate("author");

    // console.log(errands);
    return res.json(errands);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/errand/project/:projectid
// @desc    Return errands for specific project
// @access  Private
errand.get("/project/:projectid", async (req, res, next) => {
  const { projectid } = req.params;

  try {
    // Check project exists
    const project = await Project.findById(projectid);

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    // Return errands for project
    const errands = await Errand.find({ project: projectid })
      .sort({ date: "asc" })
      .populate("author project");

    return res.json(errands);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/errand/:id/update
// @desc    Update specific errand
// @access  Private
errand.put("/:id/update", auth, [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
  check("description").trim(),
  check("dueDate").trim(),
  check("priority").trim(),
  check("project").trim(),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, dueDate, priority, project } = req.body;
      const { id } = req.params;

      // Check errand exists
      const errand = await Errand.findById(id).populate("author project");

      if (!errand) {
        return res.status(400).json({ errors: [{ msg: "Invalid errand id" }] });
      }

      const parentProject = await Project.findById(errand.project).populate(
        "author members"
      );

      // Check user is errand author
      const isErrandAuthor = req.user.id === errand.author.id;

      let isProjectAuthor = false;
      let isMember = false;

      // Errand is from a project
      if (parentProject) {
        // Check user is project author
        isProjectAuthor = req.user.id === parentProject.author.id;

        // Check user is project member
        isMember =
          parentProject.members.filter((member) => member.id === req.user.id)
            .length > 0;
      }

      if (!isErrandAuthor && !isProjectAuthor && !isMember) {
        return res
          .status(401)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Create new errand object
      const newErrand = new Errand({
        title,
        author: req.user.id,
        description,
        dueDate,
        priority,
        project,
        _id: id,
      });

      // Handle empty priority
      priority
        ? (newErrand.priority = priority)
        : (newErrand.priority = "None");

      // Find errand and update
      const update = await Errand.findByIdAndUpdate(id, newErrand, {
        new: true,
      });

      res.json(update);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   PUT /api/errand/:id/toggle
// @desc    Toggle isComplete for specific errand
// @access  Private
errand.put("/:id/toggle", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check errand exists
    const errand = await Errand.findById(id).populate("author");

    if (!errand) {
      return res.status(400).json({ errors: [{ msg: "Invalid errand id" }] });
    }

    const parentProject = await Project.findById(errand.project).populate(
      "author members"
    );

    // Check user is errand author
    const isErrandAuthor = req.user.id === errand.author.id;

    let isProjectAuthor = false;
    let isMember = false;

    // Errand is from a project
    if (parentProject) {
      // Check user is project author
      isProjectAuthor = req.user.id === parentProject.author.id;

      // Check user is project member
      isMember =
        parentProject.members.filter((member) => member.id === req.user.id)
          .length > 0;
    }

    if (!isErrandAuthor && !isProjectAuthor && !isMember) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Update errand
    const newErrand = await Errand.findByIdAndUpdate(
      id,
      { isComplete: !errand.isComplete },
      { new: true }
    );

    res.json(newErrand);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   DELETE /api/errand/:id/delete
// @desc    Delete specific errand
// @access  Private
errand.delete("/:id/delete", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check that errand exists
    const errand = await Errand.findById(id).populate("author project");

    if (!errand) {
      return res.status(400).json({ errors: [{ msg: "Invalid errand id" }] });
    }

    const parentProject = await Project.findById(errand.project).populate(
      "author members"
    );

    // Check user is errand author
    const isErrandAuthor = req.user.id === errand.author.id;

    let isProjectAuthor = false;
    let isMember = false;

    // Errand is from a project
    if (parentProject) {
      // Check user is project author
      isProjectAuthor = req.user.id === parentProject.author.id;

      // Check user is project member
      isMember =
        parentProject.members.filter((member) => member.id === req.user.id)
          .length > 0;
    }

    if (!isErrandAuthor && !isProjectAuthor && !isMember) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Delete errand
    await Errand.findByIdAndDelete(id);

    res.json({ msg: "Errand deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = errand;
