const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

let gregToken;
let grettaToken;
const gregUserId = "61e71828c9cb2005247017c7";
const grettaUserId = "61e7ec186394874272d11e67";
const invalidUserId = "0000000000cb200524701123";

////////////////////////////////////////
/* PREPARATION */
////////////////////////////////////////
beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();

  // Generate token
  const gregLogin = await request(app).post("/api/user/login").send({
    email: "greg@example.com",
    password: "password",
  });
  gregToken = gregLogin.body.token;

  // Generate second token
  const grettaLogin = await request(app).post("/api/user/login").send({
    email: "gretta@example.net",
    password: "password",
  });
  grettaToken = grettaLogin.body.token;
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

////////////////////////////////////////
/* USER REGISTRATION */
////////////////////////////////////////
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

////////////////////////////////////////
/* USER LOGIN */
////////////////////////////////////////
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

////////////////////////////////////////
/* USER DETAIL ROUTE */
////////////////////////////////////////
describe("GET /api/user/detail", () => {
  it("return current user details", async () => {
    const res = await request(app)
      .get("/api/user/detail")
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("username");
    expect(res.body.username).toEqual("Greg");
    expect(res.body).toHaveProperty("email");
    expect(res.body).not.toHaveProperty("password");
  });
});

describe("GET /api/user/:id", () => {
  it("return details for user id", async () => {
    const res = await request(app)
      .get(`/api/user/${grettaUserId}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("username");
    expect(res.body).toHaveProperty("email");
  });

  it("error for invalid user id", async () => {
    const res = await request(app)
      .get(`/api/user/${invalidUserId}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toHaveProperty("Invalid user id");
  });
});

////////////////////////////////////////
/* USER FRIEND REQUEST ROUTES */
////////////////////////////////////////
