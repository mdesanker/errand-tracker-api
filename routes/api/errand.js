const express = require("express");
const errand = express.Router();

// @route   GET /api/errand/test
// @desc    Test route testing
// @access  Public
errand.get("/test", (req, res) => {
  res.json({ msg: "Test errand route" });
});

module.exports = errand;
