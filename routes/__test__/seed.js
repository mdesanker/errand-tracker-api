require("dotenv").config();
const faker = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const User = require("../../models/User");

const users = [];
const projects = [];
const errands = [];

// Generate specific user
const generateSpecificUser = () => {
  const user = new User({
    username: "Greg",
    email: "greg@example.com",
    password: "$2a$10$ijwz5joIBRc/.GSoOoYqtu3hxWu7AJSjlAUJapiEMunrtDe2Kme8m",
    avatar: "",
    friends: [],
  });
  users.push(user);
};

// Generate faker user
const generateUser = () => {
  const user = new User({
    username: faker.internet.userName(),
    email: faker.internet.exampleEmail(),
    password: faker.internet.password(8),
    avatar: faker.internet.avatar(),
    friends: [],
  });
  users.push(user);
};

const seedDB = async () => {
  // Generate specific user
  generateSpecificUser();

  // Generate 3 random users
  for (let i = 0; i < 3; i++) {
    generateUser();
  }

  // Save to db
  for (user of users) {
    try {
      await user.save();
    } catch (err) {
      err;
    }
  }

  console.log(users[0]);
  return { users };
};

module.exports = seedDB;
