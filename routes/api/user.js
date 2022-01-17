require("dotenv").config();
const express = require("express");
const user = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

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

      // Create new user object
      user = new User({
        username,
        email,
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

module.exports = user;
