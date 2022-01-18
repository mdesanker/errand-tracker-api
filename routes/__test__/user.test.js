const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");

// Connect to memory db
// require("../../config/mongoConfigTesting");
const initializeMongoServer = require("../../config/mongoConfigTesting");

beforeAll(async () => {
  await initializeMongoServer();
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
  // done();
});

// Test routes
describe("test user post route", () => {
  it("returns status 201 if username passed", async () => {
    const res = await request(app)
      .post("/api/user/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });

  it("returns status 400 if username missing", async () => {
    const res = await request(app).post("/api/user/test").send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ errors: [{ msg: "Username is required" }] });
  });
});

// User registration route
describe("POST /api/user/register", () => {
  it("successful user creation", async () => {
    const user = {
      username: "JDoe",
      email: "jdoe@gmail.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.token).toEqual(expect.anything());
  });

  it("missing input in user registration", async () => {
    const user = {
      email: "jdoe@gmail.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Username is required");
  });
});
