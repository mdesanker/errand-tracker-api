const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");

// Connect to memory db
const initializeMongoServer = require("../../config/mongoConfigTesting");

const seedDB = require("./seed");

beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();
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

  it("user already exists with email", async () => {
    const user = {
      username: "Greg",
      email: "greg@example.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual(
      "Email already associated with account"
    );
  });
});

// User login route
describe("POST /api/user/login", () => {
  it("successful login", async () => {
    const user = {
      email: "greg@example.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.token).toEqual(expect.anything());
  });
});
