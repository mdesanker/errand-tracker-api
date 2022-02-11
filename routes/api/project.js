const express = require("express");
const project = express.Router();
const auth = require("../../middleware/authMiddleware");
const projectController = require("../../controllers/project");

// @route   POST /api/project/test
// @desc    Test route testing
// @access  Public
project.post("/test", projectController.test);

// @route   GET /api/project/all
// @desc    Get all projects
// @access  Private
project.get("/all", auth, projectController.getAllProjects);

// @route   GET /api/project/author/:userid
// @desc    Get authored projects for user
// @access  Private
project.get("/author/:userid", auth, projectController.getUserAuthorProjects);

// @route   GET /api/project/member/:userid
// @desc    Get authored projects for user
// @access  Private
project.get("/member/:userid", auth, projectController.getUserMemberProjects);

// @route   GET /api/project/:id
// @desc    Get project by id
// @access  Private
project.get("/:id", auth, projectController.getProject);

// @route   POST /api/project/create
// @desc    Create project
// @access  Private
project.post("/create", auth, projectController.addProject);

// @route   PUT /api/project/:id/update
// @desc    Update project
// @access  Private
project.put("/:id/update", auth, projectController.updateProject);

// @route   PUT /api/project/:id/removeself
// @desc    Remove self as project member
// @access  Private
project.put("/:id/removeself", auth, projectController.removeSelfFromProject);

// @route   PUT /api/project/:id/addmember
// @desc    Add member to project
// @access  Private
project.put("/:id/addmember", auth, projectController.addMemberToProject);

// @route   PUT /api/project/:id/removemember
// @desc    Remove member from project
// @access  Private
project.put(
  "/:id/removemember",
  auth,
  projectController.removeMemberFromProject
);

// @route   DELETE /api/project/:id/delete
// @desc    Delete project by id
// @access  Private
project.delete("/:id/delete", auth, projectController.deleteProject);

module.exports = project;
