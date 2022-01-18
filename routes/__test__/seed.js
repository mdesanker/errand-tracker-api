require("dotenv").config();
const faker = require("@faker-js/faker");

const User = require("../../models/User");
const Errand = require("../../models/Errand");

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

// Generate specific errand
const generateSpecificErrand = () => {
  const errand = new Errand({
    title: "Pick up diapers",
    description: "CVS has a sale on pampers pure",
    author: "61e71828c9cb2005247017c7",
    priority: "High",
    _id: "61e71a80f0f8833ac7d5201d",
  });
  errands.push(errand);
};

// Generate faker errand
const generateErrand = () => {
  const priorities = ["None", "Low", "Medium", "High"];

  const random = Math.floor(Math.random() * priorities.length);

  const errand = new Errand({
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    author: "61e71828c9cb2005247017c7",
    priority: priorities[random],
  });
  errands.push(errand);
};

const seedDB = async () => {
  // Generate specifics
  generateSpecificUser();
  generateSpecificErrand();

  // Generate 3 randoms
  for (let i = 0; i < 3; i++) {
    generateUser();
    generateErrand();
  }

  // Save to db
  for (user of users) {
    try {
      await user.save();
    } catch (err) {
      err;
    }
  }

  for (errand of errands) {
    try {
      await errand.save();
    } catch (err) {
      err;
    }
  }

  // console.log(users[0]);
  // console.log(errands);
  return { users };
};

module.exports = seedDB;
