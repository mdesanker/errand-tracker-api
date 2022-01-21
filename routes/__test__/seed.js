require("dotenv").config();
const faker = require("@faker-js/faker");

const User = require("../../models/User");
const Errand = require("../../models/Errand");
const Project = require("../../models/Project");

const users = [];
const projects = [];
const errands = [];

////////////////////////////////////////
/* GENERATE USERS */
////////////////////////////////////////

const generateGreg = () => {
  const user = new User({
    username: "Greg",
    email: "greg@example.com",
    password: "$2a$10$ijwz5joIBRc/.GSoOoYqtu3hxWu7AJSjlAUJapiEMunrtDe2Kme8m",
    friends: ["61e71828d0db200524701a24"],
    _id: "61e71828c9cb2005247017c7",
  });
  users.push(user);
};

const generateGretta = () => {
  const user = new User({
    username: "Gretta",
    email: "gretta@example.net",
    password: "$2a$10$NewMjfxNR9NW7Dbk6gLpjuIHsbxv6pAfL/sE6LXj.HkNP1zQ3Oo2W",
    friendRequests: ["61e71828d0db200524701a24"],
    _id: "61e7ec186394874272d11e67",
  });
  users.push(user);
};

const generateGregFriend = () => {
  const user = new User({
    username: "George",
    email: "greorge@example.edu",
    password: "$2a$10$ijwz5joIBRc/.GSoOoYqtu3hxWu7AJSjlAUJapiEMunrtDe2Kme8m",
    friends: ["61e71828c9cb2005247017c7"],
    _id: "61e71828d0db200524701a24",
  });
  users.push(user);
};

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

////////////////////////////////////////
/* GENERATE PROJECTS */
////////////////////////////////////////

const generateGregProject = () => {
  const project = new Project({
    title: "Solo project",
    author: users[0]._id, // Greg owns project
    description: faker.lorem.sentence(),
    members: [], // No members
    _id: "61e7dd93ecec03286743e04e",
  });
  projects.push(project);
};

const generateGregAndGrettaProject = () => {
  const project = new Project({
    title: "Shared project",
    author: users[0]._id, // Greg owns project
    description: faker.lorem.sentence(),
    members: [users[1]._id], // Gretta is member
    _id: "61e7dd93ecec03286743e04a",
  });
  projects.push(project);
};

////////////////////////////////////////
/* GENERATE ERRANDS */
////////////////////////////////////////

const generateErrand = () => {
  const errand = new Errand({
    title: "Standalone errand",
    description: "This errand is not associated with a project",
    author: "61e71828c9cb2005247017c7",
    priority: "Medium",
    _id: "61e71a80f0f8833ac7d52011",
  });
  errands.push(errand);
};

const generateGregErrand = () => {
  const errand = new Errand({
    title: "Greg's errand",
    description: "This is a greg only errand",
    author: "61e71828c9cb2005247017c7",
    priority: "High",
    project: "61e7dd93ecec03286743e04e",
    _id: "61e71a80f0f8833ac7d5201d",
  });
  errands.push(errand);
};

const generateGregAndGrettaErrand = () => {
  const errand = new Errand({
    title: "Greg and Gretta's errand",
    description: "Gretta can help Greg with this errand",
    author: "61e71828c9cb2005247017c7",
    priority: "Low",
    project: "61e7dd93ecec03286743e04a",
    _id: "61e71a80f0f8833ac7d5201e",
  });
  errands.push(errand);
};

// Generate faker errand
const generateIdErrand = (authorId) => {
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

////////////////////////////////////////
/* SEED DB FUNCTION */
////////////////////////////////////////

const seedDB = async () => {
  // Generate users
  generateGreg();
  generateGretta();
  generateGregFriend();

  for (let i = 0; i < 3; i++) {
    generateUser();
  }

  // Generate projects
  generateGregProject();
  generateGregAndGrettaProject();

  // Generate errands
  generateErrand();
  generateGregErrand();
  generateGregAndGrettaErrand();

  for (user of users) {
    for (let i = 0; i < Math.floor(Math.random() * 3 + 1); i++) {
      generateErrand(user._id);
    }
  }

  // Save items to db
  for (user of users) {
    try {
      await user.save();
    } catch (err) {
      err;
    }
  }

  for (project of projects) {
    try {
      await project.save();
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

  console.log(users.slice(0, 3));
  // console.log(projects);
  // console.log(errands[0]);
  return { users, projects, errands };
};

module.exports = seedDB;
