const express = require("express");
const auth = express.Router();

// @route   GET /auth/
// @desc    Test route
// @access  Public
auth.get("/", (req, res) => {
  res.json({ msg: "Test route" });
});

module.exports = auth;
