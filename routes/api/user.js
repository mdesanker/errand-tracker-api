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

// @route   GET /api/user/
// @desc    Test route
// @access  Public
user.get("/", (req, res) => {
  res.json({ msg: "Test route" });
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
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
  },
]);

// @route   GET /api/user/detail
// @desc    Get user data
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

module.exports = user;
