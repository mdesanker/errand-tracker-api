var faker = require("@faker-js/faker");

const User = require("../../models/User");

// TODO: How to seed mongodb memory server

const users = [];
const projects = [];
const errands = [];

// Generate specific user
const generateSpecificUser = () => {
  const user = new User({
    username: "Greg",
    email: "greg@example.com",
    password: "password",
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

  console.log(users);
  return { users };
};

module.exports = seedDB;
