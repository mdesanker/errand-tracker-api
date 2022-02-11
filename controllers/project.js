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

exports.getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({})
      .sort({ date: "asc" })
      .populate("author");

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getUserAuthorProjects = async (req, res, next) => {
  const { userid } = req.params;

  try {
    // Check user exists
    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    //  Get projects
    const projects = await Project.find({ author: userid })
      .sort({
        date: "asc",
      })
      .populate("author members");

    // console.log(projects);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getUserMemberProjects = async (req, res, next) => {
  const { userid } = req.params;

  try {
    // Check user exists
    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // console.log(user);

    //  Get projects
    const projects = await Project.find({ members: userid })
      .sort({
        date: "asc",
      })
      .populate("author members");

    // console.log(projects);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.getProject = async (req, res, next) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id).populate("author members");

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.addProject = [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, members } = req.body;

      // Check all members valid
      if (members) {
        for (let member of members) {
          const isValid = await User.findById(member);

          if (!isValid) {
            return res
              .status(400)
              .json({ errors: [{ msg: "One or more member ids invalid" }] });
          }
        }
      }

      // Create new project
      const project = new Project({
        title,
        author: req.user.id,
        members,
      });

      // Save project
      const newProject = await project.save();

      // Populate members in new project
      await Project.populate(newProject, { path: "author members" });

      // console.log(newProject);
      res.json(newProject);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
];

exports.updateProject = [
  // Validate and sanitize input
  check("title", "Title is required").trim().notEmpty(),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, members } = req.body;

      // Check member ids valid
      for (let member of members) {
        const isValid = await User.findById(member);

        if (!isValid) {
          return res
            .status(400)
            .json({ errors: [{ msg: "One or more member ids invalid" }] });
        }
      }

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
        members,
        _id: id,
      });

      // Update project
      const update = await Project.findByIdAndUpdate(id, newProject, {
        new: true,
      }).populate("author members");

      // console.log(update);
      res.json(update);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
];

exports.removeSelfFromProject = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check project id valid
    const project = await Project.findById(id).populate("members");

    if (!project) {
      return res.status(400).json({ errors: [{ msg: "Invalid project id" }] });
    }

    const { members } = project;

    // Check user is a member
    const isMember =
      members.filter((member) => member.id === req.user.id).length > 0;

    if (!isMember) {
      return res
        .status(401)
        .json({ errors: [{ msg: "User not project member" }] });
    }

    // Remove user from project
    const newMembers = members.filter((member) => member.id !== req.user.id);

    const update = await Project.findByIdAndUpdate(
      id,
      { members: newMembers },
      { new: true }
    );

    // console.log(update);
    return res.json({ msg: "Removed from project" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

exports.addMemberToProject = async (req, res, next) => {
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
};

exports.removeMemberFromProject = async (req, res, next) => {
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
};

exports.deleteProject = async (req, res, next) => {
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

    // Find and delete errands associated with project
    const errands = await Errand.find({ project: id });

    for (let errand of errands) {
      await Errand.findByIdAndDelete(errand.id);
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};
