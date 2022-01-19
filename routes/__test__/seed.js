require("dotenv").config();
const faker = require("@faker-js/faker");

const User = require("../../models/User");
const Errand = require("../../models/Errand");
const Project = require("../../models/Project");

const users = [];
const projects = [];
const errands = [];

// Generate specific users
const generateGreg = () => {
  const user = new User({
    _id: "61e71828c9cb2005247017c7",
    username: "Greg",
    email: "greg@example.com",
    password: "$2a$10$ijwz5joIBRc/.GSoOoYqtu3hxWu7AJSjlAUJapiEMunrtDe2Kme8m",
    avatar: "",
    friends: [],
  });
  users.push(user);
};

const generateGretta = () => {
  const user = new User({
    _id: "61e7ec186394874272d11e67",
    username: "Gretta",
    email: "gretta@example.net",
    password: "$2a$10$NewMjfxNR9NW7Dbk6gLpjuIHsbxv6pAfL/sE6LXj.HkNP1zQ3Oo2W",
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

// Generate specific project
const generateSpecificProject = () => {
  const project = new Project({
    title: "Shopping List",
    author: users[0]._id, // Greg owns project
    description: faker.lorem.sentence(),
    _id: "61e7dd93ecec03286743e04e",
  });
  projects.push(project);
};

// Generate specific errand
const generateSpecificErrand = () => {
  const errand = new Errand({
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    author: "61e71828c9cb2005247017c7",
    priority: "High",
    project: "61e7dd93ecec03286743e04e",
    _id: "61e71a80f0f8833ac7d5201d",
  });
  errands.push(errand);
};

// Generate faker errand
const generateErrand = (authorId) => {
  const priorities = ["None", "Low", "Medium", "High"];

  const random = Math.floor(Math.random() * priorities.length);

  const errand = new Errand({
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    author: authorId,
    priority: priorities[random],
  });
  errands.push(errand);
};
const seedDB = async () => {
  // Generate specifics
  generateGreg();
  generateGretta();
  generateSpecificProject();
  generateSpecificErrand();

  // Generate 3 randoms
  for (let i = 0; i < 3; i++) {
    generateUser();
  }

  // Save users to db
  for (user of users) {
    try {
      await user.save();
    } catch (err) {
      err;
    }
  }

  // Generate random number [1, 3] of errands per user
  for (user of users) {
    for (let i = 0; i < Math.floor(Math.random() * 3 + 1); i++) {
      generateErrand(user._id);
    }
  }

  // Save projects to db
  for (project of projects) {
    try {
      await project.save();
    } catch (err) {
      err;
    }
  }

  // Save errands to db
  for (errand of errands) {
    try {
      await errand.save();
    } catch (err) {
      err;
    }
  }

  console.log(users[1]);
  // console.log(projects);
  // console.log(errands);
  return { users, projects, errands };
};

module.exports = seedDB;
