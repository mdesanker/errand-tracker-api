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

// @route   GET /api/user/all
// @desc    Get all users
// @access  Private
user.get("/all", auth, async (req, res, next) => {
  console.log("Finding users...");
  try {
    const users = await User.find({})
      .sort({ username: "asc" })
      .select("-password");

    // console.log(users);
    return res.json(users);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   GET /api/user/detail
// @desc    Get logged in user data
// @access  Private
user.get("/detail", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("friends friendRequests pendingRequests");

    console.log(user);
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
    const user = await User.findById(id)
      .select("-password")
      .populate("friends friendRequests pendingRequests");

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
    const requestee = await User.findById(id).populate(
      "friends friendRequests pendingRequests"
    );
    const user = await User.findById(req.user.id).populate(
      "pendingRequests friends"
    );

    // Check user id valid
    if (!requestee) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Check if friends
    let isFriends = false;

    if (user.friends.filter((friend) => friend.id === id).length !== 0) {
      isFriends = true;
    }

    if (isFriends) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User already friended" }] });
    }

    // Check if requested
    let isPending = false;

    if (
      user.pendingRequests.filter((friend) => friend.id === id).length !== 0
    ) {
      isPending = true;
    }

    if (isPending) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Friend request pending" }] });
    }

    // Send friend request
    const requesteeFriendRequests = requestee.friendRequests.concat(
      req.user.id
    );

    const updateRequestee = await User.findByIdAndUpdate(
      id,
      { friendRequests: requesteeFriendRequests },
      { new: true }
    );

    // Update pending requests for user
    // const requestor = await User.findById(req.user.id);

    const pendingRequests = user.pendingRequests.concat(id);

    const updateUser = await User.findByIdAndUpdate(
      req.user.id,
      { pendingRequests },
      { new: true }
    ).populate("friends friendRequests pendingRequests");

    console.log(updateUser);
    res.json(updateUser);
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
    const user = await User.findById(req.user.id).populate(
      "friends friendRequests"
    );
    const requestor = await User.findById(id).populate("pendingRequests");

    // Check id is valid
    if (!requestor) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Check friend request is valid
    isRequested = false;

    if (user.friendRequests.filter((request) => request.id === id).length !== 0)
      isRequested = true;

    if (!isRequested) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid friend request" }] });
    }

    // Update requestor friend list
    const requestorFriends = requestor.friends.concat(req.user.id);
    const requestorPendingRequests = requestor.pendingRequests.filter(
      (request) => request.id !== req.user.id
    );

    const requestorUpdate = await User.findByIdAndUpdate(
      id,
      { friends: requestorFriends, pendingRequests: requestorPendingRequests },
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
    ).populate("friends friendRequests pendingRequests");

    // console.log(userUpdate);
    res.json(userUpdate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

// @route   PUT /api/user/declinerequest/:id
// @desc    Decline friend request
// @access  Private
user.put("/declinerequest/:id", auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const requestor = await User.findById(id).populate("pendingRequests");
    const user = await User.findById(req.user.id).populate("friendRequests");

    // Check requestor id is valid
    if (!requestor) {
      return res.status(400).json({ errors: [{ msg: "Invalid user id" }] });
    }

    // Remove pendingRequest from requestor
    const pendingRequests = requestor.pendingRequests.filter(
      (request) => request.id !== req.user.id
    );

    const requestorUpdate = await User.findByIdAndUpdate(
      id,
      { pendingRequests },
      { new: true }
    );

    // Remove friend request
    const friendRequests = user.friendRequests.filter(
      (request) => request.id !== id
    );

    const userUpdate = await User.findByIdAndUpdate(
      req.user.id,
      { friendRequests },
      { new: true }
    ).populate("friends friendRequests pendingRequests");

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
    ).populate("friends friendRequests pendingRequests");

    res.json(requestorUpdate);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = user;
