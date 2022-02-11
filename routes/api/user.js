require("dotenv").config();
const express = require("express");
const user = express.Router();
const auth = require("../../middleware/authMiddleware");
const userController = require("../../controllers/user");

// @route   GET /api/user/test
// @desc    Test route testing
// @access  Public
user.post("/test", userController.test);

// @route   POST /api/user/register
// @desc    Register new user
// @access  Public
user.post("/register", userController.register);

// @route   POST /api/user/login
// @desc    Login existing user
// @access  Public
user.post("/login", userController.login);

// @route   GET /api/user/all
// @desc    Get all users
// @access  Private
user.get("/all", auth, userController.getAllUsers);

// @route   GET /api/user/detail
// @desc    Get logged in user data
// @access  Private
user.get("/detail", auth, userController.getUserDetail);

// @route   GET /api/user/:id
// @desc    Get user by id
// @access  Private
user.get("/:id", auth, userController.getUser);

// @route   PUT /api/user/sendrequest/:id
// @desc    Send friend request to user id
// @access  Private
user.put("/sendrequest/:id", auth, userController.sendFriendRequest);

// @route   PUT /api/user/acceptrequest/:id
// @desc    Accept friend request from user id
// @access  Private
user.put("/acceptrequest/:id", auth, userController.acceptFriendRequest);

// @route   PUT /api/user/declinerequest/:id
// @desc    Decline friend request
// @access  Private
user.put("/declinerequest/:id", auth, userController.declineFriendRequest);

// @route   PUT /api/user/unfriend/:id
// @desc    Unfriend user id
// @access  Private
user.put("/unfriend/:id", auth, userController.unfriendUser);

module.exports = user;
