const { check, validationResult } = require("express-validator");

const Errand = require("../models/Errand");
const User = require("../models/User");
const Project = require("../models/Project");

exports.test = (req, res) => {
  // console.log(req.body);
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
};

exports.createErrand = [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
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
      const { title, dueDate, priority, project } = req.body;

      // Create new errand object
      const errand = new Errand({
        title,
        author: req.user.id,
      });

      // Attach optionals to errand
      if (priority) errand.priority = priority;
      if (dueDate) errand.dueDate = dueDate;
      if (project) errand.project = project;

      // Save errand to db
      const newErrand = await errand.save();

      // Populate author and project
      await Errand.populate(newErrand, { path: "author project" });

      res.json(newErrand);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
];

exports.getAllErrands = async (req, res, next) => {
  try {
    const errands = await Errand.find({})
      .sort({ date: "asc" })
      .populate("author");

    res.json(errands);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getErrand = async (req, res, next) => {
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
};

exports.getUserErrands = async (req, res, next) => {
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
      .populate("author project");

    return res.json(errands);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getAllUserErrands = async (req, res, next) => {
  const { userid } = req.params;
  // console.log("userid", userid);

  try {
    // Check user exists
    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Get user errands not associated with project
    const errands = await Errand.find({
      author: userid,
      project: null,
    }).populate("author project");

    // Get user projects
    const projects = await Project.find({
      $or: [{ author: userid }, { members: userid }],
    });

    // Get errands associated with all projects
    for (let project of projects) {
      const projectErrands = await Errand.find({ project }).populate(
        "author project"
      );
      errands.push(...projectErrands);
    }

    const errandsSort = errands.sort((a, b) => a.date - b.date);

    // console.log(errands);
    return res.json(errandsSort);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getProjectErrands = async (req, res, next) => {
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
};

exports.updateErrand = [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),
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
];

exports.toggleErrand = async (req, res, next) => {
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
    let isProjectMember = false;

    // Errand is from a project
    if (parentProject) {
      // Check user is project author
      isProjectAuthor = req.user.id === parentProject.author.id;

      // Check user is project member
      isProjectMember =
        parentProject.members.filter((member) => member.id === req.user.id)
          .length > 0;
    }

    if (!isErrandAuthor && !isProjectAuthor && !isProjectMember) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Update errand
    const newErrand = await Errand.findByIdAndUpdate(
      id,
      { isComplete: !errand.isComplete },
      { new: true }
    ).populate("author project");

    res.json(newErrand);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.deleteErrand = async (req, res, next) => {
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
    let isProjectMember = false;

    // Errand is from a project
    if (parentProject) {
      // Check user is project author
      isProjectAuthor = req.user.id === parentProject.author.id;

      // Check user is project member
      isProjectMember =
        parentProject.members.filter((member) => member.id === req.user.id)
          .length > 0;
    }

    if (!isErrandAuthor && !isProjectAuthor && !isProjectMember) {
      return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Delete errand
    await Errand.findByIdAndDelete(id);

    res.json({ msg: "Errand deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};
