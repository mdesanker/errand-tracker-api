const express = require("express");
const errand = express.Router();
const auth = require("../../middleware/authMiddleware");
const errandController = require("../../controllers/errand");

// @route   POST /api/errand/test
// @desc    Test route testing
// @access  Public
errand.post("/test", errandController.test);

// @route   POST /api/errand/create
// @desc    Create errand
// @access  Private
errand.post("/create", auth, errandController.createErrand);

// @route   GET /api/errand/all
// @desc    Return all errands
// @access  Private
errand.get("/all", auth, errandController.getAllErrands);

// @route   GET /api/errand/:id
// @desc    Return all errands
// @access  Private
errand.get("/:id", auth, errandController.getErrand);

// @route   GET /api/errand/user/:userid
// @desc    Return errands for specific user
// @access  Private
errand.get("/user/:userid", auth, errandController.getUserErrands);

// @route   GET /api/errand/user/:userid/all
// @desc    Return all errands associated with specific user
// @access  Private
errand.get("/user/:userid/all", auth, errandController.getAllUserErrands);

// @route   GET /api/errand/project/:projectid
// @desc    Return errands for specific project
// @access  Private
errand.get("/project/:projectid", errandController.getProjectErrands);

// @route   PUT /api/errand/:id/update
// @desc    Update specific errand
// @access  Private
errand.put("/:id/update", auth, errandController.updateErrand);

// @route   PUT /api/errand/:id/toggle
// @desc    Toggle isComplete for specific errand
// @access  Private
errand.put("/:id/toggle", auth, errandController.toggleErrand);

// @route   DELETE /api/errand/:id/delete
// @desc    Delete specific errand
// @access  Private
errand.delete("/:id/delete", auth, errandController.deleteErrand);

module.exports = errand;
