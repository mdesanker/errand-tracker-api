const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
});

// Test errand test POST route
describe("GET /api/errand/test", () => {
  it.only("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});
