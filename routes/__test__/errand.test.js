const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

let token;

beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();

  // Generate token
  const login = await request(app).post("/api/user/login").send({
    email: "greg@example.com",
    password: "password",
  });
  token = login.body.token;
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
});

// Errand test route
describe("GET /api/errand/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});
