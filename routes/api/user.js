require("dotenv").config();
const express = require("express");
const user = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");

const User = require("../../models/User");
const auth = require("../../middleware/authMiddleware");

// @route   GET /api/user/test
// @desc    Test route testing
// @access  Public
user.post("/test", (req, res, next) => {
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
});

// @route   POST /api/user/register
// @desc    Register new user
// @access  Public
user.post("/register", [
  // Validate and sanitize input
  check("username", "Username is required").trim().notEmpty(),
  check("email", "Email is required").trim().isEmail(),
  check("password", "Password must be at least 6 characters").isLength({
    min: 6,
  }),

  // Process input
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check whether account exists with email
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email already associated with account" }] });
      }

      // Generate gravatar
      const avatar =
        "https:" + gravatar.url(email, { s: "200", r: "pg", d: "monsterid" });

      // Create new user object
      user = new User({
        username,
        email,
        avatar,
      });

      // Hash password
      user.password = await bcrypt.hash(password, 10);

      // Save user in db
      await user.save();

      // Return jwt
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, process.env.KEY, { expiresIn: "24h" }, (err, token) => {
        if (err) throw new Error(err);
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   POST /api/user/login
// @desc    Login existing user
// @access  Public
user.post("/login", [
  // Validate and sanitize input
  check("email", "Email is required").trim().isEmail(),
  check("password", "Password must be at least 6 characters").isLength({
    min: 6,
  }),

  // Process request
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find account
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Check correct password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Return jwt
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, process.env.KEY, { expiresIn: "24h" }, (err, token) => {
        if (err) throw new Error(err);
        res.status(200).json({ token });
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   GET /api/user/detail
// @desc    Get logged in user data
// @access  Private
user.get("/detail", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/user/:id
// @desc    Get user by id
// @access  Private
user.get("/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check user id is valid
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Return user object
    res.json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/user/sendrequest/:id
// @desc    Send friend request to user id
// @access  Private
user.put("/sendrequest/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check user id valid
    const user = await User.findById(id).populate("friends friendRequests");

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Check if friends
    let isFriends = false;

    if (user.friends) {
      isFriends =
        user.friends.filter((friend) => friend.id === req.user.id).length !== 0;
    }

    if (isFriends) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User already friended" }] });
    }

    // Check if requested
    let isFriendRequested = false;

    if (user.friendRequests) {
      isFriendRequested =
        user.friendRequests.filter((friend) => friend.id === req.user.id)
          .length !== 0;
    }

    if (isFriendRequested) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Friend request pending" }] });
    }

    // Send friend request
    const friendRequests = user.friendRequests.concat(req.user.id);

    const update = await User.findByIdAndUpdate(
      id,
      { friendRequests },
      { new: true }
    );

    res.json(update);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/user/acceptrequest/:id
// @desc    Accept friend request from user id
// @access  Private
user.put("/acceptrequest/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check id is valid
    const requestor = await User.findById(id);

    if (!requestor) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // console.log("REQUESTOR", requestor);

    // Check friend request is valid
    const user = await User.findById(req.user.id).populate(
      "friends friendRequests"
    );

    // console.log("USER", user);

    isRequested = false;

    if (user.friendRequests.filter((request) => request.id === id).length !== 0)
      isRequested = true;

    // console.log(isRequested);

    if (!isRequested) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid friend request" }] });
    }

    // Update requestor friend list
    const requestorFriends = requestor.friends.concat(req.user.id);
    const requestorFriendRequests = requestor.friendRequests.filter(
      (request) => request.id !== req.user.id
    );

    const requestorUpdate = await User.findByIdAndUpdate(
      id,
      { friends: requestorFriends, friendRequests: requestorFriendRequests },
      { new: true }
    );

    // Update user friend list and remove request
    const userFriends = user.friends.concat(id);
    const userFriendRequests = user.friendRequests.filter(
      (request) => request.id !== id
    );

    const userUpdate = await User.findByIdAndUpdate(
      req.user.id,
      { friends: userFriends, friendRequests: userFriendRequests },
      { new: true }
    );

    res.json(userUpdate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/user/unfriend/:id
// @desc    Unfriend user id
// @access  Private
user.put("/unfriend/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check user id valid
    const user = await User.findById(id).populate("friends");

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Remove requestor from user list
    const userFriends = user.friends.filter(
      (friend) => friend.id !== req.user.id
    );

    const userUpdate = await User.findByIdAndUpdate(
      id,
      { friends: userFriends },
      { new: true }
    );

    // Remove user from requestor list
    const requestor = await User.findById(req.user.id).populate("friends");

    const requestorFriends = requestor.friends.filter(
      (friend) => friend.id !== id
    );

    const requestorUpdate = await User.findByIdAndUpdate(
      req.user.id,
      { friends: requestorFriends },
      { new: true }
    );

    res.json(requestorUpdate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = user;
