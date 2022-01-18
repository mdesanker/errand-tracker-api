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

  it("failed login - invalid credentials", async () => {
    const user = {
      email: "greg@example.com",
      password: "password1",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("failed login - email missing", async () => {
    const user = {
      password: "password1",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Email is required");
  });
});

// Logged in user detail route
describe("GET /api/user/detail", () => {
  it("return user details", async () => {
    // Generate token
    const login = await request(app).post("/api/user/login").send({
      email: "greg@example.com",
      password: "password",
    });
    const token = login.body.token;

    // Request user detail with token
    const res = await request(app)
      .get("/api/user/detail")
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("username");
    expect(res.body.username).toEqual("Greg");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("avatar");
    expect(res.body).not.toHaveProperty("password");
  });
});
