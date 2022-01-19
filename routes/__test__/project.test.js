const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

// Global variables
let token;
let secondToken;

// Test preparations
beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();

  // Generate token
  const login = await request(app).post("/api/user/login").send({
    email: "greg@example.com",
    password: "password",
  });
  token = login.body.token;

  // Generate second token
  const secondLogin = await request(app).post("/api/user/login").send({
    email: "gretta@example.net",
    password: "password",
  });
  secondToken = secondLogin.body.token;
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
});

// Test
describe("POST /api/project/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/project/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});
