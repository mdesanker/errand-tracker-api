const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

let token;
let userid = "61e71828c9cb2005247017c7";
let invalidUserid = "0000000000cb200524701123";
let projectid = "61e7dd93ecec03286743e04e";
let invalidProjectid = "00000093ecec03286743e04e";

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
describe.skip("POST /api/errand/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

// Errand create
describe("POST /api/errand/create", () => {
  it("create errand", async () => {
    const res = await request(app)
      .post("/api/errand/create")
      .set("x-auth-token", token)
      .send({
        title: "Sample title",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  it("error creating errand missing required title", async () => {
    const res = await request(app)
      .post("/api/errand/create")
      .set("x-auth-token", token)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

// Errand reading
describe("GET /api/errand/all", () => {
  it("return all errands in db", async () => {
    const res = await request(app)
      .get("/api/errand/all")
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });
});

describe("GET /api/errand/user/:userid", () => {
  it("return errands for specific user", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${userid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid userid", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${invalidUserid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid userid");
  });
});

describe("GET /api/errand/project/:projectid", () => {
  it("return errands for specific project", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${projectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid id", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${invalidProjectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid projectid");
  });
});
