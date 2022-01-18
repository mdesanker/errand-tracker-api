const express = require("express");
const errand = express.Router();

// @route   POST /api/errand/test
// @desc    Test route testing
// @access  Public
errand.post("/test", (req, res) => {
  console.log(req.body);
  if (!req.body.username) {
    return res.status(400).json({ errors: [{ msg: "Username is required" }] });
  }
  res.sendStatus(201);
});

module.exports = errand;
